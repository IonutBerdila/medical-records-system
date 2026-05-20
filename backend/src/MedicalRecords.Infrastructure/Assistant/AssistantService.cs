using System.Text;
using System.Text.Json;
using MedicalRecords.Application.AiSummary;
using MedicalRecords.Application.Appointments;
using MedicalRecords.Application.Assistant;
using MedicalRecords.Application.Audit;
using MedicalRecords.Application.Metadata;
using MedicalRecords.Infrastructure.AiSummary;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace MedicalRecords.Infrastructure.Assistant;

/// <summary>
/// Asistent de navigare medicală pentru pacienți.
/// Reutilizează integrarea OpenAI din AI Summary (<see cref="IAiCompletionClient"/>).
/// Sintetizează orientare generală și mapează specialitățile sugerate la doctori reali;
/// nu pune diagnostice și nu recomandă tratamente.
/// </summary>
public class AssistantService : IAssistantService
{
    private const string DefaultLanguage = "ro";

    private static readonly IReadOnlyDictionary<string, string> Disclaimers = new Dictionary<string, string>
    {
        ["ro"] = "Acest asistent oferă doar informații generale de orientare și nu reprezintă un consult " +
                 "medical, un diagnostic sau un tratament. Pentru orice problemă de sănătate, consultă un medic.",
        ["fr"] = "Cet assistant fournit uniquement des informations générales d'orientation et ne constitue " +
                 "pas une consultation médicale, un diagnostic ou un traitement. Pour tout problème de santé, " +
                 "consultez un médecin.",
        ["en"] = "This assistant only provides general guidance and is not a medical consultation, diagnosis, " +
                 "or treatment. For any health concern, please consult a doctor."
    };

    private static readonly IReadOnlyDictionary<string, string> UrgentNotices = new Dictionary<string, string>
    {
        ["ro"] = "Simptomele descrise pot necesita evaluare medicală urgentă. Dacă starea este severă sau se " +
                 "agravează rapid, contactează imediat serviciul de urgență (112) sau mergi la cea mai " +
                 "apropiată unitate de urgență.",
        ["fr"] = "Les symptômes décrits peuvent nécessiter une évaluation médicale urgente. Si l'état est " +
                 "grave ou s'aggrave rapidement, contactez immédiatement les services d'urgence (112) ou " +
                 "rendez-vous au service d'urgence le plus proche.",
        ["en"] = "The symptoms described may require urgent medical evaluation. If the condition is severe or " +
                 "rapidly worsening, contact emergency services (112) immediately or go to the nearest " +
                 "emergency department."
    };

    private static readonly IReadOnlyDictionary<string, string> FallbackAnswers = new Dictionary<string, string>
    {
        ["ro"] = "Îmi pare rău, momentan nu pot genera un răspuns. Te rugăm să încerci din nou sau să " +
                 "contactezi un medic.",
        ["fr"] = "Désolé, je ne peux pas générer de réponse pour le moment. Veuillez réessayer ou contacter " +
                 "un médecin.",
        ["en"] = "Sorry, I cannot generate a response right now. Please try again or contact a doctor."
    };

    private readonly IAiCompletionClient _aiClient;
    private readonly IMetadataService _metadataService;
    private readonly IAppointmentService _appointmentService;
    private readonly IAuditService _auditService;
    private readonly AiSummaryOptions _aiOptions;
    private readonly AssistantOptions _options;
    private readonly ILogger<AssistantService> _logger;

    public AssistantService(
        IAiCompletionClient aiClient,
        IMetadataService metadataService,
        IAppointmentService appointmentService,
        IAuditService auditService,
        IOptions<AiSummaryOptions> aiOptions,
        IOptions<AssistantOptions> options,
        ILogger<AssistantService> logger)
    {
        _aiClient = aiClient;
        _metadataService = metadataService;
        _appointmentService = appointmentService;
        _auditService = auditService;
        _aiOptions = aiOptions.Value;
        _options = options.Value;
        _logger = logger;
    }

