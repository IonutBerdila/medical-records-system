using System.Security.Cryptography;
using MedicalRecords.Application.Audit;
using MedicalRecords.Application.ShareToken;
using MedicalRecords.Domain.Entities;
using MedicalRecords.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace MedicalRecords.Infrastructure.ShareToken;

public class ShareTokenService : IShareTokenService
{
    // Alfabet fără caractere foarte confuze (fără I, L, O, 0, 1).
    // Lungime actuală: 31 de caractere.
    private const string TokenAlphabet = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
    private const int TokenLength = 10;

    private readonly AppDbContext _db;
    private readonly IAuditService _audit;

    public ShareTokenService(AppDbContext db, IAuditService audit)
    {
        _db = db;
        _audit = audit;
    }

    public async Task<ShareTokenResponse> CreateShareTokenAsync(Guid patientUserId, CreateShareTokenRequest request)
    {
        // Generează un cod de EXACT 10 caractere din alfabetul definit mai sus.
        var plainToken = GenerateFixedLengthToken();
        var normalizedToken = NormalizeToken(plainToken);
        var tokenHash = ComputeSha256Hash(normalizedToken);

        var scope = string.IsNullOrWhiteSpace(request.Scope) ? "prescriptions:read" : request.Scope.Trim();
        var expiresInMinutes = request.ExpiresInMinutes ?? 10;
        if (expiresInMinutes < 1) expiresInMinutes = 1;
        if (expiresInMinutes > 60) expiresInMinutes = 60;

        var now = DateTime.UtcNow;
        var entity = new Domain.Entities.ShareToken
        {
            Id = Guid.NewGuid(),
            PatientUserId = patientUserId,
            TokenHash = tokenHash,
            Scope = scope,
            ExpiresAtUtc = now.AddMinutes(expiresInMinutes),
            CreatedAtUtc = now,
            CreatedByUserId = patientUserId,
            PrescriptionId = request.PrescriptionId
        };
        _db.ShareTokens.Add(entity);
        await _db.SaveChangesAsync();

        await _audit.LogAsync(new AuditEventCreate
        {
            TimestampUtc = now,
            Action = "SHARE_TOKEN_CREATED",
            ActorUserId = patientUserId,
            ActorRole = "Patient",
            PatientUserId = patientUserId,
            EntityType = "ShareToken",
            EntityId = entity.Id
        });

        return new ShareTokenResponse
        {
            // Tokenul este deja normalizat (upper-case, alfabet restrâns)
            Token = normalizedToken,
            ExpiresAtUtc = entity.ExpiresAtUtc,
            Scope = entity.Scope
        };
    }

    public async Task<IReadOnlyList<PharmacyPrescriptionDto>> VerifyShareTokenAsync(Guid pharmacyUserId, string token)
    {
        var normalizedToken = NormalizeToken(token);
        var tokenHash = ComputeSha256Hash(normalizedToken);
        var now = DateTime.UtcNow;

        var shareToken = await _db.ShareTokens
            .FirstOrDefaultAsync(st =>
                st.TokenHash == tokenHash
                && st.RevokedAtUtc == null
                && st.ExpiresAtUtc > now
                && st.ConsumedAtUtc == null);

        if (shareToken == null)
            throw new ShareTokenInvalidException("Token invalid, expirat sau deja folosit.");

        // One-time use: marchez consumat
        shareToken.ConsumedAtUtc = now;

        // Scope prescriptions:read — returnăm doar prescripțiile
        if (!shareToken.Scope.Contains("prescriptions:read", StringComparison.OrdinalIgnoreCase))
            return Array.Empty<PharmacyPrescriptionDto>();

        IQueryable<Domain.Entities.Prescription> query = _db.Prescriptions
            .Where(p => p.PatientUserId == shareToken.PatientUserId);

        if (shareToken.PrescriptionId.HasValue)
            query = query.Where(p => p.Id == shareToken.PrescriptionId.Value);

        var prescriptions = await query
            .OrderByDescending(p => p.CreatedAtUtc)
            .ToListAsync();

        var doctorIds = prescriptions.Select(p => p.DoctorUserId).Distinct().ToList();
        var doctorProfiles = await _db.DoctorProfiles
            .AsNoTracking()
            .Where(d => doctorIds.Contains(d.UserId))
            .ToDictionaryAsync(d => d.UserId, d => d.FullName);

        await _audit.LogAsync(new AuditEventCreate
        {
            TimestampUtc = now,
            Action = "SHARE_TOKEN_VERIFIED",
            ActorUserId = pharmacyUserId,
            ActorRole = "Pharmacy",
            PatientUserId = shareToken.PatientUserId,
            EntityType = "ShareToken",
            EntityId = shareToken.Id
        });

        await _db.SaveChangesAsync();

        return prescriptions.Select(p => new PharmacyPrescriptionDto
        {
            Id = p.Id,
            MedicationName = p.MedicationName,
            Dosage = p.Dosage,
            Instructions = p.Instructions,
            CreatedAtUtc = p.CreatedAtUtc,
            DoctorName = doctorProfiles.GetValueOrDefault(p.DoctorUserId),
            Status = p.Status,
            DispensedAtUtc = p.DispensedAtUtc
        }).ToList();
    }

