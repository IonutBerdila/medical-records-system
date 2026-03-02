namespace MedicalRecords.Application.ShareToken;

/// <summary>Un medicament din prescripție, pentru vizualizarea farmaciei.</summary>
public class PharmacyPrescriptionItemDto
{
    public Guid Id { get; set; }
    public string MedicationName { get; set; } = default!;
    public string? Form { get; set; }
    public string? Dosage { get; set; }
    public string? Frequency { get; set; }
    public int? DurationDays { get; set; }
    public int? Quantity { get; set; }
    public string? Instructions { get; set; }
    public string? Warnings { get; set; }
    public string Status { get; set; } = default!;
    public DateTime? DispensedAtUtc { get; set; }
    public string? DispensedByPharmacyName { get; set; }
}
