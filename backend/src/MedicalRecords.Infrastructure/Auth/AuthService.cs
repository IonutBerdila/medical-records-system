using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using MedicalRecords.Application.Auth;
using MedicalRecords.Domain.Entities;
using MedicalRecords.Infrastructure.Data;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;

namespace MedicalRecords.Infrastructure.Auth;

/// <summary>
/// Implementare de bază pentru autentificare și autorizare folosind Identity + JWT.
/// </summary>
public class AuthService : IAuthService
{
    private static readonly string[] AllowedRoles = ["Patient", "Doctor", "Pharmacy", "Admin"];

    private readonly UserManager<ApplicationUser> _userManager;
    private readonly RoleManager<IdentityRole<Guid>> _roleManager;
    private readonly AppDbContext _dbContext;
    private readonly IConfiguration _configuration;

    public AuthService(
        UserManager<ApplicationUser> userManager,
        RoleManager<IdentityRole<Guid>> roleManager,
        AppDbContext dbContext,
        IConfiguration configuration)
    {
        _userManager = userManager;
        _roleManager = roleManager;
        _dbContext = dbContext;
        _configuration = configuration;
    }

    public async Task<RegisterResponse> RegisterAsync(RegisterRequest req)
    {
        if (!AllowedRoles.Contains(req.Role))
        {
            throw new InvalidOperationException("Rol invalid. Roluri permise: Patient, Doctor, Pharmacy, Admin.");
        }

        var existingUser = await _userManager.FindByEmailAsync(req.Email);
        if (existingUser is not null)
        {
            throw new InvalidOperationException("Există deja un utilizator cu acest email.");
        }

        var user = new ApplicationUser
        {
            Id = Guid.NewGuid(),
            Email = req.Email,
            UserName = req.Email,
            EmailConfirmed = false
        };

        var createResult = await _userManager.CreateAsync(user, req.Password);
        if (!createResult.Succeeded)
        {
            var errors = string.Join("; ", createResult.Errors.Select(e => e.Description));
            throw new InvalidOperationException($"Eroare la crearea utilizatorului: {errors}");
        }

        var roleResult = await _userManager.AddToRoleAsync(user, req.Role);
        if (!roleResult.Succeeded)
        {
            var errors = string.Join("; ", roleResult.Errors.Select(e => e.Description));
            throw new InvalidOperationException($"Eroare la asignarea rolului: {errors}");
        }

        // Creează profilul în funcție de rol
        var utcNow = DateTime.UtcNow;

        switch (req.Role)
        {
            case "Patient":
                _dbContext.PatientProfiles.Add(new PatientProfile
                {
                    Id = Guid.NewGuid(),
                    UserId = user.Id,
                    FullName = req.FullName,
                    CreatedAtUtc = utcNow
                });
                break;
            case "Doctor":
                _dbContext.DoctorProfiles.Add(new DoctorProfile
                {
                    Id = Guid.NewGuid(),
                    UserId = user.Id,
                    FullName = req.FullName,
                    LicenseNumber = null,
                    CreatedAtUtc = utcNow
                });
                break;
            case "Pharmacy":
                _dbContext.PharmacyProfiles.Add(new PharmacyProfile
                {
                    Id = Guid.NewGuid(),
                    UserId = user.Id,
                    PharmacyName = req.FullName,
                    CreatedAtUtc = utcNow
                });
                break;
            case "Admin":
                // Admin nu are profil asociat
                break;
        }

        await _dbContext.SaveChangesAsync();

        return new RegisterResponse
        {
            UserId = user.Id,
            Email = user.Email!,
            Role = req.Role
        };
    }

    public async Task<LoginResponse> LoginAsync(LoginRequest req)
    {
        var user = await _userManager.Users.SingleOrDefaultAsync(u => u.Email == req.Email);
        if (user is null)
        {
            throw new InvalidOperationException("Email sau parolă incorecte.");
        }

        var passwordValid = await _userManager.CheckPasswordAsync(user, req.Password);
        if (!passwordValid)
        {
            throw new InvalidOperationException("Email sau parolă incorecte.");
        }

        var roles = await _userManager.GetRolesAsync(user);

        var jwtSection = _configuration.GetSection("Jwt");
        var issuer = jwtSection["Issuer"] ?? "MedicalRecords.Api";
        var audience = jwtSection["Audience"] ?? "MedicalRecords.Api";
        var key = jwtSection["Key"] ?? throw new InvalidOperationException("JWT Key not configured");
        var expiresMinutes = int.TryParse(jwtSection["ExpiresMinutes"], out var m) ? m : 60;

        var signingKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(key));
        var credentials = new SigningCredentials(signingKey, SecurityAlgorithms.HmacSha256);

        var now = DateTime.UtcNow;

        var claims = new List<Claim>
        {
            new(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
            new(JwtRegisteredClaimNames.Email, user.Email ?? string.Empty)
        };

        foreach (var role in roles)
        {
            claims.Add(new Claim(ClaimTypes.Role, role));
        }

        var token = new JwtSecurityToken(
            issuer: issuer,
            audience: audience,
            claims: claims,
            notBefore: now,
            expires: now.AddMinutes(expiresMinutes),
            signingCredentials: credentials);

        var tokenString = new JwtSecurityTokenHandler().WriteToken(token);

        return new LoginResponse
        {
            AccessToken = tokenString,
            ExpiresAtUtc = token.ValidTo
        };
    }

    public async Task<MeResponse> GetMeAsync(Guid userId)
    {
        var user = await _userManager.FindByIdAsync(userId.ToString());
        if (user is null)
        {
            throw new InvalidOperationException("Utilizatorul nu a fost găsit.");
        }

        var roles = (await _userManager.GetRolesAsync(user)).ToArray();

        object? profile = null;

        // Prioritate: Admin > Doctor > Pharmacy > Patient
        if (roles.Contains("Admin"))
        {
            profile = null; // Admin nu are profil dedicat în această fază
        }
        else if (roles.Contains("Doctor"))
        {
            var doctorProfile = await _dbContext.DoctorProfiles
                .AsNoTracking()
                .FirstOrDefaultAsync(p => p.UserId == userId);

            if (doctorProfile is not null)
            {
                profile = new
                {
                    doctorProfile.Id,
                    doctorProfile.FullName,
                    doctorProfile.LicenseNumber,
                    doctorProfile.CreatedAtUtc
                };
            }
        }
        else if (roles.Contains("Pharmacy"))
        {
            var pharmacyProfile = await _dbContext.PharmacyProfiles
                .AsNoTracking()
                .FirstOrDefaultAsync(p => p.UserId == userId);

            if (pharmacyProfile is not null)
            {
                profile = new
                {
                    pharmacyProfile.Id,
                    pharmacyProfile.PharmacyName,
                    pharmacyProfile.CreatedAtUtc
                };
            }
        }
        else if (roles.Contains("Patient"))
        {
            var patientProfile = await _dbContext.PatientProfiles
                .AsNoTracking()
                .FirstOrDefaultAsync(p => p.UserId == userId);

            if (patientProfile is not null)
            {
                profile = new
                {
                    patientProfile.Id,
                    patientProfile.FullName,
                    patientProfile.CreatedAtUtc
                };
            }
        }

        return new MeResponse
        {
            UserId = user.Id,
            Email = user.Email ?? string.Empty,
            Roles = roles,
            Profile = profile
        };
    }
}

