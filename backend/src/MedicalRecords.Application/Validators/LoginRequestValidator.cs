using FluentValidation;
using MedicalRecords.Application.Auth;

namespace MedicalRecords.Application.Validators;

public class LoginRequestValidator : AbstractValidator<LoginRequest>
{
    public LoginRequestValidator()
    {
        RuleFor(x => x.Email)
            .NotEmpty().WithMessage("Adresa de email este obligatorie.")
            .EmailAddress().WithMessage("Adresa de email nu este validă.");

        RuleFor(x => x.Password)
            .NotEmpty().WithMessage("Parola este obligatorie.");
    }
}

