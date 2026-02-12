import { notFound } from "next/navigation";
import { Metadata } from "next";
import { isSupportedLocale, Locale, SUPPORTED_LOCALES } from "@/lib/i18n";
import { getServerT } from "@/lib/i18nServer";
import { I18nProvider } from "@/components/providers/I18nProvider";
import {
  getAbsoluteUrl,
  getLocaleAlternates,
  getOpenGraphAlternateLocales,
  getOpenGraphLocale,
} from "@/lib/seo";

/*
  Locale segment layout.

  Responsibilities:
  - Validate supported locale routes.
  - Provide locale-aware metadata defaults (title, description, OG).
  - Publish canonical and hreflang alternates for locale landing pages.
*/

interface LocaleLayoutProps {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}

export function generateStaticParams() {
  return SUPPORTED_LOCALES.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;

  if (!isSupportedLocale(locale)) {
    return {};
  }

  const typedLocale = locale as Locale;
  const t = await getServerT(typedLocale);
  const localePath = `/${typedLocale}`;

  return {
    title: {
      default: t("siteName"),
      template: `%s | ${t("siteName")}`,
    },
    description: t("siteTagline"),
    alternates: {
      canonical: localePath,
      languages: {
        ...getLocaleAlternates((supportedLocale) => `/${supportedLocale}`),
        // Use English as global default locale target.
        "x-default": "/en",
      },
    },
    openGraph: {
      type: "website",
      locale: getOpenGraphLocale(typedLocale),
      alternateLocale: getOpenGraphAlternateLocales(typedLocale),
      url: getAbsoluteUrl(localePath),
      title: t("siteName"),
      description: t("siteTagline"),
      siteName: t("siteName"),
    },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: LocaleLayoutProps) {
  const { locale } = await params;

  if (!isSupportedLocale(locale)) {
    notFound();
  }

  return <I18nProvider locale={locale}>{children}</I18nProvider>;
}
