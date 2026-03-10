using MedicalRecords.Domain.Entities;

namespace MedicalRecords.Application.Appointments;

public interface IAppointmentService
{
    // Doctor availability
    Task<IReadOnlyList<DoctorAvailabilityRuleDto>> GetAvailabilityAsync(Guid doctorUserId, CancellationToken ct = default);
    Task<DoctorAvailabilityRuleDto> CreateAvailabilityRuleAsync(Guid doctorUserId, DoctorAvailabilityRuleCreateRequest request, CancellationToken ct = default);
    Task<DoctorAvailabilityRuleDto> UpdateAvailabilityRuleAsync(Guid doctorUserId, Guid ruleId, DoctorAvailabilityRuleUpdateRequest request, CancellationToken ct = default);
    Task DeleteAvailabilityRuleAsync(Guid doctorUserId, Guid ruleId, CancellationToken ct = default);

    // Patient-facing
    Task<IReadOnlyList<DoctorSearchResultDto>> SearchDoctorsAsync(Guid patientUserId, AppointmentSearchDoctorsRequest request, CancellationToken ct = default);
    Task<IReadOnlyList<AvailableSlotDto>> GetAvailableSlotsAsync(Guid patientUserId, Guid doctorInstitutionId, DateOnly date, CancellationToken ct = default);
    Task<AppointmentDto> CreateAppointmentAsync(Guid patientUserId, AppointmentCreateRequest request, CancellationToken ct = default);
    Task<IReadOnlyList<PatientAppointmentListItemDto>> GetMyAppointmentsAsync(Guid patientUserId, string? scope, CancellationToken ct = default);
    Task CancelByPatientAsync(Guid patientUserId, Guid appointmentId, string? reason, CancellationToken ct = default);

    // Doctor-facing
    Task<IReadOnlyList<DoctorAppointmentListItemDto>> GetDoctorAppointmentsAsync(Guid doctorUserId, string? scope, CancellationToken ct = default);
    Task CompleteByDoctorAsync(Guid doctorUserId, Guid appointmentId, CancellationToken ct = default);
    Task CancelByDoctorAsync(Guid doctorUserId, Guid appointmentId, string? reason, CancellationToken ct = default);
}

