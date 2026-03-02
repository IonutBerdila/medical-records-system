namespace MedicalRecords.Application.Prescriptions;

public class CreatePrescriptionRequest
{
    public string? Diagnosis { get; set; }
    public string? GeneralNotes { get; set; }
    public DateTime? ValidUntilUtc { get; set; }
    /// <summary>Draft or Active.</summary>
    public string Status { get; set; } = "Active";
    public IReadOnlyList<CreatePrescriptionItemRequest> Items { get; set; } = new List<CreatePrescriptionItemRequest>();
}
