namespace MedicalRecords.Application.Assistant;

/// <summary>
/// Răspunsul asistentului de navigare medicală.
/// Oferă doar orientare generală; nu reprezintă un diagnostic sau un tratament.
/// </summary>
public class AssistantChatResponse
{
    /// <summary>Răspunsul în limba mesajului pacientului.</summary>
    public string Answer { get; set; } = default!;

    /// <summary>Limba detectată a mesajului pacientului (ex: "ro", "fr", "en").</summary>
    public string DetectedLanguage { get; set; } = default!;

    /// <summary>
    /// Specialități sugerate, exclusiv din specialitățile active existente în baza de date.
    /// </summary>
    public IReadOnlyList<string> SuggestedSpecialties { get; set; } = new List<string>();

    /// <summary>Întrebări scurte de clarificare (maxim 3).</summary>
    public IReadOnlyList<string> ClarificationQuestions { get; set; } = new List<string>();

    /// <summary>Doctori sugerați pentru specialitățile identificate (dacă există).</summary>
    public IReadOnlyList<AssistantSuggestedDoctorDto> SuggestedDoctors { get; set; } =
        new List<AssistantSuggestedDoctorDto>();

    /// <summary>True dacă pacientul descrie simptome care pot necesita evaluare urgentă.</summary>
    public bool ShouldSeekUrgentCare { get; set; }

    /// <summary>
    /// Avertisment de urgență, controlat de server și localizat. Gol când nu este cazul.
    /// </summary>
    public string SafetyNotice { get; set; } = string.Empty;

    /// <summary>Disclaimer controlat de server, localizat după limba detectată.</summary>
    public string Disclaimer { get; set; } = default!;
}

/// <summary>
/// Doctor sugerat, cu identificatorii necesari fluxului de programare existent.
/// </summary>
public class AssistantSuggestedDoctorDto
{
    public Guid DoctorProfileId { get; set; }
    public Guid DoctorInstitutionId { get; set; }
    public Guid SpecialtyId { get; set; }
    public string Specialty { get; set; } = default!;
    public string FullName { get; set; } = default!;
    public string InstitutionName { get; set; } = default!;
    public string? InstitutionCity { get; set; }
    public bool HasAvailabilityToday { get; set; }
}
