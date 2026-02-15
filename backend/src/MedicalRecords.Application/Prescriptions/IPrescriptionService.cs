namespace MedicalRecords.Application.Prescriptions;

public interface IPrescriptionService
{
    Task<IReadOnlyList<PrescriptionDto>> GetMyPrescriptionsAsync(Guid patientUserId);
    Task<IReadOnlyList<PrescriptionDto>> GetPrescriptionsForPatientAsync(Guid doctorUserId, Guid patientUserId);
    Task<PrescriptionDto> CreatePrescriptionForPatientAsync(Guid doctorUserId, Guid patientUserId, CreatePrescriptionRequest req);
}
