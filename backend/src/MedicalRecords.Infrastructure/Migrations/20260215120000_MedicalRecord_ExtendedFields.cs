using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MedicalRecords.Infrastructure.Migrations
{
    /// <inheritdoc />
    [Migration("20260215120000_MedicalRecord_ExtendedFields")]
    public partial class MedicalRecord_ExtendedFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"ALTER TABLE ""MedicalRecords"" ADD COLUMN IF NOT EXISTS ""AdverseDrugReactions"" text NULL;");
            migrationBuilder.Sql(@"ALTER TABLE ""MedicalRecords"" ADD COLUMN IF NOT EXISTS ""CurrentMedications"" text NULL;");
            migrationBuilder.Sql(@"ALTER TABLE ""MedicalRecords"" ADD COLUMN IF NOT EXISTS ""MajorSurgeriesHospitalizations"" text NULL;");
            migrationBuilder.Sql(@"ALTER TABLE ""MedicalRecords"" ADD COLUMN IF NOT EXISTS ""EmergencyContactRelation"" text NULL;");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"ALTER TABLE ""MedicalRecords"" DROP COLUMN IF EXISTS ""AdverseDrugReactions"";");
            migrationBuilder.Sql(@"ALTER TABLE ""MedicalRecords"" DROP COLUMN IF EXISTS ""CurrentMedications"";");
            migrationBuilder.Sql(@"ALTER TABLE ""MedicalRecords"" DROP COLUMN IF EXISTS ""MajorSurgeriesHospitalizations"";");
            migrationBuilder.Sql(@"ALTER TABLE ""MedicalRecords"" DROP COLUMN IF EXISTS ""EmergencyContactRelation"";");
        }
    }
}
