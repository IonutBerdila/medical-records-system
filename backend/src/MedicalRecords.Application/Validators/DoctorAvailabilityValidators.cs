using FluentValidation;
using MedicalRecords.Application.Appointments;

namespace MedicalRecords.Application.Validators;

public class DoctorAvailabilityRuleCreateRequestValidator : AbstractValidator<DoctorAvailabilityRuleCreateRequest>
{
    public DoctorAvailabilityRuleCreateRequestValidator()
    {
        RuleFor(x => x.DoctorInstitutionId)
            .NotEmpty().WithMessage("Instituția medicală este obligatorie.");

        RuleFor(x => x.DayOfWeek)
            .InclusiveBetween(0, 6).WithMessage("Ziua săptămânii este invalidă.");

        RuleFor(x => x.SlotDurationMinutes)
            .GreaterThan(0).WithMessage("Durata slotului trebuie să fie pozitivă.");

        RuleFor(x => x)
            .Must(x => x.StartTime < x.EndTime)
            .WithMessage("Ora de început trebuie să fie mai mică decât ora de sfârșit.");
    }
}

public class DoctorAvailabilityRuleUpdateRequestValidator : AbstractValidator<DoctorAvailabilityRuleUpdateRequest>
{
    public DoctorAvailabilityRuleUpdateRequestValidator()
    {
        RuleFor(x => x.SlotDurationMinutes)
            .GreaterThan(0).WithMessage("Durata slotului trebuie să fie pozitivă.");

        RuleFor(x => x)
            .Must(x => x.StartTime < x.EndTime)
            .WithMessage("Ora de început trebuie să fie mai mică decât ora de sfârșit.");
    }
}

