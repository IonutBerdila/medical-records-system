using Microsoft.EntityFrameworkCore.Migrations;

namespace MedicalRecords.Infrastructure.Migrations;

/// <summary>
/// Fix migration to ensure AuditEvents and PharmacyVerificationSessions tables exist.
/// Uses PostgreSQL-specific CREATE TABLE IF NOT EXISTS to avoid conflicts.
/// </summary>
[Migration("20260206130000_Phase5_AuditFix")]
public partial class Phase5_AuditFix : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        // AuditEvents
        migrationBuilder.Sql(
            """
            CREATE TABLE IF NOT EXISTS "AuditEvents" (
                "Id" uuid NOT NULL PRIMARY KEY,
                "TimestampUtc" timestamp with time zone NOT NULL,
                "Action" text NOT NULL,
                "ActorUserId" uuid NOT NULL,
                "ActorRole" text NULL,
                "PatientUserId" uuid NULL,
                "EntityType" text NULL,
                "EntityId" uuid NULL,
                "MetadataJson" text NULL,
                "IpAddress" text NULL
            );
            """);

        migrationBuilder.Sql(
            """
            CREATE INDEX IF NOT EXISTS "IX_AuditEvents_PatientUserId_TimestampUtc"
            ON "AuditEvents" ("PatientUserId", "TimestampUtc");
            """);

        migrationBuilder.Sql(
            """
            CREATE INDEX IF NOT EXISTS "IX_AuditEvents_ActorUserId_TimestampUtc"
            ON "AuditEvents" ("ActorUserId", "TimestampUtc");
            """);

        migrationBuilder.Sql(
            """
            CREATE INDEX IF NOT EXISTS "IX_AuditEvents_Action_TimestampUtc"
            ON "AuditEvents" ("Action", "TimestampUtc");
            """);

        // PharmacyVerificationSessions
        migrationBuilder.Sql(
            """
            CREATE TABLE IF NOT EXISTS "PharmacyVerificationSessions" (
                "Id" uuid NOT NULL PRIMARY KEY,
                "ShareTokenId" uuid NOT NULL,
                "PharmacyUserId" uuid NOT NULL,
                "PatientUserId" uuid NOT NULL,
                "CreatedAtUtc" timestamp with time zone NOT NULL,
                "ExpiresAtUtc" timestamp with time zone NOT NULL,
                "AllowedPrescriptionId" uuid NULL,
                CONSTRAINT "FK_PharmacyVerificationSessions_ShareTokens_ShareTokenId"
                    FOREIGN KEY ("ShareTokenId") REFERENCES "ShareTokens" ("Id") ON DELETE CASCADE,
                CONSTRAINT "FK_PharmacyVerificationSessions_AspNetUsers_PharmacyUserId"
                    FOREIGN KEY ("PharmacyUserId") REFERENCES "AspNetUsers" ("Id") ON DELETE RESTRICT,
                CONSTRAINT "FK_PharmacyVerificationSessions_AspNetUsers_PatientUserId"
                    FOREIGN KEY ("PatientUserId") REFERENCES "AspNetUsers" ("Id") ON DELETE RESTRICT
            );
            """);

        migrationBuilder.Sql(
            """
            CREATE INDEX IF NOT EXISTS "IX_PharmacyVerificationSessions_ShareTokenId"
            ON "PharmacyVerificationSessions" ("ShareTokenId");
            """);

        migrationBuilder.Sql(
            """
            CREATE INDEX IF NOT EXISTS "IX_PharmacyVerificationSessions_PharmacyUserId"
            ON "PharmacyVerificationSessions" ("PharmacyUserId");
            """);

        migrationBuilder.Sql(
            """
            CREATE INDEX IF NOT EXISTS "IX_PharmacyVerificationSessions_PatientUserId"
            ON "PharmacyVerificationSessions" ("PatientUserId");
            """);
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.Sql("""DROP TABLE IF EXISTS "PharmacyVerificationSessions";""");
        migrationBuilder.Sql("""DROP TABLE IF EXISTS "AuditEvents";""");
    }
}

