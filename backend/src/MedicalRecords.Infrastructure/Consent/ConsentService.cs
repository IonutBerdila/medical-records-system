using MedicalRecords.Application.Consent;
using MedicalRecords.Domain.Entities;
using MedicalRecords.Infrastructure.Data;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace MedicalRecords.Infrastructure.Consent;

public class ConsentService : IConsentService
{
    private readonly AppDbContext _db;
    private readonly UserManager<ApplicationUser> _userManager;

    public ConsentService(AppDbContext db, UserManager<Domain.Entities.ApplicationUser> userManager)
    {
        _db = db;
        _userManager = userManager;
    }

    public async Task<bool> HasActiveAccessAsync(Guid patientUserId, Guid doctorUserId)
    {
        var now = DateTime.UtcNow;
        return await _db.PatientDoctorAccesses.AnyAsync(a =>
            a.PatientUserId == patientUserId
            && a.DoctorUserId == doctorUserId
            && a.RevokedAtUtc == null
            && (a.ExpiresAtUtc == null || a.ExpiresAtUtc > now));
    }

    public async Task GrantDoctorAccessAsync(Guid patientUserId, Guid doctorUserId, DateTime? expiresAtUtc)
    {
        var now = DateTime.UtcNow;
        var existing = await _db.PatientDoctorAccesses
            .FirstOrDefaultAsync(a => a.PatientUserId == patientUserId && a.DoctorUserId == doctorUserId && a.RevokedAtUtc == null);

        if (existing != null)
        {
            existing.ExpiresAtUtc = expiresAtUtc;
            await _db.SaveChangesAsync();
            return;
        }

        _db.PatientDoctorAccesses.Add(new PatientDoctorAccess
        {
            Id = Guid.NewGuid(),
            PatientUserId = patientUserId,
            DoctorUserId = doctorUserId,
            GrantedAtUtc = now,
            ExpiresAtUtc = expiresAtUtc
        });
        await _db.SaveChangesAsync();
    }

    public async Task RevokeDoctorAccessAsync(Guid patientUserId, Guid doctorUserId)
    {
        var now = DateTime.UtcNow;
        var access = await _db.PatientDoctorAccesses
            .FirstOrDefaultAsync(a => a.PatientUserId == patientUserId && a.DoctorUserId == doctorUserId && a.RevokedAtUtc == null);
        if (access != null)
        {
            access.RevokedAtUtc = now;
            await _db.SaveChangesAsync();
        }
    }

    public async Task<bool> RevokeAccessByIdAsync(Guid patientUserId, Guid accessId)
    {
        var now = DateTime.UtcNow;
        var access = await _db.PatientDoctorAccesses
            .FirstOrDefaultAsync(a => a.Id == accessId && a.PatientUserId == patientUserId && a.RevokedAtUtc == null);

        if (access == null)
        {
            return false;
        }

        access.RevokedAtUtc = now;
        await _db.SaveChangesAsync();
        return true;
    }

    public async Task<IReadOnlyList<AccessDto>> ListMyGrantedAccessAsync(Guid patientUserId)
    {
        var now = DateTime.UtcNow;
        var list = await _db.PatientDoctorAccesses
            .Where(a => a.PatientUserId == patientUserId)
            .OrderByDescending(a => a.GrantedAtUtc)
            .ToListAsync();

        var result = new List<AccessDto>();
        foreach (var a in list)
        {
            var isActive = a.RevokedAtUtc == null && (a.ExpiresAtUtc == null || a.ExpiresAtUtc > now);
            var doctor = await _userManager.FindByIdAsync(a.DoctorUserId.ToString());
            var profile = await _db.DoctorProfiles.AsNoTracking().FirstOrDefaultAsync(p => p.UserId == a.DoctorUserId);
            result.Add(new AccessDto
            {
                Id = a.Id,
                DoctorUserId = a.DoctorUserId,
                DoctorFullName = profile?.FullName ?? doctor?.Email,
                GrantedAtUtc = a.GrantedAtUtc,
                ExpiresAtUtc = a.ExpiresAtUtc,
                IsActive = isActive
            });
        }
        return result;
    }

    public async Task<IReadOnlyList<DoctorPatientDto>> ListMyPatientsAsync(Guid doctorUserId)
    {
        var now = DateTime.UtcNow;
        var accessList = await _db.PatientDoctorAccesses
            .Where(a => a.DoctorUserId == doctorUserId && a.RevokedAtUtc == null
                && (a.ExpiresAtUtc == null || a.ExpiresAtUtc > now))
            .Select(a => a.PatientUserId)
            .Distinct()
            .ToListAsync();

        var result = new List<DoctorPatientDto>();
        foreach (var pid in accessList)
        {
            var user = await _userManager.FindByIdAsync(pid.ToString());
            var profile = await _db.PatientProfiles.AsNoTracking().FirstOrDefaultAsync(p => p.UserId == pid);
            result.Add(new DoctorPatientDto
            {
                PatientUserId = pid,
                Email = user?.Email,
                FullName = profile?.FullName
            });
        }
        return result;
    }

    public async Task<IReadOnlyList<DoctorLookupDto>> SearchDoctorsAsync(string query)
    {
        if (string.IsNullOrWhiteSpace(query))
        {
            return Array.Empty<DoctorLookupDto>();
        }

        var normalized = query.Trim().ToLowerInvariant();

        // Căutăm doar doctori aprobați, după nume complet sau email,
        // și aducem și instituția medicală principală (dacă există).
        var doctors = await (from profile in _db.DoctorProfiles
                             join user in _userManager.Users on profile.UserId equals user.Id
                             join di in _db.DoctorInstitutions on profile.Id equals di.DoctorProfileId into diGroup
                             from di in diGroup.OrderByDescending(x => x.IsPrimaryInstitution).ThenBy(x => x.Id).Take(1).DefaultIfEmpty()
                             join inst in _db.MedicalInstitutions on di.MedicalInstitutionId equals inst.Id into instGroup
                             from inst in instGroup.DefaultIfEmpty()
                             where profile.ApprovalStatus == "Approved"
                                   && (
                                       (profile.FullName != null &&
                                        profile.FullName.ToLower().Contains(normalized)) ||
                                       (user.Email != null &&
                                        user.Email.ToLower().Contains(normalized))
                                   )
                             orderby profile.FullName
                             select new DoctorLookupDto
                             {
                                 UserId = user.Id,
                                 FullName = profile.FullName,
                                 Email = user.Email,
                                 LicenseNumber = profile.LicenseNumber,
                                 InstitutionName = inst != null ? inst.Name : null,
                                 InstitutionCity = inst != null ? inst.City : null
                             })
                             .Take(10)
                             .ToListAsync();

        return doctors;
    }
}
