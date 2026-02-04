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
    public string Status { get; set; } = "Active"; // Active, Cancelled, Fulfilled
    public DateTime CreatedAtUtc { get; set; }
}
