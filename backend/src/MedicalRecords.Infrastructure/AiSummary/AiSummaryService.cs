using System.Text;
using System.Text.Json;
using MedicalRecords.Application.AiSummary;
using MedicalRecords.Application.Audit;
using MedicalRecords.Application.Consent;
using MedicalRecords.Application.Entries;
using MedicalRecords.Application.Prescriptions;
using MedicalRecords.Application.Records;
using MedicalRecords.Infrastructure.Consent;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace MedicalRecords.Infrastructure.AiSummary;

/// <summary>
/// Orchestrează generarea rezumatului medical AI:
/// verifică consimțământul, colectează doar datele clinice necesare,
/// construiește promptul, apelează OpenAI, parsează răspunsul și înregistrează auditul.
/// </summary>
public class AiSummaryService : IAiSummaryService
{
    /// <summary>Avertisment fix, adăugat pe server în fiecare răspuns.</summary>
    private const string DisclaimerText =
        "Acest rezumat este generat automat de un model AI pe baza datelor deja existente în fișa pacientului. " +
        "Nu reprezintă un diagnostic, o recomandare de tratament sau o decizie clinică și nu înlocuiește " +
        "evaluarea și judecata medicului.";

    private static readonly IReadOnlyDictionary<string, string> EntryTypeLabels = new Dictionary<string, string>
    {
        ["Diagnosis"] = "Diagnostic",
        ["Visit"] = "Vizită",
        ["Note"] = "Notă",
        ["LabResult"] = "Rezultat laborator"
    };

    private readonly IConsentService _consentService;
    private readonly IMedicalRecordService _recordService;
    private readonly IMedicalEntryService _entryService;
    private readonly IPrescriptionService _prescriptionService;
    private readonly IAiCompletionClient _aiClient;
    private readonly IAuditService _auditService;
    private readonly AiSummaryOptions _options;
    private readonly ILogger<AiSummaryService> _logger;

    public AiSummaryService(
        IConsentService consentService,
        IMedicalRecordService recordService,
        IMedicalEntryService entryService,
        IPrescriptionService prescriptionService,
        IAiCompletionClient aiClient,
        IAuditService auditService,
        IOptions<AiSummaryOptions> options,
        ILogger<AiSummaryService> logger)
    {
        _consentService = consentService;
        _recordService = recordService;
        _entryService = entryService;
        _prescriptionService = prescriptionService;
        _aiClient = aiClient;
        _auditService = auditService;
        _options = options.Value;
        _logger = logger;
    }

    public async Task<AiSummaryDto> GenerateForPatientAsync(Guid doctorUserId, Guid patientUserId, CancellationToken cancellationToken = default)
    {
        // 1. Funcția trebuie să fie activată și configurată.
        if (!_options.Enabled)
        {
            throw new AiSummaryUnavailableException("Funcția de rezumat AI este dezactivată.");
        }
        if (string.IsNullOrWhiteSpace(_options.ApiKey))
        {
            throw new AiSummaryUnavailableException("Cheia API OpenAI nu este configurată.");
        }

        // 2. Verificarea consimțământului – același tipar folosit de celelalte servicii.
        var hasAccess = await _consentService.HasActiveAccessAsync(patientUserId, doctorUserId);
        if (!hasAccess)
        {
            throw new ConsentDeniedException();
        }

        // 3. Colectăm datele pacientului (serviciile revalidează la rândul lor consimțământul).
        var record = await _recordService.GetPatientRecordForDoctorAsync(doctorUserId, patientUserId);
        var entries = await _entryService.GetEntriesForPatientAsync(doctorUserId, patientUserId);
        var prescriptions = await _prescriptionService.GetPrescriptionsForPatientAsync(doctorUserId, patientUserId);

        var hasRecord = record.Id != Guid.Empty;
        if (!hasRecord && entries.Count == 0 && prescriptions.Count == 0)
        {
            // Niciun fel de date medicale pentru acest pacient.
            throw new KeyNotFoundException("Pacientul nu are date medicale disponibile pentru rezumat.");
        }

        // 4. Construim promptul folosind DOAR câmpuri clinice (fără nume, telefon, contacte, ID-uri).
        var maxItems = _options.MaxEntries <= 0 ? 20 : _options.MaxEntries;
        var systemPrompt = BuildSystemPrompt();
        var userPrompt = BuildUserPrompt(
            record,
            entries.Take(maxItems).ToList(),
            prescriptions.Take(maxItems).ToList());

        // 5. Apelăm modelul.
        var raw = await _aiClient.CompleteAsync(systemPrompt, userPrompt, cancellationToken);
        var (summaryText, attentionPoints) = ParseModelOutput(raw);

        // 6. Audit – acces sensibil la datele pacientului.
        await _auditService.LogAsync(new AuditEventCreate
        {
            TimestampUtc = DateTime.UtcNow,
            Action = "AI_SUMMARY_GENERATED",
            ActorUserId = doctorUserId,
            ActorRole = "Doctor",
            PatientUserId = patientUserId,
            EntityType = "AiSummary",
            MetadataJson = JsonSerializer.Serialize(new { model = _options.Model })
        });

        return new AiSummaryDto
        {
            GeneratedAtUtc = DateTime.UtcNow,
            Model = string.IsNullOrWhiteSpace(_options.Model) ? "gpt-4o-mini" : _options.Model,
            SummaryText = summaryText,
            AttentionPoints = attentionPoints,
            Disclaimer = DisclaimerText
        };
    }