    public async Task<AssistantChatResponse> ChatAsync(
        Guid patientUserId,
        AssistantChatRequest request,
        CancellationToken cancellationToken = default)
    {
        // 1. Funcția AI trebuie să fie activată și configurată (reutilizăm secțiunea "Ai").
        if (!_aiOptions.Enabled)
        {
            throw new AiSummaryUnavailableException("Funcția de asistent AI este dezactivată.");
        }
        if (string.IsNullOrWhiteSpace(_aiOptions.ApiKey))
        {
            throw new AiSummaryUnavailableException("Cheia API OpenAI nu este configurată.");
        }

        // 2. Validare + limitarea intrării.
        if (request == null || string.IsNullOrWhiteSpace(request.Message))
        {
            throw new ArgumentException("Mesajul nu poate fi gol.");
        }

        var message = Truncate(request.Message.Trim(), _options.MaxMessageLength);
        var history = NormalizeHistory(request.History);

        // 3. Specialitățile reale active din baza de date.
        var specialties = await _metadataService.GetActiveSpecialtiesAsync();

        // 4. Construim prompturile (fără date din dosarul medical al pacientului).
        var systemPrompt = BuildSystemPrompt(specialties);
        var userPrompt = BuildUserPrompt(history, message);

        // 5. Apelăm modelul prin clientul OpenAI existent.
        var raw = await _aiClient.CompleteAsync(systemPrompt, userPrompt, cancellationToken);

        // 6. Parsăm răspunsul și îl post-procesăm în siguranță.
        var parsed = ParseModelOutput(raw);
        var language = NormalizeLanguage(parsed.DetectedLanguage);

        // Doar specialitățile care există realmente în baza de date.
        var matchedSpecialties = IntersectSpecialties(parsed.SuggestedSpecialties, specialties);

        // Mapăm specialitățile la doctori reali prin sistemul de programări.
        var suggestedDoctors = await BuildSuggestedDoctorsAsync(patientUserId, matchedSpecialties, cancellationToken);

        var clarifications = parsed.ClarificationQuestions
            .Where(q => !string.IsNullOrWhiteSpace(q))
            .Select(q => q.Trim())
            .Take(_options.MaxClarificationQuestions)
            .ToList();

        // 7. Audit minim – doar tipul evenimentului și actorul, fără textul mesajului.
        await _auditService.LogAsync(new AuditEventCreate
        {
            TimestampUtc = DateTime.UtcNow,
            Action = "ASSISTANT_CHAT_USED",
            ActorUserId = patientUserId,
            ActorRole = "Patient",
            EntityType = "Assistant"
        });

        return new AssistantChatResponse
        {
            Answer = string.IsNullOrWhiteSpace(parsed.Answer) ? GetFallbackAnswer(language) : parsed.Answer.Trim(),
            DetectedLanguage = language,
            SuggestedSpecialties = matchedSpecialties.Select(s => s.Name).ToList(),
            ClarificationQuestions = clarifications,
            SuggestedDoctors = suggestedDoctors,
            ShouldSeekUrgentCare = parsed.ShouldSeekUrgentCare,
            // Notă de siguranță și disclaimer sunt controlate de server și localizate.
            SafetyNotice = parsed.ShouldSeekUrgentCare ? GetUrgentNotice(language) : string.Empty,
            Disclaimer = GetDisclaimer(language)
        };
    }

    private List<AssistantChatMessage> NormalizeHistory(List<AssistantChatMessage>? history)
    {
        if (history == null || history.Count == 0)
        {
            return new List<AssistantChatMessage>();
        }

        return history
            .Where(m => m != null && !string.IsNullOrWhiteSpace(m.Content))
            .TakeLast(_options.MaxHistoryItems)
            .Select(m => new AssistantChatMessage
            {
                Role = string.Equals(m.Role, "assistant", StringComparison.OrdinalIgnoreCase) ? "assistant" : "user",
                Content = Truncate(m.Content.Trim(), _options.MaxHistoryMessageLength)
            })
            .ToList();
    }

