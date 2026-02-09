namespace MedicalRecords.Application.ShareToken;

/// <summary>Răspuns la crearea tokenului. Tokenul în clar se afișează o singură dată.</summary>
public class ShareTokenResponse
{
    public string Token { get; set; } = default!;
    public DateTime ExpiresAtUtc { get; set; }
    public string Scope { get; set; } = default!;
}
