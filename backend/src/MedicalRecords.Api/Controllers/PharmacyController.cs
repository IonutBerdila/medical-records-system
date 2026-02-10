using System.Security.Claims;
using System.IdentityModel.Tokens.Jwt;
using MedicalRecords.Application.Admin;
using MedicalRecords.Application.Pharmacy;
using MedicalRecords.Application.ShareToken;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.AspNetCore.Mvc;
using MedicalRecords.Infrastructure.Pharmacy;
using MedicalRecords.Infrastructure.ShareToken;

namespace MedicalRecords.Api.Controllers;

[ApiController]
[Route("api/pharmacy")]
[Authorize(Roles = "Pharmacy")]
public class PharmacyController : ControllerBase
{
    private readonly IShareTokenService _shareTokenService;
    private readonly IPharmacyService _pharmacyService;
    private readonly IApprovalGuard _approvalGuard;

    public PharmacyController(
        IShareTokenService shareTokenService, 
        IPharmacyService pharmacyService,
        IApprovalGuard approvalGuard)
    {
        _shareTokenService = shareTokenService;
        _pharmacyService = pharmacyService;
        _approvalGuard = approvalGuard;
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
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> VerifyShareToken([FromBody] VerifyShareTokenRequest request)
    {
        var pharmacyUserId = GetCurrentUserId();
        if (pharmacyUserId == null) return Unauthorized();
        
        try
        {
            await _approvalGuard.EnsureApprovedAsync(pharmacyUserId.Value, "Pharmacy");
        }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(StatusCodes.Status403Forbidden, new { message = ex.Message });
        }
        
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

    /// <summary>
    /// Verifică tokenul de partajare și creează o sesiune temporară de verificare, returnând verificationId + prescripțiile permise.
    /// </summary>
    [HttpPost("verify-v2")]
    [EnableRateLimiting("PharmacyVerifyPolicy")]
    [ProducesResponseType(typeof(PharmacyVerifyResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> VerifyShareTokenV2([FromBody] VerifyShareTokenRequest request)
    {
        var pharmacyUserId = GetCurrentUserId();
        if (pharmacyUserId == null) return Unauthorized();
        
        try
        {
            await _approvalGuard.EnsureApprovedAsync(pharmacyUserId.Value, "Pharmacy");
        }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(StatusCodes.Status403Forbidden, new { message = ex.Message });
        }
        
        if (request?.Token == null)
            return BadRequest(new { message = "Token lipsă." });

        try
        {
            var result = await _shareTokenService.VerifyShareTokenV2Async(pharmacyUserId.Value, request.Token.Trim());
            return Ok(result);
        }
        catch (ShareTokenInvalidException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    public class DispenseRequest
    {
        public Guid VerificationId { get; set; }
        public Guid PrescriptionId { get; set; }
    }

    /// <summary>Marchează o prescripție ca eliberată în contextul unei sesiuni de verificare valide.</summary>
    [HttpPost("dispense")]
    [ProducesResponseType(typeof(PharmacyPrescriptionDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> Dispense([FromBody] DispenseRequest request)
    {
        var pharmacyUserId = GetCurrentUserId();
        if (pharmacyUserId == null) return Unauthorized();

        try
        {
            await _approvalGuard.EnsureApprovedAsync(pharmacyUserId.Value, "Pharmacy");
        }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(StatusCodes.Status403Forbidden, new { message = ex.Message });
        }

        try
        {
            var result = await _pharmacyService.DispensePrescriptionAsync(pharmacyUserId.Value, request.VerificationId, request.PrescriptionId);
            return Ok(result);
        }
        catch (PharmacySessionInvalidException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (PrescriptionAlreadyDispensedException ex)
        {
            return StatusCode(StatusCodes.Status409Conflict, new { message = ex.Message });
        }
        catch (KeyNotFoundException)
        {
            return NotFound(new { message = "Prescripția nu a fost găsită." });
        }
    }
}
