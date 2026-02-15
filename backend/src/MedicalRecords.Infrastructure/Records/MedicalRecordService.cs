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
        record.BloodType = string.IsNullOrWhiteSpace(req.BloodType) ? null : req.BloodType.Trim();
        record.Allergies = RecordsJsonHelper.ToStorage(req.Allergies);
        record.AdverseDrugReactions = RecordsJsonHelper.ToStorage(req.AdverseDrugReactions);
        record.ChronicConditions = RecordsJsonHelper.ToStorage(req.ChronicConditions);
        record.CurrentMedications = Truncate(req.CurrentMedications, 1000);
        record.MajorSurgeriesHospitalizations = Truncate(req.MajorSurgeriesHospitalizations, 1000);

        if (req.EmergencyContacts != null && req.EmergencyContacts.Count > 0)
        {
            record.EmergencyContactsJson = RecordsJsonHelper.EmergencyContactsToStorage(req.EmergencyContacts);
            var first = req.EmergencyContacts.FirstOrDefault(c => !string.IsNullOrWhiteSpace(c.Name) || !string.IsNullOrWhiteSpace(c.Phone));
            record.EmergencyContactName = first?.Name?.Trim();
            record.EmergencyContactRelation = first?.Relation?.Trim();
            record.EmergencyContactPhone = first?.Phone?.Trim();
        }
        else
        {
            record.EmergencyContactName = string.IsNullOrWhiteSpace(req.EmergencyContactName) ? null : req.EmergencyContactName.Trim();
            record.EmergencyContactRelation = string.IsNullOrWhiteSpace(req.EmergencyContactRelation) ? null : req.EmergencyContactRelation.Trim();
            record.EmergencyContactPhone = string.IsNullOrWhiteSpace(req.EmergencyContactPhone) ? null : req.EmergencyContactPhone.Trim();
            record.EmergencyContactsJson = string.IsNullOrWhiteSpace(record.EmergencyContactName) && string.IsNullOrWhiteSpace(record.EmergencyContactPhone)
                ? null
                : RecordsJsonHelper.EmergencyContactsToStorage(new List<EmergencyContactDto>
                {
                    new() { Name = record.EmergencyContactName, Relation = record.EmergencyContactRelation, Phone = record.EmergencyContactPhone }
                });
        }

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

    private static string? Truncate(string? value, int maxLength)
    {
        if (string.IsNullOrWhiteSpace(value)) return null;
        value = value.Trim();
        return value.Length > maxLength ? value[..maxLength] : value;
    }

    private static MedicalRecordDto ToDto(MedicalRecord r)
    {
        return new MedicalRecordDto
        {
            Id = r.Id,
            PatientUserId = r.PatientUserId,
            BloodType = r.BloodType,
            Allergies = RecordsJsonHelper.FromStorage(r.Allergies),
            AdverseDrugReactions = RecordsJsonHelper.FromStorage(r.AdverseDrugReactions),
            ChronicConditions = RecordsJsonHelper.FromStorage(r.ChronicConditions),
            CurrentMedications = r.CurrentMedications,
            MajorSurgeriesHospitalizations = r.MajorSurgeriesHospitalizations,
            EmergencyContactName = r.EmergencyContactName,
            EmergencyContactRelation = r.EmergencyContactRelation,
            EmergencyContactPhone = r.EmergencyContactPhone,
            EmergencyContacts = RecordsJsonHelper.EmergencyContactsFromStorage(r.EmergencyContactsJson, r.EmergencyContactName, r.EmergencyContactRelation, r.EmergencyContactPhone),
            UpdatedAtUtc = r.UpdatedAtUtc
        };
    }
}
