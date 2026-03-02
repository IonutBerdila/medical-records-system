namespace MedicalRecords.Application.ShareToken;

/// <summary>Vizualizare prescripție pentru farmacie — cu toate liniile (items).</summary>
public class PharmacyPrescriptionDto
{
    public Guid Id { get; set; }
    public DateTime CreatedAtUtc { get; set; }
    public string? DoctorName { get; set; }
    public string? DoctorInstitutionName { get; set; }
    public string? Diagnosis { get; set; }
    public string? GeneralNotes { get; set; }
    public DateTime? ValidUntilUtc { get; set; }
    public string Status { get; set; } = default!;
    public IReadOnlyList<PharmacyPrescriptionItemDto> Items { get; set; } = new List<PharmacyPrescriptionItemDto>();
}
