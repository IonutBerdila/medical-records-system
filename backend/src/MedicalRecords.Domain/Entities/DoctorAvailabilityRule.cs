namespace MedicalRecords.Domain.Entities;

/// <summary>
/// Regula de disponibilitate recurentă a unui doctor într-o anumită instituție.
/// </summary>
public class DoctorAvailabilityRule
{
    public Guid Id { get; set; }

    public Guid DoctorInstitutionId { get; set; }

    /// <summary>
    /// Ziua săptămânii folosind convenția .NET DayOfWeek:
    /// 0 = Sunday, 1 = Monday, ... 6 = Saturday.
    /// UI-ul trebuie să trimită valorile în acest format.
    /// </summary>
    public int DayOfWeek { get; set; }

    /// <summary>
    /// Ora de început (timp în cadrul zilei, fără componentă de dată, UTC).
    /// </summary>
    public TimeSpan StartTime { get; set; }

    /// <summary>
    /// Ora de sfârșit (timp în cadrul zilei, fără componentă de dată, UTC).
    /// </summary>
    public TimeSpan EndTime { get; set; }

    /// <summary>
    /// Durata unui slot de consultație, în minute.
    /// </summary>
    public int SlotDurationMinutes { get; set; }

    public bool IsActive { get; set; } = true;

    public DateTime CreatedAtUtc { get; set; }
}

