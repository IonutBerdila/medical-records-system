using FluentValidation;
using MedicalRecords.Application.Records;
using System.Text.RegularExpressions;

namespace MedicalRecords.Application.Validators;

public class UpdateMedicalRecordRequestValidator : AbstractValidator<UpdateMedicalRecordRequest>
{
    private static readonly string[] AllowedBloodGroups =
    [
        "Necunoscut", "0(I) Rh+", "0(I) Rh-", "A(II) Rh+", "A(II) Rh-",
        "B(III) Rh+", "B(III) Rh-", "AB(IV) Rh+", "AB(IV) Rh-"
    ];

    private static readonly Regex PhoneRegex = new(@"^[\d\s+\-()]{8,}$", RegexOptions.Compiled);

    public UpdateMedicalRecordRequestValidator()
    {
        RuleFor(x => x.BloodType)
            .Must(v => string.IsNullOrWhiteSpace(v) || AllowedBloodGroups.Contains(v.Trim()))
            .WithMessage("Grupa sanguină invalidă. Valori permise: Necunoscut, 0(I) Rh+, 0(I) Rh-, A(II) Rh+, A(II) Rh-, B(III) Rh+, B(III) Rh-, AB(IV) Rh+, AB(IV) Rh-.")
            .When(x => !string.IsNullOrEmpty(x.BloodType));

        RuleFor(x => x.Allergies)
            .Must(BeValidTagList)
            .WithMessage("Alergii: maxim 30 elemente, fiecare maxim 60 caractere.");
        RuleFor(x => x.AdverseDrugReactions)
            .Must(BeValidTagList)
            .WithMessage("Reacții adverse: maxim 30 elemente, fiecare maxim 60 caractere.");
        RuleFor(x => x.ChronicConditions)
            .Must(BeValidTagList)
            .WithMessage("Afecțiuni cronice: maxim 30 elemente, fiecare maxim 60 caractere.");

        RuleFor(x => x.CurrentMedications)
            .MaximumLength(1000)
            .WithMessage("Medicația curentă nu poate depăși 1000 caractere.");
        RuleFor(x => x.MajorSurgeriesHospitalizations)
            .MaximumLength(1000)
            .WithMessage("Intervențiile/spitalizările nu pot depăși 1000 caractere.");

        RuleFor(x => x.EmergencyContactPhone)
            .Must(v => string.IsNullOrWhiteSpace(v) || IsValidPhone(v))
            .WithMessage("Telefonul trebuie să aibă cel puțin 8 cifre și poate conține +, spații, paranteze sau liniuțe.")
            .When(x => (x.EmergencyContacts == null || x.EmergencyContacts.Count == 0) && !string.IsNullOrEmpty(x.EmergencyContactPhone));

        RuleFor(x => x.EmergencyContacts)
            .Must(list => list == null || list.All(c => string.IsNullOrWhiteSpace(c.Phone) || IsValidPhone(c.Phone)))
            .WithMessage("Unul dintre telefoanele de urgență nu este valid (minim 8 cifre).")
            .When(x => x.EmergencyContacts != null && x.EmergencyContacts.Count > 0);
    }

    private static bool BeValidTagList(IList<string>? items)
    {
        if (items == null) return true;
        if (items.Count > 30) return false;
        return items.All(s => (s?.Trim().Length ?? 0) <= 60);
    }

    private static bool IsValidPhone(string value)
    {
        var digitsOnly = new string(value.Where(char.IsDigit).ToArray());
        return digitsOnly.Length >= 8 && PhoneRegex.IsMatch(value.Trim());
    }
}
