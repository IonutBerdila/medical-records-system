namespace MedicalRecords.Application.Admin;

public class AdminAuditRequest
{
    public DateTime? FromUtc { get; set; }
    public DateTime? ToUtc { get; set; }
    public string? Action { get; set; }
    public int Skip { get; set; } = 0;
    public int Take { get; set; } = 50;
}
