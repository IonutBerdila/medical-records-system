using MedicalRecords.Application.Entries;
using MedicalRecords.Domain.Entities;
using MedicalRecords.Infrastructure.Auth;
using MedicalRecords.Infrastructure.Consent;
using MedicalRecords.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using MedicalRecords.Application.Consent;

namespace MedicalRecords.Infrastructure.Entries;

public class MedicalEntryService : IMedicalEntryService
{
    private static readonly string[] AllowedTypes = ["Diagnosis", "Visit", "Note", "LabResult"];

    private readonly AppDbContext _db;
    private readonly IConsentService _consentService;

    public MedicalEntryService(AppDbContext db, IConsentService consentService)
    {
        _db = db;
        _consentService = consentService;
    }

    public async Task<IReadOnlyList<MedicalEntryDto>> GetMyEntriesAsync(Guid patientUserId)
    {
        var record = await _db.MedicalRecords.AsNoTracking().FirstOrDefaultAsync(r => r.PatientUserId == patientUserId);
        if (record == null) return Array.Empty<MedicalEntryDto>();

        var entries = await _db.MedicalEntries
            .AsNoTracking()
            .Where(e => e.RecordId == record.Id)
            .OrderByDescending(e => e.CreatedAtUtc)
            .ToListAsync();
        return entries.Select(ToDto).ToList();
    }

    public async Task<IReadOnlyList<MedicalEntryDto>> GetEntriesForPatientAsync(Guid doctorUserId, Guid patientUserId)
    {
        var hasAccess = await _consentService.HasActiveAccessAsync(patientUserId, doctorUserId);
        if (!hasAccess)
            throw new ConsentDeniedException();
        return await GetMyEntriesAsync(patientUserId);
    }

    public async Task<MedicalEntryDto> AddEntryForPatientAsync(Guid doctorUserId, Guid patientUserId, CreateMedicalEntryRequest req)
    {
        if (!AllowedTypes.Contains(req.Type))
            throw new AuthValidationException($"Type must be one of: {string.Join(", ", AllowedTypes)}.");

        var hasAccess = await _consentService.HasActiveAccessAsync(patientUserId, doctorUserId);
        if (!hasAccess)
            throw new ConsentDeniedException();

        var record = await _db.MedicalRecords.FirstOrDefaultAsync(r => r.PatientUserId == patientUserId);
        if (record == null)
        {
            record = new MedicalRecord
            {
                Id = Guid.NewGuid(),
                PatientUserId = patientUserId,
                UpdatedAtUtc = DateTime.UtcNow
            };
            _db.MedicalRecords.Add(record);
            await _db.SaveChangesAsync();
        }

        var now = DateTime.UtcNow;
        var entry = new MedicalEntry
        {
            Id = Guid.NewGuid(),
            RecordId = record.Id,
            Type = req.Type,
            Title = req.Title,
            Description = req.Description,
            CreatedByUserId = doctorUserId,
            CreatedAtUtc = now
        };
        _db.MedicalEntries.Add(entry);
        await _db.SaveChangesAsync();
        return ToDto(entry);
    }

    private static MedicalEntryDto ToDto(MedicalEntry e)
    {
        return new MedicalEntryDto
        {
            Id = e.Id,
            RecordId = e.RecordId,
            Type = e.Type,
            Title = e.Title,
            Description = e.Description,
            CreatedByUserId = e.CreatedByUserId,
            CreatedAtUtc = e.CreatedAtUtc
        };
    }
}
