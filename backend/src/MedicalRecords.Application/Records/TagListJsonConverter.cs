using System.Text.Json;
using System.Text.Json.Serialization;

namespace MedicalRecords.Application.Records;

/// <summary>
/// JSON converter that accepts both string (legacy comma-separated) and string[] for tag fields.
/// Ensures robust deserialization when frontend sends arrays and legacy clients send strings.
/// </summary>
public sealed class TagListJsonConverter : JsonConverter<List<string>?>
{
    public override List<string>? Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
    {
        switch (reader.TokenType)
        {
            case JsonTokenType.Null:
                return null;
            case JsonTokenType.StartArray:
                var list = new List<string>();
                while (reader.Read())
                {
                    if (reader.TokenType == JsonTokenType.EndArray)
                        return list;
                    if (reader.TokenType == JsonTokenType.String)
                    {
                        var s = reader.GetString();
                        if (!string.IsNullOrWhiteSpace(s))
                            list.Add(s.Trim());
                    }
                }
                return list;
            case JsonTokenType.String:
                var str = reader.GetString();
                if (string.IsNullOrWhiteSpace(str))
                    return new List<string>();
                return str
                    .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
                    .Where(s => !string.IsNullOrWhiteSpace(s))
                    .ToList();
            default:
                throw new JsonException($"Unexpected token {reader.TokenType} for tag list. Expected array or string.");
        }
    }

    public override void Write(Utf8JsonWriter writer, List<string>? value, JsonSerializerOptions options)
    {
        if (value == null)
        {
            writer.WriteNullValue();
            return;
        }
        writer.WriteStartArray();
        foreach (var item in value)
            writer.WriteStringValue(item);
        writer.WriteEndArray();
    }
}
