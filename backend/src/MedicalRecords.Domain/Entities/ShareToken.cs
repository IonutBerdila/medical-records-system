namespace MedicalRecords.Domain.Entities;

/// <summary>
/// Token temporar pentru acces limitat (ex: farmacie) la datele pacientului.
/// Tokenul nu se salvează în clar; se salvează doar hash-ul (SHA256) pentru securitate.
/// Valid: RevokedAt == null, ExpiresAt > UtcNow, (one-time) ConsumedAt == null.
/// </summary>
public class ShareToken
{
    public Guid Id { get; set; }
    public Guid PatientUserId { get; set; }
    /// <summary>Hash-ul tokenului (SHA256). Tokenul în clar nu este niciodată stocat.</summary>
    public string TokenHash { get; set; } = default!;
    public string Scope { get; set; } = "prescriptions:read";
    public DateTime ExpiresAtUtc { get; set; }
    public DateTime? ConsumedAtUtc { get; set; }
    public DateTime? RevokedAtUtc { get; set; }
    public DateTime CreatedAtUtc { get; set; }
    public Guid CreatedByUserId { get; set; }
    /// <summary>Opțional: token limitat la o singură rețetă.</summary>
    public Guid? PrescriptionId { get; set; }
}
