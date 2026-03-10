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

    /// <summary>
    /// Prenume (stocat în profil, folosit mai ales pentru afișare).
    /// </summary>
    public string? FirstName { get; set; }

    /// <summary>
    /// Nume de familie (stocat în profil, folosit mai ales pentru afișare).
    /// </summary>
    public string? LastName { get; set; }

    /// <summary>
    /// Data nașterii (doar dată, fără oră). Opțională.
    /// </summary>
    public DateTime? DateOfBirth { get; set; }

    /// <summary>
    /// Număr licență medicală pentru Doctor (compatibilitate).
    /// </summary>
    public string? DoctorLicenseNumber { get; set; }

    /// <summary>
    /// Număr licență profesională pentru Doctor (nou câmp recomandat).
    /// </summary>
    public string? ProfessionalLicenseNumber { get; set; }

    /// <summary>
    /// ID specialitate principală (obligatoriu pentru Doctor).
    /// </summary>
    public Guid? PrimarySpecialtyId { get; set; }

    /// <summary>
    /// Denumirea instituției medicale principale (clinică / spital).
    /// </summary>
    public string? PrimaryInstitutionName { get; set; }

    /// <summary>
    /// Orașul instituției medicale principale (opțional pentru MVP).
    /// </summary>
    public string? InstitutionCity { get; set; }
}

