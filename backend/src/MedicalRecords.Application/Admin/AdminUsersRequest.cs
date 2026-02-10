namespace MedicalRecords.Application.Admin;

public class AdminUsersRequest
{
    public string? Role { get; set; } // Patient, Doctor, Pharmacy, Admin, All
    public string? Status { get; set; } // Pending, Approved, Rejected (only for Doctor/Pharmacy)
    public string? Search { get; set; } // Search by email/name/license
    public int Skip { get; set; } = 0;
    public int Take { get; set; } = 50;
}
