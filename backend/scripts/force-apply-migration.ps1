# PowerShell script to force apply migration if migration history is out of sync
# Run from backend directory: .\scripts\force-apply-migration.ps1

Write-Host "Force applying migration..." -ForegroundColor Cyan

# First, check if migration history has the migration
Write-Host "`nStep 1: Checking migration history..." -ForegroundColor Yellow
Write-Host "Run this SQL to check:" -ForegroundColor Yellow
Write-Host "SELECT * FROM `"__EFMigrationsHistory`" ORDER BY `"MigrationId`";" -ForegroundColor Cyan

$response = Read-Host "`nDoes the migration '20260216120000_PrescriptionMultiItem' exist in the history? (y/n)"
if ($response -eq 'y') {
    Write-Host "`nMigration exists in history but schema is missing." -ForegroundColor Yellow
    Write-Host "This means the migration was recorded but not applied." -ForegroundColor Yellow
    Write-Host "`nOption 1: Remove migration from history and reapply" -ForegroundColor Cyan
    Write-Host "Option 2: Manually apply SQL from migration" -ForegroundColor Cyan
    
    $choice = Read-Host "`nChoose option (1 or 2)"
    
    if ($choice -eq '1') {
        Write-Host "`nRemoving migration from history..." -ForegroundColor Yellow
        Write-Host "Run this SQL:" -ForegroundColor Yellow
        Write-Host "DELETE FROM `"__EFMigrationsHistory`" WHERE `"MigrationId`" = '20260216120000_PrescriptionMultiItem';" -ForegroundColor Cyan
        Write-Host "`nThen run: dotnet ef database update" -ForegroundColor Yellow
    } else {
        Write-Host "`nManually applying SQL from migration..." -ForegroundColor Yellow
        Write-Host "See migration file: src\MedicalRecords.Infrastructure\Migrations\20260216120000_PrescriptionMultiItem.cs" -ForegroundColor Cyan
    }
} else {
    Write-Host "`nMigration not in history. Applying normally..." -ForegroundColor Green
    dotnet ef database update --project src/MedicalRecords.Infrastructure --startup-project src/MedicalRecords.Api
}
