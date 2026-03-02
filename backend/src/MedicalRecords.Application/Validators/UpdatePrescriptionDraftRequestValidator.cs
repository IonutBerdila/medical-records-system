using FluentValidation;
using MedicalRecords.Application.Prescriptions;

namespace MedicalRecords.Application.Validators;

public class UpdatePrescriptionDraftRequestValidator : AbstractValidator<UpdatePrescriptionDraftRequest>
{
    public UpdatePrescriptionDraftRequestValidator()
    {
        RuleFor(x => x.Items)
            .NotEmpty()
            .WithMessage("Prescripția trebuie să conțină cel puțin un medicament.");

        RuleForEach(x => x.Items).SetValidator(new UpdatePrescriptionItemRequestValidator());
    }
}

public class UpdatePrescriptionItemRequestValidator : AbstractValidator<UpdatePrescriptionItemRequest>
{
    public UpdatePrescriptionItemRequestValidator()
    {
        RuleFor(x => x.MedicationName)
            .NotEmpty()
            .WithMessage("Denumirea medicamentului este obligatorie.")
            .MaximumLength(500);
    }
}
