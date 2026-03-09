import { AppLocale, DEFAULT_LOCALE } from "@/i18n/runtime";

type TranslatedLocale = Exclude<AppLocale, "es">;

const GLOSSARY: Record<TranslatedLocale, Record<string, string>> = {
  pt: {
    ci: "CPF",
    "c.i.": "CPF",
    "carnet de identidad": "CPF",
    "cédula de identidad": "CPF",
    "cedula de identidad": "CPF",
    expensa: "taxa de condominio",
    expensas: "taxas de condominio",
    egreso: "despesa",
    egresos: "despesas",
    ingreso: "receita",
    ingresos: "receitas",
    moroso: "inadimplente",
    morosos: "inadimplentes",
  },
  en: {
    ci: "SSN",
    "c.i.": "SSN",
    "carnet de identidad": "SSN",
    "cédula de identidad": "SSN",
    "cedula de identidad": "SSN",
    expensa: "condominium fee",
    expensas: "condominium fees",
    egreso: "expense",
    egresos: "expenses",
    ingreso: "income",
    ingresos: "income",
    moroso: "defaulter",
    morosos: "defaulters",
  },
};

const applyOriginalCase = (original: string, translated: string) => {
  if (original.toUpperCase() === original) {
    return translated.toUpperCase();
  }

  if (
    original[0] &&
    original[0] === original[0].toUpperCase() &&
    original.slice(1) !== original.slice(1).toUpperCase()
  ) {
    return translated.charAt(0).toUpperCase() + translated.slice(1);
  }

  return translated;
};

export const getGlossaryTranslation = (
  text: string,
  targetLocale: AppLocale,
) => {
  if (targetLocale === DEFAULT_LOCALE) {
    return null;
  }

  const normalized = text.trim().toLowerCase();
  const glossaryEntry = GLOSSARY[targetLocale as TranslatedLocale]?.[normalized];

  if (!glossaryEntry) {
    return null;
  }

  return applyOriginalCase(text, glossaryEntry);
};