    private static string BuildSystemPrompt(IReadOnlyList<SpecialtyDto> specialties)
    {
        var specialtyList = specialties.Count > 0
            ? string.Join(", ", specialties.Select(s => s.Name))
            : "(nicio specialitate disponibilă)";

        return
            "Ești un asistent de navigare medicală pentru pacienții unei platforme de dosare medicale. " +
            "NU ești medic. Rolul tău este să oferi orientare generală și să îndrumi pacientul către tipul " +
            "potrivit de specialist.\n" +
            "REGULI STRICTE DE SIGURANȚĂ:\n" +
            "- NU pune diagnostice. NU spune niciodată „ai boala X\" sau „aveți afecțiunea X\".\n" +
            "- NU recomanda medicamente, doze sau tratamente.\n" +
            "- NU sugera începerea, oprirea sau modificarea unui tratament existent.\n" +
            "- NU interpreta simptomele ca pe un diagnostic final.\n" +
            "- Încurajează mereu consultarea unui medic. Fii prudent cu incertitudinea medicală.\n" +
            "- Păstrează răspunsul concis și practic.\n" +
            "LIMBĂ:\n" +
            "- Răspunde în aceeași limbă ca mesajul pacientului (română -> română, franceză -> franceză, " +
            "engleză -> engleză).\n" +
            "- Dacă limba este mixtă, folosește limba principală a mesajului. Nu schimba limba inutil.\n" +
            "CLARIFICĂRI:\n" +
            "- Poți pune maxim 3 întrebări scurte de clarificare dacă simptomele sunt neclare.\n" +
            "SPECIALITĂȚI:\n" +
            "- Poți sugera una sau mai multe specialități, DAR exclusiv din această listă exactă: " +
            specialtyList + ".\n" +
            "- Folosește denumirile EXACT cum sunt scrise în listă. Dacă nimic nu se potrivește, lasă lista goală.\n" +
            "URGENȚE:\n" +
            "- Setează \"shouldSeekUrgentCare\" pe true DOAR dacă pacientul descrie simptome severe, bruște, " +
            "care se agravează rapid sau de tip urgență. NU oferi instrucțiuni medicale detaliate.\n" +
            "FORMAT:\n" +
            "- Răspunde EXCLUSIV cu un obiect JSON valid, fără alt text, în formatul:\n" +
            "{\"answer\": \"...\", \"detectedLanguage\": \"ro|fr|en\", \"suggestedSpecialties\": [\"...\"], " +
            "\"clarificationQuestions\": [\"...\"], \"shouldSeekUrgentCare\": false}\n" +
            "- Câmpurile \"answer\" și \"clarificationQuestions\" trebuie să fie în limba pacientului.\n" +
            "- Nu include disclaimer sau notă de siguranță; acestea sunt adăugate automat de sistem.";
    }

    private static string BuildUserPrompt(IReadOnlyList<AssistantChatMessage> history, string message)
    {
        var sb = new StringBuilder();
        if (history.Count > 0)
        {
            sb.AppendLine("Conversația de până acum:");
            foreach (var m in history)
            {
                var who = m.Role == "assistant" ? "Asistent" : "Pacient";
                sb.AppendLine($"{who}: {m.Content}");
            }
            sb.AppendLine();
        }
        sb.AppendLine("Mesajul nou al pacientului:");
        sb.AppendLine($"Pacient: {message}");
        return sb.ToString();
    }

    private ParsedOutput ParseModelOutput(string raw)
    {
        try
        {
            using var doc = JsonDocument.Parse(raw);
            var root = doc.RootElement;

            return new ParsedOutput(
                Answer: GetString(root, "answer"),
                DetectedLanguage: GetString(root, "detectedLanguage"),
                SuggestedSpecialties: GetStringArray(root, "suggestedSpecialties"),
                ClarificationQuestions: GetStringArray(root, "clarificationQuestions"),
                ShouldSeekUrgentCare: root.TryGetProperty("shouldSeekUrgentCare", out var urgentEl) && ReadBool(urgentEl));
        }
        catch (JsonException ex)
        {
            _logger.LogWarning(ex, "Răspunsul asistentului nu a putut fi parsat ca JSON; se folosește textul brut.");
            return new ParsedOutput(raw.Trim(), null, Array.Empty<string>(), Array.Empty<string>(), false);
        }
    }

    private List<SpecialtyDto> IntersectSpecialties(IReadOnlyList<string> suggested, IReadOnlyList<SpecialtyDto> active)
    {
        var result = new List<SpecialtyDto>();
        if (suggested.Count == 0 || active.Count == 0)
        {
            return result;
        }

        var byName = new Dictionary<string, SpecialtyDto>();
        foreach (var s in active)
        {
            var key = s.Name.Trim().ToLowerInvariant();
            byName.TryAdd(key, s);
        }

        var seen = new HashSet<Guid>();
        foreach (var name in suggested)
        {
            var key = name.Trim().ToLowerInvariant();
            if (byName.TryGetValue(key, out var match) && seen.Add(match.Id))
            {
                result.Add(match);
                if (result.Count >= _options.MaxSuggestedSpecialties)
                {
                    break;
                }
            }
        }
        return result;
    }

