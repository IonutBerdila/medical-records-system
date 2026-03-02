namespace MedicalRecords.Domain.Entities;

/// <summary>
/// Rețetă emisă de doctor pentru pacient. Poate conține mai multe medicamente (Items).
/// </summary>
public class Prescription
{
    public Guid Id { get; set; }
    public Guid PatientUserId { get; set; }
    public Guid DoctorUserId { get; set; }

    public string? Diagnosis { get; set; }
    public string? GeneralNotes { get; set; }
    public DateTime? ValidUntilUtc { get; set; }

    /// <summary>Draft, Active, Completed, Cancelled. Completed when all items are Dispensed.</summary>
    public string Status { get; set; } = "Active";

    public DateTime CreatedAtUtc { get; set; }

    /// <summary>Medicamente (linii) din prescripție. Eliberarea se face per item.</summary>
    public ICollection<PrescriptionItem> Items { get; set; } = new List<PrescriptionItem>();

    // Legacy columns: kept for migration backfill and backward compatibility; new code uses Items.
    public string? MedicationName { get; set; }
    public string? Dosage { get; set; }
    public string? Instructions { get; set; }
    public DateTime? DispensedAtUtc { get; set; }
    public Guid? DispensedByPharmacyUserId { get; set; }
}
