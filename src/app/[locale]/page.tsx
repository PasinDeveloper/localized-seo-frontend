import { notFound } from "next/navigation";
import { Metadata } from "next";
import { RecipeBlog } from "@/components/RecipeBlog";
import { isSupportedLocale, Locale } from "@/lib/i18n";
import { getServerT } from "@/lib/i18nServer";
import { getLocaleAlternates } from "@/lib/seo";

/*
  Locale landing page route.

  Validates locale, resolves translated metadata text, and renders localized recipe listing.
*/

interface LocalePageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({
  params,
}: LocalePageProps): Promise<Metadata> {
  const { locale } = await params;

  if (!isSupportedLocale(locale)) {
    return {};
  }

  const typedLocale = locale as Locale;
  const t = await getServerT(typedLocale);

  return {
    title: t("siteName"),
    description: t("siteTagline"),
    alternates: {
      canonical: `/${typedLocale}`,
      languages: {
        ...getLocaleAlternates((supportedLocale) => `/${supportedLocale}`),
        "x-default": "/en",
      },
    },
  };
}

export default async function LocalePage({ params }: LocalePageProps) {
  const { locale } = await params;

  if (!isSupportedLocale(locale)) {
    notFound();
  }

  return <RecipeBlog locale={locale} />;
}
