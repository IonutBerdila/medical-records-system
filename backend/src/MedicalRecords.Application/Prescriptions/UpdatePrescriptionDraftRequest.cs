namespace MedicalRecords.Application.Prescriptions;

public class UpdatePrescriptionDraftRequest
{
    public string? Diagnosis { get; set; }
    public string? GeneralNotes { get; set; }
    public DateTime? ValidUntilUtc { get; set; }
    public IReadOnlyList<UpdatePrescriptionItemRequest> Items { get; set; } = new List<UpdatePrescriptionItemRequest>();
}
