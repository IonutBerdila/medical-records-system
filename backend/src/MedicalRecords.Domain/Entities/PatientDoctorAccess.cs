namespace MedicalRecords.Domain.Entities;

/// <summary>
/// Consimțământ pacient–doctor: pacientul acordă acces doctorului la fișa medicală.
/// IsActive = RevokedAtUtc == null && (ExpiresAtUtc == null || ExpiresAtUtc > now).
/// </summary>
public class PatientDoctorAccess
{
    public Guid Id { get; set; }
    public Guid PatientUserId { get; set; }
    public Guid DoctorUserId { get; set; }
    public DateTime GrantedAtUtc { get; set; }
    public DateTime? ExpiresAtUtc { get; set; }
    public DateTime? RevokedAtUtc { get; set; }
}
