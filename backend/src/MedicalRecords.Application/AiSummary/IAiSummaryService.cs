namespace MedicalRecords.Application.AiSummary;

/// <summary>
/// Serviciu care generează un rezumat medical asistat de AI pentru un medic.
/// Doar sintetizează datele existente ale pacientului; nu pune diagnostice
/// și nu oferă recomandări de tratament.
/// </summary>
public interface IAiSummaryService
{
    /// <summary>
    /// Generează rezumatul pentru un pacient, verificând în prealabil consimțământul activ al medicului.
    /// </summary>
    Task<AiSummaryDto> GenerateForPatientAsync(Guid doctorUserId, Guid patientUserId, CancellationToken cancellationToken = default);
}
