using System.Security.Claims;
using System.IdentityModel.Tokens.Jwt;
using MedicalRecords.Application.Assistant;
using MedicalRecords.Infrastructure.AiSummary;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace MedicalRecords.Api.Controllers;

[ApiController]
[Route("api/assistant")]
[Authorize(Roles = "Patient")]
public class AssistantController : ControllerBase
{
    private readonly IAssistantService _assistantService;

    public AssistantController(IAssistantService assistantService)
    {
        _assistantService = assistantService;
    }

    private Guid? GetCurrentUserId()
    {
        var sub = User.FindFirstValue(JwtRegisteredClaimNames.Sub) ?? User.FindFirstValue(ClaimTypes.NameIdentifier);
        return Guid.TryParse(sub, out var id) ? id : null;
    }

    /// <summary>
    /// Asistent de navigare medicală pentru pacient.
    /// Pacientul descrie simptome/întrebări generale; asistentul oferă orientare,
    /// sugerează tipul de specialist și (dacă există) doctori disponibili.
    /// Nu pune diagnostice și nu recomandă tratamente.
    /// Operația apelează OpenAI și consumă tokeni, de aceea este expusă ca POST.
    /// </summary>
    [HttpPost("chat")]
    [EnableRateLimiting("AssistantPolicy")]
    [ProducesResponseType(typeof(AssistantChatResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status503ServiceUnavailable)]
    public async Task<IActionResult> Chat([FromBody] AssistantChatRequest request, CancellationToken cancellationToken)
    {
        var patientUserId = GetCurrentUserId();
        if (patientUserId == null) return Unauthorized();

        if (request == null || string.IsNullOrWhiteSpace(request.Message))
        {
            return BadRequest(new { message = "Mesajul nu poate fi gol." });
        }

        try
        {
            var result = await _assistantService.ChatAsync(patientUserId.Value, request, cancellationToken);
            return Ok(result);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (AiSummaryUnavailableException ex)
        {
            // Funcție dezactivată, cheie API lipsă sau eroare la apelul OpenAI.
            return StatusCode(StatusCodes.Status503ServiceUnavailable, new { message = ex.Message });
        }
    }
}
