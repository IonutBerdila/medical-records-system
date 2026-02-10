namespace MedicalRecords.Application.Admin;

public interface IAdminService
{
    Task<AdminUsersResponse> GetUsersAsync(AdminUsersRequest request);
    Task<AdminApprovalsResponse> GetApprovalsAsync(AdminApprovalsRequest request);
    Task<AdminUserDto> ApproveUserAsync(Guid adminUserId, Guid userId, ApproveUserRequest? request = null);
    Task<AdminUserDto> RejectUserAsync(Guid adminUserId, Guid userId, RejectUserRequest request);
    Task<AdminDashboardResponse> GetDashboardAsync();
    Task<AdminAuditResponse> GetAuditAsync(AdminAuditRequest request);
}
