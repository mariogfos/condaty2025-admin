export const LANGUAGE_PREFERENCE_KEY = "condaty.language.preference";
export const LANGUAGE_CACHE_KEY = "condaty.language.cache.v3";
export const MANUAL_LANGUAGE_OVERRIDE_ENABLED = true;

export type AppLocale = "es" | "pt" | "en";
export type LocalePreference = "auto" | AppLocale;

export const DEFAULT_LOCALE: AppLocale = "es";
export const SUPPORTED_LOCALES: AppLocale[] = ["es", "pt", "en"];

export const normalizeLocale = (value?: string | null): AppLocale => {
  if (!value) {
    return DEFAULT_LOCALE;
  }

  const lowered = value.toLowerCase();

  if (lowered.startsWith("pt")) {
    return "pt";
  }

  if (lowered.startsWith("en")) {
    return "en";
  }

  return "es";
};

export const normalizePreference = (
  value?: string | null,
): LocalePreference => {
  if (!value || value === "auto") {
    return "auto";
  }

  return normalizeLocale(value);
};

export const detectDeviceLocale = (): AppLocale => {
  if (typeof navigator === "undefined") {
    return DEFAULT_LOCALE;
  }

  const languages =
    navigator.languages && navigator.languages.length > 0
      ? navigator.languages
      : [navigator.language];

  for (const language of languages) {
    const locale = normalizeLocale(language);
    if (locale !== DEFAULT_LOCALE) {
      return locale;
    }
  }

  return DEFAULT_LOCALE;
};

export const getStoredPreference = (): LocalePreference => {
  if (typeof window === "undefined") {
    return "auto";
  }

  if (!MANUAL_LANGUAGE_OVERRIDE_ENABLED) {
    return "auto";
  }

  return normalizePreference(
    window.localStorage.getItem(LANGUAGE_PREFERENCE_KEY),
  );
};

export const getCurrentClientLocale = (): AppLocale => {
  if (typeof window === "undefined") {
    return DEFAULT_LOCALE;
  }

  const preference = getStoredPreference();
  return preference === "auto" ? detectDeviceLocale() : preference;
};
