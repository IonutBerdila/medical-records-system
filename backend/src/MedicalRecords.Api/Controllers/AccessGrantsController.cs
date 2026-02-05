using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using MedicalRecords.Application.Consent;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace MedicalRecords.Api.Controllers;

[ApiController]
[Route("api/access-grants")]
[Authorize(Roles = "Patient")]
public class AccessGrantsController : ControllerBase
{
    private readonly IConsentService _consentService;

    public AccessGrantsController(IConsentService consentService)
    {
        _consentService = consentService;
    }

    private Guid? GetCurrentUserId()
    {
        var sub = User.FindFirstValue(JwtRegisteredClaimNames.Sub) ?? User.FindFirstValue(ClaimTypes.NameIdentifier);
        return Guid.TryParse(sub, out var id) ? id : null;
    }

    [HttpDelete("{id:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Revoke(Guid id)
    {
        var patientUserId = GetCurrentUserId();
        if (patientUserId == null) return Unauthorized();

        var success = await _consentService.RevokeAccessByIdAsync(patientUserId.Value, id);
        if (!success) return NotFound();

        return NoContent();
    }
}

