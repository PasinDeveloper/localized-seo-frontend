import enCommon from "../../public/locales/en/common.json";
import frCommon from "../../public/locales/fr/common.json";

/*
  Raw i18next setup for the app.

  - Keeps locale definitions and resources in one place.
  - Exposes locale constants/resources shared by server and client helpers.
*/

export const SUPPORTED_LOCALES = ["en", "fr"] as const;
export type Locale = (typeof SUPPORTED_LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "en";
export const TRANSLATION_NAMESPACE = "common";

export const resources = {
  en: { [TRANSLATION_NAMESPACE]: enCommon },
  fr: { [TRANSLATION_NAMESPACE]: frCommon },
} as const;

export function isSupportedLocale(value: string): value is Locale {
  return SUPPORTED_LOCALES.includes(value as Locale);
}

export function getBaseConfig(locale: Locale) {
  return {
    resources,
    lng: locale,
    fallbackLng: DEFAULT_LOCALE,
    supportedLngs: [...SUPPORTED_LOCALES],
    defaultNS: TRANSLATION_NAMESPACE,
    ns: [TRANSLATION_NAMESPACE],
    interpolation: {
      escapeValue: false,
    },
    returnNull: false as const,
  };
}
