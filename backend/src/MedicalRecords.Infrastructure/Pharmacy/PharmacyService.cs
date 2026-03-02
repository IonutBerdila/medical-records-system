using MedicalRecords.Application.Audit;
using MedicalRecords.Application.Pharmacy;
using MedicalRecords.Application.ShareToken;
using MedicalRecords.Domain.Entities;
using MedicalRecords.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace MedicalRecords.Infrastructure.Pharmacy;

public class PharmacySessionInvalidException : Exception
{
    public PharmacySessionInvalidException(string message = "Sesiune de verificare invalidă sau expirată.") : base(message) { }
}

public class PrescriptionItemAlreadyDispensedException : Exception
{
    public PrescriptionItemAlreadyDispensedException(string message = "Itemul este deja eliberat.") : base(message) { }
}

public class PharmacyService : IPharmacyService
{
    private readonly AppDbContext _db;
    private readonly IAuditService _audit;

    public PharmacyService(AppDbContext db, IAuditService audit)
    {
        _db = db;
        _audit = audit;
    }

    public async Task<IReadOnlyList<PharmacyPrescriptionDto>> DispensePrescriptionItemsAsync(Guid pharmacyUserId, Guid verificationId, IReadOnlyList<Guid> prescriptionItemIds)
    {
        if (prescriptionItemIds == null || prescriptionItemIds.Count == 0)
            return Array.Empty<PharmacyPrescriptionDto>();

        var now = DateTime.UtcNow;

        var session = await _db.PharmacyVerificationSessions
            .AsNoTracking()
            .FirstOrDefaultAsync(s =>
                s.Id == verificationId &&
                s.PharmacyUserId == pharmacyUserId &&
                s.ExpiresAtUtc > now);

        if (session == null)
            throw new PharmacySessionInvalidException();

        var distinctIds = prescriptionItemIds.Distinct().ToList();
        var items = await _db.PrescriptionItems
            .Include(i => i.Prescription)
            .Where(i => distinctIds.Contains(i.Id))
            .ToListAsync();

        foreach (var item in items)
        {
            if (item.Prescription.PatientUserId != session.PatientUserId)
                throw new PharmacySessionInvalidException("Prescripția nu aparține pacientului din sesiune.");
            if (session.AllowedPrescriptionId.HasValue && session.AllowedPrescriptionId.Value != item.PrescriptionId)
                throw new PharmacySessionInvalidException("Sesiunea nu permite această prescripție.");
            if (item.Status != "Pending")
                throw new PrescriptionItemAlreadyDispensedException($"Itemul {item.MedicationName} este deja eliberat.");
        }

        foreach (var item in items)
        {
            item.Status = "Dispensed";
            item.DispensedAtUtc = now;
            item.DispensedByPharmacyUserId = pharmacyUserId;
        }

        var prescriptionIds = items.Select(i => i.PrescriptionId).Distinct().ToList();
        var prescriptions = await _db.Prescriptions.Include(p => p.Items).Where(p => prescriptionIds.Contains(p.Id)).ToListAsync();

        foreach (var p in prescriptions)
        {
            if (p.Items.All(i => i.Status == "Dispensed" || i.Status == "Cancelled"))
                p.Status = "Completed";
        }

        await _db.SaveChangesAsync();

        foreach (var item in items)
        {
            await _audit.LogAsync(new AuditEventCreate
            {
                TimestampUtc = now,
                Action = "PRESCRIPTION_ITEM_DISPENSED",
                ActorUserId = pharmacyUserId,
                ActorRole = "Pharmacy",
                PatientUserId = items.First().Prescription.PatientUserId,
                EntityType = "PrescriptionItem",
                EntityId = item.Id
            });
        }

        var allPrescriptionsForPatient = await _db.Prescriptions
            .AsNoTracking()
            .Include(p => p.Items)
            .Where(p => p.PatientUserId == session.PatientUserId && p.Status == "Active")
            .OrderByDescending(p => p.CreatedAtUtc)
            .ToListAsync();

        var withPending = allPrescriptionsForPatient.Where(p => p.Items.Any(i => i.Status == "Pending")).ToList();
        if (withPending.Count == 0)
            return Array.Empty<PharmacyPrescriptionDto>();

        var doctorIds = withPending.Select(p => p.DoctorUserId).Distinct().ToList();
        var doctorProfiles = await _db.DoctorProfiles.AsNoTracking().Where(d => doctorIds.Contains(d.UserId)).ToDictionaryAsync(d => d.UserId, d => d.FullName);
        var pharmacyUserIds = withPending.SelectMany(p => p.Items).Where(i => i.DispensedByPharmacyUserId.HasValue).Select(i => i.DispensedByPharmacyUserId!.Value).Distinct().ToList();
        var pharmacyNames = pharmacyUserIds.Count > 0
            ? await _db.PharmacyProfiles.AsNoTracking().Where(ph => pharmacyUserIds.Contains(ph.UserId)).ToDictionaryAsync(ph => ph.UserId, ph => ph.PharmacyName)
            : new Dictionary<Guid, string>();

        return withPending.Select(p => new PharmacyPrescriptionDto
        {
            Id = p.Id,
            CreatedAtUtc = p.CreatedAtUtc,
            DoctorName = doctorProfiles.GetValueOrDefault(p.DoctorUserId),
            DoctorInstitutionName = null,
            Diagnosis = p.Diagnosis,
            GeneralNotes = p.GeneralNotes,
            ValidUntilUtc = p.ValidUntilUtc,
            Status = p.Status,
            Items = p.Items.Select(i => new PharmacyPrescriptionItemDto
            {
                Id = i.Id,
                MedicationName = i.MedicationName,
                Form = i.Form,
                Dosage = i.Dosage,
                Frequency = i.Frequency,
                DurationDays = i.DurationDays,
                Quantity = i.Quantity,
                Instructions = i.Instructions,
                Warnings = i.Warnings,
                Status = i.Status,
                DispensedAtUtc = i.DispensedAtUtc,
                DispensedByPharmacyName = i.DispensedByPharmacyUserId.HasValue && pharmacyNames.TryGetValue(i.DispensedByPharmacyUserId.Value, out var name) ? name : null
            }).ToList()
        }).ToList();
    }
}
