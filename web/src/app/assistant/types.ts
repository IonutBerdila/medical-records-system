/** Rolul unui mesaj din conversația cu asistentul. */
export type AssistantRole = 'user' | 'assistant';

/** Un mesaj din istoricul conversației, trimis înapoi la backend. */
export interface AssistantHistoryMessage {
  role: AssistantRole;
  content: string;
}

/** Cererea trimisă către POST /api/assistant/chat. */
export interface AssistantChatRequest {
  message: string;
  history?: AssistantHistoryMessage[];
}

/** Doctor sugerat de asistent, cu identificatorii necesari programării. */
export interface AssistantSuggestedDoctor {
  doctorProfileId: string;
  doctorInstitutionId: string;
  specialtyId: string;
  specialty: string;
  fullName: string;
  institutionName: string;
  institutionCity?: string | null;
  hasAvailabilityToday: boolean;
}

/** Răspunsul asistentului de navigare medicală. */
export interface AssistantChatResponse {
  answer: string;
  detectedLanguage: string;
  suggestedSpecialties: string[];
  clarificationQuestions: string[];
  suggestedDoctors: AssistantSuggestedDoctor[];
  shouldSeekUrgentCare: boolean;
  safetyNotice: string;
  disclaimer: string;
}
