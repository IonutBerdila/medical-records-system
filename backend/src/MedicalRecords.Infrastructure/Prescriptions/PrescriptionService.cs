using MedicalRecords.Application.Prescriptions;
using MedicalRecords.Domain.Entities;
using MedicalRecords.Infrastructure.Consent;
using MedicalRecords.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using MedicalRecords.Application.Consent;

namespace MedicalRecords.Infrastructure.Prescriptions;

public class PrescriptionService : IPrescriptionService
{
    private readonly AppDbContext _db;
    private readonly IConsentService _consentService;

    public PrescriptionService(AppDbContext db, IConsentService consentService)
    {
        _db = db;
        _consentService = consentService;
    }

    public async Task<IReadOnlyList<PrescriptionDto>> GetMyPrescriptionsAsync(Guid patientUserId)
    {
        var list = await _db.Prescriptions
            .AsNoTracking()
            .Include(p => p.Items)
            .Where(p => p.PatientUserId == patientUserId)
            .OrderByDescending(p => p.CreatedAtUtc)
            .ToListAsync();
        return await MapToDtosAsync(list);
    }

    public async Task<IReadOnlyList<PrescriptionDto>> GetPrescriptionsForPatientAsync(Guid doctorUserId, Guid patientUserId)
    {
        var hasAccess = await _consentService.HasActiveAccessAsync(patientUserId, doctorUserId);
        if (!hasAccess)
            throw new ConsentDeniedException();

        var list = await _db.Prescriptions
            .AsNoTracking()
            .Include(p => p.Items)
            .Where(p => p.PatientUserId == patientUserId)
            .OrderByDescending(p => p.CreatedAtUtc)
            .ToListAsync();
        return await MapToDtosAsync(list);
    }

    public async Task<PrescriptionDto> CreatePrescriptionForPatientAsync(Guid doctorUserId, Guid patientUserId, CreatePrescriptionRequest req)
    {
        var hasAccess = await _consentService.HasActiveAccessAsync(patientUserId, doctorUserId);
        if (!hasAccess)
            throw new ConsentDeniedException();

        var now = DateTime.UtcNow;
        var status = string.IsNullOrWhiteSpace(req.Status) ? "Active" : req.Status.Trim();
        if (status != "Draft" && status != "Active") status = "Active";

        var p = new Prescription
        {
            Id = Guid.NewGuid(),
            PatientUserId = patientUserId,
            DoctorUserId = doctorUserId,
            Diagnosis = req.Diagnosis?.Trim(),
            GeneralNotes = req.GeneralNotes?.Trim(),
            ValidUntilUtc = req.ValidUntilUtc,
            Status = status,
            CreatedAtUtc = now
        };

        foreach (var itemReq in req.Items)
        {
            if (string.IsNullOrWhiteSpace(itemReq.MedicationName)) continue;
            p.Items.Add(new PrescriptionItem
            {
                Id = Guid.NewGuid(),
                PrescriptionId = p.Id,
                MedicationName = itemReq.MedicationName.Trim(),
                Form = itemReq.Form?.Trim(),
                Dosage = itemReq.Dosage?.Trim(),
                Frequency = itemReq.Frequency?.Trim(),
                DurationDays = itemReq.DurationDays,
                Quantity = itemReq.Quantity,
                Instructions = itemReq.Instructions?.Trim(),
                Warnings = itemReq.Warnings?.Trim(),
                Status = "Pending"
            });
        }

        if (p.Items.Count == 0)
            throw new InvalidOperationException("Prescripția trebuie să conțină cel puțin un medicament.");

        _db.Prescriptions.Add(p);
        await _db.SaveChangesAsync();

        var doctorName = await _db.DoctorProfiles
            .AsNoTracking()
            .Where(d => d.UserId == doctorUserId)
            .Select(d => d.FullName)
            .FirstOrDefaultAsync();

        return ToDto(p, doctorName, null);
    }

