namespace MedicalRecords.Domain.Entities;

/// <summary>
/// Fișa medicală a unui pacient (1:1 cu pacientul).
/// Tag fields (Allergies, AdverseDrugReactions, ChronicConditions) are stored as JSON arrays.
/// </summary>
public class MedicalRecord
{
    public Guid Id { get; set; }
    public Guid PatientUserId { get; set; }
    public string? BloodType { get; set; }
    /// <summary>JSON array of strings, or legacy comma-separated.</summary>
    public string? Allergies { get; set; }
    /// <summary>JSON array of strings.</summary>
    public string? AdverseDrugReactions { get; set; }
    /// <summary>JSON array of strings, or legacy comma-separated.</summary>
    public string? ChronicConditions { get; set; }
    public string? CurrentMedications { get; set; }
    public string? MajorSurgeriesHospitalizations { get; set; }
    public string? EmergencyContactName { get; set; }
    public string? EmergencyContactRelation { get; set; }
    public string? EmergencyContactPhone { get; set; }
    /// <summary>JSON array of { name, relation, phone }. Used when multiple contacts.</summary>
    public string? EmergencyContactsJson { get; set; }
    public DateTime UpdatedAtUtc { get; set; }
}
