using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using MedicalRecords.Application.Appointments;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace MedicalRecords.Api.Controllers;

[ApiController]
[Route("api/appointments")]
public class AppointmentsController : ControllerBase
{
    private readonly IAppointmentService _appointments;

    public AppointmentsController(IAppointmentService appointments)
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

    // B. Căutare doctori pentru pacient
    [HttpGet("doctors/search")]
    [Authorize(Roles = "Patient")]
    [ProducesResponseType(typeof(IReadOnlyList<DoctorSearchResultDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> SearchDoctors([FromQuery] Guid specialtyId, [FromQuery] DateOnly? date, CancellationToken ct)
    {
        var userId = GetCurrentUserId();
        var request = new AppointmentSearchDoctorsRequest
        {
            SpecialtyId = specialtyId,
            Date = date
        };
        var result = await _appointments.SearchDoctorsAsync(userId, request, ct);
        return Ok(result);
    }

    // C. Sloturi disponibile
    [HttpGet("available-slots")]
    [Authorize(Roles = "Patient")]
    [ProducesResponseType(typeof(IReadOnlyList<AvailableSlotDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAvailableSlots([FromQuery] Guid doctorInstitutionId, [FromQuery] DateOnly date, CancellationToken ct)
    {
        var userId = GetCurrentUserId();
        var slots = await _appointments.GetAvailableSlotsAsync(userId, doctorInstitutionId, date, ct);
        return Ok(slots);
    }

    // D. Creare programare
    [HttpPost]
    [Authorize(Roles = "Patient")]
    [ProducesResponseType(typeof(AppointmentDto), StatusCodes.Status200OK)]
    public async Task<IActionResult> Create([FromBody] AppointmentCreateRequest request, CancellationToken ct)
    {
        var userId = GetCurrentUserId();
        var result = await _appointments.CreateAppointmentAsync(userId, request, ct);
        return Ok(result);
    }

    // E. Listare programări pacient
    [HttpGet("my")]
    [Authorize(Roles = "Patient")]
    [ProducesResponseType(typeof(IReadOnlyList<PatientAppointmentListItemDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetMy([FromQuery] string? scope, CancellationToken ct)
    {
        var userId = GetCurrentUserId();
        var result = await _appointments.GetMyAppointmentsAsync(userId, scope, ct);
        return Ok(result);
    }

    // F. Anulare de către pacient
    public class CancelByPatientRequest
    {
        public string? Reason { get; set; }
    }

    [HttpPost("{id:guid}/cancel-by-patient")]
    [Authorize(Roles = "Patient")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> CancelByPatient(Guid id, [FromBody] CancelByPatientRequest request, CancellationToken ct)
    {
        var userId = GetCurrentUserId();
        await _appointments.CancelByPatientAsync(userId, id, request.Reason, ct);
        return NoContent();
    }
}

