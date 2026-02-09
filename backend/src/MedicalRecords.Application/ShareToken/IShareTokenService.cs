namespace MedicalRecords.Application.ShareToken;

public interface IShareTokenService
{
    /// <summary>Generează un token nou; returnează tokenul în clar (afișat o singură dată) + expiresAt + scope.</summary>
    Task<ShareTokenResponse> CreateShareTokenAsync(Guid patientUserId, CreateShareTokenRequest request);

    /// <summary>Verifică tokenul (farmacie). Validează hash + expiry + revoked/consumed; marchează ConsumedAt (one-time). Returnează doar prescripțiile permise.</summary>
    Task<IReadOnlyList<PharmacyPrescriptionDto>> VerifyShareTokenAsync(Guid pharmacyUserId, string token);
}
