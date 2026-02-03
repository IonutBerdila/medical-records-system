const TOKEN_KEY = 'medcard_token';
const PROFILE_DRAFT_KEY = 'medcard_profile_draft';

export interface ProfileDraft {
  fullName: string;
  phone: string;
  photoUrl?: string;
}

export const storage = {
  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  },

  setToken(token: string | null) {
    if (!token) {
      localStorage.removeItem(TOKEN_KEY);
      return;
    }
    localStorage.setItem(TOKEN_KEY, token);
  },

  clearAuth() {
    localStorage.removeItem(TOKEN_KEY);
  },

  getProfileDraft(): ProfileDraft | null {
    const raw = localStorage.getItem(PROFILE_DRAFT_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as ProfileDraft;
    } catch {
      return null;
    }
  },

  setProfileDraft(draft: ProfileDraft | null) {
    if (!draft) {
      localStorage.removeItem(PROFILE_DRAFT_KEY);
      return;
    }
    localStorage.setItem(PROFILE_DRAFT_KEY, JSON.stringify(draft));
  }
};

