using MedicalRecords.Application.Metadata;
using MedicalRecords.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace MedicalRecords.Infrastructure.Metadata;

public class MetadataService : IMetadataService
{
    private readonly AppDbContext _dbContext;

    public MetadataService(AppDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<IReadOnlyList<SpecialtyDto>> GetActiveSpecialtiesAsync()
    {
        return await _dbContext.Specialties
            .AsNoTracking()
            .Where(s => s.IsActive)
            .OrderBy(s => s.Name)
            .Select(s => new SpecialtyDto
            {
                Id = s.Id,
                Name = s.Name
            })
            .ToListAsync();
    }
}

