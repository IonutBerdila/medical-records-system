namespace MedicalRecords.Application.Consent;

public class AccessDto
{
    public Guid DoctorUserId { get; set; }
    public string? DoctorFullName { get; set; }
    public DateTime GrantedAtUtc { get; set; }
    public DateTime? ExpiresAtUtc { get; set; }
    public bool IsActive { get; set; }
}
