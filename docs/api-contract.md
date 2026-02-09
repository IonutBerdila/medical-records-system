# API Contract

## Auth

## Patient

## Doctor

## Pharmacy (QR access & token)

- **POST `/api/consent/share-token`** (Patient, auth + rol `Patient`)
  - Generează un token temporar (10 caractere, alfabet `ABCDEFGHJKMNPQRSTUVWXYZ23456789`) pentru acces farmacie.
  - Body: `{ scope?: string, expiresInMinutes?: number (1–60), prescriptionId?: Guid }`
  - Response: `{ token: string, expiresAtUtc: string, scope: string }` — tokenul se afișează o singură dată.

- **POST `/api/pharmacy/verify-v2`** (Pharmacy, auth + rol `Pharmacy`)
  - Verifică un ShareToken (one-time) și creează o sesiune temporară de verificare.
  - Body: `{ token: string }` (case-insensitive, exact 10 caractere din alfabetul de mai sus).
  - Response:
    ```jsonc
    {
      "verificationId": "guid",
      "prescriptions": [
        {
          "id": "guid",
          "medicationName": "string",
          "dosage": "string?",
          "instructions": "string?",
          "createdAtUtc": "string",
          "doctorName": "string?",
          "status": "Active|Dispensed|...",
          "dispensedAtUtc": "string?"
        }
      ]
    }
    ```
  - Comportament:
    - Consumă tokenul (one-time).
    - Creează `PharmacyVerificationSession` cu valabilitate scurtă (ex. 5 minute).
    - Rate limiting: fixed window 10 req/min per user/IP → răspunde cu **429 TooManyRequests** la depășire.

- **POST `/api/pharmacy/dispense`** (Pharmacy, auth + rol `Pharmacy`)
  - Marchează o prescripție ca eliberată în contextul unei sesiuni valide.
  - Body: `{ verificationId: Guid, prescriptionId: Guid }`
  - Response: `PharmacyPrescriptionDto` actualizat (status + dispensedAtUtc).
  - Reguli:
    - Sesiunea trebuie să existe, să nu fie expirată și să aparțină utilizatorului curent.
    - Prescripția trebuie să aparțină pacientului din sesiune.
    - Dacă sesiunea este limitată la o singură prescripție, doar acea prescripție poate fi eliberată.
    - A doua eliberare pentru aceeași prescripție → **409 Conflict**.

## Audit- Sistemul înregistrează evenimente în `AuditEvents`:
  - `SHARE_TOKEN_CREATED` (actor = Patient, entity = ShareToken)
  - `SHARE_TOKEN_VERIFIED` (actor = Pharmacy, entity = ShareToken)
  - `PRESCRIPTION_DISPENSED` (actor = Pharmacy, entity = Prescription)
