using MedicalRecords.Application.Prescriptions;
using MedicalRecords.Domain.Entities;
using MedicalRecords.Infrastructure.Consent;
using MedicalRecords.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using MedicalRecords.Application.Consent;

namespace MedicalRecords.Infrastructure.Prescriptions;

public class PrescriptionService : IPrescriptionService
{
    private readonly AppDbContext _db;
    private readonly IConsentService _consentService;

    public PrescriptionService(AppDbContext db, IConsentService consentService)
    {
        _db = db;
        _consentService = consentService;
    }

    public async Task<IReadOnlyList<PrescriptionDto>> GetMyPrescriptionsAsync(Guid patientUserId)
    {
        var list = await _db.Prescriptions
            .AsNoTracking()
            .Where(p => p.PatientUserId == patientUserId)
            .OrderByDescending(p => p.CreatedAtUtc)
            .ToListAsync();
        return list.Select(ToDto).ToList();
    }

    public async Task<PrescriptionDto> CreatePrescriptionForPatientAsync(Guid doctorUserId, Guid patientUserId, CreatePrescriptionRequest req)
    {
        var hasAccess = await _consentService.HasActiveAccessAsync(patientUserId, doctorUserId);
        if (!hasAccess)
            throw new ConsentDeniedException();

        var now = DateTime.UtcNow;
        var p = new Prescription
        {
            Id = Guid.NewGuid(),
            PatientUserId = patientUserId,
            DoctorUserId = doctorUserId,
            MedicationName = req.MedicationName,
            Dosage = req.Dosage,
            Instructions = req.Instructions,
            ValidUntilUtc = req.ValidUntilUtc,
            Status = "Active",
            CreatedAtUtc = now
        };
        _db.Prescriptions.Add(p);
        await _db.SaveChangesAsync();
        return ToDto(p);
    }

    private static PrescriptionDto ToDto(Prescription p)
    {
        return new PrescriptionDto
        {
            Id = p.Id,
            PatientUserId = p.PatientUserId,
            DoctorUserId = p.DoctorUserId,
            MedicationName = p.MedicationName,
            Dosage = p.Dosage,
            Instructions = p.Instructions,
            ValidUntilUtc = p.ValidUntilUtc,
            Status = p.Status,
            CreatedAtUtc = p.CreatedAtUtc,
            DispensedAtUtc = p.DispensedAtUtc
        };
    }
}
