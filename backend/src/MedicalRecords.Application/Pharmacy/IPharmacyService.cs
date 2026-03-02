using MedicalRecords.Application.ShareToken;

namespace MedicalRecords.Application.Pharmacy;

public interface IPharmacyService
{
    /// <summary>
    /// Marchează itemurile selectate ca eliberate. Returnează lista actualizată de prescripții (doar cele care mai au itemuri în așteptare).
    /// </summary>
    Task<IReadOnlyList<PharmacyPrescriptionDto>> DispensePrescriptionItemsAsync(Guid pharmacyUserId, Guid verificationId, IReadOnlyList<Guid> prescriptionItemIds);
}

