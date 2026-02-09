namespace MedicalRecords.Application.ShareToken;

/// <summary>Request pentru verificarea tokenului de partajare (farmacie).</summary>
public class VerifyShareTokenRequest
{
    public string Token { get; set; } = default!;
}
