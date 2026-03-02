using FluentValidation;
using MedicalRecords.Application.Prescriptions;

namespace MedicalRecords.Application.Validators;

public class CreatePrescriptionRequestValidator : AbstractValidator<CreatePrescriptionRequest>
{
    private static readonly string[] AllowedStatuses = ["Draft", "Active"];

    public CreatePrescriptionRequestValidator()
    {
        RuleFor(x => x.Status)
            .Must(s => AllowedStatuses.Contains(s))
            .WithMessage("Status trebuie să fie Draft sau Active.");

        RuleFor(x => x.Items)
            .NotEmpty()
            .WithMessage("Prescripția trebuie să conțină cel puțin un medicament.");

        RuleForEach(x => x.Items).SetValidator(new CreatePrescriptionItemRequestValidator());
    }
}

public class CreatePrescriptionItemRequestValidator : AbstractValidator<CreatePrescriptionItemRequest>
{
    public CreatePrescriptionItemRequestValidator()
    {
        RuleFor(x => x.MedicationName)
            .NotEmpty()
            .WithMessage("Denumirea medicamentului este obligatorie.")
            .MaximumLength(500);
    }
}
