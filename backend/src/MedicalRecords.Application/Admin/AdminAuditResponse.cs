namespace MedicalRecords.Application.Admin;

public class AdminAuditResponse
{
    public List<AdminAuditEventDto> Events { get; set; } = new();
    public int Total { get; set; }
}

public class AdminAuditEventDto
{
    public Guid Id { get; set; }
    public DateTime TimestampUtc { get; set; }
    public string Action { get; set; } = default!;
    public Guid ActorUserId { get; set; }
    public string? ActorRole { get; set; }
    public string? ActorEmail { get; set; }
    public Guid? PatientUserId { get; set; }
    public string? PatientEmail { get; set; }
    public string? EntityType { get; set; }
    public Guid? EntityId { get; set; }
    public string? MetadataJson { get; set; }
    public string? IpAddress { get; set; }
}
