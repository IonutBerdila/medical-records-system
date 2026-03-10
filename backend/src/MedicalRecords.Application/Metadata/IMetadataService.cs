namespace MedicalRecords.Application.Metadata;

public interface IMetadataService
{
    Task<IReadOnlyList<SpecialtyDto>> GetActiveSpecialtiesAsync();
}

