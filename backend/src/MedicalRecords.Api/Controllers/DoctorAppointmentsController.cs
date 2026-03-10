using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using MedicalRecords.Application.Appointments;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace MedicalRecords.Api.Controllers;

[ApiController]
[Route("api/doctor/appointments")]
[Authorize(Roles = "Doctor")]
public class DoctorAppointmentsController : ControllerBase
{
    private readonly IAppointmentService _appointments;

    public DoctorAppointmentsController(IAppointmentService appointments)
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
    [ProducesResponseType(typeof(IReadOnlyList<DoctorAppointmentListItemDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> Get([FromQuery] string? scope, CancellationToken ct)
    {
        var doctorUserId = GetCurrentUserId();
        var items = await _appointments.GetDoctorAppointmentsAsync(doctorUserId, scope, ct);
        return Ok(items);
    }

    [HttpPost("{id:guid}/complete")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> Complete(Guid id, CancellationToken ct)
    {
        var doctorUserId = GetCurrentUserId();
        await _appointments.CompleteByDoctorAsync(doctorUserId, id, ct);
        return NoContent();
    }

    public class DoctorCancelRequest
    {
        public string? Reason { get; set; }
    }

    [HttpPost("{id:guid}/cancel")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> Cancel(Guid id, [FromBody] DoctorCancelRequest request, CancellationToken ct)
    {
        var doctorUserId = GetCurrentUserId();
        await _appointments.CancelByDoctorAsync(doctorUserId, id, request.Reason, ct);
        return NoContent();
    }
}
