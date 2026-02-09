namespace MedicalRecords.Application.ShareToken;

/// <summary>Vizualizare limitată a rețetei pentru farmacie — doar câmpuri necesare, fără PII inutil.</summary>
public class PharmacyPrescriptionDto
{
    public Guid Id { get; set; }
    public string MedicationName { get; set; } = default!;
    public string? Dosage { get; set; }
    public string? Instructions { get; set; }
    public DateTime CreatedAtUtc { get; set; }
    public string? DoctorName { get; set; }
    public string Status { get; set; } = default!;
    public DateTime? DispensedAtUtc { get; set; }
}
