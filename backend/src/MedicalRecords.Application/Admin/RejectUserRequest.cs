namespace MedicalRecords.Application.Admin;

public class RejectUserRequest
{
    public string Reason { get; set; } = default!; // Required, max 500 chars
}
