"use client";

import { ReactNode, useEffect, useMemo } from "react";
import { I18nextProvider } from "react-i18next";
import { Locale } from "@/lib/i18n";
import { getClientI18n } from "@/lib/i18nClient";

/*
  i18next provider for client components.

  Ensures translation hooks use the active route locale.
*/

interface I18nProviderProps {
  locale: Locale;
  children: ReactNode;
}

export function I18nProvider({ locale, children }: I18nProviderProps) {
  const i18n = useMemo(() => getClientI18n(locale), [locale]);

  useEffect(() => {
    void i18n.changeLanguage(locale);
  }, [i18n, locale]);

  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>;
}
