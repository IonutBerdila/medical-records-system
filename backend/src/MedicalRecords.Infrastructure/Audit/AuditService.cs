using MedicalRecords.Application.Audit;
using MedicalRecords.Domain.Entities;
using MedicalRecords.Infrastructure.Data;
using Npgsql;

namespace MedicalRecords.Infrastructure.Audit;

public class AuditService : IAuditService
{
    private readonly AppDbContext _db;

    public AuditService(AppDbContext db)
    {
        _db = db;
    }

    public async Task LogAsync(AuditEventCreate request)
    {
        // Asigurăm că TimestampUtc este mereu în UTC (PostgreSQL cere Kind=Utc pentru timestamptz)
        var timestamp = request.TimestampUtc == default
            ? DateTime.UtcNow
            : request.TimestampUtc;
        if (timestamp.Kind != DateTimeKind.Utc)
        {
            timestamp = DateTime.SpecifyKind(timestamp, DateTimeKind.Utc);
        }

        var entity = new AuditEvent
        {
            Id = Guid.NewGuid(),
            TimestampUtc = timestamp,
            Action = request.Action,
            ActorUserId = request.ActorUserId,
            ActorRole = request.ActorRole,
            PatientUserId = request.PatientUserId,
            EntityType = request.EntityType,
            EntityId = request.EntityId,
            MetadataJson = request.MetadataJson,
            IpAddress = request.IpAddress
        };

        _db.AuditEvents.Add(entity);

        try
        {
            await _db.SaveChangesAsync();
        }
        catch (PostgresException ex) when (ex.SqlState == "42P01")
        {
            // Tabela AuditEvents nu există încă (migrarea nu a fost aplicată complet).
            // În mediul de dev, ignorăm eroarea pentru a nu bloca fluxul principal.
            _db.ChangeTracker.Clear();
        }
    }
}

