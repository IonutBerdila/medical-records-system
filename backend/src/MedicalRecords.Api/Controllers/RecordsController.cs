using System.Security.Claims;
using System.IdentityModel.Tokens.Jwt;
using MedicalRecords.Application.Records;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace MedicalRecords.Api.Controllers;

[ApiController]
[Route("api/records")]
[Authorize(Roles = "Patient,Doctor")]
public class RecordsController : ControllerBase
{
    private readonly IMedicalRecordService _recordService;

    public RecordsController(IMedicalRecordService recordService)
    {
        _recordService = recordService;
    }

    private Guid? GetCurrentUserId()
    {
        var sub = User.FindFirstValue(JwtRegisteredClaimNames.Sub) ?? User.FindFirstValue(ClaimTypes.NameIdentifier);
        return Guid.TryParse(sub, out var id) ? id : null;
    }

    [HttpGet("me")]
    [ProducesResponseType(typeof(MedicalRecordDto), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetMyRecord()
    {
        if (!User.IsInRole("Patient"))
            return StatusCode(403, new { message = "Only patients can access their own record." });
        var userId = GetCurrentUserId();
        if (userId == null) return Unauthorized();
        var result = await _recordService.GetMyRecordAsync(userId.Value);
        return Ok(result);
    }

    [HttpPut("me")]
    [ProducesResponseType(typeof(MedicalRecordDto), StatusCodes.Status200OK)]
    public async Task<IActionResult> UpdateMyRecord([FromBody] UpdateMedicalRecordRequest request)
    {
        if (!User.IsInRole("Patient"))
            return StatusCode(403, new { message = "Only patients can update their own record." });
        var userId = GetCurrentUserId();
        if (userId == null) return Unauthorized();
        var result = await _recordService.UpdateMyRecordAsync(userId.Value, request);
        return Ok(result);
    }
}
