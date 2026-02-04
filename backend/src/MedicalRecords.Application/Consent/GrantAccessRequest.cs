namespace MedicalRecords.Application.Consent;

public class GrantAccessRequest
{
    public Guid? DoctorUserId { get; set; }
    public string? DoctorEmail { get; set; }
    public DateTime? ExpiresAtUtc { get; set; }
}
