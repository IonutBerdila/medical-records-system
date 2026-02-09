namespace MedicalRecords.Application.Audit;

/// <summary>
/// Model simplu pentru a crea un eveniment de audit.
/// </summary>
public class AuditEventCreate
{
    public DateTime TimestampUtc { get; set; }
    public string Action { get; set; } = default!;
    public Guid ActorUserId { get; set; }
    public string? ActorRole { get; set; }
    public Guid? PatientUserId { get; set; }
    public string? EntityType { get; set; }
    public Guid? EntityId { get; set; }
    public string? MetadataJson { get; set; }
    public string? IpAddress { get; set; }
}

