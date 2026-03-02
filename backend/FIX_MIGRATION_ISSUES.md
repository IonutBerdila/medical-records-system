# Fix Migration and EF Mapping Issues

## Root Cause Analysis

### Issue 1: EF Relationship Mapping (Shadow FK Warning)
**Problem**: EF Core was creating a shadow property `PrescriptionId1` because the relationship configuration didn't explicitly map the navigation property.

**Root Cause**: In `AppDbContext.cs`, the PrescriptionItem relationship used:
```csharp
entity.HasOne<Prescription>()  // Generic type, no navigation property mapping
```

**Fix Applied**: Changed to explicitly map the navigation property:
```csharp
entity.HasOne(x => x.Prescription)  // Explicit navigation property mapping
```

### Issue 2: Migration Not Applied
**Problem**: Migration `20260216120000_PrescriptionMultiItem` exists but database schema is missing:
- Table `PrescriptionItems` doesn't exist
- Column `Prescription.Diagnosis` doesn't exist
- Column `Prescription.GeneralNotes` doesn't exist

**Root Cause**: Migration history table (`__EFMigrationsHistory`) may be out of sync with actual schema, or migration was never applied.

## Files Modified

1. **AppDbContext.cs** - Fixed PrescriptionItem relationship mapping
   - Changed `HasOne<Prescription>()` to `HasOne(x => x.Prescription)`

2. **Scripts Created**:
   - `scripts/check-migration-status.sql` - SQL to verify migration status
   - `scripts/apply-migration.ps1` - PowerShell script to apply migration
   - `scripts/force-apply-migration.ps1` - PowerShell script for force apply if needed

## Steps to Fix

### Step 1: Verify Current State

Connect to PostgreSQL and run:
```sql
-- Check migration history
SELECT "MigrationId", "ProductVersion" 
FROM "__EFMigrationsHistory" 
ORDER BY "MigrationId";

-- Check if PrescriptionItems table exists
SELECT to_regclass('public."PrescriptionItems"') as "PrescriptionItemsTable";

-- Check Prescriptions table columns
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'Prescriptions' 
ORDER BY ordinal_position;
```

Or use the SQL script:
```powershell
psql -h localhost -p 5432 -U medicaluser -d medicaldb -f scripts/check-migration-status.sql
```

### Step 2: Apply Migration

**Option A: Normal Apply (if migration not in history)**
```powershell
cd backend
dotnet ef database update --project src/MedicalRecords.Infrastructure --startup-project src/MedicalRecords.Api
```

**Option B: If migration exists in history but schema is missing**

1. Remove migration from history:
```sql
DELETE FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260216120000_PrescriptionMultiItem';
```

2. Then apply:
```powershell
dotnet ef database update --project src/MedicalRecords.Infrastructure --startup-project src/MedicalRecords.Api
```

**Option C: Use PowerShell script**
```powershell
cd backend
.\scripts\apply-migration.ps1
```

### Step 3: Verify Schema After Migration

After applying migration, verify:

```sql
-- Should return table name (not null)
SELECT to_regclass('public."PrescriptionItems"') as "PrescriptionItemsTable";

-- Should include Diagnosis and GeneralNotes
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'Prescriptions' 
AND column_name IN ('Diagnosis', 'GeneralNotes', 'ValidUntilUtc', 'Status');

-- Should show PrescriptionItems columns
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'PrescriptionItems';
```

### Step 4: Verify Application Works

1. Start the API:
```powershell
cd backend/src/MedicalRecords.Api
dotnet run
```

2. Test endpoints:
   - `GET /api/patients/{patientId}/prescriptions` - Should return 200 OK
   - `POST /api/patients/{patientId}/prescriptions` - Should create prescription with items

3. Check logs for:
   - No EF shadow FK warnings
   - No Postgres errors about missing tables/columns

## Expected Schema After Fix

### Prescriptions Table
- `Id` (uuid, PK)
- `PatientUserId` (uuid, FK)
- `DoctorUserId` (uuid, FK)
- `Diagnosis` (text, nullable) ✅ NEW
- `GeneralNotes` (text, nullable) ✅ NEW
- `ValidUntilUtc` (timestamp, nullable)
- `Status` (varchar(50), not null)
- `CreatedAtUtc` (timestamp, not null)
- `MedicationName` (text, nullable) - Legacy
- `Dosage` (text, nullable) - Legacy
- `Instructions` (text, nullable) - Legacy
- `DispensedAtUtc` (timestamp, nullable) - Legacy
- `DispensedByPharmacyUserId` (uuid, nullable) - Legacy

### PrescriptionItems Table ✅ NEW
- `Id` (uuid, PK)
- `PrescriptionId` (uuid, FK -> Prescriptions.Id, cascade delete)
- `MedicationName` (text, not null)
- `Form` (text, nullable)
- `Dosage` (text, nullable)
- `Frequency` (text, nullable)
- `DurationDays` (integer, nullable)
- `Quantity` (integer, nullable)
- `Instructions` (text, nullable)
- `Warnings` (text, nullable)
- `Status` (varchar(50), not null)
- `DispensedAtUtc` (timestamp, nullable)
- `DispensedByPharmacyUserId` (uuid, nullable)

### Indexes
- `IX_PrescriptionItems_PrescriptionId` on PrescriptionItems.PrescriptionId

### Foreign Keys
- `FK_PrescriptionItems_Prescriptions_PrescriptionId` (CASCADE DELETE)

## Troubleshooting

### If migration still fails:

1. **Check connection string**: Ensure `appsettings.Development.json` has correct connection string
2. **Check database exists**: `SELECT current_database();`
3. **Check user permissions**: Ensure `medicaluser` has CREATE TABLE permissions
4. **Check migration history**: Ensure no duplicate migration IDs
5. **Manual SQL**: If needed, run SQL from migration file manually

### If shadow FK warning persists:

1. Rebuild solution: `dotnet clean && dotnet build`
2. Verify AppDbContext.cs has explicit navigation property mapping
3. Check for duplicate relationship configurations

## Summary

- ✅ Fixed EF relationship mapping (no more shadow FK)
- ✅ Created migration verification scripts
- ✅ Provided step-by-step fix instructions
- ✅ Migration `20260216120000_PrescriptionMultiItem` ready to apply
