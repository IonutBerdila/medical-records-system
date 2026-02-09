using MedicalRecords.Application.ShareToken;

namespace MedicalRecords.Application.Pharmacy;

public interface IPharmacyService
{
    /// <summary>
    /// Marchează o prescripție ca eliberată (dispensed) în contextul unei sesiuni de verificare valide.
    /// </summary>
    Task<PharmacyPrescriptionDto> DispensePrescriptionAsync(Guid pharmacyUserId, Guid verificationId, Guid prescriptionId);
}