    public async Task<PrescriptionDto> GetPrescriptionByIdForDoctorAsync(Guid doctorUserId, Guid patientUserId, Guid prescriptionId)
    {
        var hasAccess = await _consentService.HasActiveAccessAsync(patientUserId, doctorUserId);
        if (!hasAccess)
            throw new ConsentDeniedException();

        var prescription = await _db.Prescriptions
            .AsNoTracking()
            .Include(p => p.Items)
            .FirstOrDefaultAsync(p => p.Id == prescriptionId && p.PatientUserId == patientUserId);

        if (prescription == null)
            throw new KeyNotFoundException("Prescripția nu a fost găsită.");

        var doctorName = await _db.DoctorProfiles
            .AsNoTracking()
            .Where(d => d.UserId == doctorUserId)
            .Select(d => d.FullName)
            .FirstOrDefaultAsync();

        var pharmacyUserIds = prescription.Items.Where(i => i.DispensedByPharmacyUserId.HasValue).Select(i => i.DispensedByPharmacyUserId!.Value).Distinct().ToList();
        var pharmacyNames = pharmacyUserIds.Count > 0
            ? await _db.PharmacyProfiles.AsNoTracking().Where(ph => pharmacyUserIds.Contains(ph.UserId)).ToDictionaryAsync(ph => ph.UserId, ph => ph.PharmacyName)
            : new Dictionary<Guid, string>();

        return ToDto(prescription, doctorName, pharmacyNames);
    }

