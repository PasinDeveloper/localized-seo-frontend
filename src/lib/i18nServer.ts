import { createInstance } from "i18next";
import { getBaseConfig, Locale, TRANSLATION_NAMESPACE } from "@/lib/i18n";

/*
  Server-side i18next helper.

  Creates isolated instances per request context for metadata/routes.
*/

export async function getServerT(locale: Locale) {
  const instance = createInstance();
  await instance.init(getBaseConfig(locale));

  return instance.getFixedT(locale, TRANSLATION_NAMESPACE);
}
