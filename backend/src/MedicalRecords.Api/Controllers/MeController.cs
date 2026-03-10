using System.Security.Claims;
using System.IdentityModel.Tokens.Jwt;
using MedicalRecords.Application.Auth;
using MedicalRecords.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace MedicalRecords.Api.Controllers;

[ApiController]
[Route("api/me")]
public class MeController : ControllerBase
{
    private readonly IAuthService _authService;
    private readonly AppDbContext _dbContext;

    public MeController(IAuthService authService, AppDbContext dbContext)
    {
        _authService = authService;
        _dbContext = dbContext;
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

    public class DoctorInstitutionDto
    {
        public Guid Id { get; set; }
        public string Name { get; set; } = default!;
        public string? City { get; set; }
    }

    /// <summary>
    /// Listează instituțiile medicale active asociate doctorului autentificat.
    /// </summary>
    [HttpGet("doctor-institutions")]
    [Authorize(Roles = "Doctor")]
    [ProducesResponseType(typeof(IReadOnlyList<DoctorInstitutionDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetDoctorInstitutions()
    {
        var subClaim = User.FindFirstValue(JwtRegisteredClaimNames.Sub) ??
                       User.FindFirstValue(ClaimTypes.NameIdentifier);

        if (string.IsNullOrWhiteSpace(subClaim) || !Guid.TryParse(subClaim, out var userId))
        {
            return Unauthorized();
        }

        var query =
            from dp in _dbContext.DoctorProfiles.AsNoTracking()
            join di in _dbContext.DoctorInstitutions.AsNoTracking() on dp.Id equals di.DoctorProfileId
            join mi in _dbContext.MedicalInstitutions.AsNoTracking() on di.MedicalInstitutionId equals mi.Id
            where dp.UserId == userId && di.IsActive
            select new DoctorInstitutionDto
            {
                Id = di.Id,
                Name = mi.Name,
                City = mi.City
            };

        var list = await query
            .OrderBy(x => x.Name)
            .ThenBy(x => x.City)
            .ToListAsync();

        return Ok(list);
    }
}

