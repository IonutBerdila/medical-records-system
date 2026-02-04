using System.Security.Claims;
using System.IdentityModel.Tokens.Jwt;
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

    public DoctorPatientsController(IConsentService consentService)
    {
        _consentService = consentService;
    }

    [HttpGet("patients")]
    [ProducesResponseType(typeof(IReadOnlyList<DoctorPatientDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetMyPatients()
    {
        var sub = User.FindFirstValue(JwtRegisteredClaimNames.Sub) ?? User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrWhiteSpace(sub) || !Guid.TryParse(sub, out var doctorUserId))
            return Unauthorized();
        var result = await _consentService.ListMyPatientsAsync(doctorUserId);
        return Ok(result);
    }
}
