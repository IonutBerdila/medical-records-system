namespace MedicalRecords.Application.Auth;

/// <summary>
/// DTO pentru autentificare (login).
/// </summary>
public class LoginRequest
{
    public string Email { get; set; } = default!;

    public string Password { get; set; } = default!;
}

