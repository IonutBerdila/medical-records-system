using System.Security.Claims;
using System.IdentityModel.Tokens.Jwt;
using MedicalRecords.Application.Entries;
using MedicalRecords.Application.Prescriptions;
using MedicalRecords.Application.Records;
using MedicalRecords.Infrastructure.Auth;
using MedicalRecords.Infrastructure.Consent;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace MedicalRecords.Api.Controllers;

[ApiController]
[Route("api/patients")]
[Authorize(Roles = "Doctor")]
public class PatientsController : ControllerBase
{
    private readonly IMedicalRecordService _recordService;
    private readonly IMedicalEntryService _entryService;
    private readonly IPrescriptionService _prescriptionService;

    public PatientsController(
        IMedicalRecordService recordService,
        IMedicalEntryService entryService,
        IPrescriptionService prescriptionService)
    {
        _recordService = recordService;
        _entryService = entryService;
        _prescriptionService = prescriptionService;
    }

    private Guid? GetCurrentUserId()
    {
        var sub = User.FindFirstValue(JwtRegisteredClaimNames.Sub) ?? User.FindFirstValue(ClaimTypes.NameIdentifier);
        return Guid.TryParse(sub, out var id) ? id : null;
    }

    [HttpGet("{patientUserId:guid}/entries")]
    [ProducesResponseType(typeof(IReadOnlyList<MedicalEntryDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetPatientEntries(Guid patientUserId)
    {
        var doctorUserId = GetCurrentUserId();
        if (doctorUserId == null) return Unauthorized();
        try
        {
            var result = await _entryService.GetEntriesForPatientAsync(doctorUserId.Value, patientUserId);
            return Ok(result);
        }
        catch (ConsentDeniedException ex)
        {
            return StatusCode(403, new { message = ex.Message });
        }
    }

    [HttpGet("{patientUserId:guid}/record")]
    [ProducesResponseType(typeof(MedicalRecordDto), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetPatientRecord(Guid patientUserId)
    {
        var doctorUserId = GetCurrentUserId();
        if (doctorUserId == null) return Unauthorized();
        try
        {
            var result = await _recordService.GetPatientRecordForDoctorAsync(doctorUserId.Value, patientUserId);
            return Ok(result);
        }
        catch (ConsentDeniedException ex)
        {
            return StatusCode(403, new { message = ex.Message });
        }
    }

    [HttpPost("{patientUserId:guid}/entries")]
    [ProducesResponseType(typeof(MedicalEntryDto), StatusCodes.Status201Created)]
    public async Task<IActionResult> AddPatientEntry(Guid patientUserId, [FromBody] CreateMedicalEntryRequest request)
    {
        var doctorUserId = GetCurrentUserId();
        if (doctorUserId == null) return Unauthorized();
        try
        {
            var result = await _entryService.AddEntryForPatientAsync(doctorUserId.Value, patientUserId, request);
            return CreatedAtAction(nameof(AddPatientEntry), new { patientUserId }, result);
        }
        catch (ConsentDeniedException ex)
        {
            return StatusCode(403, new { message = ex.Message });
        }
        catch (AuthValidationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPost("{patientUserId:guid}/prescriptions")]
    [ProducesResponseType(typeof(PrescriptionDto), StatusCodes.Status201Created)]
    public async Task<IActionResult> CreatePatientPrescription(Guid patientUserId, [FromBody] CreatePrescriptionRequest request)
    {
        var doctorUserId = GetCurrentUserId();
        if (doctorUserId == null) return Unauthorized();
        try
        {
            var result = await _prescriptionService.CreatePrescriptionForPatientAsync(doctorUserId.Value, patientUserId, request);
            return CreatedAtAction(nameof(CreatePatientPrescription), new { patientUserId }, result);
        }
        catch (ConsentDeniedException ex)
        {
            return StatusCode(403, new { message = ex.Message });
        }
    }
}