    private static string BuildSystemPrompt()
    {
        return
            "Ești un asistent care ajută un medic să înțeleagă rapid o fișă medicală deja existentă. " +
            "REGULI STRICTE:\n" +
            "- Rezumă DOAR informațiile furnizate mai jos. Nu inventa și nu presupune date.\n" +
            "- NU pune diagnostice. NU recomanda tratamente sau medicamente. NU lua decizii clinice.\n" +
            "- NU înlocui medicul; ești doar un instrument de sinteză a datelor existente.\n" +
            "- Dacă o informație lipsește, menționează explicit că lipsește.\n" +
            "- Scrie în limba română, clar și concis, pentru un medic.\n" +
            "La 'attentionPoints' enumeră puncte de atenție OBSERVABILE direct din date " +
            "(ex: alergii, reacții adverse la medicamente, posibilă polipragmazie, informații lipsă, " +
            "prescripții recente numeroase). Nu formula recomandări de tratament.\n" +
            "Răspunde EXCLUSIV cu un obiect JSON valid, în formatul: " +
            "{\"summary\": \"text de sinteză\", \"attentionPoints\": [\"punct 1\", \"punct 2\"]}.";
    }

    private static string BuildUserPrompt(
        MedicalRecordDto record,
        IReadOnlyList<MedicalEntryDto> entries,
        IReadOnlyList<PrescriptionDto> prescriptions)
    {
        var sb = new StringBuilder();
        sb.AppendLine("Datele clinice ale pacientului (anonimizate):");
        sb.AppendLine();

        sb.AppendLine("# Fișă medicală");
        sb.AppendLine($"- Grupă sanguină: {FormatValue(record.BloodType)}");
        sb.AppendLine($"- Alergii: {FormatList(record.Allergies)}");
        sb.AppendLine($"- Reacții adverse la medicamente: {FormatList(record.AdverseDrugReactions)}");
        sb.AppendLine($"- Afecțiuni cronice: {FormatList(record.ChronicConditions)}");
        sb.AppendLine($"- Medicație curentă: {FormatValue(record.CurrentMedications)}");
        sb.AppendLine($"- Intervenții chirurgicale / spitalizări: {FormatValue(record.MajorSurgeriesHospitalizations)}");
        sb.AppendLine();

        sb.AppendLine($"# Intrări recente în timeline ({entries.Count})");
        if (entries.Count == 0)
        {
            sb.AppendLine("- (nicio intrare)");
        }
        else
        {
            foreach (var e in entries)
            {
                var type = EntryTypeLabels.TryGetValue(e.Type, out var label) ? label : e.Type;
                sb.AppendLine($"- [{e.CreatedAtUtc:yyyy-MM-dd}] {type}: {FormatValue(e.Title)}");
                if (!string.IsNullOrWhiteSpace(e.Description))
                {
                    sb.AppendLine($"  Descriere: {e.Description.Trim()}");
                }
            }
        }
        sb.AppendLine();

        sb.AppendLine($"# Prescripții recente ({prescriptions.Count})");
        if (prescriptions.Count == 0)
        {
            sb.AppendLine("- (nicio prescripție)");
        }
        else
        {
            foreach (var p in prescriptions)
            {
                sb.AppendLine($"- [{p.CreatedAtUtc:yyyy-MM-dd}] Status: {FormatValue(p.Status)}");
                if (!string.IsNullOrWhiteSpace(p.Diagnosis))
                {
                    sb.AppendLine($"  Diagnostic consemnat: {p.Diagnosis.Trim()}");
                }
                if (!string.IsNullOrWhiteSpace(p.GeneralNotes))
                {
                    sb.AppendLine($"  Note generale: {p.GeneralNotes.Trim()}");
                }
                foreach (var it in p.Items)
                {
                    var parts = new List<string> { it.MedicationName };
                    if (!string.IsNullOrWhiteSpace(it.Form)) parts.Add($"formă: {it.Form}");
                    if (!string.IsNullOrWhiteSpace(it.Dosage)) parts.Add($"dozaj: {it.Dosage}");
                    if (!string.IsNullOrWhiteSpace(it.Frequency)) parts.Add($"frecvență: {it.Frequency}");
                    if (it.DurationDays.HasValue) parts.Add($"durată: {it.DurationDays} zile");
                    if (it.Quantity.HasValue) parts.Add($"cantitate: {it.Quantity}");
                    if (!string.IsNullOrWhiteSpace(it.Instructions)) parts.Add($"instrucțiuni: {it.Instructions}");
                    if (!string.IsNullOrWhiteSpace(it.Warnings)) parts.Add($"atenționări: {it.Warnings}");
                    sb.AppendLine($"  • {string.Join(" · ", parts)}");
                }
            }
        }
        sb.AppendLine();
        sb.AppendLine("Generează rezumatul respectând regulile din mesajul de sistem.");

        return sb.ToString();
    }

