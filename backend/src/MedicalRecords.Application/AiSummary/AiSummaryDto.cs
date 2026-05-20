namespace MedicalRecords.Application.AiSummary;

/// <summary>
/// Rezultatul rezumatului medical generat de AI pentru un medic.
/// Conține doar o sinteză a datelor existente, NU un diagnostic sau o recomandare clinică.
/// </summary>
public class AiSummaryDto
{
    /// <summary>Momentul (UTC) la care a fost generat rezumatul.</summary>
    public DateTime GeneratedAtUtc { get; set; }

    /// <summary>Modelul OpenAI folosit pentru generare.</summary>
    public string Model { get; set; } = default!;

    /// <summary>Textul de sinteză al fișei medicale.</summary>
    public string SummaryText { get; set; } = default!;

    /// <summary>
    /// Puncte de atenție observabile din datele existente
    /// (ex: alergii, reacții adverse, posibilă polipragmazie, informații lipsă).
    /// </summary>
    public IReadOnlyList<string> AttentionPoints { get; set; } = new List<string>();

    /// <summary>
    /// Avertisment generat pe server, prezent mereu în răspuns.
    /// </summary>
    public string Disclaimer { get; set; } = default!;
}
