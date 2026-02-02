namespace MedicalRecords.Application.Auth;

/// <summary>
/// Răspuns după autentificare reușită.
/// </summary>
public class LoginResponse
{
    public string AccessToken { get; set; } = default!;

    public DateTime ExpiresAtUtc { get; set; }
}

