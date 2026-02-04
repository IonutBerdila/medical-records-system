namespace MedicalRecords.Application.Records;

public interface IMedicalRecordService
{
    Task<MedicalRecordDto> GetMyRecordAsync(Guid userId);
    Task<MedicalRecordDto> UpdateMyRecordAsync(Guid userId, UpdateMedicalRecordRequest req);
    Task<MedicalRecordDto> GetPatientRecordForDoctorAsync(Guid doctorUserId, Guid patientUserId);
}
