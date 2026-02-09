namespace MedicalRecords.Application.Prescriptions;

public class PrescriptionDto
{
    public Guid Id { get; set; }
    public Guid PatientUserId { get; set; }
    public Guid DoctorUserId { get; set; }
    public string MedicationName { get; set; } = default!;
    public string? Dosage { get; set; }
    public string? Instructions { get; set; }
    public DateTime? ValidUntilUtc { get; set; }
    public string Status { get; set; } = default!;
    public DateTime CreatedAtUtc { get; set; }
    public DateTime? DispensedAtUtc { get; set; }
}
