using MedicalRecords.Application.Admin;
using MedicalRecords.Application.Audit;
using MedicalRecords.Application.Common;
using MedicalRecords.Domain.Entities;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace MedicalRecords.Infrastructure.Admin;

public class AdminService : IAdminService
{
    private readonly IRepository<PatientProfile> _patientProfiles;
    private readonly IRepository<DoctorProfile> _doctorProfiles;
    private readonly IRepository<PharmacyProfile> _pharmacyProfiles;
    private readonly IRepository<AuditEvent> _auditEvents;
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly IAuditService _auditService;

    public AdminService(
        IRepository<PatientProfile> patientProfiles,
        IRepository<DoctorProfile> doctorProfiles,
        IRepository<PharmacyProfile> pharmacyProfiles,
        IRepository<AuditEvent> auditEvents,
        UserManager<ApplicationUser> userManager,
        IAuditService auditService)
    {
        _patientProfiles = patientProfiles;
        _doctorProfiles = doctorProfiles;
        _pharmacyProfiles = pharmacyProfiles;
        _auditEvents = auditEvents;
        _userManager = userManager;
        _auditService = auditService;
    }

    public async Task<AdminUsersResponse> GetUsersAsync(AdminUsersRequest request)
    {
        var query = _userManager.Users.AsQueryable();

        // Filter by role
        if (!string.IsNullOrEmpty(request.Role) && request.Role != "All")
        {
            var roleUsers = await _userManager.GetUsersInRoleAsync(request.Role);
            var roleUserIds = roleUsers.Select(u => u.Id).ToList();
            query = query.Where(u => roleUserIds.Contains(u.Id));
        }

        // Search filter
        if (!string.IsNullOrEmpty(request.Search))
        {
            var searchLower = request.Search.ToLower();
            query = query.Where(u => 
                u.Email != null && u.Email.ToLower().Contains(searchLower));
        }

        var total = await query.CountAsync();

        // Apply pagination
        var users = await query
            .OrderByDescending(u => u.Id) // Simple ordering
            .Skip(request.Skip)
            .Take(request.Take)
            .ToListAsync();

        var userDtos = new List<AdminUserDto>();

        foreach (var user in users)
        {
            var roles = await _userManager.GetRolesAsync(user);
            var dto = new AdminUserDto
            {
                UserId = user.Id,
                Email = user.Email ?? string.Empty,
                Roles = roles.ToList(),
                CreatedAtUtc = null // ApplicationUser doesn't have CreatedAtUtc by default
            };

            // Load profile based on role
            if (roles.Contains("Patient"))
            {
                var profile = await _patientProfiles
                    .Query()
                    .AsNoTracking()
                    .FirstOrDefaultAsync(p => p.UserId == user.Id);
                if (profile != null)
                {
                    dto.FullName = profile.FullName;
                    dto.CreatedAtUtc = profile.CreatedAtUtc;
                }
            }
            else if (roles.Contains("Doctor"))
            {
                var profile = await _doctorProfiles
                    .Query()
                    .AsNoTracking()
                    .FirstOrDefaultAsync(p => p.UserId == user.Id);
                if (profile != null)
                {
                    dto.FullName = profile.FullName;
                    dto.LicenseNumber = profile.LicenseNumber;
                    dto.ApprovalStatus = profile.ApprovalStatus;
                    dto.ApprovedAtUtc = profile.ApprovedAtUtc;
                    dto.ApprovedByAdminUserId = profile.ApprovedByAdminUserId;
                    dto.RejectedAtUtc = profile.RejectedAtUtc;
                    dto.RejectionReason = profile.RejectionReason;
                    dto.CreatedAtUtc = profile.CreatedAtUtc;
                }

                // Filter by approval status if specified
                if (!string.IsNullOrEmpty(request.Status) && 
                    profile?.ApprovalStatus != request.Status)
                {
                    continue;
                }
            }
            else if (roles.Contains("Pharmacy"))
            {
                var profile = await _pharmacyProfiles
                    .Query()
                    .AsNoTracking()
                    .FirstOrDefaultAsync(p => p.UserId == user.Id);
                if (profile != null)
                {
                    dto.PharmacyName = profile.PharmacyName;
                    dto.ApprovalStatus = profile.ApprovalStatus;
                    dto.ApprovedAtUtc = profile.ApprovedAtUtc;
                    dto.ApprovedByAdminUserId = profile.ApprovedByAdminUserId;
                    dto.RejectedAtUtc = profile.RejectedAtUtc;
                    dto.RejectionReason = profile.RejectionReason;
                    dto.CreatedAtUtc = profile.CreatedAtUtc;
                }

                // Filter by approval status if specified
                if (!string.IsNullOrEmpty(request.Status) && 
                    profile?.ApprovalStatus != request.Status)
                {
                    continue;
                }
            }

            // Additional search in profile fields
            if (!string.IsNullOrEmpty(request.Search))
            {
                var searchLower = request.Search.ToLower();
                var matches = dto.Email.ToLower().Contains(searchLower) ||
                             (dto.FullName != null && dto.FullName.ToLower().Contains(searchLower)) ||
                             (dto.PharmacyName != null && dto.PharmacyName.ToLower().Contains(searchLower)) ||
                             (dto.LicenseNumber != null && dto.LicenseNumber.ToLower().Contains(searchLower));
                
                if (!matches)
                {
                    continue;
                }
            }

            userDtos.Add(dto);
        }

        return new AdminUsersResponse
        {
            Users = userDtos,
            Total = total
        };
    }

