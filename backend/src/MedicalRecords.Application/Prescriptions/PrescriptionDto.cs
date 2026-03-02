namespace MedicalRecords.Application.Prescriptions;

public class PrescriptionDto
{
    public Guid Id { get; set; }
    public Guid PatientUserId { get; set; }
    public Guid DoctorUserId { get; set; }
    public string? DoctorFullName { get; set; }
    public string? DoctorInstitutionName { get; set; }
    public string? Diagnosis { get; set; }
    public string? GeneralNotes { get; set; }
    public DateTime? ValidUntilUtc { get; set; }
    public string Status { get; set; } = default!;
    public DateTime CreatedAtUtc { get; set; }
    public IReadOnlyList<PrescriptionItemDto> Items { get; set; } = new List<PrescriptionItemDto>();
}
