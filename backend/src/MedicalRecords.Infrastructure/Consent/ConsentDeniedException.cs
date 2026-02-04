namespace MedicalRecords.Infrastructure.Consent;

/// <summary>
/// Aruncată când un doctor nu are consimțământ activ pentru pacient.
/// Controller returnează 403.
/// </summary>
public class ConsentDeniedException : Exception
{
    public ConsentDeniedException(string message = "No active consent for this patient.") : base(message) { }
}
