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

    /// <summary>
    /// Status aprobare: Pending (implicit), Approved, Rejected.
    /// </summary>
    public string ApprovalStatus { get; set; } = "Pending";

    /// <summary>Data la care a fost aprobat de un admin.</summary>
    public DateTime? ApprovedAtUtc { get; set; }

    /// <summary>ID-ul adminului care a aprobat contul.</summary>
    public Guid? ApprovedByAdminUserId { get; set; }

    /// <summary>Data la care a fost respins de un admin.</summary>
    public DateTime? RejectedAtUtc { get; set; }

    /// <summary>Motivul respingerii (max 500 caractere).</summary>
    public string? RejectionReason { get; set; }
}

