using System.Text.Json;
using MedicalRecords.Application.Records;

namespace MedicalRecords.Infrastructure.Records;

/// <summary>
/// Helper for serializing/deserializing tag arrays to/from JSON.
/// Handles legacy comma-separated values for backward compatibility.
/// </summary>
internal static class RecordsJsonHelper
{
    private static readonly JsonSerializerOptions JsonOptions = new() { WriteIndented = false };

    public static IReadOnlyList<string> FromStorage(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
            return Array.Empty<string>();

        value = value.Trim();
        if (value.StartsWith('['))
        {
            try
            {
                var arr = JsonSerializer.Deserialize<string[]>(value, JsonOptions);
                return arr ?? Array.Empty<string>();
            }
            catch
            {
                return SplitLegacy(value);
            }
        }

        return SplitLegacy(value);
    }

    public static string ToStorage(IList<string>? items)
    {
        if (items == null || items.Count == 0)
            return string.Empty;

        var trimmed = items
            .Select(s => s?.Trim())
            .Where(s => !string.IsNullOrEmpty(s))
            .Take(30)
            .Select(s => s!.Length > 60 ? s[..60] : s)
            .ToList();

        return trimmed.Count == 0 ? string.Empty : JsonSerializer.Serialize(trimmed, JsonOptions);
    }

    private static IReadOnlyList<string> SplitLegacy(string value)
    {
        return value
            .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
            .Where(s => !string.IsNullOrWhiteSpace(s))
            .Take(30)
            .Select(s => s!.Length > 60 ? s[..60] : s)
            .ToList();
    }

    public static IReadOnlyList<EmergencyContactDto> EmergencyContactsFromStorage(string? json, string? legacyName, string? legacyRelation, string? legacyPhone)
    {
        if (!string.IsNullOrWhiteSpace(json) && json.TrimStart().StartsWith('['))
        {
            try
            {
                var list = JsonSerializer.Deserialize<List<EmergencyContactDto>>(json, JsonOptions);
                if (list != null && list.Count > 0)
                    return list;
            }
            catch { /* fall through to legacy */ }
        }
        if (!string.IsNullOrWhiteSpace(legacyName) || !string.IsNullOrWhiteSpace(legacyPhone))
        {
            return new List<EmergencyContactDto>
            {
                new() { Name = legacyName?.Trim(), Relation = legacyRelation?.Trim(), Phone = legacyPhone?.Trim() }
            };
        }
        return Array.Empty<EmergencyContactDto>();
    }

    public static string EmergencyContactsToStorage(IList<EmergencyContactDto>? contacts)
    {
        if (contacts == null || contacts.Count == 0)
            return string.Empty;
        var list = contacts
            .Where(c => !string.IsNullOrWhiteSpace(c.Name) || !string.IsNullOrWhiteSpace(c.Phone))
            .Select(c => new EmergencyContactDto
            {
                Name = c.Name?.Trim() ?? "",
                Relation = c.Relation?.Trim() ?? "",
                Phone = c.Phone?.Trim() ?? ""
            })
            .Take(10)
            .ToList();
        return list.Count == 0 ? string.Empty : JsonSerializer.Serialize(list, JsonOptions);
    }
}
