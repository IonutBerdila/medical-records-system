namespace MedicalRecords.Domain.Entities;

public class DoctorInstitution
{
    public Guid Id { get; set; }

    public Guid DoctorProfileId { get; set; }

    public Guid MedicalInstitutionId { get; set; }

    public bool IsPrimaryInstitution { get; set; } = true;

    public bool IsActive { get; set; } = true;
}

