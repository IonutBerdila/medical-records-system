using System.Text;
using System.Threading.RateLimiting;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using FluentValidation;
using FluentValidation.AspNetCore;
using MedicalRecords.Application.Validators;
using MedicalRecords.Api.Middleware;
using MedicalRecords.Application.Common;
using MedicalRecords.Application.Admin;
using MedicalRecords.Application.Auth;
using MedicalRecords.Application.Audit;
using MedicalRecords.Application.Consent;
using MedicalRecords.Application.Entries;
using MedicalRecords.Application.Pharmacy;
using MedicalRecords.Application.Prescriptions;
using MedicalRecords.Application.Records;
using MedicalRecords.Application.ShareToken;
using MedicalRecords.Domain.Entities;
using MedicalRecords.Infrastructure.Admin;
using MedicalRecords.Infrastructure.Auth;
using MedicalRecords.Infrastructure.Audit;
using MedicalRecords.Infrastructure.Consent;
using MedicalRecords.Infrastructure.Data;
using MedicalRecords.Infrastructure.Entries;
using MedicalRecords.Infrastructure.Pharmacy;
using MedicalRecords.Infrastructure.Prescriptions;
using MedicalRecords.Infrastructure.Records;
using MedicalRecords.Infrastructure.ShareToken;
using Microsoft.OpenApi.Models;

var builder = WebApplication.CreateBuilder(args);

// Add DbContext
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

// Generic repositories
builder.Services.AddScoped(typeof(IRepository<>), typeof(EfRepository<>));

// Add Identity
builder.Services.AddIdentityCore<ApplicationUser>()
    .AddRoles<IdentityRole<Guid>>()
    .AddEntityFrameworkStores<AppDbContext>();

// Add JWT Authentication
var jwtSection = builder.Configuration.GetSection("Jwt");
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = jwtSection["Issuer"],
            ValidAudience = jwtSection["Audience"],
            IssuerSigningKey = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(jwtSection["Key"] ?? throw new InvalidOperationException("JWT Key not configured")))
        };
    });

// CORS pentru clientul web (Vite)
builder.Services.AddCors(options =>
{
    options.AddPolicy("WebClient", policy =>
    {
        policy.WithOrigins("http://localhost:5173")
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials();
    });
});

// Add Authorization + role-based policies
builder.Services.AddAuthorization(options =>
{
    options.AddPolicy("RequirePatient", policy => policy.RequireRole("Patient"));
    options.AddPolicy("RequireDoctor", policy => policy.RequireRole("Doctor"));
    options.AddPolicy("RequirePharmacy", policy => policy.RequireRole("Pharmacy"));
    options.AddPolicy("RequireAdmin", policy => policy.RequireRole("Admin"));
});

// Rate limiting – protecție brute-force pentru endpoint-ul de farmacie
builder.Services.AddRateLimiter(options =>
{
    options.AddPolicy("PharmacyVerifyPolicy", context =>
        RateLimitPartition.GetFixedWindowLimiter(
            partitionKey: context.User?.Identity?.Name
                         ?? context.Connection.RemoteIpAddress?.ToString()
                         ?? "anonymous",
            factory: _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = 10,
                Window = TimeSpan.FromMinutes(1),
                QueueProcessingOrder = QueueProcessingOrder.OldestFirst,
                QueueLimit = 0
            }));
});

// Dependency Injection
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IAuditService, AuditService>();
builder.Services.AddScoped<IAdminService, AdminService>();
builder.Services.AddScoped<IApprovalGuard, ApprovalGuard>();
builder.Services.AddScoped<IConsentService, ConsentService>();
builder.Services.AddScoped<IMedicalRecordService, MedicalRecordService>();
builder.Services.AddScoped<IMedicalEntryService, MedicalEntryService>();
builder.Services.AddScoped<IPrescriptionService, PrescriptionService>();
builder.Services.AddScoped<IShareTokenService, ShareTokenService>();
builder.Services.AddScoped<IPharmacyService, PharmacyService>();

