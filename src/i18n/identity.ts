import {
  AppLocale,
  DEFAULT_LOCALE,
  getCurrentClientLocale,
} from "@/i18n/runtime";

const IDENTITY_DOCUMENT_CODE: Record<AppLocale, string> = {
  es: "CI",
  pt: "CPF",
  en: "SSN",
};

const IDENTITY_PATTERNS = [
  /\bC\.?\s*I\.?\b/gi,
  /carnet de identidad/gi,
  /c[eé]dula de identidad/gi,
  /carteira de identidade/gi,
  /documento de identidade/gi,
  /\bidentity card\b/gi,
];

const resolveLocale = (locale?: AppLocale) =>
  locale ?? getCurrentClientLocale() ?? DEFAULT_LOCALE;

export const getIdentityDocumentCode = (locale?: AppLocale) =>
  IDENTITY_DOCUMENT_CODE[resolveLocale(locale)] ?? IDENTITY_DOCUMENT_CODE.es;

export const normalizeIdentityDocumentText = (
  text: string,
  locale?: AppLocale,
) => {
  const replacement = getIdentityDocumentCode(locale);

  return IDENTITY_PATTERNS.reduce(
    (current, pattern) => current.replace(pattern, replacement),
    text,
  );
};