    public async Task<AdminApprovalsResponse> GetApprovalsAsync(AdminApprovalsRequest request)
    {
        var query = _userManager.Users.AsQueryable();

        // Filter by role
        if (!string.IsNullOrEmpty(request.Role) && request.Role != "All")
        {
            var roleUsers = await _userManager.GetUsersInRoleAsync(request.Role);
            var roleUserIds = roleUsers.Select(u => u.Id).ToList();
            query = query.Where(u => roleUserIds.Contains(u.Id));
        }

        var users = await query.ToListAsync();
        var items = new List<AdminUserDto>();

        foreach (var user in users)
        {
            var roles = await _userManager.GetRolesAsync(user);
            
            if (roles.Contains("Doctor"))
            {
                var profile = await _doctorProfiles
                    .Query()
                    .AsNoTracking()
                    .FirstOrDefaultAsync(p => p.UserId == user.Id);
                
                if (profile != null && profile.ApprovalStatus == request.Status)
                {
                    items.Add(new AdminUserDto
                    {
                        UserId = user.Id,
                        Email = user.Email ?? string.Empty,
                        Roles = roles.ToList(),
                        FullName = profile.FullName,
                        LicenseNumber = profile.LicenseNumber,
                        ApprovalStatus = profile.ApprovalStatus,
                        ApprovedAtUtc = profile.ApprovedAtUtc,
                        ApprovedByAdminUserId = profile.ApprovedByAdminUserId,
                        RejectedAtUtc = profile.RejectedAtUtc,
                        RejectionReason = profile.RejectionReason,
                        CreatedAtUtc = profile.CreatedAtUtc
                    });
                }
            }
            else if (roles.Contains("Pharmacy"))
            {
                var profile = await _pharmacyProfiles
                    .Query()
                    .AsNoTracking()
                    .FirstOrDefaultAsync(p => p.UserId == user.Id);
                
                if (profile != null && profile.ApprovalStatus == request.Status)
                {
                    items.Add(new AdminUserDto
                    {
                        UserId = user.Id,
                        Email = user.Email ?? string.Empty,
                        Roles = roles.ToList(),
                        PharmacyName = profile.PharmacyName,
                        ApprovalStatus = profile.ApprovalStatus,
                        ApprovedAtUtc = profile.ApprovedAtUtc,
                        ApprovedByAdminUserId = profile.ApprovedByAdminUserId,
                        RejectedAtUtc = profile.RejectedAtUtc,
                        RejectionReason = profile.RejectionReason,
                        CreatedAtUtc = profile.CreatedAtUtc
                    });
                }
            }
        }

        var total = items.Count;
        items = items
            .OrderByDescending(i => i.CreatedAtUtc ?? DateTime.MinValue)
            .Skip(request.Skip)
            .Take(request.Take)
            .ToList();

        return new AdminApprovalsResponse
        {
            Items = items,
            Total = total
        };
    }