    public async Task<PrescriptionDto> UpdateDraftAsync(Guid doctorUserId, Guid patientUserId, Guid prescriptionId, UpdatePrescriptionDraftRequest request)
    {
        var hasAccess = await _consentService.HasActiveAccessAsync(patientUserId, doctorUserId);
        if (!hasAccess)
            throw new ConsentDeniedException();

        // Load the prescription as a tracked entity with items included
        var prescription = await _db.Prescriptions
            .Include(p => p.Items)
            .FirstOrDefaultAsync(p => p.Id == prescriptionId
                && p.PatientUserId == patientUserId
                && p.DoctorUserId == doctorUserId);

        if (prescription == null)
            throw new KeyNotFoundException("Prescripția nu a fost găsită.");

        if (prescription.Status != "Draft")
            throw new InvalidOperationException("Doar prescripțiile cu status Draft pot fi editate.");

        // Validate that no items are already dispensed (check all dispensed indicators)
        if (prescription.Items.Any(i =>
            i.Status == "Dispensed" ||
            i.DispensedAtUtc.HasValue ||
            i.DispensedByPharmacyUserId.HasValue))
        {
            throw new InvalidOperationException("Nu se poate edita o prescripție care conține medicamente deja eliberate.");
        }

        // Normalize incoming items (ignore empty, trim strings)
        var incomingItems = (request.Items ?? Array.Empty<UpdatePrescriptionItemRequest>())
            .Where(i => !string.IsNullOrWhiteSpace(i.MedicationName))
            .ToList();

        if (incomingItems.Count == 0)
            throw new InvalidOperationException("Prescripția trebuie să conțină cel puțin un medicament.");

        // Update scalar fields on the tracked entity
        prescription.Diagnosis = request.Diagnosis?.Trim();
        prescription.GeneralNotes = request.GeneralNotes?.Trim();
        prescription.ValidUntilUtc = request.ValidUntilUtc;

        // Diff & apply items:
        // - update existing items in place when Id matches
        // - add new items when Id is missing/unknown
        // - delete items that are not present in the incoming list
        var existingItems = prescription.Items.ToList();
        var existingById = existingItems.ToDictionary(i => i.Id, i => i);
        var keptItemIds = new HashSet<Guid>();

        foreach (var itemReq in incomingItems)
        {
            if (itemReq.Id.HasValue && existingById.TryGetValue(itemReq.Id.Value, out var existing))
            {
                // Update existing item in place
                existing.MedicationName = itemReq.MedicationName.Trim();
                existing.Form = itemReq.Form?.Trim();
                existing.Dosage = itemReq.Dosage?.Trim();
                existing.Frequency = itemReq.Frequency?.Trim();
                existing.DurationDays = itemReq.DurationDays;
                existing.Quantity = itemReq.Quantity;
                existing.Instructions = itemReq.Instructions?.Trim();
                existing.Warnings = itemReq.Warnings?.Trim();
                // Draft edit keeps items as Pending and clears any accidental dispense flags
                existing.Status = "Pending";
                existing.DispensedAtUtc = null;
                existing.DispensedByPharmacyUserId = null;

                keptItemIds.Add(existing.Id);
            }
            else
            {
                // New item (no Id or unknown Id) -> create entity with server-generated Id
                var newItem = new PrescriptionItem
                {
                    Id = Guid.NewGuid(),
                    PrescriptionId = prescription.Id,
                    MedicationName = itemReq.MedicationName.Trim(),
                    Form = itemReq.Form?.Trim(),
                    Dosage = itemReq.Dosage?.Trim(),
                    Frequency = itemReq.Frequency?.Trim(),
                    DurationDays = itemReq.DurationDays,
                    Quantity = itemReq.Quantity,
                    Instructions = itemReq.Instructions?.Trim(),
                    Warnings = itemReq.Warnings?.Trim(),
                    Status = "Pending",
                    DispensedAtUtc = null,
                    DispensedByPharmacyUserId = null
                };

                prescription.Items.Add(newItem);
                keptItemIds.Add(newItem.Id);
            }
        }

        // Remove items that were present in DB but not in the incoming request
        var itemsToRemove = existingItems.Where(i => !keptItemIds.Contains(i.Id)).ToList();
        if (itemsToRemove.Count > 0)
        {
            _db.PrescriptionItems.RemoveRange(itemsToRemove);
        }

        if (!prescription.Items.Any())
            throw new InvalidOperationException("Prescripția trebuie să conțină cel puțin un medicament.");

#if DEBUG
        var debugStates = _db.ChangeTracker.Entries<PrescriptionItem>()
            .Select(e => $"{e.Entity.Id}:{e.State}")
            .ToList();
        Console.WriteLine($"[DEBUG] PrescriptionItem states before SaveChanges (UpdateDraftAsync): {string.Join(", ", debugStates)}");
#endif

        // SaveChanges will delete removed items, update existing ones, insert new ones, and update the prescription header
        try
        {
            await _db.SaveChangesAsync();
        }
        catch (DbUpdateConcurrencyException ex)
        {
            // If a PrescriptionItem was concurrently deleted (or has a stale Id),
            // re-treat the affected entries as new items instead of failing with 409.
            if (ex.Entries.All(e => e.Entity is PrescriptionItem))
            {
                foreach (var entry in ex.Entries)
                {
                    if (entry.Entity is not PrescriptionItem pi) continue;

                    entry.State = EntityState.Detached;
                    pi.Id = Guid.NewGuid();
                    pi.PrescriptionId = prescription.Id;
                    _db.PrescriptionItems.Add(pi);
                }

                await _db.SaveChangesAsync();
            }
            else
            {
                throw;
            }
        }

        var doctorName = await _db.DoctorProfiles
            .AsNoTracking()
            .Where(d => d.UserId == doctorUserId)
            .Select(d => d.FullName)
            .FirstOrDefaultAsync();

        return ToDto(prescription, doctorName, null);
    }

