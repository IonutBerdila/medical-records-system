using System.Security.Claims;
using System.IdentityModel.Tokens.Jwt;
using MedicalRecords.Application.Admin;
using MedicalRecords.Application.Consent;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace MedicalRecords.Api.Controllers;

[ApiController]
[Route("api/doctor")]
[Authorize(Roles = "Doctor")]
public class DoctorPatientsController : ControllerBase
{
    private readonly IConsentService _consentService;
    private readonly IApprovalGuard _approvalGuard;

    public DoctorPatientsController(IConsentService consentService, IApprovalGuard approvalGuard)
    {
        _consentService = consentService;
        _approvalGuard = approvalGuard;
    }

    [HttpGet("patients")]
    [ProducesResponseType(typeof(IReadOnlyList<DoctorPatientDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> GetMyPatients()
    {
        var sub = User.FindFirstValue(JwtRegisteredClaimNames.Sub) ?? User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrWhiteSpace(sub) || !Guid.TryParse(sub, out var doctorUserId))
            return Unauthorized();
        
        try
        {
            await _approvalGuard.EnsureApprovedAsync(doctorUserId, "Doctor");
        }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(StatusCodes.Status403Forbidden, new { message = ex.Message });
        }
        
        var result = await _consentService.ListMyPatientsAsync(doctorUserId);
        return Ok(result);
    }
}
