namespace MedicalRecords.Application.Auth;

/// <summary>
/// Contract pentru operațiunile de autentificare și autorizare de bază.
/// </summary>
public interface IAuthService
{
    /// <summary>
    /// Înregistrează un utilizator nou și creează profilul asociat, dacă este cazul.
    /// </summary>
    Task<RegisterResponse> RegisterAsync(RegisterRequest req);

    /// <summary>
    /// Autentifică utilizatorul și generează un token JWT.
    /// </summary>
    Task<LoginResponse> LoginAsync(LoginRequest req);

    /// <summary>
    /// Returnează informații despre utilizatorul curent și profilul său.
    /// </summary>
    Task<MeResponse> GetMeAsync(Guid userId);
}

