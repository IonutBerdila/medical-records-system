namespace MedicalRecords.Domain.Entities;

/// <summary>
/// Un medicament (linie) dintr-o prescripție. Eliberarea se face per item.
/// </summary>
public class PrescriptionItem
{
    public Guid Id { get; set; }
    public Guid PrescriptionId { get; set; }

    public string MedicationName { get; set; } = default!;
    public string? Form { get; set; }
    public string? Dosage { get; set; }
    public string? Frequency { get; set; }
    public int? DurationDays { get; set; }
    public int? Quantity { get; set; }
    public string? Instructions { get; set; }
    public string? Warnings { get; set; }

    /// <summary>Pending, Dispensed, Cancelled</summary>
    public string Status { get; set; } = "Pending";

    public DateTime? DispensedAtUtc { get; set; }
    public Guid? DispensedByPharmacyUserId { get; set; }

    public Prescription Prescription { get; set; } = null!;
}
