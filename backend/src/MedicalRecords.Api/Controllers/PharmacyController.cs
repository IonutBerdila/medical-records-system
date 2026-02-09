using System.Security.Claims;
using System.IdentityModel.Tokens.Jwt;
using MedicalRecords.Application.ShareToken;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.AspNetCore.Mvc;
using MedicalRecords.Infrastructure.ShareToken;

namespace MedicalRecords.Api.Controllers;

[ApiController]
[Route("api/pharmacy")]
[Authorize(Roles = "Pharmacy")]
public class PharmacyController : ControllerBase
{
    private readonly IShareTokenService _shareTokenService;

    public PharmacyController(IShareTokenService shareTokenService)
    {
        _shareTokenService = shareTokenService;
    }

    private Guid? GetCurrentUserId()
    {
        var sub = User.FindFirstValue(JwtRegisteredClaimNames.Sub) ?? User.FindFirstValue(ClaimTypes.NameIdentifier);
        return Guid.TryParse(sub, out var id) ? id : null;
    }

    /// <summary>Verifică tokenul de partajare și returnează prescripțiile permise (one-time use).</summary>
    [HttpPost("verify")]
    [EnableRateLimiting("PharmacyVerifyPolicy")]
    [ProducesResponseType(typeof(IReadOnlyList<PharmacyPrescriptionDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> VerifyShareToken([FromBody] VerifyShareTokenRequest request)
    {
        var pharmacyUserId = GetCurrentUserId();
        if (pharmacyUserId == null) return Unauthorized();
        if (request?.Token == null)
            return BadRequest(new { message = "Token lipsă." });

        try
        {
            var result = await _shareTokenService.VerifyShareTokenAsync(pharmacyUserId.Value, request.Token.Trim());
            return Ok(result);
        }
        catch (ShareTokenInvalidException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }
}
