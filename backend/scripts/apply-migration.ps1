# PowerShell script to apply migration
# Run from backend directory: .\scripts\apply-migration.ps1

Write-Host "Checking migration status..." -ForegroundColor Cyan

# Check if migration exists in code
$migrationFile = "src\MedicalRecords.Infrastructure\Migrations\20260216120000_PrescriptionMultiItem.cs"
if (-not (Test-Path $migrationFile)) {
    Write-Host "ERROR: Migration file not found: $migrationFile" -ForegroundColor Red
    exit 1
}

Write-Host "Migration file found: $migrationFile" -ForegroundColor Green

# Check connection string
Write-Host "`nConnection string from appsettings.Development.json:" -ForegroundColor Cyan
$appsettings = Get-Content "src\MedicalRecords.Api\appsettings.Development.json" | ConvertFrom-Json
Write-Host $appsettings.ConnectionStrings.DefaultConnection -ForegroundColor Yellow

# Apply migration
Write-Host "`nApplying migration..." -ForegroundColor Cyan
dotnet ef database update --project src/MedicalRecords.Infrastructure --startup-project src/MedicalRecords.Api

if ($LASTEXITCODE -eq 0) {
    Write-Host "`nMigration applied successfully!" -ForegroundColor Green
} else {
    Write-Host "`nMigration failed. Check errors above." -ForegroundColor Red
    exit 1
}

# Verify schema
Write-Host "`nVerifying schema..." -ForegroundColor Cyan
Write-Host "Run the SQL script check-migration-status.sql to verify the schema." -ForegroundColor Yellow
