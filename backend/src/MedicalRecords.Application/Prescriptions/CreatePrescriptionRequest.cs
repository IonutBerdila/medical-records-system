namespace MedicalRecords.Application.Prescriptions;

public class CreatePrescriptionRequest
{
    public string MedicationName { get; set; } = default!;
    public string? Dosage { get; set; }
    public string? Instructions { get; set; }
    public DateTime? ValidUntilUtc { get; set; }
}