// ProblemDetails for consistent error responses (used by global exception handling)
builder.Services.AddProblemDetails();

// Add Controllers + FluentValidation (explicit camelCase for JSON)
builder.Services
    .AddControllers()
    .AddJsonOptions(opts =>
    {
        opts.JsonSerializerOptions.PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase;
        opts.JsonSerializerOptions.PropertyNameCaseInsensitive = true;
    })
    .AddFluentValidation();

builder.Services.AddValidatorsFromAssemblyContaining<RegisterRequestValidator>();
builder.Services.AddFluentValidationAutoValidation();

// Add Swagger
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo { Title = "MedicalRecords.Api", Version = "v1" });

    // JWT Bearer in Swagger
    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT",
        In = ParameterLocation.Header,
        Description = "Enter: Bearer {your JWT token}"
    });

    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });
});

var app = builder.Build();

// Aplicare migrații + repair schema + seed roluri și admin user la startup
using (var scope = app.Services.CreateScope())
{
    var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    dbContext.Database.Migrate();

    // Repair: ensure MedicalRecord columns exist (idempotent when EF migrations are out of sync)
    await dbContext.Database.ExecuteSqlRawAsync(@"ALTER TABLE ""MedicalRecords"" ADD COLUMN IF NOT EXISTS ""AdverseDrugReactions"" text NULL;");
    await dbContext.Database.ExecuteSqlRawAsync(@"ALTER TABLE ""MedicalRecords"" ADD COLUMN IF NOT EXISTS ""CurrentMedications"" text NULL;");
    await dbContext.Database.ExecuteSqlRawAsync(@"ALTER TABLE ""MedicalRecords"" ADD COLUMN IF NOT EXISTS ""MajorSurgeriesHospitalizations"" text NULL;");
    await dbContext.Database.ExecuteSqlRawAsync(@"ALTER TABLE ""MedicalRecords"" ADD COLUMN IF NOT EXISTS ""EmergencyContactRelation"" text NULL;");
    await dbContext.Database.ExecuteSqlRawAsync(@"ALTER TABLE ""MedicalRecords"" ADD COLUMN IF NOT EXISTS ""EmergencyContactsJson"" text NULL;");

    var roleManager = scope.ServiceProvider.GetRequiredService<RoleManager<IdentityRole<Guid>>>();
    var userManager = scope.ServiceProvider.GetRequiredService<UserManager<ApplicationUser>>();
    var configuration = scope.ServiceProvider.GetRequiredService<IConfiguration>();
    
    string[] roles = ["Patient", "Doctor", "Pharmacy", "Admin"];

    foreach (var role in roles)
    {
        if (!await roleManager.RoleExistsAsync(role))
        {
            await roleManager.CreateAsync(new IdentityRole<Guid>(role));
        }
    }

    // Seed default admin user în Development
    if (app.Environment.IsDevelopment())
    {
        var adminEmail = configuration["Admin:Email"] ?? "admin@medicalrecords.local";
        var adminPassword = configuration["Admin:Password"] ?? "Admin123!";

        var existingAdmin = await userManager.FindByEmailAsync(adminEmail);
        if (existingAdmin == null)
        {
            var adminUser = new ApplicationUser
            {
                Id = Guid.NewGuid(),
                Email = adminEmail,
                UserName = adminEmail,
                EmailConfirmed = true
            };

            var createResult = await userManager.CreateAsync(adminUser, adminPassword);
            if (createResult.Succeeded)
            {
                await userManager.AddToRoleAsync(adminUser, "Admin");
            }
        }
        else if (!await userManager.IsInRoleAsync(existingAdmin, "Admin"))
        {
            await userManager.AddToRoleAsync(existingAdmin, "Admin");
        }
    }
}

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

// Global exception handling (must run early in the pipeline)
app.UseMiddleware<GlobalExceptionHandlingMiddleware>();

app.UseCors("WebClient");

app.UseRateLimiter();

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();
