using System.Text.Json.Serialization;

namespace MedicalRecords.Application.Records;

public class UpdateMedicalRecordRequest
{
    public string? BloodType { get; set; }

    [JsonConverter(typeof(TagListJsonConverter))]
    public List<string>? Allergies { get; set; }

    [JsonConverter(typeof(TagListJsonConverter))]
    public List<string>? AdverseDrugReactions { get; set; }

    [JsonConverter(typeof(TagListJsonConverter))]
    public List<string>? ChronicConditions { get; set; }
    public string? CurrentMedications { get; set; }
    public string? MajorSurgeriesHospitalizations { get; set; }
    public string? EmergencyContactName { get; set; }
    public string? EmergencyContactRelation { get; set; }
    public string? EmergencyContactPhone { get; set; }
    public IList<EmergencyContactDto>? EmergencyContacts { get; set; }
}
