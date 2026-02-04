using System.Security.Claims;
using System.IdentityModel.Tokens.Jwt;
using MedicalRecords.Application.Prescriptions;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace MedicalRecords.Api.Controllers;

[ApiController]
[Route("api/prescriptions")]
[Authorize]
public class PrescriptionsController : ControllerBase
{
    private readonly IPrescriptionService _prescriptionService;

    public PrescriptionsController(IPrescriptionService prescriptionService)
    {
        _prescriptionService = prescriptionService;
    }

    private Guid? GetCurrentUserId()
    {
        var sub = User.FindFirstValue(JwtRegisteredClaimNames.Sub) ?? User.FindFirstValue(ClaimTypes.NameIdentifier);
        return Guid.TryParse(sub, out var id) ? id : null;
    }

    [HttpGet("me")]
    [ProducesResponseType(typeof(IReadOnlyList<PrescriptionDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetMyPrescriptions()
    {
        if (!User.IsInRole("Patient"))
            return StatusCode(403, new { message = "Only patients can access their prescriptions." });
        var userId = GetCurrentUserId();
        if (userId == null) return Unauthorized();
        var result = await _prescriptionService.GetMyPrescriptionsAsync(userId.Value);
        return Ok(result);
    }
}
