using System.Security.Claims;
using System.IdentityModel.Tokens.Jwt;
using MedicalRecords.Application.Entries;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace MedicalRecords.Api.Controllers;

[ApiController]
[Route("api/entries")]
[Authorize]
public class EntriesController : ControllerBase
{
    private readonly IMedicalEntryService _entryService;

    public EntriesController(IMedicalEntryService entryService)
    {
        _entryService = entryService;
    }

    private Guid? GetCurrentUserId()
    {
        var sub = User.FindFirstValue(JwtRegisteredClaimNames.Sub) ?? User.FindFirstValue(ClaimTypes.NameIdentifier);
        return Guid.TryParse(sub, out var id) ? id : null;
    }

    [HttpGet("me")]
    [ProducesResponseType(typeof(IReadOnlyList<MedicalEntryDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetMyEntries()
    {
        if (!User.IsInRole("Patient"))
            return StatusCode(403, new { message = "Only patients can access their entries." });
        var userId = GetCurrentUserId();
        if (userId == null) return Unauthorized();
        var result = await _entryService.GetMyEntriesAsync(userId.Value);
        return Ok(result);
    }
}
