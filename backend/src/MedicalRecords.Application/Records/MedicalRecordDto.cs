namespace MedicalRecords.Application.Records;

public class MedicalRecordDto
{
    public Guid Id { get; set; }
    public Guid? PatientUserId { get; set; }
    public string? BloodType { get; set; }
    public IReadOnlyList<string>? Allergies { get; set; }
    public IReadOnlyList<string>? AdverseDrugReactions { get; set; }
    public IReadOnlyList<string>? ChronicConditions { get; set; }
    public string? CurrentMedications { get; set; }
    public string? MajorSurgeriesHospitalizations { get; set; }
    public string? EmergencyContactName { get; set; }
    public string? EmergencyContactRelation { get; set; }
    public string? EmergencyContactPhone { get; set; }
    /// <summary>Multiple emergency contacts. Populated from EmergencyContactsJson or legacy single fields.</summary>
    public IReadOnlyList<EmergencyContactDto>? EmergencyContacts { get; set; }
    public DateTime UpdatedAtUtc { get; set; }
}
