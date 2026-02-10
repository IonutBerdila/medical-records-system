namespace MedicalRecords.Application.Admin;

public class AdminApprovalsResponse
{
    public List<AdminUserDto> Items { get; set; } = new();
    public int Total { get; set; }
}
