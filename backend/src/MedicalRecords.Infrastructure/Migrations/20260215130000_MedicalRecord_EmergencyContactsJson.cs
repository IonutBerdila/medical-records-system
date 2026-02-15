using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MedicalRecords.Infrastructure.Migrations
{
    [Migration("20260215130000_MedicalRecord_EmergencyContactsJson")]
    public partial class MedicalRecord_EmergencyContactsJson : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"ALTER TABLE ""MedicalRecords"" ADD COLUMN IF NOT EXISTS ""EmergencyContactsJson"" text NULL;");
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"ALTER TABLE ""MedicalRecords"" DROP COLUMN IF EXISTS ""EmergencyContactsJson"";");
        }
    }
}
