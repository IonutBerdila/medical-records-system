using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MedicalRecords.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class Phase5_AuditEvents : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "DispensedAtUtc",
                table: "Prescriptions",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "DispensedByPharmacyUserId",
                table: "Prescriptions",
                type: "uuid",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "AuditEvents",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    TimestampUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    Action = table.Column<string>(type: "text", nullable: false),
                    ActorUserId = table.Column<Guid>(type: "uuid", nullable: false),
                    ActorRole = table.Column<string>(type: "text", nullable: true),
                    PatientUserId = table.Column<Guid>(type: "uuid", nullable: true),
                    EntityType = table.Column<string>(type: "text", nullable: true),
                    EntityId = table.Column<Guid>(type: "uuid", nullable: true),
                    MetadataJson = table.Column<string>(type: "text", nullable: true),
                    IpAddress = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AuditEvents", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "PharmacyVerificationSessions",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    ShareTokenId = table.Column<Guid>(type: "uuid", nullable: false),
                    PharmacyUserId = table.Column<Guid>(type: "uuid", nullable: false),
                    PatientUserId = table.Column<Guid>(type: "uuid", nullable: false),
                    CreatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    ExpiresAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    AllowedPrescriptionId = table.Column<Guid>(type: "uuid", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PharmacyVerificationSessions", x => x.Id);
                    table.ForeignKey(
                        name: "FK_PharmacyVerificationSessions_AspNetUsers_PatientUserId",
                        column: x => x.PatientUserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_PharmacyVerificationSessions_AspNetUsers_PharmacyUserId",
                        column: x => x.PharmacyUserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_PharmacyVerificationSessions_ShareTokens_ShareTokenId",
                        column: x => x.ShareTokenId,
                        principalTable: "ShareTokens",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_AuditEvents_Action_TimestampUtc",
                table: "AuditEvents",
                columns: new[] { "Action", "TimestampUtc" });

            migrationBuilder.CreateIndex(
                name: "IX_AuditEvents_ActorUserId_TimestampUtc",
                table: "AuditEvents",
                columns: new[] { "ActorUserId", "TimestampUtc" });

            migrationBuilder.CreateIndex(
                name: "IX_AuditEvents_PatientUserId_TimestampUtc",
                table: "AuditEvents",
                columns: new[] { "PatientUserId", "TimestampUtc" });

            migrationBuilder.CreateIndex(
                name: "IX_PharmacyVerificationSessions_PatientUserId",
                table: "PharmacyVerificationSessions",
                column: "PatientUserId");

            migrationBuilder.CreateIndex(
                name: "IX_PharmacyVerificationSessions_PharmacyUserId",
                table: "PharmacyVerificationSessions",
                column: "PharmacyUserId");

            migrationBuilder.CreateIndex(
                name: "IX_PharmacyVerificationSessions_ShareTokenId",
                table: "PharmacyVerificationSessions",
                column: "ShareTokenId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "AuditEvents");

            migrationBuilder.DropTable(
                name: "PharmacyVerificationSessions");

            migrationBuilder.DropColumn(
                name: "DispensedAtUtc",
                table: "Prescriptions");

            migrationBuilder.DropColumn(
                name: "DispensedByPharmacyUserId",
                table: "Prescriptions");
        }
    }
}
