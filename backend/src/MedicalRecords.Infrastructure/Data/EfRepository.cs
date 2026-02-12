using MedicalRecords.Application.Common;
using Microsoft.EntityFrameworkCore;

namespace MedicalRecords.Infrastructure.Data;

/// <summary>
/// EF Core-based generic repository implementation.
/// </summary>
public class EfRepository<T> : IRepository<T> where T : class
{
    private readonly AppDbContext _dbContext;
    private readonly DbSet<T> _set;

    public EfRepository(AppDbContext dbContext)
    {
        _dbContext = dbContext;
        _set = _dbContext.Set<T>();
    }

    public IQueryable<T> Query() => _set.AsQueryable();

    public async Task<T?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return await _set.FindAsync(new object?[] { id }, cancellationToken);
    }

    public Task AddAsync(T entity, CancellationToken cancellationToken = default)
    {
        _set.Add(entity);
        return Task.CompletedTask;
    }

    public void Update(T entity) => _set.Update(entity);

    public void Remove(T entity) => _set.Remove(entity);

    public Task<int> SaveChangesAsync(CancellationToken cancellationToken = default) =>
        _dbContext.SaveChangesAsync(cancellationToken);
}

