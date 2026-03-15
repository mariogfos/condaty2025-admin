"use client";

import {
  AppLocale,
  DEFAULT_LOCALE,
  detectDeviceLocale,
  getStoredPreference,
  LANGUAGE_PREFERENCE_KEY,
  MANUAL_LANGUAGE_OVERRIDE_ENABLED,
  LocalePreference,
} from "@/i18n/runtime";
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { ReactNode } from "react";

type LanguageContextType = {
  locale: AppLocale;
  preference: LocalePreference;
  ready: boolean;
  setPreference: (value: LocalePreference) => void;
};

const LanguageContext = createContext<LanguageContextType | null>(null);

const resolveLocale = (preference: LocalePreference): AppLocale => {
  return preference === "auto" ? detectDeviceLocale() : preference;
};

export const LanguageProvider = ({
  children,
}: {
  children: ReactNode;
}) => {
  const [preference, setPreferenceState] = useState<LocalePreference>("auto");
  const [locale, setLocale] = useState<AppLocale>(DEFAULT_LOCALE);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const storedPreference = getStoredPreference();
    setPreferenceState(storedPreference);
    setLocale(resolveLocale(storedPreference));
    setReady(true);
  }, []);

  useEffect(() => {
    if (typeof document === "undefined") {
      return;
    }

    document.documentElement.lang = locale;
    document.documentElement.dataset.locale = locale;
  }, [locale]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const onLanguageChange = () => {
      setPreferenceState((currentPreference) => {
        if (currentPreference !== "auto") {
          return currentPreference;
        }

        setLocale(detectDeviceLocale());
        return currentPreference;
      });
    };

    window.addEventListener("languagechange", onLanguageChange);
    return () => {
      window.removeEventListener("languagechange", onLanguageChange);
    };
  }, []);

  const setPreference = (value: LocalePreference) => {
    setPreferenceState(value);
    setLocale(resolveLocale(value));

    if (typeof window !== "undefined") {
      window.localStorage.setItem(LANGUAGE_PREFERENCE_KEY, value);
    }
  };

  const value = useMemo(
    () => ({
      locale,
      preference,
      ready,
      setPreference,
    }),
    [locale, preference, ready],
  );

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);

  if (!context) {
    throw new Error("useLanguage must be used within LanguageProvider");
  }

  return context;
};
