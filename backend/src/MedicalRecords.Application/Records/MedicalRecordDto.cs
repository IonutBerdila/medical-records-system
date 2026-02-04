namespace MedicalRecords.Application.Records;

public class MedicalRecordDto
{
    public Guid Id { get; set; }
    public Guid? PatientUserId { get; set; }
    public string? BloodType { get; set; }
    public string? Allergies { get; set; }
    public string? ChronicConditions { get; set; }
    public string? EmergencyContactName { get; set; }
    public string? EmergencyContactPhone { get; set; }
    public DateTime UpdatedAtUtc { get; set; }
}
