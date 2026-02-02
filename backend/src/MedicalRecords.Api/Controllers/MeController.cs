using System.Security.Claims;
using System.IdentityModel.Tokens.Jwt;
using MedicalRecords.Application.Auth;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace MedicalRecords.Api.Controllers;

[ApiController]
[Route("api/me")]
public class MeController : ControllerBase
{
    private readonly IAuthService _authService;

    public MeController(IAuthService authService)
    {
        _authService = authService;
    }

    /// <summary>
    /// Informații despre utilizatorul autentificat.
    /// </summary>
    [HttpGet]
    [Authorize]
    [ProducesResponseType(typeof(MeResponse), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetMe()
    {
        var subClaim = User.FindFirstValue(JwtRegisteredClaimNames.Sub) ??
                       User.FindFirstValue(ClaimTypes.NameIdentifier);

        if (string.IsNullOrWhiteSpace(subClaim) || !Guid.TryParse(subClaim, out var userId))
        {
            return Unauthorized();
        }

        var result = await _authService.GetMeAsync(userId);
        return Ok(result);
    }
}

