namespace MedicalRecords.Domain.Entities;

/// <summary>
/// Intrare în timeline-ul medical (diagnostic, vizită, notă, rezultat analiză).
/// </summary>
public class MedicalEntry
{
    public Guid Id { get; set; }
    public Guid RecordId { get; set; }
    public string Type { get; set; } = default!; // Diagnosis, Visit, Note, LabResult
    public string Title { get; set; } = default!;
    public string? Description { get; set; }
    public Guid CreatedByUserId { get; set; }
    public DateTime CreatedAtUtc { get; set; }
}
