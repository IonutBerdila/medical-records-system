namespace MedicalRecords.Application.Assistant;

/// <summary>
/// Limite (ne-secrete) pentru asistentul de navigare medicală.
/// Se încarcă din secțiunea "Assistant" a configurației; toate au valori implicite.
/// </summary>
public class AssistantOptions
{
    public const string SectionName = "Assistant";

    /// <summary>Lungimea maximă acceptată a mesajului pacientului.</summary>
    public int MaxMessageLength { get; set; } = 2000;

    /// <summary>Numărul maxim de mesaje din istoric luate în considerare.</summary>
    public int MaxHistoryItems { get; set; } = 10;

    /// <summary>Lungimea maximă a unui mesaj din istoric.</summary>
    public int MaxHistoryMessageLength { get; set; } = 2000;

    /// <summary>Numărul maxim de întrebări de clarificare returnate.</summary>
    public int MaxClarificationQuestions { get; set; } = 3;

    /// <summary>Numărul maxim de specialități sugerate.</summary>
    public int MaxSuggestedSpecialties { get; set; } = 4;

    /// <summary>Numărul maxim total de doctori sugerați.</summary>
    public int MaxSuggestedDoctors { get; set; } = 6;

    /// <summary>Numărul maxim de doctori sugerați per specialitate.</summary>
    public int MaxDoctorsPerSpecialty { get; set; } = 3;
}