    public async Task<AdminUserDto> ApproveUserAsync(Guid adminUserId, Guid userId, ApproveUserRequest? request = null)
    {
        var user = await _userManager.FindByIdAsync(userId.ToString());
        if (user == null)
        {
            throw new InvalidOperationException("Utilizatorul nu a fost găsit.");
        }

        var roles = await _userManager.GetRolesAsync(user);
        var utcNow = DateTime.UtcNow;

        if (roles.Contains("Doctor"))
        {
            var profile = await _doctorProfiles
                .Query()
                .FirstOrDefaultAsync(p => p.UserId == userId);
            
            if (profile == null)
            {
                throw new InvalidOperationException("Profilul doctorului nu a fost găsit.");
            }

            profile.ApprovalStatus = "Approved";
            profile.ApprovedAtUtc = utcNow;
            profile.ApprovedByAdminUserId = adminUserId;
            profile.RejectedAtUtc = null;
            profile.RejectionReason = null;

            _doctorProfiles.Update(profile);
            await _doctorProfiles.SaveChangesAsync();

            // Log audit event
            await _auditService.LogAsync(new AuditEventCreate
            {
                TimestampUtc = utcNow,
                Action = "DOCTOR_APPROVED",
                ActorUserId = adminUserId,
                ActorRole = "Admin",
                EntityType = "DoctorProfile",
                EntityId = profile.Id,
                MetadataJson = $"{{\"doctorUserId\":\"{userId}\",\"doctorEmail\":\"{user.Email}\",\"note\":\"{request?.Note ?? ""}\"}}"
            });

            return new AdminUserDto
            {
                UserId = user.Id,
                Email = user.Email ?? string.Empty,
                Roles = roles.ToList(),
                FullName = profile.FullName,
                LicenseNumber = profile.LicenseNumber,
                ApprovalStatus = profile.ApprovalStatus,
                ApprovedAtUtc = profile.ApprovedAtUtc,
                ApprovedByAdminUserId = profile.ApprovedByAdminUserId,
                CreatedAtUtc = profile.CreatedAtUtc
            };
        }
        else if (roles.Contains("Pharmacy"))
        {
            var profile = await _pharmacyProfiles
                .Query()
                .FirstOrDefaultAsync(p => p.UserId == userId);
            
            if (profile == null)
            {
                throw new InvalidOperationException("Profilul farmaciei nu a fost găsit.");
            }

            profile.ApprovalStatus = "Approved";
            profile.ApprovedAtUtc = utcNow;
            profile.ApprovedByAdminUserId = adminUserId;
            profile.RejectedAtUtc = null;
            profile.RejectionReason = null;

            _pharmacyProfiles.Update(profile);
            await _pharmacyProfiles.SaveChangesAsync();

            // Log audit event
            await _auditService.LogAsync(new AuditEventCreate
            {
                TimestampUtc = utcNow,
                Action = "PHARMACY_APPROVED",
                ActorUserId = adminUserId,
                ActorRole = "Admin",
                EntityType = "PharmacyProfile",
                EntityId = profile.Id,
                MetadataJson = $"{{\"pharmacyUserId\":\"{userId}\",\"pharmacyEmail\":\"{user.Email}\",\"note\":\"{request?.Note ?? ""}\"}}"
            });

            return new AdminUserDto
            {
                UserId = user.Id,
                Email = user.Email ?? string.Empty,
                Roles = roles.ToList(),
                PharmacyName = profile.PharmacyName,
                ApprovalStatus = profile.ApprovalStatus,
                ApprovedAtUtc = profile.ApprovedAtUtc,
                ApprovedByAdminUserId = profile.ApprovedByAdminUserId,
                CreatedAtUtc = profile.CreatedAtUtc
            };
        }
        else
        {
            throw new InvalidOperationException("Doar conturile de Doctor sau Pharmacy pot fi aprobate.");
        }
    }

