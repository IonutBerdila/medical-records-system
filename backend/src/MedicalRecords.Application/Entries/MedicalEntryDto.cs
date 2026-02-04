namespace MedicalRecords.Application.Entries;

public class MedicalEntryDto
{
    public Guid Id { get; set; }
    public Guid RecordId { get; set; }
    public string Type { get; set; } = default!;
    public string Title { get; set; } = default!;
    public string? Description { get; set; }
    public Guid CreatedByUserId { get; set; }
    public DateTime CreatedAtUtc { get; set; }
}
