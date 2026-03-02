using System.Security.Claims;
using System.IdentityModel.Tokens.Jwt;
using MedicalRecords.Application.Admin;
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
    private readonly IApprovalGuard _approvalGuard;
    private readonly ILogger<PatientsController> _logger;

    public PatientsController(
        IMedicalRecordService recordService,
        IMedicalEntryService entryService,
        IPrescriptionService prescriptionService,
        IApprovalGuard approvalGuard,
        ILogger<PatientsController> logger)
    {
        _recordService = recordService;
        _entryService = entryService;
        _prescriptionService = prescriptionService;
        _approvalGuard = approvalGuard;
        _logger = logger;
    }

    private Guid? GetCurrentUserId()
    {
        var sub = User.FindFirstValue(JwtRegisteredClaimNames.Sub) ?? User.FindFirstValue(ClaimTypes.NameIdentifier);
        return Guid.TryParse(sub, out var id) ? id : null;
    }

    [HttpGet("{patientUserId:guid}/entries")]
    [ProducesResponseType(typeof(IReadOnlyList<MedicalEntryDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> GetPatientEntries(Guid patientUserId)
    {
        var doctorUserId = GetCurrentUserId();
        if (doctorUserId == null) return Unauthorized();
        
        try
        {
            await _approvalGuard.EnsureApprovedAsync(doctorUserId.Value, "Doctor");
        }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(StatusCodes.Status403Forbidden, new { message = ex.Message });
        }
        
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
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> GetPatientRecord(Guid patientUserId)
    {
        var doctorUserId = GetCurrentUserId();
        if (doctorUserId == null) return Unauthorized();
        
        try
        {
            await _approvalGuard.EnsureApprovedAsync(doctorUserId.Value, "Doctor");
        }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(StatusCodes.Status403Forbidden, new { message = ex.Message });
        }
        
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
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> AddPatientEntry(Guid patientUserId, [FromBody] CreateMedicalEntryRequest request)
    {
        var doctorUserId = GetCurrentUserId();
        if (doctorUserId == null) return Unauthorized();
        
        try
        {
            await _approvalGuard.EnsureApprovedAsync(doctorUserId.Value, "Doctor");
        }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(StatusCodes.Status403Forbidden, new { message = ex.Message });
        }
        
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

    [HttpGet("{patientUserId:guid}/prescriptions", Name = nameof(GetPatientPrescriptions))]
    [ProducesResponseType(typeof(IReadOnlyList<PrescriptionDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> GetPatientPrescriptions(Guid patientUserId)
    {
        var doctorUserId = GetCurrentUserId();
        if (doctorUserId == null) return Unauthorized();

        try
        {
            await _approvalGuard.EnsureApprovedAsync(doctorUserId.Value, "Doctor");
        }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(StatusCodes.Status403Forbidden, new { message = ex.Message });
        }

        try
        {
            var result = await _prescriptionService.GetPrescriptionsForPatientAsync(doctorUserId.Value, patientUserId);
            return Ok(result);
        }
        catch (ConsentDeniedException ex)
        {
            return StatusCode(403, new { message = ex.Message });
        }
    }

    [HttpPost("{patientUserId:guid}/prescriptions")]
    [ProducesResponseType(typeof(PrescriptionDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> CreatePatientPrescription(Guid patientUserId, [FromBody] CreatePrescriptionRequest request)
    {
        var doctorUserId = GetCurrentUserId();
        if (doctorUserId == null) return Unauthorized();
        
        try
        {
            await _approvalGuard.EnsureApprovedAsync(doctorUserId.Value, "Doctor");
        }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(StatusCodes.Status403Forbidden, new { message = ex.Message });
        }
        
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

    [HttpGet("{patientUserId:guid}/prescriptions/{prescriptionId:guid}")]
    [ProducesResponseType(typeof(PrescriptionDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetPatientPrescription(Guid patientUserId, Guid prescriptionId)
    {
        var doctorUserId = GetCurrentUserId();
        if (doctorUserId == null) return Unauthorized();

        try
        {
            await _approvalGuard.EnsureApprovedAsync(doctorUserId.Value, "Doctor");
        }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(StatusCodes.Status403Forbidden, new { message = ex.Message });
        }

        try
        {
            var result = await _prescriptionService.GetPrescriptionByIdForDoctorAsync(doctorUserId.Value, patientUserId, prescriptionId);
            return Ok(result);
        }
        catch (ConsentDeniedException ex)
        {
            return StatusCode(403, new { message = ex.Message });
        }
        catch (KeyNotFoundException)
        {
            return NotFound(new { message = "Prescripția nu a fost găsită." });
        }
    }

    [HttpPut("{patientUserId:guid}/prescriptions/{prescriptionId:guid}")]
    [ProducesResponseType(typeof(PrescriptionDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> UpdatePatientPrescriptionDraft(Guid patientUserId, Guid prescriptionId, [FromBody] UpdatePrescriptionDraftRequest request)
    {
        var doctorUserId = GetCurrentUserId();
        if (doctorUserId == null) return Unauthorized();

        try
        {
            await _approvalGuard.EnsureApprovedAsync(doctorUserId.Value, "Doctor");
        }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(StatusCodes.Status403Forbidden, new { message = ex.Message });
        }

        try
        {
            var result = await _prescriptionService.UpdateDraftAsync(doctorUserId.Value, patientUserId, prescriptionId, request);
            return Ok(result);
        }
        catch (ConsentDeniedException ex)
        {
            return StatusCode(403, new { message = ex.Message });
        }
        catch (KeyNotFoundException)
        {
            return NotFound(new { message = "Prescripția nu a fost găsită." });
        }
        catch (InvalidOperationException ex)
        {
            // Business rule conflicts (not Draft, already eliberată, fără medicamente etc.)
            return StatusCode(409, new Microsoft.AspNetCore.Mvc.ProblemDetails
            {
                Title = "Conflict de stare",
                Detail = ex.Message,
                Status = 409
            });
        }
        catch (Microsoft.EntityFrameworkCore.DbUpdateConcurrencyException ex)
        {
            // Concurență reală EF Core (rândul nu mai există sau a fost modificat între timp)
            var primaryKey = ex.Entries.FirstOrDefault()?.Metadata.FindPrimaryKey();
            var entriesInfo = string.Join(" | ", ex.Entries.Select(e =>
            {
                var pkProps = primaryKey?.Properties ?? Enumerable.Empty<Microsoft.EntityFrameworkCore.Metadata.IProperty>();
                var pkValues = string.Join(",", pkProps.Select(pk => $"{pk.Name}={e.Property(pk.Name).CurrentValue}"));
                return $"{e.Metadata.ClrType.Name} Keys=[{pkValues}] State={e.State}";
            }));
            
            _logger.LogWarning(ex,
                "DbUpdateConcurrencyException la actualizarea draftului de prescripție. PatientUserId={PatientUserId}, PrescriptionId={PrescriptionId}, Entries={Entries}",
                patientUserId,
                prescriptionId,
                entriesInfo);

            return StatusCode(409, new Microsoft.AspNetCore.Mvc.ProblemDetails
            {
                Title = "Conflict de stare",
                Detail = "Draft-ul a fost modificat sau șters de alt utilizator. Te rugăm să reîncarci pagina și să încerci din nou.",
                Status = 409
            });
        }
    }

    [HttpPost("{patientUserId:guid}/prescriptions/{prescriptionId:guid}/issue")]
    [ProducesResponseType(typeof(PrescriptionDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> IssuePatientPrescriptionDraft(Guid patientUserId, Guid prescriptionId, [FromBody] UpdatePrescriptionDraftRequest request)
    {
        var doctorUserId = GetCurrentUserId();
        if (doctorUserId == null) return Unauthorized();

        try
        {
            await _approvalGuard.EnsureApprovedAsync(doctorUserId.Value, "Doctor");
        }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(StatusCodes.Status403Forbidden, new { message = ex.Message });
        }

        try
        {
            var result = await _prescriptionService.IssueDraftAsync(doctorUserId.Value, patientUserId, prescriptionId, request);
            return Ok(result);
        }
        catch (ConsentDeniedException ex)
        {
            return StatusCode(403, new { message = ex.Message });
        }
        catch (KeyNotFoundException)
        {
            return NotFound(new { message = "Prescripția nu a fost găsită." });
        }
        catch (InvalidOperationException ex)
        {
            return StatusCode(409, new Microsoft.AspNetCore.Mvc.ProblemDetails
            {
                Title = "Conflict de stare",
                Detail = ex.Message,
                Status = 409
            });
        }
        catch (Microsoft.EntityFrameworkCore.DbUpdateConcurrencyException ex)
        {
            var primaryKey = ex.Entries.FirstOrDefault()?.Metadata.FindPrimaryKey();
            var entriesInfo = string.Join(" | ", ex.Entries.Select(e =>
            {
                var pkProps = primaryKey?.Properties ?? Enumerable.Empty<Microsoft.EntityFrameworkCore.Metadata.IProperty>();
                var pkValues = string.Join(",", pkProps.Select(pk => $"{pk.Name}={e.Property(pk.Name).CurrentValue}"));
                return $"{e.Metadata.ClrType.Name} Keys=[{pkValues}] State={e.State}";
            }));
            
            _logger.LogWarning(ex,
                "DbUpdateConcurrencyException la emiterea draftului de prescripție. PatientUserId={PatientUserId}, PrescriptionId={PrescriptionId}, Entries={Entries}",
                patientUserId,
                prescriptionId,
                entriesInfo);

            return StatusCode(409, new Microsoft.AspNetCore.Mvc.ProblemDetails
            {
                Title = "Conflict de stare",
                Detail = "Draft-ul a fost modificat sau șters de alt utilizator. Te rugăm să reîncarci pagina și să încerci din nou.",
                Status = 409
            });
        }
    }

    [HttpDelete("{patientUserId:guid}/prescriptions/{prescriptionId:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> DeletePatientPrescriptionDraft(Guid patientUserId, Guid prescriptionId)
    {
        var doctorUserId = GetCurrentUserId();
        if (doctorUserId == null) return Unauthorized();

        try
        {
            await _approvalGuard.EnsureApprovedAsync(doctorUserId.Value, "Doctor");
        }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(StatusCodes.Status403Forbidden, new { message = ex.Message });
        }

        try
        {
            await _prescriptionService.DeleteDraftAsync(doctorUserId.Value, patientUserId, prescriptionId);
            return NoContent();
        }
        catch (ConsentDeniedException ex)
        {
            return StatusCode(403, new { message = ex.Message });
        }
        catch (KeyNotFoundException)
        {
            return NotFound(new { message = "Prescripția nu a fost găsită." });
        }
        catch (InvalidOperationException ex)
        {
            return StatusCode(409, new { message = ex.Message });
        }
    }
}
