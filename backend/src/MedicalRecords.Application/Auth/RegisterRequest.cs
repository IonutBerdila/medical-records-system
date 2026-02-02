namespace MedicalRecords.Application.Auth;

/// <summary>
/// DTO pentru înregistrarea unui utilizator nou.
/// </summary>
public class RegisterRequest
{
    public string Email { get; set; } = default!;

    public string Password { get; set; } = default!;

    /// <summary>
    /// Rolul utilizatorului: Patient / Doctor / Pharmacy / Admin.
    /// </summary>
    public string Role { get; set; } = default!;

    /// <summary>
    /// Nume complet (pentru Patient/Doctor) sau denumire farmacie (pentru Pharmacy).
    /// </summary>
    public string FullName { get; set; } = default!;
}

