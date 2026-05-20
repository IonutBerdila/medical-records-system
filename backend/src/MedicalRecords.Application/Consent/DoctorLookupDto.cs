namespace MedicalRecords.Application.Consent;

public class DoctorLookupDto
{
    public Guid UserId { get; set; }
    public string? FullName { get; set; }
    public string? Email { get; set; }
    public string? LicenseNumber { get; set; }
    public string? InstitutionName { get; set; }
    public string? InstitutionCity { get; set; }
}

