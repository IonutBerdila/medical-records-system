namespace MedicalRecords.Application.Auth;

/// <summary>
/// Informații de bază despre utilizatorul autentificat.
/// </summary>
public class MeResponse
{
    public Guid UserId { get; set; }

    public string Email { get; set; } = default!;

    public string[] Roles { get; set; } = Array.Empty<string>();

    /// <summary>
    /// Obiect simplu cu detalii de profil (sau null dacă nu există).
    /// </summary>
    public object? Profile { get; set; }
}

