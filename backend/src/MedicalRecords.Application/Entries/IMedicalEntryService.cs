namespace MedicalRecords.Application.Entries;

public interface IMedicalEntryService
{
    Task<IReadOnlyList<MedicalEntryDto>> GetMyEntriesAsync(Guid patientUserId);
    Task<IReadOnlyList<MedicalEntryDto>> GetEntriesForPatientAsync(Guid doctorUserId, Guid patientUserId);
    Task<MedicalEntryDto> AddEntryForPatientAsync(Guid doctorUserId, Guid patientUserId, CreateMedicalEntryRequest req);
}
