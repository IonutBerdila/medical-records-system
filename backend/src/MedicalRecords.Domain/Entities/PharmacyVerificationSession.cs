namespace MedicalRecords.Domain.Entities;

/// <summary>
/// Sesiune temporară de verificare farmacie după un ShareToken validat.
/// Permite acțiuni ulterioare (ex. dispense) fără a reintroduce tokenul.
/// </summary>
public class PharmacyVerificationSession
{
    public Guid Id { get; set; }
    public Guid ShareTokenId { get; set; }
    public Guid PharmacyUserId { get; set; }
    public Guid PatientUserId { get; set; }
    public DateTime CreatedAtUtc { get; set; }
    public DateTime ExpiresAtUtc { get; set; }
    /// <summary>
    /// Dacă tokenul a fost limitat la o singură prescripție, doar aceasta poate fi dispensată în sesiune.
    /// </summary>
    public Guid? AllowedPrescriptionId { get; set; }
}

