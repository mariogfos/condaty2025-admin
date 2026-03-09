"use client";

import { useCallback, useMemo } from "react";
import { useLanguage } from "@/i18n/LanguageProvider";
import { I18nSection, LOCALE_TAGS, messages } from "@/i18n/messages";

type MessageValues = Record<string, string | number>;

const formatMessage = (template: string, values?: MessageValues) => {
  if (!values) {
    return template;
  }

  return template.replace(/\{(\w+)\}/g, (_, key: string) => {
    const value = values[key];
    return value === undefined ? `{${key}}` : String(value);
  });
};

export const useScopedI18n = (section: I18nSection) => {
  const { locale } = useLanguage();

  const scopedMessages = useMemo(() => messages[locale][section], [locale, section]);
  const fallbackMessages = messages.es[section];

  const translate = useCallback(
    (key: string, values?: MessageValues) => {
      const source =
        (scopedMessages as Record<string, string>)[key] ??
        (fallbackMessages as Record<string, string>)[key] ??
        key;

      return formatMessage(source, values);
    },
    [fallbackMessages, scopedMessages],
  );

  return {
    locale,
    localeTag: LOCALE_TAGS[locale],
    translate,
    t: translate,
  };
};
