namespace MedicalRecords.Domain.Entities;

/// <summary>
/// Profil medic de bază. Legat 1:1 de ApplicationUser prin UserId.
/// </summary>
public class DoctorProfile
{
    public Guid Id { get; set; }

    public Guid UserId { get; set; }

    public string FullName { get; set; } = default!;

    public string? LicenseNumber { get; set; }

    public DateTime CreatedAtUtc { get; set; }
}

