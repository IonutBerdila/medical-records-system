namespace MedicalRecords.Application.Consent;

public interface IConsentService
{
    Task<bool> HasActiveAccessAsync(Guid patientUserId, Guid doctorUserId);
    Task GrantDoctorAccessAsync(Guid patientUserId, Guid doctorUserId, DateTime? expiresAtUtc);
    Task RevokeDoctorAccessAsync(Guid patientUserId, Guid doctorUserId);
    Task<IReadOnlyList<AccessDto>> ListMyGrantedAccessAsync(Guid patientUserId);
    Task<IReadOnlyList<DoctorPatientDto>> ListMyPatientsAsync(Guid doctorUserId);
}

public class DoctorPatientDto
{
    public Guid PatientUserId { get; set; }
    public string? Email { get; set; }
    public string? FullName { get; set; }
}
