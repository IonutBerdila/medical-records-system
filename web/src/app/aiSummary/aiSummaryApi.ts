import { http } from '../http';
import type { AiSummaryDto } from './types';

/**
 * Generează rezumatul medical AI pentru un pacient.
 * Endpoint: POST /api/patients/{patientUserId}/ai-summary (doar pentru medici).
 * Cheia OpenAI rămâne exclusiv pe backend; frontend-ul nu o cunoaște.
 */
export async function generateAiSummary(patientUserId: string): Promise<AiSummaryDto> {
  const { data } = await http.post<AiSummaryDto>(`/api/patients/${patientUserId}/ai-summary`);
  return data;
}
