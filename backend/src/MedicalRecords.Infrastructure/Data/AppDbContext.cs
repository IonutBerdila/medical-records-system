using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using MedicalRecords.Domain.Entities;

namespace MedicalRecords.Infrastructure.Data;

public class AppDbContext : IdentityDbContext<ApplicationUser, IdentityRole<Guid>, Guid>
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
    {
    }

    public DbSet<PatientProfile> PatientProfiles => Set<PatientProfile>();

    public DbSet<DoctorProfile> DoctorProfiles => Set<DoctorProfile>();

    public DbSet<PharmacyProfile> PharmacyProfiles => Set<PharmacyProfile>();

    public DbSet<MedicalRecord> MedicalRecords => Set<MedicalRecord>();
    public DbSet<MedicalEntry> MedicalEntries => Set<MedicalEntry>();
    public DbSet<Prescription> Prescriptions => Set<Prescription>();
    public DbSet<PatientDoctorAccess> PatientDoctorAccesses => Set<PatientDoctorAccess>();
    public DbSet<Domain.Entities.ShareToken> ShareTokens => Set<Domain.Entities.ShareToken>();
    public DbSet<PharmacyVerificationSession> PharmacyVerificationSessions => Set<PharmacyVerificationSession>();
    public DbSet<AuditEvent> AuditEvents => Set<AuditEvent>();

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);

        // Configurare profil pacient
        builder.Entity<PatientProfile>(entity =>
        {
            entity.HasKey(x => x.Id);

            entity.HasIndex(x => x.UserId)
                .IsUnique();

            entity.HasOne<ApplicationUser>()
                .WithMany()
                .HasForeignKey(x => x.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // Configurare profil doctor
        builder.Entity<DoctorProfile>(entity =>
        {
            entity.HasKey(x => x.Id);

            entity.HasIndex(x => x.UserId)
                .IsUnique();

            entity.HasIndex(x => x.ApprovalStatus);

            entity.Property(x => x.ApprovalStatus)
                .HasMaxLength(50)
                .IsRequired();

            entity.Property(x => x.RejectionReason)
                .HasMaxLength(500);

            entity.HasOne<ApplicationUser>()
                .WithMany()
                .HasForeignKey(x => x.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // Configurare profil farmacie
        builder.Entity<PharmacyProfile>(entity =>
        {
            entity.HasKey(x => x.Id);

            entity.HasIndex(x => x.UserId)
                .IsUnique();

            entity.HasIndex(x => x.ApprovalStatus);

            entity.Property(x => x.ApprovalStatus)
                .HasMaxLength(50)
                .IsRequired();

            entity.Property(x => x.RejectionReason)
                .HasMaxLength(500);

            entity.HasOne<ApplicationUser>()
                .WithMany()
                .HasForeignKey(x => x.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // Phase 3: MedicalRecord — un record per pacient
        builder.Entity<MedicalRecord>(entity =>
        {
            entity.HasKey(x => x.Id);
            entity.HasIndex(x => x.PatientUserId).IsUnique();
            entity.HasOne<ApplicationUser>()
                .WithMany()
                .HasForeignKey(x => x.PatientUserId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // MedicalEntry — intrări pe record; ștergere record șterge intrările
        builder.Entity<MedicalEntry>(entity =>
        {
            entity.HasKey(x => x.Id);
            entity.HasOne<MedicalRecord>()
                .WithMany()
                .HasForeignKey(x => x.RecordId)
                .OnDelete(DeleteBehavior.Cascade);
            entity.HasOne<ApplicationUser>()
                .WithMany()
                .HasForeignKey(x => x.CreatedByUserId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // Prescription
        builder.Entity<Prescription>(entity =>
        {
            entity.HasKey(x => x.Id);
            entity.HasIndex(x => x.PatientUserId);
            entity.HasIndex(x => x.DoctorUserId);
            entity.HasOne<ApplicationUser>()
                .WithMany()
                .HasForeignKey(x => x.PatientUserId)
                .OnDelete(DeleteBehavior.Restrict);
            entity.HasOne<ApplicationUser>()
                .WithMany()
                .HasForeignKey(x => x.DoctorUserId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // PatientDoctorAccess (consent)
        builder.Entity<PatientDoctorAccess>(entity =>
        {
            entity.HasKey(x => x.Id);
            entity.HasIndex(x => new { x.PatientUserId, x.DoctorUserId });
            entity.HasOne<ApplicationUser>()
                .WithMany()
                .HasForeignKey(x => x.PatientUserId)
                .OnDelete(DeleteBehavior.Restrict);
            entity.HasOne<ApplicationUser>()
                .WithMany()
                .HasForeignKey(x => x.DoctorUserId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // ShareToken — token temporar pentru farmacie (hash stocat, nu tokenul în clar)
        builder.Entity<Domain.Entities.ShareToken>(entity =>
        {
            entity.HasKey(x => x.Id);
            entity.HasIndex(x => x.TokenHash);
            entity.HasIndex(x => x.PatientUserId);
            entity.HasOne<ApplicationUser>()
                .WithMany()
                .HasForeignKey(x => x.PatientUserId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // PharmacyVerificationSession
        builder.Entity<PharmacyVerificationSession>(entity =>
        {
            entity.HasKey(x => x.Id);
            entity.HasIndex(x => x.ShareTokenId);
            entity.HasIndex(x => x.PharmacyUserId);
            entity.HasIndex(x => x.PatientUserId);
            entity.Property(x => x.ExpiresAtUtc);
            entity.HasOne<Domain.Entities.ShareToken>()
                .WithMany()
                .HasForeignKey(x => x.ShareTokenId)
                .OnDelete(DeleteBehavior.Cascade);
            entity.HasOne<ApplicationUser>()
                .WithMany()
                .HasForeignKey(x => x.PharmacyUserId)
                .OnDelete(DeleteBehavior.Restrict);
            entity.HasOne<ApplicationUser>()
                .WithMany()
                .HasForeignKey(x => x.PatientUserId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // AuditEvent
        builder.Entity<AuditEvent>(entity =>
        {
            entity.HasKey(x => x.Id);
            entity.HasIndex(x => new { x.PatientUserId, x.TimestampUtc });
            entity.HasIndex(x => new { x.ActorUserId, x.TimestampUtc });
            entity.HasIndex(x => new { x.Action, x.TimestampUtc });
        });
    }
}
