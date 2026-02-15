using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MedicalRecords.Infrastructure.Migrations
{
    /// <summary>
    /// Repair migration: ensures all MedicalRecord columns exist.
    /// Idempotent (ADD COLUMN IF NOT EXISTS) - safe when columns already exist or not.
    /// Use when entity was extended but schema is out of sync.
    /// </summary>
    [Migration("20260215150000_Repair_MedicalRecordColumns_IfMissing")]
    public partial class Repair_MedicalRecordColumns_IfMissing : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"ALTER TABLE ""MedicalRecords"" ADD COLUMN IF NOT EXISTS ""AdverseDrugReactions"" text NULL;");
            migrationBuilder.Sql(@"ALTER TABLE ""MedicalRecords"" ADD COLUMN IF NOT EXISTS ""CurrentMedications"" text NULL;");
            migrationBuilder.Sql(@"ALTER TABLE ""MedicalRecords"" ADD COLUMN IF NOT EXISTS ""MajorSurgeriesHospitalizations"" text NULL;");
            migrationBuilder.Sql(@"ALTER TABLE ""MedicalRecords"" ADD COLUMN IF NOT EXISTS ""EmergencyContactRelation"" text NULL;");
            migrationBuilder.Sql(@"ALTER TABLE ""MedicalRecords"" ADD COLUMN IF NOT EXISTS ""EmergencyContactsJson"" text NULL;");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // Leave empty for repair migrations to avoid data loss.
        }
    }
}
