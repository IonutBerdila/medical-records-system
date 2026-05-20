using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using MedicalRecords.Application.AiSummary;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace MedicalRecords.Infrastructure.AiSummary;

/// <summary>
/// Client OpenAI (Chat Completions) bazat pe <see cref="HttpClient"/> și System.Text.Json.
/// Trimite promptul și returnează conținutul brut al răspunsului modelului.
/// Cheia API este citită din configurație (user-secrets), niciodată din cod.
/// </summary>
public class OpenAiCompletionClient : IAiCompletionClient
{
    private const string DefaultEndpoint = "https://api.openai.com/v1/chat/completions";
    private const string DefaultModel = "gpt-4o-mini";

    private readonly HttpClient _http;
    private readonly AiSummaryOptions _options;
    private readonly ILogger<OpenAiCompletionClient> _logger;

    public OpenAiCompletionClient(
        HttpClient http,
        IOptions<AiSummaryOptions> options,
        ILogger<OpenAiCompletionClient> logger)
    {
        _http = http;
        _options = options.Value;
        _logger = logger;
    }

    public async Task<string> CompleteAsync(string systemPrompt, string userPrompt, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(_options.ApiKey))
        {
            // Nu logăm cheia; doar semnalăm absența ei.
            throw new AiSummaryUnavailableException("Cheia API OpenAI nu este configurată.");
        }

        var endpoint = string.IsNullOrWhiteSpace(_options.Endpoint) ? DefaultEndpoint : _options.Endpoint;
        var model = string.IsNullOrWhiteSpace(_options.Model) ? DefaultModel : _options.Model;

        var payload = new
        {
            model,
            temperature = 0.2,
            response_format = new { type = "json_object" },
            messages = new[]
            {
                new { role = "system", content = systemPrompt },
                new { role = "user", content = userPrompt }
            }
        };

        using var request = new HttpRequestMessage(HttpMethod.Post, endpoint);
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", _options.ApiKey);
        request.Content = new StringContent(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json");

        HttpResponseMessage response;
        try
        {
            var timeoutSeconds = _options.TimeoutSeconds <= 0 ? 60 : _options.TimeoutSeconds;
            using var timeoutCts = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken);
            timeoutCts.CancelAfter(TimeSpan.FromSeconds(timeoutSeconds));
            response = await _http.SendAsync(request, timeoutCts.Token);
        }
        catch (OperationCanceledException ex) when (!cancellationToken.IsCancellationRequested)
        {
            throw new AiSummaryUnavailableException("Cererea către OpenAI a expirat (timeout).", ex);
        }
        catch (HttpRequestException ex)
        {
            throw new AiSummaryUnavailableException("Serviciul OpenAI nu a putut fi contactat.", ex);
        }

        var body = await response.Content.ReadAsStringAsync(cancellationToken);

        if (!response.IsSuccessStatusCode)
        {
            // Logăm starea și corpul pentru depanare, dar nu expunem detaliile către client.
            _logger.LogError("Apel OpenAI eșuat. Status={Status}. Body={Body}", (int)response.StatusCode, body);
            throw new AiSummaryUnavailableException($"Serviciul OpenAI a returnat o eroare ({(int)response.StatusCode}).");
        }

        try
        {
            using var doc = JsonDocument.Parse(body);
            var content = doc.RootElement
                .GetProperty("choices")[0]
                .GetProperty("message")
                .GetProperty("content")
                .GetString();

            if (string.IsNullOrWhiteSpace(content))
            {
                throw new AiSummaryUnavailableException("Răspuns gol primit de la OpenAI.");
            }

            return content;
        }
        catch (Exception ex) when (ex is JsonException or KeyNotFoundException or InvalidOperationException or IndexOutOfRangeException)
        {
            _logger.LogError(ex, "Răspuns OpenAI cu format neașteptat. Body={Body}", body);
            throw new AiSummaryUnavailableException("Răspuns invalid primit de la OpenAI.");
        }
    }
}
