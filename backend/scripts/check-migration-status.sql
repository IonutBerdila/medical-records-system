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

-- Check PrescriptionItems table columns (if exists)
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'PrescriptionItems' 
ORDER BY ordinal_position;
