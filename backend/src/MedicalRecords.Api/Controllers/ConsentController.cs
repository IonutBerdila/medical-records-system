using System.Security.Claims;
using System.IdentityModel.Tokens.Jwt;
using MedicalRecords.Application.Consent;
using MedicalRecords.Domain.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;

namespace MedicalRecords.Api.Controllers;

[ApiController]
[Route("api/consent")]
[Authorize(Roles = "Patient")]
public class ConsentController : ControllerBase
{
    private readonly IConsentService _consentService;
    private readonly UserManager<ApplicationUser> _userManager;

    public ConsentController(IConsentService consentService, UserManager<ApplicationUser> userManager)
    {
        _consentService = consentService;
        _userManager = userManager;
    }

    private Guid? GetCurrentUserId()
    {
        var sub = User.FindFirstValue(JwtRegisteredClaimNames.Sub) ?? User.FindFirstValue(ClaimTypes.NameIdentifier);
        return Guid.TryParse(sub, out var id) ? id : null;
    }

    [HttpGet("my-doctors")]
    [ProducesResponseType(typeof(IReadOnlyList<AccessDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetMyDoctors()
    {
        var userId = GetCurrentUserId();
        if (userId == null) return Unauthorized();
        var result = await _consentService.ListMyGrantedAccessAsync(userId.Value);
        return Ok(result);
    }

    [HttpPost("grant")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> Grant([FromBody] GrantAccessRequest request)
    {
        var patientUserId = GetCurrentUserId();
        if (patientUserId == null) return Unauthorized();

        Guid doctorUserId;
        if (request.DoctorUserId.HasValue)
            doctorUserId = request.DoctorUserId.Value;
        else if (!string.IsNullOrWhiteSpace(request.DoctorEmail))
        {
            var doctor = await _userManager.FindByEmailAsync(request.DoctorEmail);
            if (doctor == null)
                return BadRequest(new { message = "Doctor not found with the given email." });
            doctorUserId = doctor.Id;
        }
        else
            return BadRequest(new { message = "Provide either DoctorUserId or DoctorEmail." });

        await _consentService.GrantDoctorAccessAsync(patientUserId.Value, doctorUserId, request.ExpiresAtUtc);
        return NoContent();
    }

    [HttpPost("revoke")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> Revoke([FromBody] RevokeAccessRequest request)
    {
        var patientUserId = GetCurrentUserId();
        if (patientUserId == null) return Unauthorized();
        await _consentService.RevokeDoctorAccessAsync(patientUserId.Value, request.DoctorUserId);
        return NoContent();
    }
}
