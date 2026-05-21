import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  SUPPORTED_LANGUAGES,
  DEFAULT_LANGUAGE,
  setLanguage,
  type SupportedLanguage
} from '../i18n';

/** Etichetele limbilor, afișate mereu în limba proprie. */
const LANGUAGE_LABELS: Record<SupportedLanguage, string> = {
  ro: 'Română',
  en: 'English',
  fr: 'Français',
  ru: 'Русский'
};

/**
 * Selector compact de limbă pentru bara de sus.
 * Schimbă limba interfeței și o reține în localStorage (cheia medcard_lang).
 */
export const LanguageSelector: React.FC = () => {
  const { t, i18n } = useTranslation();

  const current: SupportedLanguage = (SUPPORTED_LANGUAGES as readonly string[]).includes(
    i18n.language
  )
    ? (i18n.language as SupportedLanguage)
    : DEFAULT_LANGUAGE;

  return (
    <select
      aria-label={t('topbar.language')}
      value={current}
      onChange={(e) => setLanguage(e.target.value as SupportedLanguage)}
      className="h-9 rounded-lg border border-slate-200 bg-white px-2 text-sm font-medium text-slate-600 outline-none transition-colors hover:bg-slate-50 focus:border-primary focus:ring-2 focus:ring-primary/20"
    >
      {SUPPORTED_LANGUAGES.map((lng) => (
        <option key={lng} value={lng}>
          {LANGUAGE_LABELS[lng]}
        </option>
      ))}
    </select>
  );
};
