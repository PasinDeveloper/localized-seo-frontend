import { createInstance, i18n as I18n } from "i18next";
import { initReactI18next } from "react-i18next";
import { getBaseConfig, Locale } from "@/lib/i18n";

/*
  Client-side i18next singleton.

  Keeps one browser i18n instance and switches language on locale changes.
*/

let clientI18n: I18n | null = null;

export function getClientI18n(locale: Locale): I18n {
  if (!clientI18n) {
    clientI18n = createInstance();
    void clientI18n.use(initReactI18next).init({
      ...getBaseConfig(locale),
      initImmediate: false,
    });
  }

  return clientI18n;
}
