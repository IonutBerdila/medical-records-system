namespace MedicalRecords.Application.Appointments;

public class AppointmentDto
{
    public Guid Id { get; set; }
    public Guid PatientUserId { get; set; }
    public Guid DoctorInstitutionId { get; set; }
    public Guid SpecialtyId { get; set; }
    public DateOnly AppointmentDate { get; set; }
    public TimeSpan StartTime { get; set; }
    public TimeSpan EndTime { get; set; }
    public string Status { get; set; } = default!;
    public string? Reason { get; set; }
    public string? Notes { get; set; }
}

/// <summary>
/// DTO bogat pentru listarea programărilor unui pacient.
/// Include datele esențiale + informații display-ready despre doctor, specialitate și instituție.
/// </summary>
public class PatientAppointmentListItemDto
{
    public Guid AppointmentId { get; set; }
    public string Status { get; set; } = default!;
    public DateOnly AppointmentDate { get; set; }
    public TimeSpan StartTime { get; set; }
    public TimeSpan EndTime { get; set; }
    public string? Reason { get; set; }
    public string? Notes { get; set; }
    public string? CancellationReason { get; set; }
    public DateTime CreatedAtUtc { get; set; }
    public DateTime? CancelledAtUtc { get; set; }

    public Guid DoctorProfileId { get; set; }
    public string DoctorFullName { get; set; } = default!;

    public Guid SpecialtyId { get; set; }
    public string SpecialtyName { get; set; } = default!;

    public Guid MedicalInstitutionId { get; set; }
    public string MedicalInstitutionName { get; set; } = default!;
    public string? MedicalInstitutionCity { get; set; }
}

/// <summary>
/// DTO bogat pentru listarea programărilor unui doctor.
/// Include datele esențiale + informații despre pacient.
/// </summary>
public class DoctorAppointmentListItemDto
{
    public Guid AppointmentId { get; set; }
    public string Status { get; set; } = default!;
    public DateOnly AppointmentDate { get; set; }
    public TimeSpan StartTime { get; set; }
    public TimeSpan EndTime { get; set; }
    public string? Reason { get; set; }
    public string? Notes { get; set; }
    public string? CancellationReason { get; set; }
    public DateTime CreatedAtUtc { get; set; }
    public DateTime? CancelledAtUtc { get; set; }

    public Guid PatientUserId { get; set; }
    public string PatientFullName { get; set; } = default!;

    public Guid SpecialtyId { get; set; }
    public string SpecialtyName { get; set; } = default!;

    public Guid MedicalInstitutionId { get; set; }
    public string MedicalInstitutionName { get; set; } = default!;
    public string? MedicalInstitutionCity { get; set; }
}

public class AppointmentCreateRequest
{
    public Guid DoctorInstitutionId { get; set; }
    public Guid SpecialtyId { get; set; }
    public DateOnly AppointmentDate { get; set; }
    public TimeSpan StartTime { get; set; }
    public string? Reason { get; set; }
    public string? Notes { get; set; }
}

public class AppointmentSearchDoctorsRequest
{
    public Guid SpecialtyId { get; set; }
    public DateOnly? Date { get; set; }
}

public class DoctorSearchResultDto
{
    public Guid DoctorProfileId { get; set; }
    public Guid DoctorInstitutionId { get; set; }
    public string DoctorFullName { get; set; } = default!;
    public Guid SpecialtyId { get; set; }
    public string SpecialtyName { get; set; } = default!;
    public string InstitutionName { get; set; } = default!;
    public string? InstitutionCity { get; set; }
    public bool HasAvailabilityOnDate { get; set; }
}

public class AvailableSlotDto
{
    public DateOnly Date { get; set; }
    public TimeSpan StartTime { get; set; }
    public TimeSpan EndTime { get; set; }
    public string Label { get; set; } = default!;
}