    public async Task<PrescriptionDto> IssueDraftAsync(Guid doctorUserId, Guid patientUserId, Guid prescriptionId, UpdatePrescriptionDraftRequest request)
    {
        var hasAccess = await _consentService.HasActiveAccessAsync(patientUserId, doctorUserId);
        if (!hasAccess)
            throw new ConsentDeniedException();

        // Load the prescription as a tracked entity with items included
        var prescription = await _db.Prescriptions
            .Include(p => p.Items)
            .FirstOrDefaultAsync(p => p.Id == prescriptionId
                && p.PatientUserId == patientUserId
                && p.DoctorUserId == doctorUserId);

        if (prescription == null)
            throw new KeyNotFoundException("Prescripția nu a fost găsită.");

        if (prescription.Status != "Draft")
            throw new InvalidOperationException("Doar prescripțiile cu status Draft pot fi emise.");

        // Validate that no items are already dispensed
        if (prescription.Items.Any(i =>
            i.Status == "Dispensed" ||
            i.DispensedAtUtc.HasValue ||
            i.DispensedByPharmacyUserId.HasValue))
        {
            throw new InvalidOperationException("Nu se poate emite o prescripție care conține medicamente deja eliberate.");
        }

        // Normalize incoming items (ignore empty, trim strings)
        var incomingItems = (request.Items ?? Array.Empty<UpdatePrescriptionItemRequest>())
            .Where(i => !string.IsNullOrWhiteSpace(i.MedicationName))
            .ToList();

        if (incomingItems.Count == 0)
            throw new InvalidOperationException("Prescripția trebuie să conțină cel puțin un medicament.");

        // Update scalar fields for issuing the draft
        prescription.Diagnosis = request.Diagnosis?.Trim();
        prescription.GeneralNotes = request.GeneralNotes?.Trim();
        prescription.ValidUntilUtc = request.ValidUntilUtc;
        prescription.Status = "Active";

        // Diff & apply items:
        var existingItems = prescription.Items.ToList();
        var existingById = existingItems.ToDictionary(i => i.Id, i => i);
        var keptItemIds = new HashSet<Guid>();

        foreach (var itemReq in incomingItems)
        {
            if (itemReq.Id.HasValue && existingById.TryGetValue(itemReq.Id.Value, out var existing))
            {
                existing.MedicationName = itemReq.MedicationName.Trim();
                existing.Form = itemReq.Form?.Trim();
                existing.Dosage = itemReq.Dosage?.Trim();
                existing.Frequency = itemReq.Frequency?.Trim();
                existing.DurationDays = itemReq.DurationDays;
                existing.Quantity = itemReq.Quantity;
                existing.Instructions = itemReq.Instructions?.Trim();
                existing.Warnings = itemReq.Warnings?.Trim();
                // When issuing, items start as Pending; pharmacy moves them to Dispensed
                existing.Status = "Pending";
                existing.DispensedAtUtc = null;
                existing.DispensedByPharmacyUserId = null;

                keptItemIds.Add(existing.Id);
            }
            else
            {
                var newItem = new PrescriptionItem
                {
                    Id = Guid.NewGuid(),
                    PrescriptionId = prescription.Id,
                    MedicationName = itemReq.MedicationName.Trim(),
                    Form = itemReq.Form?.Trim(),
                    Dosage = itemReq.Dosage?.Trim(),
                    Frequency = itemReq.Frequency?.Trim(),
                    DurationDays = itemReq.DurationDays,
                    Quantity = itemReq.Quantity,
                    Instructions = itemReq.Instructions?.Trim(),
                    Warnings = itemReq.Warnings?.Trim(),
                    Status = "Pending",
                    DispensedAtUtc = null,
                    DispensedByPharmacyUserId = null
                };

                prescription.Items.Add(newItem);
                keptItemIds.Add(newItem.Id);
            }
        }

        var itemsToRemove = existingItems.Where(i => !keptItemIds.Contains(i.Id)).ToList();
        if (itemsToRemove.Count > 0)
        {
            _db.PrescriptionItems.RemoveRange(itemsToRemove);
        }

        if (!prescription.Items.Any())
            throw new InvalidOperationException("Prescripția trebuie să conțină cel puțin un medicament.");

#if DEBUG
        var debugStates = _db.ChangeTracker.Entries<PrescriptionItem>()
            .Select(e => $"{e.Entity.Id}:{e.State}")
            .ToList();
        Console.WriteLine($"[DEBUG] PrescriptionItem states before SaveChanges (IssueDraftAsync): {string.Join(", ", debugStates)}");
#endif

        try
        {
            await _db.SaveChangesAsync();
        }
        catch (DbUpdateConcurrencyException ex)
        {
            if (ex.Entries.All(e => e.Entity is PrescriptionItem))
            {
                foreach (var entry in ex.Entries)
                {
                    if (entry.Entity is not PrescriptionItem pi) continue;

                    entry.State = EntityState.Detached;
                    pi.Id = Guid.NewGuid();
                    pi.PrescriptionId = prescription.Id;
                    _db.PrescriptionItems.Add(pi);
                }

                await _db.SaveChangesAsync();
            }
            else
            {
                throw;
            }
        }

        var doctorName = await _db.DoctorProfiles
            .AsNoTracking()
            .Where(d => d.UserId == doctorUserId)
            .Select(d => d.FullName)
            .FirstOrDefaultAsync();

        return ToDto(prescription, doctorName, null);
    }

