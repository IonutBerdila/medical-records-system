using System.Text.Json;
using MedicalRecords.Application.Appointments;
using MedicalRecords.Application.Audit;
using MedicalRecords.Domain.Entities;
using MedicalRecords.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace MedicalRecords.Infrastructure.Appointments;

public class AppointmentService : IAppointmentService
{
    private readonly AppDbContext _db;
    private readonly IAuditService _audit;

    public AppointmentService(AppDbContext db, IAuditService audit)
    {
        _db = db;
        _audit = audit;
    }

    // Helper: ensure doctor is approved and institution active
    private async Task<(DoctorProfile doctor, DoctorInstitution institution)> EnsureDoctorInstitutionAsync(Guid doctorInstitutionId, CancellationToken ct)
    {
        var institution = await _db.DoctorInstitutions
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.Id == doctorInstitutionId && x.IsActive, ct);
        if (institution == null)
        {
            throw new InvalidOperationException("Instituția medicală a doctorului nu a fost găsită sau nu este activă.");
        }

        var doctor = await _db.DoctorProfiles
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.Id == institution.DoctorProfileId, ct);
        if (doctor == null || doctor.ApprovalStatus != "Approved")
        {
            throw new InvalidOperationException("Doctorul nu este aprobat pentru programări.");
        }

        return (doctor, institution);
    }

    /// <summary>
    /// Obține ziua săptămânii pentru o dată, folosind convenția .NET (Sunday=0..Saturday=6).
    /// </summary>
    private static int GetDayOfWeekNumber(DateOnly date)
    {
        return (int)date.ToDateTime(TimeOnly.MinValue).DayOfWeek;
    }

    public async Task<IReadOnlyList<DoctorAvailabilityRuleDto>> GetAvailabilityAsync(Guid doctorUserId, CancellationToken ct = default)
    {
        var doctor = await _db.DoctorProfiles.AsNoTracking().FirstOrDefaultAsync(x => x.UserId == doctorUserId, ct)
                     ?? throw new InvalidOperationException("Profilul doctorului nu a fost găsit.");

        var rules = await _db.DoctorAvailabilityRules
            .AsNoTracking()
            .Where(r => _db.DoctorInstitutions.Any(di => di.Id == r.DoctorInstitutionId && di.DoctorProfileId == doctor.Id))
            .ToListAsync(ct);

        return rules
            .Select(r => new DoctorAvailabilityRuleDto
            {
                Id = r.Id,
                DoctorInstitutionId = r.DoctorInstitutionId,
                DayOfWeek = r.DayOfWeek,
                StartTime = r.StartTime,
                EndTime = r.EndTime,
                SlotDurationMinutes = r.SlotDurationMinutes,
                IsActive = r.IsActive
            })
            .ToList();
    }

    public async Task<DoctorAvailabilityRuleDto> CreateAvailabilityRuleAsync(Guid doctorUserId, DoctorAvailabilityRuleCreateRequest request, CancellationToken ct = default)
    {
        var doctor = await _db.DoctorProfiles.FirstOrDefaultAsync(x => x.UserId == doctorUserId, ct)
                     ?? throw new InvalidOperationException("Profilul doctorului nu a fost găsit.");

        if (doctor.ApprovalStatus != "Approved")
        {
            throw new InvalidOperationException("Doctorul trebuie să fie aprobat pentru a configura disponibilitatea.");
        }

        var institution = await _db.DoctorInstitutions
            .FirstOrDefaultAsync(x => x.Id == request.DoctorInstitutionId && x.DoctorProfileId == doctor.Id && x.IsActive, ct);
        if (institution == null)
        {
            throw new InvalidOperationException("Instituția medicală selectată nu aparține doctorului sau nu este activă.");
        }

        // Suprapuneri în aceeași zi / instituție
        var hasOverlap = await _db.DoctorAvailabilityRules
            .AsNoTracking()
            .AnyAsync(r =>
                r.DoctorInstitutionId == request.DoctorInstitutionId &&
                r.DayOfWeek == request.DayOfWeek &&
                r.IsActive &&
                r.StartTime < request.EndTime &&
                request.StartTime < r.EndTime,
                ct);

        if (hasOverlap)
        {
            throw new InvalidOperationException("Există deja o regulă de disponibilitate care se suprapune pentru această zi.");
        }

        var now = DateTime.UtcNow;
        var rule = new DoctorAvailabilityRule
        {
            Id = Guid.NewGuid(),
            DoctorInstitutionId = request.DoctorInstitutionId,
            DayOfWeek = request.DayOfWeek,
            StartTime = request.StartTime,
            EndTime = request.EndTime,
            SlotDurationMinutes = request.SlotDurationMinutes,
            IsActive = true,
            CreatedAtUtc = now
        };

        _db.DoctorAvailabilityRules.Add(rule);
        await _db.SaveChangesAsync(ct);

        await _audit.LogAsync(new AuditEventCreate
        {
            TimestampUtc = now,
            Action = "DOCTOR_AVAILABILITY_RULE_CREATED",
            ActorUserId = doctorUserId,
            ActorRole = "Doctor",
            EntityType = nameof(DoctorAvailabilityRule),
            EntityId = rule.Id,
            MetadataJson = JsonSerializer.Serialize(new
            {
                rule.DoctorInstitutionId,
                rule.DayOfWeek,
                rule.StartTime,
                rule.EndTime,
                rule.SlotDurationMinutes
            })
        });

        return new DoctorAvailabilityRuleDto
        {
            Id = rule.Id,
            DoctorInstitutionId = rule.DoctorInstitutionId,
            DayOfWeek = rule.DayOfWeek,
            StartTime = rule.StartTime,
            EndTime = rule.EndTime,
            SlotDurationMinutes = rule.SlotDurationMinutes,
            IsActive = rule.IsActive
        };
    }

    public async Task<DoctorAvailabilityRuleDto> UpdateAvailabilityRuleAsync(Guid doctorUserId, Guid ruleId, DoctorAvailabilityRuleUpdateRequest request, CancellationToken ct = default)
    {
        var doctor = await _db.DoctorProfiles.FirstOrDefaultAsync(x => x.UserId == doctorUserId, ct)
                     ?? throw new InvalidOperationException("Profilul doctorului nu a fost găsit.");

        var rule = await _db.DoctorAvailabilityRules
            .FirstOrDefaultAsync(r => r.Id == ruleId, ct)
            ?? throw new InvalidOperationException("Regula de disponibilitate nu a fost găsită.");

        var institution = await _db.DoctorInstitutions
            .FirstOrDefaultAsync(x => x.Id == rule.DoctorInstitutionId && x.DoctorProfileId == doctor.Id, ct);
        if (institution == null)
        {
            throw new InvalidOperationException("Doctorul nu are dreptul să modifice această regulă.");
        }

        // Suprapuneri pentru noul interval (excludem regula curentă)
        var hasOverlap = await _db.DoctorAvailabilityRules
            .AsNoTracking()
            .AnyAsync(r =>
                r.Id != rule.Id &&
                r.DoctorInstitutionId == rule.DoctorInstitutionId &&
                r.DayOfWeek == rule.DayOfWeek &&
                r.IsActive &&
                r.StartTime < request.EndTime &&
                request.StartTime < r.EndTime,
                ct);

        if (hasOverlap)
        {
            throw new InvalidOperationException("Există deja o regulă de disponibilitate care se suprapune pentru această zi.");
        }

        rule.StartTime = request.StartTime;
        rule.EndTime = request.EndTime;
        rule.SlotDurationMinutes = request.SlotDurationMinutes;
        rule.IsActive = request.IsActive;

        await _db.SaveChangesAsync(ct);

        await _audit.LogAsync(new AuditEventCreate
        {
            TimestampUtc = DateTime.UtcNow,
            Action = "DOCTOR_AVAILABILITY_RULE_UPDATED",
            ActorUserId = doctorUserId,
            ActorRole = "Doctor",
            EntityType = nameof(DoctorAvailabilityRule),
            EntityId = rule.Id
        });

        return new DoctorAvailabilityRuleDto
        {
            Id = rule.Id,
            DoctorInstitutionId = rule.DoctorInstitutionId,
            DayOfWeek = rule.DayOfWeek,
            StartTime = rule.StartTime,
            EndTime = rule.EndTime,
            SlotDurationMinutes = rule.SlotDurationMinutes,
            IsActive = rule.IsActive
        };
    }

    public async Task DeleteAvailabilityRuleAsync(Guid doctorUserId, Guid ruleId, CancellationToken ct = default)
    {
        var doctor = await _db.DoctorProfiles.FirstOrDefaultAsync(x => x.UserId == doctorUserId, ct)
                     ?? throw new InvalidOperationException("Profilul doctorului nu a fost găsit.");

        var rule = await _db.DoctorAvailabilityRules
            .FirstOrDefaultAsync(r => r.Id == ruleId, ct)
            ?? throw new InvalidOperationException("Regula de disponibilitate nu a fost găsită.");

        var institution = await _db.DoctorInstitutions
            .FirstOrDefaultAsync(x => x.Id == rule.DoctorInstitutionId && x.DoctorProfileId == doctor.Id, ct);
        if (institution == null)
        {
            throw new InvalidOperationException("Doctorul nu are dreptul să modifice această regulă.");
        }

        _db.DoctorAvailabilityRules.Remove(rule);
        await _db.SaveChangesAsync(ct);

        await _audit.LogAsync(new AuditEventCreate
        {
            TimestampUtc = DateTime.UtcNow,
            Action = "DOCTOR_AVAILABILITY_RULE_DELETED",
            ActorUserId = doctorUserId,
            ActorRole = "Doctor",
            EntityType = nameof(DoctorAvailabilityRule),
            EntityId = rule.Id
        });
    }

    public async Task<IReadOnlyList<DoctorSearchResultDto>> SearchDoctorsAsync(Guid patientUserId, AppointmentSearchDoctorsRequest request, CancellationToken ct = default)
    {
        // Pacientul trebuie să existe, dar nu încărcăm tot profilul
        var patientExists = await _db.PatientProfiles.AsNoTracking().AnyAsync(p => p.UserId == patientUserId, ct);
        if (!patientExists)
        {
            throw new InvalidOperationException("Profilul pacientului nu a fost găsit.");
        }

        var localToday = DateOnly.FromDateTime(DateTime.Now.Date);
        var date = request.Date ?? localToday;
        var dayOfWeek = GetDayOfWeekNumber(date);

        // Doctori aprobați cu specialitatea cerută și instituții active
        var query =
            from di in _db.DoctorInstitutions
            join dp in _db.DoctorProfiles on di.DoctorProfileId equals dp.Id
            join mi in _db.MedicalInstitutions on di.MedicalInstitutionId equals mi.Id
            join ds in _db.DoctorSpecialties on dp.Id equals ds.DoctorProfileId
            join s in _db.Specialties on ds.SpecialtyId equals s.Id
            where dp.ApprovalStatus == "Approved"
                  && di.IsActive
                  && s.IsActive
                  && s.Id == request.SpecialtyId
            select new { di, dp, mi, s };

        var list = await query.Distinct().ToListAsync(ct);

        var doctorInstitutionIds = list.Select(x => x.di.Id).ToArray();

        // Reguli active în ziua respectivă
        var rulesByInstitution = await _db.DoctorAvailabilityRules
            .AsNoTracking()
            .Where(r => doctorInstitutionIds.Contains(r.DoctorInstitutionId) && r.IsActive && r.DayOfWeek == dayOfWeek)
            .GroupBy(r => r.DoctorInstitutionId)
            .ToDictionaryAsync(g => g.Key, g => g.ToList(), ct);

        // Programări existente în ziua respectivă
        var appointmentsByInstitution = await _db.Appointments
            .AsNoTracking()
            .Where(a =>
                doctorInstitutionIds.Contains(a.DoctorInstitutionId) &&
                a.AppointmentDate == date &&
                a.Status == "Confirmed")
            .GroupBy(a => a.DoctorInstitutionId)
            .ToDictionaryAsync(g => g.Key, g => g.ToList(), ct);

        bool HasAvailability(Guid doctorInstitutionId)
        {
            if (!rulesByInstitution.TryGetValue(doctorInstitutionId, out var rules))
                return false;

            var existing = appointmentsByInstitution.TryGetValue(doctorInstitutionId, out var apps)
                ? apps
                : new List<Appointment>();

            foreach (var rule in rules)
            {
                var slotDuration = TimeSpan.FromMinutes(rule.SlotDurationMinutes);
                var cursor = rule.StartTime;
                while (cursor + slotDuration <= rule.EndTime)
                {
                    var slotStart = cursor;
                    var slotEnd = cursor + slotDuration;
                    var overlaps = existing.Any(a =>
                        a.StartTime < slotEnd &&
                        slotStart < a.EndTime);
                    if (!overlaps)
                    {
                        return true;
                    }
                    cursor += slotDuration;
                }
            }

            return false;
        }

        return list
            .Select(x => new DoctorSearchResultDto
            {
                DoctorProfileId = x.dp.Id,
                DoctorInstitutionId = x.di.Id,
                DoctorFullName = x.dp.FullName,
                SpecialtyId = x.s.Id,
                SpecialtyName = x.s.Name,
                InstitutionName = x.mi.Name,
                InstitutionCity = x.mi.City,
                HasAvailabilityOnDate = HasAvailability(x.di.Id)
            })
            .ToList();
    }

    public async Task<IReadOnlyList<AvailableSlotDto>> GetAvailableSlotsAsync(Guid patientUserId, Guid doctorInstitutionId, DateOnly date, CancellationToken ct = default)
    {
        // Verificăm că pacientul există
        var patientExists = await _db.PatientProfiles.AsNoTracking().AnyAsync(p => p.UserId == patientUserId, ct);
        if (!patientExists)
        {
            throw new InvalidOperationException("Profilul pacientului nu a fost găsit.");
        }

        var (doctor, institution) = await EnsureDoctorInstitutionAsync(doctorInstitutionId, ct);

        var dayOfWeek = GetDayOfWeekNumber(date);

        var rules = await _db.DoctorAvailabilityRules
            .AsNoTracking()
            .Where(r => r.DoctorInstitutionId == doctorInstitutionId && r.IsActive && r.DayOfWeek == dayOfWeek)
            .ToListAsync(ct);

        if (rules.Count == 0)
            return Array.Empty<AvailableSlotDto>();

        var existing = await _db.Appointments
            .AsNoTracking()
            .Where(a =>
                a.DoctorInstitutionId == doctorInstitutionId &&
                a.AppointmentDate == date &&
                a.Status == "Confirmed")
            .ToListAsync(ct);

        var slots = new List<AvailableSlotDto>();
        var nowLocal = DateTime.Now;

        foreach (var rule in rules)
        {
            var slotDuration = TimeSpan.FromMinutes(rule.SlotDurationMinutes);
            var cursor = rule.StartTime;
            while (cursor + slotDuration <= rule.EndTime)
            {
                var slotStart = cursor;
                var slotEnd = cursor + slotDuration;

                // Excludem sloturile din trecut (pentru ziua curentă, în ora locală a aplicației)
                var slotStartLocal = date.ToDateTime(TimeOnly.FromTimeSpan(slotStart));
                if (slotStartLocal <= nowLocal)
                {
                    cursor += slotDuration;
                    continue;
                }

                var overlaps = existing.Any(a =>
                    a.StartTime < slotEnd &&
                    slotStart < a.EndTime);
                if (!overlaps)
                {
                    slots.Add(new AvailableSlotDto
                    {
                        Date = date,
                        StartTime = slotStart,
                        EndTime = slotEnd,
                        Label = $"{slotStart:hh\\:mm} - {slotEnd:hh\\:mm}"
                    });
                }

                cursor += slotDuration;
            }
        }

        return slots.OrderBy(s => s.StartTime).ToList();
    }

    public async Task<AppointmentDto> CreateAppointmentAsync(Guid patientUserId, AppointmentCreateRequest request, CancellationToken ct = default)
    {
        var patient = await _db.PatientProfiles.AsNoTracking().FirstOrDefaultAsync(p => p.UserId == patientUserId, ct)
                      ?? throw new InvalidOperationException("Profilul pacientului nu a fost găsit.");

        var (doctor, institution) = await EnsureDoctorInstitutionAsync(request.DoctorInstitutionId, ct);

        var specialty = await _db.Specialties.AsNoTracking()
            .FirstOrDefaultAsync(s => s.Id == request.SpecialtyId && s.IsActive, ct)
            ?? throw new InvalidOperationException("Specialitatea selectată nu este validă.");

        var todayLocal = DateOnly.FromDateTime(DateTime.Now.Date);
        if (request.AppointmentDate < todayLocal)
        {
            throw new InvalidOperationException("Nu poți crea programări în trecut.");
        }

        var dayOfWeek = GetDayOfWeekNumber(request.AppointmentDate);

        var rules = await _db.DoctorAvailabilityRules
            .AsNoTracking()
            .Where(r => r.DoctorInstitutionId == request.DoctorInstitutionId && r.IsActive && r.DayOfWeek == dayOfWeek)
            .ToListAsync(ct);

        if (rules.Count == 0)
        {
            throw new InvalidOperationException("Doctorul nu are disponibilitate configurată pentru această zi.");
        }

        // Găsim regula care acoperă startTime
        var matchingRule = rules.FirstOrDefault(r => r.StartTime <= request.StartTime && request.StartTime < r.EndTime);
        if (matchingRule == null)
        {
            throw new InvalidOperationException("Ora selectată este în afara programului doctorului.");
        }

        var slotDuration = TimeSpan.FromMinutes(matchingRule.SlotDurationMinutes);
        var endTime = request.StartTime + slotDuration;
        if (endTime > matchingRule.EndTime)
        {
            throw new InvalidOperationException("Slotul selectat nu este valid.");
        }

        // Prevenim condiții de cursă cu tranzacție + blocare moderată
        using var tx = await _db.Database.BeginTransactionAsync(ct);

        var existsOverlap = await _db.Appointments
            .Where(a =>
                a.DoctorInstitutionId == request.DoctorInstitutionId &&
                a.AppointmentDate == request.AppointmentDate &&
                a.Status == "Confirmed" &&
                a.StartTime < endTime &&
                request.StartTime < a.EndTime)
            .AnyAsync(ct);

        if (existsOverlap)
        {
            throw new InvalidOperationException("Slotul selectat este deja ocupat.");
        }

        var now = DateTime.UtcNow;
        var appointment = new Appointment
        {
            Id = Guid.NewGuid(),
            PatientUserId = patient.UserId,
            DoctorInstitutionId = request.DoctorInstitutionId,
            SpecialtyId = request.SpecialtyId,
            AppointmentDate = request.AppointmentDate,
            StartTime = request.StartTime,
            EndTime = endTime,
            Status = "Confirmed",
            Reason = request.Reason,
            Notes = request.Notes,
            CreatedAtUtc = now
        };

        _db.Appointments.Add(appointment);
        await _db.SaveChangesAsync(ct);
        await tx.CommitAsync(ct);

        await _audit.LogAsync(new AuditEventCreate
        {
            TimestampUtc = now,
            Action = "APPOINTMENT_CREATED",
            ActorUserId = patientUserId,
            ActorRole = "Patient",
            PatientUserId = patient.UserId,
            EntityType = nameof(Appointment),
            EntityId = appointment.Id,
            MetadataJson = JsonSerializer.Serialize(new
            {
                appointment.DoctorInstitutionId,
                appointment.SpecialtyId,
                appointment.AppointmentDate,
                appointment.StartTime,
                appointment.EndTime
            })
        });

        return new AppointmentDto
        {
            Id = appointment.Id,
            PatientUserId = appointment.PatientUserId,
            DoctorInstitutionId = appointment.DoctorInstitutionId,
            SpecialtyId = appointment.SpecialtyId,
            AppointmentDate = appointment.AppointmentDate,
            StartTime = appointment.StartTime,
            EndTime = appointment.EndTime,
            Status = appointment.Status,
            Reason = appointment.Reason,
            Notes = appointment.Notes
        };
    }

    private static IQueryable<Appointment> ApplyScope(IQueryable<Appointment> query, string? scope, DateTime nowLocal)
    {
        var today = DateOnly.FromDateTime(nowLocal.Date);
        return scope switch
        {
            "upcoming" => query.Where(a =>
                a.Status == "Confirmed" &&
                (a.AppointmentDate > today ||
                 (a.AppointmentDate == today && a.EndTime > nowLocal.TimeOfDay))),
            "history" => query.Where(a =>
                a.AppointmentDate < today ||
                (a.AppointmentDate == today && a.EndTime <= nowLocal.TimeOfDay)),
            "cancelled" => query.Where(a => a.Status == "CancelledByPatient" || a.Status == "CancelledByDoctor"),
            "today" => query.Where(a => a.AppointmentDate == today),
            _ => query
        };
    }

    public async Task<IReadOnlyList<PatientAppointmentListItemDto>> GetMyAppointmentsAsync(Guid patientUserId, string? scope, CancellationToken ct = default)
    {
        var now = DateTime.Now;
        var baseQuery = _db.Appointments.AsNoTracking().Where(a => a.PatientUserId == patientUserId);
        baseQuery = ApplyScope(baseQuery, scope, now);

        var list = await (
            from a in baseQuery
            join di in _db.DoctorInstitutions on a.DoctorInstitutionId equals di.Id
            join dp in _db.DoctorProfiles on di.DoctorProfileId equals dp.Id
            join mi in _db.MedicalInstitutions on di.MedicalInstitutionId equals mi.Id
            join s in _db.Specialties on a.SpecialtyId equals s.Id
            orderby a.AppointmentDate, a.StartTime
            select new { a, di, dp, mi, s }
        ).ToListAsync(ct);

        return list.Select(x => new PatientAppointmentListItemDto
        {
            AppointmentId = x.a.Id,
            Status = x.a.Status,
            AppointmentDate = x.a.AppointmentDate,
            StartTime = x.a.StartTime,
            EndTime = x.a.EndTime,
            Reason = x.a.Reason,
            Notes = x.a.Notes,
            CancellationReason = x.a.CancellationReason,
            CreatedAtUtc = x.a.CreatedAtUtc,
            CancelledAtUtc = x.a.CancelledAtUtc,
            DoctorProfileId = x.dp.Id,
            DoctorFullName = x.dp.FullName,
            SpecialtyId = x.s.Id,
            SpecialtyName = x.s.Name,
            MedicalInstitutionId = x.mi.Id,
            MedicalInstitutionName = x.mi.Name,
            MedicalInstitutionCity = x.mi.City
        }).ToList();
    }

    public async Task CancelByPatientAsync(Guid patientUserId, Guid appointmentId, string? reason, CancellationToken ct = default)
    {
        var now = DateTime.UtcNow;

        var appointment = await _db.Appointments.FirstOrDefaultAsync(a => a.Id == appointmentId, ct)
                          ?? throw new InvalidOperationException("Programarea nu a fost găsită.");

        if (appointment.PatientUserId != patientUserId)
        {
            throw new InvalidOperationException("Nu poți anula o programare care nu îți aparține.");
        }

        if (appointment.Status != "Confirmed")
        {
            throw new InvalidOperationException("Doar programările confirmate pot fi anulate de pacient.");
        }

        var nowLocal = DateTime.Now;
        var startLocal = appointment.AppointmentDate.ToDateTime(TimeOnly.FromTimeSpan(appointment.StartTime));
        if (startLocal <= nowLocal)
        {
            throw new InvalidOperationException("Nu poți anula o programare din trecut.");
        }

        appointment.Status = "CancelledByPatient";
        appointment.CancelledAtUtc = now;
        appointment.CancellationReason = reason;
        appointment.UpdatedAtUtc = now;

        await _db.SaveChangesAsync(ct);

        await _audit.LogAsync(new AuditEventCreate
        {
            TimestampUtc = now,
            Action = "APPOINTMENT_CANCELLED_BY_PATIENT",
            ActorUserId = patientUserId,
            ActorRole = "Patient",
            PatientUserId = appointment.PatientUserId,
            EntityType = nameof(Appointment),
            EntityId = appointment.Id,
            MetadataJson = JsonSerializer.Serialize(new { reason })
        });
    }

    public async Task<IReadOnlyList<DoctorAppointmentListItemDto>> GetDoctorAppointmentsAsync(Guid doctorUserId, string? scope, CancellationToken ct = default)
    {
        var doctor = await _db.DoctorProfiles.AsNoTracking().FirstOrDefaultAsync(x => x.UserId == doctorUserId, ct)
                     ?? throw new InvalidOperationException("Profilul doctorului nu a fost găsit.");

        var institutionIds = await _db.DoctorInstitutions
            .AsNoTracking()
            .Where(di => di.DoctorProfileId == doctor.Id && di.IsActive)
            .Select(di => di.Id)
            .ToListAsync(ct);

        var now = DateTime.Now;
        var baseQuery = _db.Appointments.AsNoTracking().Where(a => institutionIds.Contains(a.DoctorInstitutionId));
        baseQuery = ApplyScope(baseQuery, scope, now);

        var list = await (
            from a in baseQuery
            join di in _db.DoctorInstitutions on a.DoctorInstitutionId equals di.Id
            join mi in _db.MedicalInstitutions on di.MedicalInstitutionId equals mi.Id
            join s in _db.Specialties on a.SpecialtyId equals s.Id
            join pp in _db.PatientProfiles on a.PatientUserId equals pp.UserId into ppJoin
            from pp in ppJoin.DefaultIfEmpty()
            orderby a.AppointmentDate, a.StartTime
            select new { a, di, mi, s, pp }
        ).ToListAsync(ct);

        return list.Select(x => new DoctorAppointmentListItemDto
        {
            AppointmentId = x.a.Id,
            Status = x.a.Status,
            AppointmentDate = x.a.AppointmentDate,
            StartTime = x.a.StartTime,
            EndTime = x.a.EndTime,
            Reason = x.a.Reason,
            Notes = x.a.Notes,
            CancellationReason = x.a.CancellationReason,
            CreatedAtUtc = x.a.CreatedAtUtc,
            CancelledAtUtc = x.a.CancelledAtUtc,
            PatientUserId = x.a.PatientUserId,
            PatientFullName = x.pp != null ? x.pp.FullName : string.Empty,
            SpecialtyId = x.s.Id,
            SpecialtyName = x.s.Name,
            MedicalInstitutionId = x.mi.Id,
            MedicalInstitutionName = x.mi.Name,
            MedicalInstitutionCity = x.mi.City
        }).ToList();
    }

    public async Task CompleteByDoctorAsync(Guid doctorUserId, Guid appointmentId, CancellationToken ct = default)
    {
        var doctor = await _db.DoctorProfiles.AsNoTracking().FirstOrDefaultAsync(x => x.UserId == doctorUserId, ct)
                     ?? throw new InvalidOperationException("Profilul doctorului nu a fost găsit.");

        var institutionIds = await _db.DoctorInstitutions
            .AsNoTracking()
            .Where(di => di.DoctorProfileId == doctor.Id && di.IsActive)
            .Select(di => di.Id)
            .ToListAsync(ct);

        var appointment = await _db.Appointments.FirstOrDefaultAsync(a => a.Id == appointmentId, ct)
                          ?? throw new InvalidOperationException("Programarea nu a fost găsită.");

        if (!institutionIds.Contains(appointment.DoctorInstitutionId))
        {
            throw new InvalidOperationException("Nu poți modifica o programare care nu îți aparține.");
        }

        if (appointment.Status != "Confirmed")
        {
            throw new InvalidOperationException("Doar programările confirmate pot fi marcate ca finalizate.");
        }

        appointment.Status = "Completed";
        appointment.UpdatedAtUtc = DateTime.UtcNow;

        await _db.SaveChangesAsync(ct);

        await _audit.LogAsync(new AuditEventCreate
        {
            TimestampUtc = DateTime.UtcNow,
            Action = "APPOINTMENT_COMPLETED_BY_DOCTOR",
            ActorUserId = doctorUserId,
            ActorRole = "Doctor",
            PatientUserId = appointment.PatientUserId,
            EntityType = nameof(Appointment),
            EntityId = appointment.Id
        });
    }

    public async Task CancelByDoctorAsync(Guid doctorUserId, Guid appointmentId, string? reason, CancellationToken ct = default)
    {
        var doctor = await _db.DoctorProfiles.AsNoTracking().FirstOrDefaultAsync(x => x.UserId == doctorUserId, ct)
                     ?? throw new InvalidOperationException("Profilul doctorului nu a fost găsit.");

        var institutionIds = await _db.DoctorInstitutions
            .AsNoTracking()
            .Where(di => di.DoctorProfileId == doctor.Id && di.IsActive)
            .Select(di => di.Id)
            .ToListAsync(ct);

        var appointment = await _db.Appointments.FirstOrDefaultAsync(a => a.Id == appointmentId, ct)
                          ?? throw new InvalidOperationException("Programarea nu a fost găsită.");

        if (!institutionIds.Contains(appointment.DoctorInstitutionId))
        {
            throw new InvalidOperationException("Nu poți modifica o programare care nu îți aparține.");
        }

        if (appointment.Status == "Completed")
        {
            throw new InvalidOperationException("Nu poți anula o programare deja finalizată.");
        }

        if (appointment.Status == "CancelledByPatient" || appointment.Status == "CancelledByDoctor")
        {
            throw new InvalidOperationException("Programarea este deja anulată.");
        }

        appointment.Status = "CancelledByDoctor";
        appointment.CancelledAtUtc = DateTime.UtcNow;
        appointment.CancellationReason = reason;
        appointment.UpdatedAtUtc = DateTime.UtcNow;

        await _db.SaveChangesAsync(ct);

        await _audit.LogAsync(new AuditEventCreate
        {
            TimestampUtc = DateTime.UtcNow,
            Action = "APPOINTMENT_CANCELLED_BY_DOCTOR",
            ActorUserId = doctorUserId,
            ActorRole = "Doctor",
            PatientUserId = appointment.PatientUserId,
            EntityType = nameof(Appointment),
            EntityId = appointment.Id,
            MetadataJson = JsonSerializer.Serialize(new { reason })
        });
    }
}

