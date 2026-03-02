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

        shareToken.ConsumedAtUtc = now;

        if (!shareToken.Scope.Contains("prescriptions:read", StringComparison.OrdinalIgnoreCase))
            return Array.Empty<PharmacyPrescriptionDto>();

        var prescriptions = await GetPrescriptionsWithPendingItemsAsync(shareToken.PatientUserId, shareToken.PrescriptionId);
        var result = await MapToPharmacyDtosAsync(prescriptions);

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
        return result;
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

        var prescriptions = await GetPrescriptionsWithPendingItemsAsync(shareToken.PatientUserId, shareToken.PrescriptionId);
        var prescriptionDtos = await MapToPharmacyDtosAsync(prescriptions);

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

        return new PharmacyVerifyResponse
        {
            VerificationId = session.Id,
            Prescriptions = prescriptionDtos
        };
    }

    /// <summary>Returns only Active prescriptions that have at least one Pending item. Includes all items (pending + dispensed).</summary>
    private async Task<List<Domain.Entities.Prescription>> GetPrescriptionsWithPendingItemsAsync(Guid patientUserId, Guid? limitToPrescriptionId)
    {
        var query = _db.Prescriptions
            .AsNoTracking()
            .Include(p => p.Items)
            .Where(p => p.PatientUserId == patientUserId && p.Status == "Active");

        if (limitToPrescriptionId.HasValue)
            query = query.Where(p => p.Id == limitToPrescriptionId.Value);

        var list = await query.OrderByDescending(p => p.CreatedAtUtc).ToListAsync();
        return list.Where(p => p.Items.Any(i => i.Status == "Pending")).ToList();
    }

    private async Task<List<PharmacyPrescriptionDto>> MapToPharmacyDtosAsync(List<Domain.Entities.Prescription> prescriptions)
    {
        if (prescriptions.Count == 0) return new List<PharmacyPrescriptionDto>();

        var doctorIds = prescriptions.Select(p => p.DoctorUserId).Distinct().ToList();
        var doctorProfiles = await _db.DoctorProfiles
            .AsNoTracking()
            .Where(d => doctorIds.Contains(d.UserId))
            .ToDictionaryAsync(d => d.UserId, d => d.FullName);

        var pharmacyUserIds = prescriptions.SelectMany(p => p.Items).Where(i => i.DispensedByPharmacyUserId.HasValue).Select(i => i.DispensedByPharmacyUserId!.Value).Distinct().ToList();
        var pharmacyNames = pharmacyUserIds.Count > 0
            ? await _db.PharmacyProfiles.AsNoTracking().Where(ph => pharmacyUserIds.Contains(ph.UserId)).ToDictionaryAsync(ph => ph.UserId, ph => ph.PharmacyName)
            : new Dictionary<Guid, string>();

        return prescriptions.Select(p => new PharmacyPrescriptionDto
        {
            Id = p.Id,
            CreatedAtUtc = p.CreatedAtUtc,
            DoctorName = doctorProfiles.GetValueOrDefault(p.DoctorUserId),
            DoctorInstitutionName = null,
            Diagnosis = p.Diagnosis,
            GeneralNotes = p.GeneralNotes,
            ValidUntilUtc = p.ValidUntilUtc,
            Status = p.Status,
            Items = p.Items.Select(i => new PharmacyPrescriptionItemDto
            {
                Id = i.Id,
                MedicationName = i.MedicationName,
                Form = i.Form,
                Dosage = i.Dosage,
                Frequency = i.Frequency,
                DurationDays = i.DurationDays,
                Quantity = i.Quantity,
                Instructions = i.Instructions,
                Warnings = i.Warnings,
                Status = i.Status,
                DispensedAtUtc = i.DispensedAtUtc,
                DispensedByPharmacyName = i.DispensedByPharmacyUserId.HasValue && pharmacyNames.TryGetValue(i.DispensedByPharmacyUserId.Value, out var name) ? name : null
            }).ToList()
        }).ToList();
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
