namespace MedicalRecords.Application.Entries;

public class CreateMedicalEntryRequest
{
    public string Type { get; set; } = default!; // Diagnosis, Visit, Note, LabResult
    public string Title { get; set; } = default!;
    public string? Description { get; set; }
}