    public async Task<AdminUserDto> RejectUserAsync(Guid adminUserId, Guid userId, RejectUserRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Reason))
        {
            throw new ArgumentException("Motivul respingerii este obligatoriu.");
        }

        if (request.Reason.Length > 500)
        {
            throw new ArgumentException("Motivul respingerii nu poate depăși 500 de caractere.");
        }

        var user = await _userManager.FindByIdAsync(userId.ToString());
        if (user == null)
        {
            throw new InvalidOperationException("Utilizatorul nu a fost găsit.");
        }

        var roles = await _userManager.GetRolesAsync(user);
        var utcNow = DateTime.UtcNow;

        if (roles.Contains("Doctor"))
        {
            var profile = await _doctorProfiles
                .Query()
                .FirstOrDefaultAsync(p => p.UserId == userId);
            
            if (profile == null)
            {
                throw new InvalidOperationException("Profilul doctorului nu a fost găsit.");
            }

            profile.ApprovalStatus = "Rejected";
            profile.RejectedAtUtc = utcNow;
            profile.RejectionReason = request.Reason;
            profile.ApprovedAtUtc = null;
            profile.ApprovedByAdminUserId = null;

            _doctorProfiles.Update(profile);
            await _doctorProfiles.SaveChangesAsync();

            // Log audit event
            await _auditService.LogAsync(new AuditEventCreate
            {
                TimestampUtc = utcNow,
                Action = "DOCTOR_REJECTED",
                ActorUserId = adminUserId,
                ActorRole = "Admin",
                EntityType = "DoctorProfile",
                EntityId = profile.Id,
                MetadataJson = $"{{\"doctorUserId\":\"{userId}\",\"doctorEmail\":\"{user.Email}\",\"reason\":\"{request.Reason.Replace("\"", "\\\"")}\"}}"
            });

            return new AdminUserDto
            {
                UserId = user.Id,
                Email = user.Email ?? string.Empty,
                Roles = roles.ToList(),
                FullName = profile.FullName,
                LicenseNumber = profile.LicenseNumber,
                ApprovalStatus = profile.ApprovalStatus,
                RejectedAtUtc = profile.RejectedAtUtc,
                RejectionReason = profile.RejectionReason,
                CreatedAtUtc = profile.CreatedAtUtc
            };
        }
        else if (roles.Contains("Pharmacy"))
        {
            var profile = await _pharmacyProfiles
                .Query()
                .FirstOrDefaultAsync(p => p.UserId == userId);
            
            if (profile == null)
            {
                throw new InvalidOperationException("Profilul farmaciei nu a fost găsit.");
            }

            profile.ApprovalStatus = "Rejected";
            profile.RejectedAtUtc = utcNow;
            profile.RejectionReason = request.Reason;
            profile.ApprovedAtUtc = null;
            profile.ApprovedByAdminUserId = null;

            _pharmacyProfiles.Update(profile);
            await _pharmacyProfiles.SaveChangesAsync();

            // Log audit event
            await _auditService.LogAsync(new AuditEventCreate
            {
                TimestampUtc = utcNow,
                Action = "PHARMACY_REJECTED",
                ActorUserId = adminUserId,
                ActorRole = "Admin",
                EntityType = "PharmacyProfile",
                EntityId = profile.Id,
                MetadataJson = $"{{\"pharmacyUserId\":\"{userId}\",\"pharmacyEmail\":\"{user.Email}\",\"reason\":\"{request.Reason.Replace("\"", "\\\"")}\"}}"
            });

            return new AdminUserDto
            {
                UserId = user.Id,
                Email = user.Email ?? string.Empty,
                Roles = roles.ToList(),
                PharmacyName = profile.PharmacyName,
                ApprovalStatus = profile.ApprovalStatus,
                RejectedAtUtc = profile.RejectedAtUtc,
                RejectionReason = profile.RejectionReason,
                CreatedAtUtc = profile.CreatedAtUtc
            };
        }
        else
        {
            throw new InvalidOperationException("Doar conturile de Doctor sau Pharmacy pot fi respinse.");
        }
    }

    public async Task<AdminDashboardResponse> GetDashboardAsync()
    {
        var allUsers = await _userManager.Users.ToListAsync();
        var counts = new AdminDashboardCounts
        {
            TotalUsers = allUsers.Count
        };

        foreach (var user in allUsers)
        {
            var roles = await _userManager.GetRolesAsync(user);
            if (roles.Contains("Patient")) counts.Patients++;
            if (roles.Contains("Doctor")) counts.Doctors++;
            if (roles.Contains("Pharmacy")) counts.Pharmacies++;
            if (roles.Contains("Admin")) counts.Admins++;
        }

        // Count pending approvals by role
        var pendingDoctors = await _doctorProfiles
            .Query()
            .CountAsync(p => p.ApprovalStatus == "Pending");
        var pendingPharmacies = await _pharmacyProfiles
            .Query()
            .CountAsync(p => p.ApprovalStatus == "Pending");

        counts.PendingDoctors = pendingDoctors;
        counts.PendingPharmacies = pendingPharmacies;
        counts.PendingApprovalsTotal = pendingDoctors + pendingPharmacies;
        // Backwards-compat: keep aggregated value in PendingApprovals as well
        counts.PendingApprovals = counts.PendingApprovalsTotal;

        // Get recent activity (last 20 audit events)
        var recentEvents = await _auditEvents
            .Query()
            .OrderByDescending(e => e.TimestampUtc)
            .Take(20)
            .ToListAsync();

        var recentActivity = new List<AdminAuditEventDto>();
        foreach (var evt in recentEvents)
        {
            var actorUser = await _userManager.FindByIdAsync(evt.ActorUserId.ToString());
            var patientUser = evt.PatientUserId.HasValue 
                ? await _userManager.FindByIdAsync(evt.PatientUserId.Value.ToString())
                : null;

            recentActivity.Add(new AdminAuditEventDto
            {
                Id = evt.Id,
                TimestampUtc = evt.TimestampUtc,
                Action = evt.Action,
                ActorUserId = evt.ActorUserId,
                ActorRole = evt.ActorRole,
                ActorEmail = actorUser?.Email,
                PatientUserId = evt.PatientUserId,
                PatientEmail = patientUser?.Email,
                EntityType = evt.EntityType,
                EntityId = evt.EntityId,
                MetadataJson = evt.MetadataJson,
                IpAddress = evt.IpAddress
            });
        }

        return new AdminDashboardResponse
        {
            Counts = counts,
            RecentActivity = recentActivity
        };
    }

    public async Task<AdminAuditResponse> GetAuditAsync(AdminAuditRequest request)
    {
        var query = _auditEvents.Query();

        if (request.FromUtc.HasValue)
        {
            query = query.Where(e => e.TimestampUtc >= request.FromUtc.Value);
        }

        if (request.ToUtc.HasValue)
        {
            query = query.Where(e => e.TimestampUtc <= request.ToUtc.Value);
        }

        if (!string.IsNullOrEmpty(request.Action))
        {
            query = query.Where(e => e.Action == request.Action);
        }

        var total = await query.CountAsync();

        var events = await query
            .OrderByDescending(e => e.TimestampUtc)
            .Skip(request.Skip)
            .Take(request.Take)
            .ToListAsync();

        var eventDtos = new List<AdminAuditEventDto>();
        foreach (var evt in events)
        {
            var actorUser = await _userManager.FindByIdAsync(evt.ActorUserId.ToString());
            var patientUser = evt.PatientUserId.HasValue 
                ? await _userManager.FindByIdAsync(evt.PatientUserId.Value.ToString())
                : null;

            eventDtos.Add(new AdminAuditEventDto
            {
                Id = evt.Id,
                TimestampUtc = evt.TimestampUtc,
                Action = evt.Action,
                ActorUserId = evt.ActorUserId,
                ActorRole = evt.ActorRole,
                ActorEmail = actorUser?.Email,
                PatientUserId = evt.PatientUserId,
                PatientEmail = patientUser?.Email,
                EntityType = evt.EntityType,
                EntityId = evt.EntityId,
                MetadataJson = evt.MetadataJson,
                IpAddress = evt.IpAddress
            });
        }

        return new AdminAuditResponse
        {
            Events = eventDtos,
            Total = total
        };
    }
}
