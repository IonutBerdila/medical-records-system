import { http } from '../http';
import type { AssistantChatRequest, AssistantChatResponse } from './types';

/**
 * Trimite un mesaj către asistentul de navigare medicală.
 * Endpoint: POST /api/assistant/chat (doar pentru pacienți autentificați).
 * Cheia OpenAI rămâne exclusiv pe backend; frontend-ul nu o cunoaște.
 */
export async function sendAssistantMessage(
  body: AssistantChatRequest
): Promise<AssistantChatResponse> {
  const { data } = await http.post<AssistantChatResponse>('/api/assistant/chat', body);
  return data;
}