    private async Task<List<AssistantSuggestedDoctorDto>> BuildSuggestedDoctorsAsync(
        Guid patientUserId,
        List<SpecialtyDto> specialties,
        CancellationToken cancellationToken)
    {
        var result = new List<AssistantSuggestedDoctorDto>();
        if (specialties.Count == 0)
        {
            return result;
        }

        var today = DateOnly.FromDateTime(DateTime.Now.Date);
        var seen = new HashSet<string>();

        foreach (var specialty in specialties)
        {
            if (result.Count >= _options.MaxSuggestedDoctors)
            {
                break;
            }

            IReadOnlyList<DoctorSearchResultDto> doctors;
            try
            {
                doctors = await _appointmentService.SearchDoctorsAsync(
                    patientUserId,
                    new AppointmentSearchDoctorsRequest { SpecialtyId = specialty.Id, Date = today },
                    cancellationToken);
            }
            catch (OperationCanceledException)
            {
                throw;
            }
            catch (Exception ex)
            {
                // Degradare grațioasă: dacă maparea doctorilor eșuează, restul răspunsului rămâne valid.
                _logger.LogWarning(ex, "Căutarea doctorilor a eșuat pentru specialitatea {SpecialtyId}.", specialty.Id);
                continue;
            }

            var perSpecialty = 0;
            foreach (var d in doctors)
            {
                if (result.Count >= _options.MaxSuggestedDoctors || perSpecialty >= _options.MaxDoctorsPerSpecialty)
                {
                    break;
                }

                var dedupeKey = $"{d.DoctorInstitutionId}:{d.SpecialtyId}";
                if (!seen.Add(dedupeKey))
                {
                    continue;
                }

                result.Add(new AssistantSuggestedDoctorDto
                {
                    DoctorProfileId = d.DoctorProfileId,
                    DoctorInstitutionId = d.DoctorInstitutionId,
                    SpecialtyId = d.SpecialtyId,
                    Specialty = d.SpecialtyName,
                    FullName = d.DoctorFullName,
                    InstitutionName = d.InstitutionName,
                    InstitutionCity = d.InstitutionCity,
                    HasAvailabilityToday = d.HasAvailabilityOnDate
                });
                perSpecialty++;
            }
        }

        return result;
    }

    private static string NormalizeLanguage(string? language)
    {
        if (string.IsNullOrWhiteSpace(language))
        {
            return DefaultLanguage;
        }
        var code = language.Trim().ToLowerInvariant();
        if (code.Length > 2)
        {
            code = code[..2];
        }
        return code switch
        {
            "ro" => "ro",
            "fr" => "fr",
            "en" => "en",
            _ => DefaultLanguage
        };
    }

    private static string GetDisclaimer(string language) =>
        Disclaimers.TryGetValue(language, out var value) ? value : Disclaimers[DefaultLanguage];

    private static string GetUrgentNotice(string language) =>
        UrgentNotices.TryGetValue(language, out var value) ? value : UrgentNotices[DefaultLanguage];

    private static string GetFallbackAnswer(string language) =>
        FallbackAnswers.TryGetValue(language, out var value) ? value : FallbackAnswers[DefaultLanguage];

    private static string Truncate(string value, int maxLength) =>
        maxLength > 0 && value.Length > maxLength ? value[..maxLength] : value;

    private static string GetString(JsonElement root, string name) =>
        root.TryGetProperty(name, out var el) && el.ValueKind == JsonValueKind.String
            ? el.GetString() ?? string.Empty
            : string.Empty;

    private static IReadOnlyList<string> GetStringArray(JsonElement root, string name)
    {
        if (!root.TryGetProperty(name, out var el) || el.ValueKind != JsonValueKind.Array)
        {
            return Array.Empty<string>();
        }

        var list = new List<string>();
        foreach (var item in el.EnumerateArray())
        {
            if (item.ValueKind == JsonValueKind.String)
            {
                var value = item.GetString();
                if (!string.IsNullOrWhiteSpace(value))
                {
                    list.Add(value.Trim());
                }
            }
        }
        return list;
    }

    private static bool ReadBool(JsonElement element) => element.ValueKind switch
    {
        JsonValueKind.True => true,
        JsonValueKind.False => false,
        JsonValueKind.String => bool.TryParse(element.GetString(), out var parsed) && parsed,
        _ => false
    };

    private sealed record ParsedOutput(
        string Answer,
        string? DetectedLanguage,
        IReadOnlyList<string> SuggestedSpecialties,
        IReadOnlyList<string> ClarificationQuestions,
        bool ShouldSeekUrgentCare);
}
