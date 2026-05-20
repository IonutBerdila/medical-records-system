namespace MedicalRecords.Application.AiSummary;

/// <summary>
/// Abstracție subțire peste furnizorul de completări AI (în această iterație: OpenAI).
/// Returnează conținutul brut al răspunsului modelului.
/// </summary>
public interface IAiCompletionClient
{
    /// <summary>
    /// Trimite un prompt de sistem și unul de utilizator către model
    /// și returnează textul răspunsului.
    /// </summary>
    Task<string> CompleteAsync(string systemPrompt, string userPrompt, CancellationToken cancellationToken = default);
}
