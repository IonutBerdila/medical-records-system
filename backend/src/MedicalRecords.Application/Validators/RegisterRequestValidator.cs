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
            RuleFor(x => x.DoctorLicenseNumber)
                .NotEmpty().WithMessage("Numărul de licență este obligatoriu pentru doctor.");
        });

        // Pentru celelalte roluri nu impunem reguli suplimentare, pentru a nu introduce breaking changes.
    }
}

