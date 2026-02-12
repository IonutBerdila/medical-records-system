using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MedicalRecords.Infrastructure.Migrations
{
    /// <inheritdoc />
    [Migration("20260211140000_Register_ExtendedProfileFields")]
    public partial class Register_ExtendedProfileFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // PatientProfiles
            migrationBuilder.AddColumn<string>(
                name: "FirstName",
                table: "PatientProfiles",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "LastName",
                table: "PatientProfiles",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "DateOfBirth",
                table: "PatientProfiles",
                type: "timestamp with time zone",
                nullable: true);

            // DoctorProfiles
            migrationBuilder.AddColumn<string>(
                name: "FirstName",
                table: "DoctorProfiles",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "LastName",
                table: "DoctorProfiles",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "DateOfBirth",
                table: "DoctorProfiles",
                type: "timestamp with time zone",
                nullable: true);

            // PharmacyProfiles
            migrationBuilder.AddColumn<string>(
                name: "FirstName",
                table: "PharmacyProfiles",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "LastName",
                table: "PharmacyProfiles",
                type: "text",
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
                name: "FirstName",
                table: "PatientProfiles");

            migrationBuilder.DropColumn(
                name: "LastName",
                table: "PatientProfiles");

            migrationBuilder.DropColumn(
                name: "DateOfBirth",
                table: "PatientProfiles");

            migrationBuilder.DropColumn(
                name: "FirstName",
                table: "DoctorProfiles");

            migrationBuilder.DropColumn(
                name: "LastName",
                table: "DoctorProfiles");

            migrationBuilder.DropColumn(
                name: "DateOfBirth",
                table: "DoctorProfiles");

            migrationBuilder.DropColumn(
                name: "FirstName",
                table: "PharmacyProfiles");

            migrationBuilder.DropColumn(
                name: "LastName",
                table: "PharmacyProfiles");

            migrationBuilder.DropColumn(
                name: "DateOfBirth",
                table: "PharmacyProfiles");
        }
    }
}

