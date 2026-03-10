namespace MedicalRecords.Domain.Entities;

public class Specialty
{
    public Guid Id { get; set; }

    public string Name { get; set; } = default!;

    public bool IsActive { get; set; } = true;
}

