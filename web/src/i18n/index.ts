import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import ro from './locales/ro.json';
import en from './locales/en.json';
import fr from './locales/fr.json';
import ru from './locales/ru.json';

/** Limbile suportate de interfață. */
export const SUPPORTED_LANGUAGES = ['ro', 'en', 'fr', 'ru'] as const;
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

/** Cheia din localStorage unde se reține limba aleasă. */
export const LANGUAGE_STORAGE_KEY = 'medcard_lang';

/** Limba implicită: româna. */
export const DEFAULT_LANGUAGE: SupportedLanguage = 'ro';

function isSupported(value: string | null): value is SupportedLanguage {
  return value != null && (SUPPORTED_LANGUAGES as readonly string[]).includes(value);
}

function getInitialLanguage(): SupportedLanguage {
  try {
    const stored = localStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (isSupported(stored)) {
      return stored;
    }
  } catch {
    // localStorage indisponibil – folosim limba implicită.
  }
  return DEFAULT_LANGUAGE;
}

void i18n.use(initReactI18next).init({
  resources: {
    ro: { translation: ro },
    en: { translation: en },
    fr: { translation: fr },
    ru: { translation: ru },
  },
  lng: getInitialLanguage(),
  fallbackLng: DEFAULT_LANGUAGE,
  interpolation: { escapeValue: false },
  react: { useSuspense: false },
});

/** Schimbă limba interfeței și o reține în localStorage. */
export function setLanguage(language: SupportedLanguage): void {
  try {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
  } catch {
    // localStorage indisponibil – limba se aplică doar pentru sesiunea curentă.
  }
  void i18n.changeLanguage(language);
}

export default i18n;
