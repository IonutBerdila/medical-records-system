namespace MedicalRecords.Application.Auth;

/// <summary>
/// Răspuns după înregistrarea unui utilizator nou.
/// Nu conține token JWT.
/// </summary>
public class RegisterResponse
{
    public Guid UserId { get; set; }

    public string Email { get; set; } = default!;

    public string Role { get; set; } = default!;
}

