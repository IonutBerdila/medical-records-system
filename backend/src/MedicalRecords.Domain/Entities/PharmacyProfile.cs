namespace MedicalRecords.Domain.Entities;

/// <summary>
/// Profil farmacie de bază. Legat 1:1 de ApplicationUser prin UserId.
/// </summary>
public class PharmacyProfile
{
    public Guid Id { get; set; }

    public Guid UserId { get; set; }

    public string PharmacyName { get; set; } = default!;

    public DateTime CreatedAtUtc { get; set; }
}

