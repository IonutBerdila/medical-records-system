namespace MedicalRecords.Infrastructure.Auth;

/// <summary>
/// Excepție pentru erori de validare în fluxurile de autentificare/înregistrare.
/// Folosită pentru a întoarce răspunsuri 4xx clare către client.
/// </summary>
public class AuthValidationException : Exception
{
    public AuthValidationException(string message) : base(message)
    {
    }
}

