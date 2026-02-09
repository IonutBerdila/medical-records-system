namespace MedicalRecords.Application.ShareToken;

public class CreateShareTokenRequest
{
    /// <summary>Scope implicit: prescriptions:read.</summary>
    public string? Scope { get; set; }
    /// <summary>Valabilitate în minute (ex: 1..60). Implicit 10.</summary>
    public int? ExpiresInMinutes { get; set; }
    /// <summary>Opțional: limitare la o singură rețetă.</summary>
    public Guid? PrescriptionId { get; set; }
}
