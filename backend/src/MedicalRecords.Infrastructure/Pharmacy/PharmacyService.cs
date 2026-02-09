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

public class PrescriptionAlreadyDispensedException : Exception
{
    public PrescriptionAlreadyDispensedException(string message = "Prescripția este deja marcată ca eliberată.") : base(message) { }
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

    public async Task<PharmacyPrescriptionDto> DispensePrescriptionAsync(Guid pharmacyUserId, Guid verificationId, Guid prescriptionId)
    {
        var now = DateTime.UtcNow;

        var session = await _db.PharmacyVerificationSessions
            .AsNoTracking()
            .FirstOrDefaultAsync(s =>
                s.Id == verificationId &&
                s.PharmacyUserId == pharmacyUserId &&
                s.ExpiresAtUtc > now);

        if (session == null)
            throw new PharmacySessionInvalidException();

        var prescription = await _db.Prescriptions.FirstOrDefaultAsync(p => p.Id == prescriptionId);
        if (prescription == null)
            throw new KeyNotFoundException("Prescripția nu a fost găsită.");

        if (prescription.PatientUserId != session.PatientUserId)
            throw new PharmacySessionInvalidException("Prescripția nu aparține pacientului din sesiune.");

        if (session.AllowedPrescriptionId.HasValue && session.AllowedPrescriptionId.Value != prescriptionId)
            throw new PharmacySessionInvalidException("Sesiunea permite doar o altă prescripție.");

        if (string.Equals(prescription.Status, "Dispensed", StringComparison.OrdinalIgnoreCase) ||
            prescription.DispensedAtUtc != null)
        {
            throw new PrescriptionAlreadyDispensedException();
        }

        prescription.Status = "Dispensed";
        prescription.DispensedAtUtc = now;
        prescription.DispensedByPharmacyUserId = pharmacyUserId;

        await _db.SaveChangesAsync();

        await _audit.LogAsync(new AuditEventCreate
        {
            TimestampUtc = now,
            Action = "PRESCRIPTION_DISPENSED",
            ActorUserId = pharmacyUserId,
            ActorRole = "Pharmacy",
            PatientUserId = prescription.PatientUserId,
            EntityType = "Prescription",
            EntityId = prescription.Id
        });

        return new PharmacyPrescriptionDto
        {
            Id = prescription.Id,
            MedicationName = prescription.MedicationName,
            Dosage = prescription.Dosage,
            Instructions = prescription.Instructions,
            CreatedAtUtc = prescription.CreatedAtUtc,
            // DoctorName nu este necesar aici; poate fi completat separat dacă este nevoie
            DoctorName = null,
            Status = prescription.Status,
            DispensedAtUtc = prescription.DispensedAtUtc
        };
    }
}

