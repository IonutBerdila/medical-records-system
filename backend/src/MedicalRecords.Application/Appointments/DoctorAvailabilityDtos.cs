namespace MedicalRecords.Application.Appointments;

public class DoctorAvailabilityRuleDto
{
    public Guid Id { get; set; }
    public Guid DoctorInstitutionId { get; set; }
    public int DayOfWeek { get; set; }
    public TimeSpan StartTime { get; set; }
    public TimeSpan EndTime { get; set; }
    public int SlotDurationMinutes { get; set; }
    public bool IsActive { get; set; }
}

public class DoctorAvailabilityRuleCreateRequest
{
    public Guid DoctorInstitutionId { get; set; }
    public int DayOfWeek { get; set; }
    public TimeSpan StartTime { get; set; }
    public TimeSpan EndTime { get; set; }
    public int SlotDurationMinutes { get; set; }
}

public class DoctorAvailabilityRuleUpdateRequest
{
    public TimeSpan StartTime { get; set; }
    public TimeSpan EndTime { get; set; }
    public int SlotDurationMinutes { get; set; }
    public bool IsActive { get; set; }
}

