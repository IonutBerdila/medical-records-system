namespace MedicalRecords.Domain.Entities;

/// <summary>
/// Programare între pacient și doctor într-o anumită instituție.
/// </summary>
public class Appointment
{
    public Guid Id { get; set; }

    public Guid PatientUserId { get; set; }

    public Guid DoctorInstitutionId { get; set; }

    public Guid SpecialtyId { get; set; }

    /// <summary>
    /// Data calendaristică a programării (fără componentă de timp).
    /// </summary>
    public DateOnly AppointmentDate { get; set; }

    /// <summary>
    /// Ora de început (timp în cadrul zilei, fără componentă de dată, UTC).
    /// </summary>
    public TimeSpan StartTime { get; set; }

    /// <summary>
    /// Ora de sfârșit (timp în cadrul zilei, fără componentă de dată, UTC).
    /// </summary>
    public TimeSpan EndTime { get; set; }

    /// <summary>
    /// Statusul programării: Confirmed, CancelledByPatient, CancelledByDoctor, Completed.
    /// </summary>
    public string Status { get; set; } = default!;

    /// <summary>
    /// Motivul programării (scurt).
    /// </summary>
    public string? Reason { get; set; }

    /// <summary>
    /// Note suplimentare (pentru doctor / pacient).
    /// </summary>
    public string? Notes { get; set; }

    public DateTime CreatedAtUtc { get; set; }

    public DateTime? UpdatedAtUtc { get; set; }

    public DateTime? CancelledAtUtc { get; set; }

    public string? CancellationReason { get; set; }
}

