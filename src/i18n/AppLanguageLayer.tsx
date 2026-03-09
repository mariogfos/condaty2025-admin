"use client";

import DomTranslator from "@/i18n/DomTranslator";
import { LanguageProvider } from "@/i18n/LanguageProvider";
import type { ReactNode } from "react";

const AppLanguageLayer = ({ children }: { children: ReactNode }) => {
  return (
    <LanguageProvider>
      <DomTranslator />
      {children}
    </LanguageProvider>
  );
};

export default AppLanguageLayer;
