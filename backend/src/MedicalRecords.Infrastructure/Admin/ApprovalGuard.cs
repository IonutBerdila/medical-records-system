using MedicalRecords.Application.Admin;
using MedicalRecords.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace MedicalRecords.Infrastructure.Admin;

public class ApprovalGuard : IApprovalGuard
{
    private readonly AppDbContext _db;

    public ApprovalGuard(AppDbContext db)
    {
        _db = db;
    }

    public async Task EnsureApprovedAsync(Guid userId, string role)
    {
        if (role == "Doctor")
        {
            var profile = await _db.DoctorProfiles
                .AsNoTracking()
                .FirstOrDefaultAsync(p => p.UserId == userId);

            if (profile == null)
            {
                throw new UnauthorizedAccessException("Profilul doctorului nu a fost găsit.");
            }

            if (profile.ApprovalStatus == "Pending")
            {
                throw new UnauthorizedAccessException("Contul este în așteptarea aprobării de către administrator.");
            }

            if (profile.ApprovalStatus == "Rejected")
            {
                throw new UnauthorizedAccessException("Contul a fost respins. Contactați administratorul pentru detalii.");
            }

            if (profile.ApprovalStatus != "Approved")
            {
                throw new UnauthorizedAccessException("Contul nu este aprobat.");
            }
        }
        else if (role == "Pharmacy")
        {
            var profile = await _db.PharmacyProfiles
                .AsNoTracking()
                .FirstOrDefaultAsync(p => p.UserId == userId);

            if (profile == null)
            {
                throw new UnauthorizedAccessException("Profilul farmaciei nu a fost găsit.");
            }

            if (profile.ApprovalStatus == "Pending")
            {
                throw new UnauthorizedAccessException("Contul este în așteptarea aprobării de către administrator.");
            }

            if (profile.ApprovalStatus == "Rejected")
            {
                throw new UnauthorizedAccessException("Contul a fost respins. Contactați administratorul pentru detalii.");
            }

            if (profile.ApprovalStatus != "Approved")
            {
                throw new UnauthorizedAccessException("Contul nu este aprobat.");
            }
        }
        // Patient și Admin nu necesită aprobare
    }
}
