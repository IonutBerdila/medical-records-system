namespace MedicalRecords.Application.Prescriptions;

public interface IPrescriptionService
{
    Task<IReadOnlyList<PrescriptionDto>> GetMyPrescriptionsAsync(Guid patientUserId);
    Task<IReadOnlyList<PrescriptionDto>> GetPrescriptionsForPatientAsync(Guid doctorUserId, Guid patientUserId);
    Task<PrescriptionDto> CreatePrescriptionForPatientAsync(Guid doctorUserId, Guid patientUserId, CreatePrescriptionRequest req);
    Task<PrescriptionDto> GetPrescriptionByIdForDoctorAsync(Guid doctorUserId, Guid patientUserId, Guid prescriptionId);
    Task<PrescriptionDto> UpdateDraftAsync(Guid doctorUserId, Guid patientUserId, Guid prescriptionId, UpdatePrescriptionDraftRequest request);
    Task<PrescriptionDto> IssueDraftAsync(Guid doctorUserId, Guid patientUserId, Guid prescriptionId, UpdatePrescriptionDraftRequest request);
    Task DeleteDraftAsync(Guid doctorUserId, Guid patientUserId, Guid prescriptionId);
}
