namespace MedicalRecords.Application.Assistant;

/// <summary>
/// Cererea trimisă asistentului de navigare medicală de către un pacient.
/// </summary>
public class AssistantChatRequest
{
    /// <summary>Mesajul curent al pacientului.</summary>
    public string Message { get; set; } = default!;

    /// <summary>
    /// Istoricul opțional al conversației (multi-turn). Nu este persistat pe server;
    /// frontend-ul îl trimite la fiecare cerere.
    /// </summary>
    public List<AssistantChatMessage>? History { get; set; }
}

/// <summary>
/// Un mesaj din istoricul conversației.
/// </summary>
public class AssistantChatMessage
{
    /// <summary>Rolul mesajului: "user" (pacient) sau "assistant".</summary>
    public string Role { get; set; } = default!;

    /// <summary>Conținutul mesajului.</summary>
    public string Content { get; set; } = default!;
}
