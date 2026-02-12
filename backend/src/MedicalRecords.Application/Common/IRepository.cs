using System.Linq;

namespace MedicalRecords.Application.Common;

/// <summary>
/// Minimal generic repository abstraction used by application services.
/// Keeps surface small to avoid over-coupling to EF-specific APIs.
/// </summary>
public interface IRepository<T> where T : class
{
    IQueryable<T> Query();

    Task<T?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);

    Task AddAsync(T entity, CancellationToken cancellationToken = default);

    void Update(T entity);

    void Remove(T entity);

    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}

