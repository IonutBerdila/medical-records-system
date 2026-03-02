namespace MedicalRecords.Application.Prescriptions;

public class CreatePrescriptionItemRequest
{
    public string MedicationName { get; set; } = default!;
    public string? Form { get; set; }
    public string? Dosage { get; set; }
    public string? Frequency { get; set; }
    public int? DurationDays { get; set; }
    public int? Quantity { get; set; }
    public string? Instructions { get; set; }
    public string? Warnings { get; set; }
}
