namespace MedicalRecords.Application.Admin;

public class AdminUserDto
{
    public Guid UserId { get; set; }
    public string Email { get; set; } = default!;
    public List<string> Roles { get; set; } = new();
    public DateTime? CreatedAtUtc { get; set; }
    
    // Profile fields
    public string? FullName { get; set; }
    public string? PharmacyName { get; set; }
    public string? LicenseNumber { get; set; }
    
    // Approval fields (for Doctor/Pharmacy)
    public string? ApprovalStatus { get; set; }
    public DateTime? ApprovedAtUtc { get; set; }
    public Guid? ApprovedByAdminUserId { get; set; }
    public DateTime? RejectedAtUtc { get; set; }
    public string? RejectionReason { get; set; }
}
