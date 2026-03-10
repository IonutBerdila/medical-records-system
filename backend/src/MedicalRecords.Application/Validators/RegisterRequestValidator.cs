using FluentValidation;
using MedicalRecords.Application.Auth;

namespace MedicalRecords.Application.Validators;

public class RegisterRequestValidator : AbstractValidator<RegisterRequest>
{
    private static readonly string[] AllowedRoles = ["Patient", "Doctor", "Pharmacy", "Admin"];

    public RegisterRequestValidator()
    {
        RuleFor(x => x.Email)
            .NotEmpty().WithMessage("Adresa de email este obligatorie.")
            .EmailAddress().WithMessage("Adresa de email nu este validă.");

        RuleFor(x => x.Password)
            .NotEmpty().WithMessage("Parola este obligatorie.")
            .MinimumLength(6).WithMessage("Parola trebuie să conțină cel puțin 6 caractere.");

        RuleFor(x => x.Role)
            .NotEmpty().WithMessage("Rolul este obligatoriu.")
            .Must(role => AllowedRoles.Contains(role))
            .WithMessage("Rol invalid. Roluri permise: Patient, Doctor, Pharmacy, Admin.");

        When(x => x.Role == "Doctor", () =>
        {
            RuleFor(x => x.ProfessionalLicenseNumber)
                .NotEmpty().WithMessage("Numărul licenței profesionale este obligatoriu pentru doctor.")
                .MinimumLength(3).WithMessage("Numărul licenței profesionale trebuie să conțină cel puțin 3 caractere.");

            RuleFor(x => x.PrimarySpecialtyId)
                .NotNull().WithMessage("Specialitatea principală este obligatorie pentru doctor.")
                .Must(id => id != Guid.Empty).WithMessage("Specialitatea principală este obligatorie pentru doctor.");

            RuleFor(x => x.PrimaryInstitutionName)
                .NotEmpty().WithMessage("Instituția medicală principală este obligatorie pentru doctor.")
                .MinimumLength(3).WithMessage("Instituția medicală principală trebuie să conțină cel puțin 3 caractere.");

            RuleFor(x => x.InstitutionCity)
                .MaximumLength(128).WithMessage("Orașul instituției poate avea cel mult 128 de caractere.");
        });

        // Pentru celelalte roluri nu impunem reguli suplimentare, pentru a nu introduce breaking changes.
    }
}

