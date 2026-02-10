namespace MedicalRecords.Application.Admin;

public class AdminUsersResponse
{
    public List<AdminUserDto> Users { get; set; } = new();
    public int Total { get; set; }
}
