namespace MedicalRecords.Domain.Entities;

/// <summary>
/// Profil pacient de bază. Legat 1:1 de ApplicationUser prin UserId.
/// </summary>
public class PatientProfile
{
    public Guid Id { get; set; }

    public Guid UserId { get; set; }

    public string FullName { get; set; } = default!;

    public DateTime CreatedAtUtc { get; set; }
}

