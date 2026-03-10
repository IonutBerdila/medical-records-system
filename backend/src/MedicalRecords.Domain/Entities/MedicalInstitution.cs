namespace MedicalRecords.Domain.Entities;

public class MedicalInstitution
{
    public Guid Id { get; set; }

    public string Name { get; set; } = default!;

    public string? City { get; set; }

    public bool IsActive { get; set; } = true;
}

