namespace MedicalRecords.Infrastructure.AiSummary;

/// <summary>
/// Aruncată când rezumatul AI nu poate fi generat din motive de infrastructură:
/// funcție dezactivată, cheie API lipsă, eroare sau timeout la apelul OpenAI.
/// Controller-ul returnează 503 Service Unavailable.
/// </summary>
public class AiSummaryUnavailableException : Exception
{
    public AiSummaryUnavailableException(string message)
        : base(message) { }

    public AiSummaryUnavailableException(string message, Exception innerException)
        : base(message, innerException) { }
}
