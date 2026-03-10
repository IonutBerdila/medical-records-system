namespace MedicalRecords.Domain.Entities;

public class DoctorSpecialty
{
    public Guid DoctorProfileId { get; set; }

    public Guid SpecialtyId { get; set; }

    public bool IsPrimary { get; set; }
}

