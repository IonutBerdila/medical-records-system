namespace MedicalRecords.Application.Admin;

public class AdminApprovalsRequest
{
    public string Status { get; set; } = "Pending"; // Pending, Approved, Rejected
    public string? Role { get; set; } // Doctor, Pharmacy, All
    public int Skip { get; set; } = 0;
    public int Take { get; set; } = 50;
}
