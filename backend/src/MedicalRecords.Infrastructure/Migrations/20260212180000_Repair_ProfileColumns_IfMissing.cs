using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MedicalRecords.Infrastructure.Migrations
{
    /// <inheritdoc />
    [Migration("20260212180000_Repair_ProfileColumns_IfMissing")]
    public partial class Repair_ProfileColumns_IfMissing : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Repair migration: ensures DateOfBirth, FirstName, LastName columns exist on all profile tables.
            // Uses raw SQL with IF NOT EXISTS to be idempotent: safe on fresh DBs and existing DBs
            // where columns might have been added manually or via previous migrations.

            // Add DateOfBirth columns
            migrationBuilder.Sql(@"ALTER TABLE ""DoctorProfiles""   ADD COLUMN IF NOT EXISTS ""DateOfBirth"" timestamp with time zone NULL;");
            migrationBuilder.Sql(@"ALTER TABLE ""PatientProfiles""  ADD COLUMN IF NOT EXISTS ""DateOfBirth"" timestamp with time zone NULL;");
            migrationBuilder.Sql(@"ALTER TABLE ""PharmacyProfiles"" ADD COLUMN IF NOT EXISTS ""DateOfBirth"" timestamp with time zone NULL;");

            // Add FirstName columns
            migrationBuilder.Sql(@"ALTER TABLE ""DoctorProfiles""   ADD COLUMN IF NOT EXISTS ""FirstName"" text NULL;");
            migrationBuilder.Sql(@"ALTER TABLE ""PatientProfiles""  ADD COLUMN IF NOT EXISTS ""FirstName"" text NULL;");
            migrationBuilder.Sql(@"ALTER TABLE ""PharmacyProfiles"" ADD COLUMN IF NOT EXISTS ""FirstName"" text NULL;");

            // Add LastName columns
            migrationBuilder.Sql(@"ALTER TABLE ""DoctorProfiles""   ADD COLUMN IF NOT EXISTS ""LastName"" text NULL;");
            migrationBuilder.Sql(@"ALTER TABLE ""PatientProfiles""  ADD COLUMN IF NOT EXISTS ""LastName"" text NULL;");
            migrationBuilder.Sql(@"ALTER TABLE ""PharmacyProfiles"" ADD COLUMN IF NOT EXISTS ""LastName"" text NULL;");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // Leave Down() empty for repair migrations to avoid data loss.
            // If columns need to be removed, do it manually or via a separate migration
            // after verifying no critical data depends on them.
        }
    }
}
