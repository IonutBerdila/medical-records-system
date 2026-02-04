# Medical Records Backend

Un proiect ASP.NET Core 8 + EF Core + PostgreSQL pentru sistemul de fișe medicale.

## Ce am nevoie instalat

- .NET 8 SDK
- Docker (pentru PostgreSQL)
- Unelte EF Core:

```bash
dotnet tool install --global dotnet-ef
```

## Cum pornesc backend‑ul de la zero

1. **Porneșc baza de date în Docker**

```bash
cd ..\infra
docker compose up -d
```

2. **Reinstalez pachetele și compil proiectul**

```bash
cd ..\backend
dotnet restore
dotnet build
```

3. **Creez migrarea inițială (Identity)** – doar prima dată

```bash
dotnet ef migrations add InitialIdentity ^
  --project src/MedicalRecords.Infrastructure ^
  --startup-project src/MedicalRecords.Api
```

4. **Aplic migrarea inițială în baza de date**

```bash
dotnet ef database update ^
  --project src/MedicalRecords.Infrastructure ^
  --startup-project src/MedicalRecords.Api
```

5. **Adaug migrarea pentru profiluri (Phase 2)** – după ce termin faza 2

```bash
dotnet ef migrations add AddProfiles ^
  --project src/MedicalRecords.Infrastructure ^
  --startup-project src/MedicalRecords.Api

dotnet ef database update ^
  --project src/MedicalRecords.Infrastructure ^
  --startup-project src/MedicalRecords.Api
```

6. **Adaug migrarea pentru fișe medicale / rețete / consimțământ (Phase 3)**

```bash
dotnet ef migrations add Phase3_MedicalCore ^
  --project src/MedicalRecords.Infrastructure ^
  --startup-project src/MedicalRecords.Api

dotnet ef database update ^
  --project src/MedicalRecords.Infrastructure ^
  --startup-project src/MedicalRecords.Api
```

> Dacă EF îmi spune „No migrations were applied”, înseamnă că baza de date este deja la zi.

7. **Porneșc API‑ul**

```bash
cd src\MedicalRecords.Api
dotnet run
```

În consolă văd adresa la care ascultă API‑ul, de tipul `http://localhost:5119`. Această adresă o folosesc și în front‑end (`VITE_API_BASE_URL`).

8. **Deschid Swagger pentru test rapid**

Deschid în browser adresa HTTP afișată în consolă, de ex:

- `http://localhost:5119/swagger`

De aici pot testa:

- înregistrare / login (`/api/auth/...`)
- `/api/me`
- endpoint‑urile din faza 3:
  - `/api/records/me`, `/api/entries/me`, `/api/prescriptions/me`
  - `/api/consent/*`, `/api/doctor/patients`
  - `/api/patients/{patientUserId}/record|entries|prescriptions`

## Alte note

- Structura proiectului:

  ```text
  backend/
    MedicalRecords.sln
    src/
      MedicalRecords.Api/
      MedicalRecords.Application/
      MedicalRecords.Domain/
      MedicalRecords.Infrastructure/
  ```

- Conexiunea la baza de date și setările pentru JWT le editez în  
  `src/MedicalRecords.Api/appsettings.Development.json`.

