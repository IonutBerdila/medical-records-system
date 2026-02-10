namespace MedicalRecords.Application.Admin;

public interface IApprovalGuard
{
    /// <summary>
    /// Verifică dacă utilizatorul Doctor sau Pharmacy este aprobat.
    /// Aruncă excepție dacă nu este aprobat.
    /// </summary>
    Task EnsureApprovedAsync(Guid userId, string role);
}
