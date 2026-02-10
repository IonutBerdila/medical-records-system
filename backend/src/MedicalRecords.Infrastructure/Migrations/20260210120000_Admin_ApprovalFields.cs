using MedicalRecords.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using System;

#nullable disable

namespace MedicalRecords.Infrastructure.Migrations
{
    /// <inheritdoc />
    [DbContext(typeof(AppDbContext))]
    [Migration("20260210120000_Admin_ApprovalFields")]
    public partial class Admin_ApprovalFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "ApprovalStatus",
                table: "DoctorProfiles",
                type: "character varying(50)",
                maxLength: 50,
                nullable: false,
                defaultValue: "Pending");

            migrationBuilder.AddColumn<DateTime>(
                name: "ApprovedAtUtc",
                table: "DoctorProfiles",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "ApprovedByAdminUserId",
                table: "DoctorProfiles",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "RejectedAtUtc",
                table: "DoctorProfiles",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "RejectionReason",
                table: "DoctorProfiles",
                type: "character varying(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ApprovalStatus",
                table: "PharmacyProfiles",
                type: "character varying(50)",
                maxLength: 50,
                nullable: false,
                defaultValue: "Pending");

            migrationBuilder.AddColumn<DateTime>(
                name: "ApprovedAtUtc",
                table: "PharmacyProfiles",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "ApprovedByAdminUserId",
                table: "PharmacyProfiles",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "RejectedAtUtc",
                table: "PharmacyProfiles",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "RejectionReason",
                table: "PharmacyProfiles",
                type: "character varying(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_DoctorProfiles_ApprovalStatus",
                table: "DoctorProfiles",
                column: "ApprovalStatus");

            migrationBuilder.CreateIndex(
                name: "IX_PharmacyProfiles_ApprovalStatus",
                table: "PharmacyProfiles",
                column: "ApprovalStatus");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_DoctorProfiles_ApprovalStatus",
                table: "DoctorProfiles");

            migrationBuilder.DropIndex(
                name: "IX_PharmacyProfiles_ApprovalStatus",
                table: "PharmacyProfiles");

            migrationBuilder.DropColumn(
                name: "ApprovalStatus",
                table: "DoctorProfiles");

            migrationBuilder.DropColumn(
                name: "ApprovedAtUtc",
                table: "DoctorProfiles");

            migrationBuilder.DropColumn(
                name: "ApprovedByAdminUserId",
                table: "DoctorProfiles");

            migrationBuilder.DropColumn(
                name: "RejectedAtUtc",
                table: "DoctorProfiles");

            migrationBuilder.DropColumn(
                name: "RejectionReason",
                table: "DoctorProfiles");

            migrationBuilder.DropColumn(
                name: "ApprovalStatus",
                table: "PharmacyProfiles");

            migrationBuilder.DropColumn(
                name: "ApprovedAtUtc",
                table: "PharmacyProfiles");

            migrationBuilder.DropColumn(
                name: "ApprovedByAdminUserId",
                table: "PharmacyProfiles");

            migrationBuilder.DropColumn(
                name: "RejectedAtUtc",
                table: "PharmacyProfiles");

            migrationBuilder.DropColumn(
                name: "RejectionReason",
                table: "PharmacyProfiles");
        }
    }
}
