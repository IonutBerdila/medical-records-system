using MedicalRecords.Application.Records;
using MedicalRecords.Domain.Entities;
using MedicalRecords.Infrastructure.Consent;
using MedicalRecords.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using MedicalRecords.Application.Consent;

namespace MedicalRecords.Infrastructure.Records;

public class MedicalRecordService : IMedicalRecordService
{
    private readonly AppDbContext _db;
    private readonly IConsentService _consentService;

    public MedicalRecordService(AppDbContext db, IConsentService consentService)
    {
        _db = db;
        _consentService = consentService;
    }

    public async Task<MedicalRecordDto> GetMyRecordAsync(Guid userId)
    {
        var now = DateTime.UtcNow;
        var record = await _db.MedicalRecords.AsNoTracking().FirstOrDefaultAsync(r => r.PatientUserId == userId);
        if (record == null)
        {
            record = new MedicalRecord
            {
                Id = Guid.NewGuid(),
                PatientUserId = userId,
                UpdatedAtUtc = now
            };
            _db.MedicalRecords.Add(record);
            await _db.SaveChangesAsync();
        }
        return ToDto(record);
    }

    public async Task<MedicalRecordDto> UpdateMyRecordAsync(Guid userId, UpdateMedicalRecordRequest req)
    {
        var now = DateTime.UtcNow;
        var record = await _db.MedicalRecords.FirstOrDefaultAsync(r => r.PatientUserId == userId);
        if (record == null)
        {
            record = new MedicalRecord
            {
                Id = Guid.NewGuid(),
                PatientUserId = userId,
                UpdatedAtUtc = now
            };
            _db.MedicalRecords.Add(record);
        }
        record.BloodType = req.BloodType;
        record.Allergies = req.Allergies;
        record.ChronicConditions = req.ChronicConditions;
        record.EmergencyContactName = req.EmergencyContactName;
        record.EmergencyContactPhone = req.EmergencyContactPhone;
        record.UpdatedAtUtc = now;
        await _db.SaveChangesAsync();
        return ToDto(record);
    }

    public async Task<MedicalRecordDto> GetPatientRecordForDoctorAsync(Guid doctorUserId, Guid patientUserId)
    {
        var hasAccess = await _consentService.HasActiveAccessAsync(patientUserId, doctorUserId);
        if (!hasAccess)
            throw new ConsentDeniedException();

        var record = await _db.MedicalRecords.AsNoTracking().FirstOrDefaultAsync(r => r.PatientUserId == patientUserId);
        if (record == null)
            return new MedicalRecordDto { Id = Guid.Empty, PatientUserId = patientUserId, UpdatedAtUtc = DateTime.UtcNow };
        return ToDto(record);
    }

    private static MedicalRecordDto ToDto(MedicalRecord r)
    {
        return new MedicalRecordDto
        {
            Id = r.Id,
            PatientUserId = r.PatientUserId,
            BloodType = r.BloodType,
            Allergies = r.Allergies,
            ChronicConditions = r.ChronicConditions,
            EmergencyContactName = r.EmergencyContactName,
            EmergencyContactPhone = r.EmergencyContactPhone,
            UpdatedAtUtc = r.UpdatedAtUtc
        };
    }
}
