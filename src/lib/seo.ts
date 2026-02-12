import { cache } from "react";
import { Locale, SUPPORTED_LOCALES } from "@/lib/i18n";
import { Recipe } from "./recipesApi";

/*
  SEO utility layer for localized routes.

  Responsibilities:
  - Build absolute URLs for metadata, sitemap, and social previews.
  - Map locale-specific slug variants.
  - Fetch recipe data for SEO routes from backend API only.
  - Apply short revalidation so sitemap/metadata pick up DB changes.
*/

const DEFAULT_SITE_URL = "http://localhost:3000";
const DEFAULT_API_BASE_URL = "http://localhost:3010";

export const SEO_REVALIDATE_SECONDS = 60;

const localeOgMap: Record<Locale, string> = {
  en: "en_US",
  fr: "fr_FR",
};

function trimTrailingSlash(value: string): string {
  return value.replace(/\/$/, "");
}

export function getSiteUrl(): string {
  return trimTrailingSlash(
    process.env.NEXT_PUBLIC_SITE_URL ?? DEFAULT_SITE_URL,
  );
}

export function getPublicApiBaseUrl(): string {
  return trimTrailingSlash(
    process.env.NEXT_PUBLIC_API_BASE_URL ?? DEFAULT_API_BASE_URL,
  );
}

function getApiBaseUrl(): string {
  // Prefer server-only API URL for server-rendered SEO routes when available.
  return trimTrailingSlash(
    process.env.API_BASE_URL ??
      process.env.NEXT_PUBLIC_API_BASE_URL ??
      DEFAULT_API_BASE_URL,
  );
}

export function getAbsoluteUrl(pathname: string): string {
  const normalizedPath = pathname.startsWith("/") ? pathname : `/${pathname}`;
  return `${getSiteUrl()}${normalizedPath}`;
}

export function getRecipeImageAbsoluteUrl(imagePath: string): string {
  const normalizedPath = imagePath.startsWith("/")
    ? imagePath
    : `/${imagePath}`;
  return `${getPublicApiBaseUrl()}${normalizedPath}`;
}

export function localizeRecipeSlug(slug: string, locale: Locale): string {
  return slug.replace(/^(en|fr)-/, `${locale}-`);
}

export function getLocaleAlternates(
  pathnameBuilder: (locale: Locale) => string,
) {
  return Object.fromEntries(
    SUPPORTED_LOCALES.map((locale) => [locale, pathnameBuilder(locale)]),
  );
}

export function getOpenGraphLocale(locale: Locale): string {
  return localeOgMap[locale];
}

export function getOpenGraphAlternateLocales(locale: Locale): string[] {
  return SUPPORTED_LOCALES.filter((value) => value !== locale).map(
    getOpenGraphLocale,
  );
}

async function fetchJson<T>(path: string): Promise<T> {
  const response = await fetch(`${getApiBaseUrl()}${path}`, {
    headers: {
      Accept: "application/json",
      ...(process.env.INTERNAL_API_KEY
        ? { "x-internal-api-key": process.env.INTERNAL_API_KEY }
        : {}),
    },
    // Keep SEO output fresh while still leveraging Next.js caching.
    next: { revalidate: SEO_REVALIDATE_SECONDS },
  });

  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`);
  }

  return (await response.json()) as T;
}

export const getRecipesForSeo = cache(
  async (locale?: Locale): Promise<Recipe[]> => {
    const params = locale ? `?locale=${encodeURIComponent(locale)}` : "";
    try {
      return await fetchJson<Recipe[]>(`/recipes${params}`);
    } catch {
      return [];
    }
  },
);

export async function getRecipeForSeo(
  slug: string,
  locale: Locale,
): Promise<Recipe | null> {
  const localizedSlug = localizeRecipeSlug(slug, locale);

  try {
    return await fetchJson<Recipe>(`/recipes/${localizedSlug}`);
  } catch {
    return null;
  }
}