    public async Task<PharmacyVerifyResponse> VerifyShareTokenV2Async(Guid pharmacyUserId, string token)
    {
        var normalizedToken = NormalizeToken(token);
        var tokenHash = ComputeSha256Hash(normalizedToken);
        var now = DateTime.UtcNow;

        var shareToken = await _db.ShareTokens
            .FirstOrDefaultAsync(st =>
                st.TokenHash == tokenHash
                && st.RevokedAtUtc == null
                && st.ExpiresAtUtc > now
                && st.ConsumedAtUtc == null);

        if (shareToken == null)
            throw new ShareTokenInvalidException("Token invalid, expirat sau deja folosit.");

        shareToken.ConsumedAtUtc = now;

        IQueryable<Domain.Entities.Prescription> query = _db.Prescriptions
            .Where(p => p.PatientUserId == shareToken.PatientUserId);

        if (shareToken.PrescriptionId.HasValue)
            query = query.Where(p => p.Id == shareToken.PrescriptionId.Value);

        var prescriptions = await query
            .OrderByDescending(p => p.CreatedAtUtc)
            .ToListAsync();

        var doctorIds = prescriptions.Select(p => p.DoctorUserId).Distinct().ToList();
        var doctorProfiles = await _db.DoctorProfiles
            .AsNoTracking()
            .Where(d => doctorIds.Contains(d.UserId))
            .ToDictionaryAsync(d => d.UserId, d => d.FullName);

        var session = new PharmacyVerificationSession
        {
            Id = Guid.NewGuid(),
            ShareTokenId = shareToken.Id,
            PharmacyUserId = pharmacyUserId,
            PatientUserId = shareToken.PatientUserId,
            CreatedAtUtc = now,
            ExpiresAtUtc = now.AddMinutes(5),
            AllowedPrescriptionId = shareToken.PrescriptionId
        };

        _db.PharmacyVerificationSessions.Add(session);

        await _audit.LogAsync(new AuditEventCreate
        {
            TimestampUtc = now,
            Action = "SHARE_TOKEN_VERIFIED",
            ActorUserId = pharmacyUserId,
            ActorRole = "Pharmacy",
            PatientUserId = shareToken.PatientUserId,
            EntityType = "ShareToken",
            EntityId = shareToken.Id
        });

        await _db.SaveChangesAsync();

        var items = prescriptions.Select(p => new PharmacyPrescriptionDto
        {
            Id = p.Id,
            MedicationName = p.MedicationName,
            Dosage = p.Dosage,
            Instructions = p.Instructions,
            CreatedAtUtc = p.CreatedAtUtc,
            DoctorName = doctorProfiles.GetValueOrDefault(p.DoctorUserId),
            Status = p.Status,
            DispensedAtUtc = p.DispensedAtUtc
        }).ToList();

        return new PharmacyVerifyResponse
        {
            VerificationId = session.Id,
            Prescriptions = items
        };
    }

    /// <summary>
    /// Generează un cod de EXACT 10 caractere din alfabetul TokenAlphabet.
    /// Folosește octeți random și modulo pe lungimea alfabetului (bias neglijabil pentru acest use‑case).
    /// </summary>
    private static string GenerateFixedLengthToken()
    {
        Span<char> buffer = stackalloc char[TokenLength];
        Span<byte> randomBytes = stackalloc byte[TokenLength];

        using var rng = RandomNumberGenerator.Create();
        rng.GetBytes(randomBytes);

        for (var i = 0; i < TokenLength; i++)
        {
            var idx = randomBytes[i] % TokenAlphabet.Length;
            buffer[i] = TokenAlphabet[idx];
        }

        return new string(buffer);
    }

    private static string ComputeSha256Hash(string input)
    {
        var bytes = System.Text.Encoding.UTF8.GetBytes(input);
        var hash = SHA256.HashData(bytes);
        return Convert.ToHexString(hash).ToLowerInvariant();
    }

    /// <summary>
    /// Normalizează tokenul: trim, upper-case, validează lungime = 10 și alfabetul permis.
    /// Aruncă ShareTokenInvalidException pentru input invalid.
    /// </summary>
    private static string NormalizeToken(string? token)
    {
        if (string.IsNullOrWhiteSpace(token))
            throw new ShareTokenInvalidException("Token lipsă.");

        var trimmed = token.Trim().ToUpperInvariant();
        if (trimmed.Length != TokenLength)
            throw new ShareTokenInvalidException("Token invalid.");

        // Verificăm că toate caracterele fac parte din alfabetul permis
        foreach (var c in trimmed)
        {
            if (!TokenAlphabet.Contains(c))
                throw new ShareTokenInvalidException("Token invalid.");
        }

        return trimmed;
    }
}
