using MedicalRecords.Application.Admin;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace MedicalRecords.Api.Controllers;

[ApiController]
[Route("api/admin")]
[Authorize(Roles = "Admin")]
public class AdminController : ControllerBase
{
    private readonly IAdminService _adminService;

    public AdminController(IAdminService adminService)
    {
        _adminService = adminService;
    }

    private Guid GetCurrentUserId()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier) 
            ?? User.FindFirst("sub");
        if (userIdClaim == null || !Guid.TryParse(userIdClaim.Value, out var userId))
        {
            throw new UnauthorizedAccessException("Invalid user ID in token.");
        }
        return userId;
    }

    /// <summary>
    /// Listă utilizatori cu filtrare și paginare.
    /// </summary>
    [HttpGet("users")]
    [ProducesResponseType(typeof(AdminUsersResponse), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetUsers([FromQuery] AdminUsersRequest request)
    {
        var result = await _adminService.GetUsersAsync(request);
        return Ok(result);
    }

    /// <summary>
    /// Listă cereri de aprobare (pending/approved/rejected).
    /// </summary>
    [HttpGet("approvals")]
    [ProducesResponseType(typeof(AdminApprovalsResponse), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetApprovals([FromQuery] AdminApprovalsRequest request)
    {
        var result = await _adminService.GetApprovalsAsync(request);
        return Ok(result);
    }

    /// <summary>
    /// Aprobă un utilizator Doctor sau Pharmacy.
    /// </summary>
    [HttpPost("approvals/{userId}/approve")]
    [ProducesResponseType(typeof(AdminUserDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> ApproveUser(Guid userId, [FromBody] ApproveUserRequest? request = null)
    {
        var adminUserId = GetCurrentUserId();
        var result = await _adminService.ApproveUserAsync(adminUserId, userId, request);
        return Ok(result);
    }

    /// <summary>
    /// Respinge un utilizator Doctor sau Pharmacy (necesită motiv).
    /// </summary>
    [HttpPost("approvals/{userId}/reject")]
    [ProducesResponseType(typeof(AdminUserDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> RejectUser(Guid userId, [FromBody] RejectUserRequest request)
    {
        var adminUserId = GetCurrentUserId();
        var result = await _adminService.RejectUserAsync(adminUserId, userId, request);
        return Ok(result);
    }

    /// <summary>
    /// Dashboard admin cu statistici și activitate recentă.
    /// </summary>
    [HttpGet("dashboard")]
    [ProducesResponseType(typeof(AdminDashboardResponse), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetDashboard()
    {
        var result = await _adminService.GetDashboardAsync();
        return Ok(result);
    }

    /// <summary>
    /// Jurnal audit cu filtrare și paginare.
    /// </summary>
    [HttpGet("audit")]
    [ProducesResponseType(typeof(AdminAuditResponse), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAudit([FromQuery] AdminAuditRequest request)
    {
        var result = await _adminService.GetAuditAsync(request);
        return Ok(result);
    }
}
