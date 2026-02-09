namespace MedicalRecords.Application.ShareToken;

/// <summary>
/// Răspuns pentru verificarea tokenului de farmacie (versiunea cu sesiune).
/// </summary>
public class PharmacyVerifyResponse
{
    public Guid VerificationId { get; set; }
    public IReadOnlyList<PharmacyPrescriptionDto> Prescriptions { get; set; } = Array.Empty<PharmacyPrescriptionDto>();
}

