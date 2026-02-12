using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MedicalRecords.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class Fix_Missing_DateOfBirth_Columns : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Repară drift-ul de schemă: ne asigurăm că DateOfBirth există pe toate profilele,
            // chiar dacă snapshot-ul a fost actualizat manual înainte.

            migrationBuilder.AddColumn<DateTime>(
                name: "DateOfBirth",
                table: "DoctorProfiles",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "DateOfBirth",
                table: "PatientProfiles",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "DateOfBirth",
                table: "PharmacyProfiles",
                type: "timestamp with time zone",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "DateOfBirth",
                table: "DoctorProfiles");

            migrationBuilder.DropColumn(
                name: "DateOfBirth",
                table: "PatientProfiles");

            migrationBuilder.DropColumn(
                name: "DateOfBirth",
                table: "PharmacyProfiles");
        }
    }
}
