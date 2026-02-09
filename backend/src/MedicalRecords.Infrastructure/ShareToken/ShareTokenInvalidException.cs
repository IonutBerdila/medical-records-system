namespace MedicalRecords.Infrastructure.ShareToken;

/// <summary>
/// Aruncată când tokenul de partajare este invalid, expirat, revocat sau deja consumat.
/// Controller returnează 400/404.
/// </summary>
public class ShareTokenInvalidException : Exception
{
    public ShareTokenInvalidException(string message = "Token invalid, expirat sau deja folosit.") : base(message) { }
}
