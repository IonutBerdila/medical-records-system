namespace MedicalRecords.Application.Assistant;

/// <summary>
/// Asistent de navigare medicală pentru pacienți.
/// Oferă orientare generală și sugerează tipul de specialist potrivit;
/// nu pune diagnostice, nu recomandă tratamente sau medicamente.
/// </summary>
public interface IAssistantService
{
    Task<AssistantChatResponse> ChatAsync(
        Guid patientUserId,
        AssistantChatRequest request,
        CancellationToken cancellationToken = default);
}