    private (string Summary, IReadOnlyList<string> AttentionPoints) ParseModelOutput(string raw)
    {
        try
        {
            using var doc = JsonDocument.Parse(raw);
            var root = doc.RootElement;

            var summary = root.TryGetProperty("summary", out var summaryEl)
                ? summaryEl.GetString() ?? string.Empty
                : string.Empty;

            var points = new List<string>();
            if (root.TryGetProperty("attentionPoints", out var pointsEl) && pointsEl.ValueKind == JsonValueKind.Array)
            {
                foreach (var item in pointsEl.EnumerateArray())
                {
                    var text = item.ValueKind == JsonValueKind.String ? item.GetString() : item.ToString();
                    if (!string.IsNullOrWhiteSpace(text))
                    {
                        points.Add(text.Trim());
                    }
                }
            }

            // Dacă modelul nu a respectat formatul, folosim textul brut ca rezumat.
            if (string.IsNullOrWhiteSpace(summary))
            {
                summary = raw;
            }

            return (summary.Trim(), points);
        }
        catch (JsonException ex)
        {
            _logger.LogWarning(ex, "Răspunsul AI nu a putut fi parsat ca JSON; se folosește textul brut.");
            return (raw.Trim(), Array.Empty<string>());
        }
    }

    private static string FormatValue(string? value) =>
        string.IsNullOrWhiteSpace(value) ? "lipsă" : value.Trim();

    private static string FormatList(IReadOnlyList<string>? values)
    {
        if (values == null || values.Count == 0)
        {
            return "lipsă";
        }
        var cleaned = values.Where(v => !string.IsNullOrWhiteSpace(v)).Select(v => v.Trim()).ToList();
        return cleaned.Count == 0 ? "lipsă" : string.Join(", ", cleaned);
    }
}
