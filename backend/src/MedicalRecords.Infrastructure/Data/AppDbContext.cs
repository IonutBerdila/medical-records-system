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

    public DbSet<Specialty> Specialties => Set<Specialty>();

    public DbSet<DoctorSpecialty> DoctorSpecialties => Set<DoctorSpecialty>();

    public DbSet<MedicalInstitution> MedicalInstitutions => Set<MedicalInstitution>();

    public DbSet<DoctorInstitution> DoctorInstitutions => Set<DoctorInstitution>();

    public DbSet<MedicalRecord> MedicalRecords => Set<MedicalRecord>();
    public DbSet<MedicalEntry> MedicalEntries => Set<MedicalEntry>();
    public DbSet<Prescription> Prescriptions => Set<Prescription>();
    public DbSet<PrescriptionItem> PrescriptionItems => Set<PrescriptionItem>();
    public DbSet<PatientDoctorAccess> PatientDoctorAccesses => Set<PatientDoctorAccess>();
    public DbSet<Domain.Entities.ShareToken> ShareTokens => Set<Domain.Entities.ShareToken>();
    public DbSet<PharmacyVerificationSession> PharmacyVerificationSessions => Set<PharmacyVerificationSession>();
    public DbSet<AuditEvent> AuditEvents => Set<AuditEvent>();

    public DbSet<DoctorAvailabilityRule> DoctorAvailabilityRules => Set<DoctorAvailabilityRule>();

    public DbSet<Appointment> Appointments => Set<Appointment>();

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

            entity.Property(x => x.ConsultationDurationMinutes)
                .HasDefaultValue(30);

            entity.HasIndex(x => x.LicenseNumber)
                .IsUnique(false);

            entity.HasOne<ApplicationUser>()
                .WithMany()
                .HasForeignKey(x => x.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // Specialties
        builder.Entity<Specialty>(entity =>
        {
            entity.HasKey(x => x.Id);
            entity.Property(x => x.Name)
                .IsRequired()
                .HasMaxLength(200);
            entity.HasIndex(x => x.Name)
                .IsUnique();
        });

        // DoctorSpecialty (many-to-many)
        builder.Entity<DoctorSpecialty>(entity =>
        {
            entity.HasKey(x => new { x.DoctorProfileId, x.SpecialtyId });

            entity.HasOne<DoctorProfile>()
                .WithMany()
                .HasForeignKey(x => x.DoctorProfileId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne<Specialty>()
                .WithMany()
                .HasForeignKey(x => x.SpecialtyId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // MedicalInstitution
        builder.Entity<MedicalInstitution>(entity =>
        {
            entity.HasKey(x => x.Id);
            entity.Property(x => x.Name)
                .IsRequired()
                .HasMaxLength(256);
            entity.Property(x => x.City)
                .HasMaxLength(128);

            entity.HasIndex(x => new { x.Name, x.City });
        });

        // DoctorInstitution
        builder.Entity<DoctorInstitution>(entity =>
        {
            entity.HasKey(x => x.Id);

            entity.HasOne<DoctorProfile>()
                .WithMany()
                .HasForeignKey(x => x.DoctorProfileId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne<MedicalInstitution>()
                .WithMany()
                .HasForeignKey(x => x.MedicalInstitutionId)
                .OnDelete(DeleteBehavior.Restrict);
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
            entity.Property(x => x.Status).HasMaxLength(50);
            entity.HasOne<ApplicationUser>()
                .WithMany()
                .HasForeignKey(x => x.PatientUserId)
                .OnDelete(DeleteBehavior.Restrict);
            entity.HasOne<ApplicationUser>()
                .WithMany()
                .HasForeignKey(x => x.DoctorUserId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // PrescriptionItem — cascade delete when prescription is deleted
        builder.Entity<PrescriptionItem>(entity =>
        {
            entity.HasKey(x => x.Id);
            entity.HasIndex(x => x.PrescriptionId);
            entity.Property(x => x.Status).HasMaxLength(50);
            entity.HasOne(x => x.Prescription)
                .WithMany(x => x.Items)
                .HasForeignKey(x => x.PrescriptionId)
                .OnDelete(DeleteBehavior.Cascade);
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

        // DoctorAvailabilityRule
        builder.Entity<DoctorAvailabilityRule>(entity =>
        {
            entity.HasKey(x => x.Id);
            entity.Property(x => x.DayOfWeek).IsRequired();
            entity.Property(x => x.StartTime).IsRequired();
            entity.Property(x => x.EndTime).IsRequired();
            entity.Property(x => x.SlotDurationMinutes).IsRequired();
            entity.Property(x => x.CreatedAtUtc).IsRequired();

            entity.HasIndex(x => new { x.DoctorInstitutionId, x.DayOfWeek, x.IsActive });

            entity.HasOne<DoctorInstitution>()
                .WithMany()
                .HasForeignKey(x => x.DoctorInstitutionId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // Appointment
        builder.Entity<Appointment>(entity =>
        {
            entity.HasKey(x => x.Id);

            entity.Property(x => x.Status)
                .HasMaxLength(50)
                .IsRequired();

            entity.Property(x => x.Reason)
                .HasMaxLength(200);

            entity.Property(x => x.Notes)
                .HasMaxLength(2000);

            entity.Property(x => x.CancellationReason)
                .HasMaxLength(500);

            entity.HasIndex(x => x.PatientUserId);
            entity.HasIndex(x => x.Status);
            entity.HasIndex(x => new { x.DoctorInstitutionId, x.AppointmentDate });

            entity.HasOne<ApplicationUser>()
                .WithMany()
                .HasForeignKey(x => x.PatientUserId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne<DoctorInstitution>()
                .WithMany()
                .HasForeignKey(x => x.DoctorInstitutionId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne<Specialty>()
                .WithMany()
                .HasForeignKey(x => x.SpecialtyId)
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
