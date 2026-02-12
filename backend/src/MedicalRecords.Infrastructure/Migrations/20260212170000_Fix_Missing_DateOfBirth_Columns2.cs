using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MedicalRecords.Infrastructure.Migrations
{
    /// <inheritdoc />
    [Migration("20260212170000_Fix_Missing_DateOfBirth_Columns2")]
    public partial class Fix_Missing_DateOfBirth_Columns2 : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Repara definitiv drift-ul de schemă pentru baza de date existentă:
            // adaugă coloana DateOfBirth pe toate tabelele de profil,
            // chiar dacă o migrație anterioară cu același nume logic a fost aplicată cu Up gol.

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

