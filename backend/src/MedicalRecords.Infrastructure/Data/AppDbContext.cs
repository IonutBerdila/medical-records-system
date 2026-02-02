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

            entity.HasOne<ApplicationUser>()
                .WithMany()
                .HasForeignKey(x => x.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        });
    }
}
