using System.Security.Claims;
using System.IdentityModel.Tokens.Jwt;
using MedicalRecords.Application.Consent;
using MedicalRecords.Application.ShareToken;
using MedicalRecords.Domain.Entities;
using MedicalRecords.Infrastructure.ShareToken;
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
    private readonly IShareTokenService _shareTokenService;
    private readonly UserManager<ApplicationUser> _userManager;

    public ConsentController(IConsentService consentService, IShareTokenService shareTokenService, UserManager<ApplicationUser> userManager)
    {
        _consentService = consentService;
        _shareTokenService = shareTokenService;
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
        {
            var doctorFromId = await _userManager.FindByIdAsync(request.DoctorUserId.Value.ToString());
            if (doctorFromId == null)
                return BadRequest(new { message = "Doctor not found with the given id." });

            var isDoctorRole = await _userManager.IsInRoleAsync(doctorFromId, "Doctor");
            if (!isDoctorRole)
                return BadRequest(new { message = "Recipient must be a Doctor." });

            doctorUserId = doctorFromId.Id;
        }
        else if (!string.IsNullOrWhiteSpace(request.DoctorEmail))
        {
            var doctor = await _userManager.FindByEmailAsync(request.DoctorEmail);
            if (doctor == null)
                return BadRequest(new { message = "Doctor not found with the given email." });
            var isDoctorRole = await _userManager.IsInRoleAsync(doctor, "Doctor");
            if (!isDoctorRole)
                return BadRequest(new { message = "Recipient must be a Doctor." });
            doctorUserId = doctor.Id;
        }
        else
            return BadRequest(new { message = "Provide either DoctorUserId or DoctorEmail." });

        if (doctorUserId == patientUserId.Value)
        {
            return BadRequest(new { message = "Recipient cannot be the same as the current patient." });
        }

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

    /// <summary>Generează un token de partajare (ex. pentru farmacie). Tokenul se afișează o singură dată.</summary>
    [HttpPost("share-token")]
    [ProducesResponseType(typeof(ShareTokenResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> CreateShareToken([FromBody] CreateShareTokenRequest request)
    {
        var patientUserId = GetCurrentUserId();
        if (patientUserId == null) return Unauthorized();

        var result = await _shareTokenService.CreateShareTokenAsync(patientUserId.Value, request ?? new CreateShareTokenRequest());
        return Ok(result);
    }
}
