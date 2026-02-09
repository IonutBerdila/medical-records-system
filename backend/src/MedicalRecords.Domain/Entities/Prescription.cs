namespace MedicalRecords.Domain.Entities;

/// <summary>
/// Rețetă emisă de doctor pentru pacient.
/// </summary>
public class Prescription
{
    public Guid Id { get; set; }
    public Guid PatientUserId { get; set; }
    public Guid DoctorUserId { get; set; }
    public string MedicationName { get; set; } = default!;
    public string? Dosage { get; set; }
    public string? Instructions { get; set; }
    public DateTime? ValidUntilUtc { get; set; }
    /// <summary>
    /// Status prescripție: Active, Dispensed, Cancelled, Expired.
    /// </summary>
    public string Status { get; set; } = "Active";
    /// <summary>Data la care a fost eliberată de o farmacie (dacă este cazul).</summary>
    public DateTime? DispensedAtUtc { get; set; }
    /// <summary>Utilizatorul (farmacia) care a marcat prescripția ca eliberată.</summary>
    public Guid? DispensedByPharmacyUserId { get; set; }
    public DateTime CreatedAtUtc { get; set; }
}
