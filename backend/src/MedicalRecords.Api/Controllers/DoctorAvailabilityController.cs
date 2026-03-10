using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using MedicalRecords.Application.Appointments;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace MedicalRecords.Api.Controllers;

[ApiController]
[Route("api/doctor/availability")]
[Authorize(Roles = "Doctor")]
public class DoctorAvailabilityController : ControllerBase
{
    private readonly IAppointmentService _appointments;

    public DoctorAvailabilityController(IAppointmentService appointments)
    {
        _appointments = appointments;
    }

    private Guid GetCurrentUserId()
    {
        var sub = User.FindFirstValue(JwtRegisteredClaimNames.Sub) ?? User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (sub == null || !Guid.TryParse(sub, out var id))
        {
            throw new InvalidOperationException("Utilizatorul nu este autentificat corect.");
        }

        return id;
    }

    [HttpGet]
    [ProducesResponseType(typeof(IReadOnlyList<DoctorAvailabilityRuleDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAvailability(CancellationToken ct)
    {
        var userId = GetCurrentUserId();
        var rules = await _appointments.GetAvailabilityAsync(userId, ct);
        return Ok(rules);
    }

    [HttpPost]
    [ProducesResponseType(typeof(DoctorAvailabilityRuleDto), StatusCodes.Status200OK)]
    public async Task<IActionResult> Create([FromBody] DoctorAvailabilityRuleCreateRequest request, CancellationToken ct)
    {
        var userId = GetCurrentUserId();
        var result = await _appointments.CreateAvailabilityRuleAsync(userId, request, ct);
        return Ok(result);
    }

    [HttpPut("{id:guid}")]
    [ProducesResponseType(typeof(DoctorAvailabilityRuleDto), StatusCodes.Status200OK)]
    public async Task<IActionResult> Update(Guid id, [FromBody] DoctorAvailabilityRuleUpdateRequest request, CancellationToken ct)
    {
        var userId = GetCurrentUserId();
        var result = await _appointments.UpdateAvailabilityRuleAsync(userId, id, request, ct);
        return Ok(result);
    }

    [HttpDelete("{id:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct)
    {
        var userId = GetCurrentUserId();
        await _appointments.DeleteAvailabilityRuleAsync(userId, id, ct);
        return NoContent();
    }
}
