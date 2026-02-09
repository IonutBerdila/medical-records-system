namespace MedicalRecords.Application.Audit;

public interface IAuditService
{
    Task LogAsync(AuditEventCreate request);
}