    public async Task DeleteDraftAsync(Guid doctorUserId, Guid patientUserId, Guid prescriptionId)
    {
        var hasAccess = await _consentService.HasActiveAccessAsync(patientUserId, doctorUserId);
        if (!hasAccess)
            throw new ConsentDeniedException();

        var prescription = await _db.Prescriptions
            .Include(p => p.Items)
            .FirstOrDefaultAsync(p => p.Id == prescriptionId && p.PatientUserId == patientUserId);

        if (prescription == null)
            throw new KeyNotFoundException("Prescripția nu a fost găsită.");

        if (prescription.Status != "Draft")
            throw new InvalidOperationException("Doar prescripțiile cu status Draft pot fi șterse.");

        _db.Prescriptions.Remove(prescription);
        await _db.SaveChangesAsync();
    }

    private async Task<IReadOnlyList<PrescriptionDto>> MapToDtosAsync(List<Prescription> list)
    {
        var doctorIds = list.Select(p => p.DoctorUserId).Distinct().ToList();
        var doctorNames = await _db.DoctorProfiles
            .AsNoTracking()
            .Where(d => doctorIds.Contains(d.UserId))
            .ToDictionaryAsync(d => d.UserId, d => d.FullName);

        var pharmacyUserIds = list.SelectMany(p => p.Items).Where(i => i.DispensedByPharmacyUserId.HasValue).Select(i => i.DispensedByPharmacyUserId!.Value).Distinct().ToList();
        var pharmacyNames = pharmacyUserIds.Count > 0
            ? await _db.PharmacyProfiles.AsNoTracking().Where(ph => pharmacyUserIds.Contains(ph.UserId)).ToDictionaryAsync(ph => ph.UserId, ph => ph.PharmacyName)
            : new Dictionary<Guid, string>();

        return list.Select(p => ToDto(p, doctorNames.GetValueOrDefault(p.DoctorUserId), pharmacyNames)).ToList();
    }

    private static PrescriptionDto ToDto(Prescription p, string? doctorFullName, IReadOnlyDictionary<Guid, string>? pharmacyNames)
    {
        pharmacyNames ??= new Dictionary<Guid, string>();
        return new PrescriptionDto
        {
            Id = p.Id,
            PatientUserId = p.PatientUserId,
            DoctorUserId = p.DoctorUserId,
            DoctorFullName = doctorFullName,
            DoctorInstitutionName = null,
            Diagnosis = p.Diagnosis,
            GeneralNotes = p.GeneralNotes,
            ValidUntilUtc = p.ValidUntilUtc,
            Status = p.Status,
            CreatedAtUtc = p.CreatedAtUtc,
            Items = p.Items.Select(i => new PrescriptionItemDto
            {
                Id = i.Id,
                MedicationName = i.MedicationName,
                Form = i.Form,
                Dosage = i.Dosage,
                Frequency = i.Frequency,
                DurationDays = i.DurationDays,
                Quantity = i.Quantity,
                Instructions = i.Instructions,
                Warnings = i.Warnings,
                Status = i.Status,
                DispensedAtUtc = i.DispensedAtUtc,
                DispensedByPharmacyUserId = i.DispensedByPharmacyUserId,
                DispensedByPharmacyName = i.DispensedByPharmacyUserId.HasValue && pharmacyNames.TryGetValue(i.DispensedByPharmacyUserId.Value, out var name) ? name : null
            }).ToList()
        };
    }
}
