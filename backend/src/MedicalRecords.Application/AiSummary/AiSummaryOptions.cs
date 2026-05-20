namespace MedicalRecords.Application.AiSummary;

/// <summary>
/// Configurare pentru funcția de rezumat medical AI.
/// Se încarcă din secțiunea "Ai" a configurației.
/// IMPORTANT: <see cref="ApiKey"/> NU se pune în appsettings.json;
/// se setează prin user-secrets sau variabile de mediu.
/// </summary>
public class AiSummaryOptions
{
    public const string SectionName = "Ai";

    /// <summary>Activează/dezactivează funcția. Dacă este false, endpoint-ul returnează 503.</summary>
    public bool Enabled { get; set; } = true;

    /// <summary>Endpoint-ul OpenAI Chat Completions.</summary>
    public string Endpoint { get; set; } = "https://api.openai.com/v1/chat/completions";

    /// <summary>Modelul OpenAI folosit (ex: gpt-4o-mini).</summary>
    public string Model { get; set; } = "gpt-4o-mini";

    /// <summary>Cheia API OpenAI. Se furnizează prin secrete, niciodată în cod sau appsettings.json.</summary>
    public string? ApiKey { get; set; }

    /// <summary>Timeout (secunde) pentru apelul către OpenAI.</summary>
    public int TimeoutSeconds { get; set; } = 60;

    /// <summary>Numărul maxim de intrări/prescripții recente trimise spre rezumare.</summary>
    public int MaxEntries { get; set; } = 20;
}
