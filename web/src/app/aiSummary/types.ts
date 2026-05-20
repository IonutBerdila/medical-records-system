/**
 * Rezultatul rezumatului medical generat de AI.
 * Sintetizează doar datele existente; nu reprezintă un diagnostic.
 */
export interface AiSummaryDto {
  /** Momentul (UTC, ISO 8601) la care a fost generat rezumatul. */
  generatedAtUtc: string;
  /** Modelul OpenAI folosit pentru generare. */
  model: string;
  /** Textul de sinteză al fișei medicale. */
  summaryText: string;
  /** Puncte de atenție observabile din datele existente. */
  attentionPoints: string[];
  /** Avertisment generat pe server, prezent mereu în răspuns. */
  disclaimer: string;
}
