using MedicalRecords.Application.Metadata;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace MedicalRecords.Api.Controllers;

[ApiController]
[Route("api/metadata")]
public class MetadataController : ControllerBase
{
    private readonly IMetadataService _metadataService;

    public MetadataController(IMetadataService metadataService)
    {
        _metadataService = metadataService;
    }

    /// <summary>
    /// Listează specialitățile medicale active (pentru formularul de înregistrare doctor).
    /// </summary>
    [HttpGet("specialties")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(List<SpecialtyDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetSpecialties()
    {
        var items = await _metadataService.GetActiveSpecialtiesAsync();
        return Ok(items);
    }
}

