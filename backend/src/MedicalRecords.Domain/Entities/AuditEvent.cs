namespace MedicalRecords.Domain.Entities;

/// <summary>
/// Eveniment de audit pentru acțiuni critice (verify token, dispense etc.).
/// </summary>
public class AuditEvent
{
    public Guid Id { get; set; }
    public DateTime TimestampUtc { get; set; }
    public string Action { get; set; } = default!; // ex: SHARE_TOKEN_VERIFIED, PRESCRIPTION_DISPENSEED
    public Guid ActorUserId { get; set; }
    public string? ActorRole { get; set; }
    public Guid? PatientUserId { get; set; }
    public string? EntityType { get; set; }
    public Guid? EntityId { get; set; }
    public string? MetadataJson { get; set; }
    public string? IpAddress { get; set; }
}

