import { MetadataRoute } from "next";
import { Locale, SUPPORTED_LOCALES } from "@/lib/i18n";
import {
  getAbsoluteUrl,
  getRecipesForSeo,
  localizeRecipeSlug,
} from "@/lib/seo";

/*
  Dynamic sitemap route.

  Strategy:
  - Emit one canonical entry per localized recipe group.
  - Attach locale alternates via hreflang.
  - Revalidate frequently so DB updates are reflected in sitemap.xml.
*/

export const revalidate = 60 * 60; // Revalidate every hour to keep sitemap fresh with DB changes.

function recipePath(locale: Locale, slug: string): string {
  return `/${locale}/recipes/${localizeRecipeSlug(slug, locale)}`;
}

function toRecipeGroupKey(slug: string): string {
  // Group `en-recipe-001` and `fr-recipe-001` under the same logical key.
  return slug.replace(/^(en|fr)-/, "");
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const recipes = await getRecipesForSeo();
  const groupedRecipes = new Map<string, Partial<Record<Locale, string>>>();

  for (const recipe of recipes) {
    const locale = recipe.locale as Locale;
    const key = toRecipeGroupKey(recipe.slug);
    const existing = groupedRecipes.get(key) ?? {};

    existing[locale] = recipe.slug;
    groupedRecipes.set(key, existing);
  }

  const localeEntries: MetadataRoute.Sitemap = [
    {
      url: getAbsoluteUrl("/en"),
      lastModified: new Date(),
      alternates: {
        languages: Object.fromEntries(
          SUPPORTED_LOCALES.map((supportedLocale) => [
            supportedLocale,
            getAbsoluteUrl(`/${supportedLocale}`),
          ]),
        ),
      },
    },
  ];

  const recipeEntries: MetadataRoute.Sitemap = [];

  for (const [, localeSlugs] of groupedRecipes.entries()) {
    // Prefer English URL as canonical when present, otherwise fallback to French.
    const canonicalLocale: Locale = localeSlugs.en ? "en" : "fr";
    const canonicalSlug =
      localeSlugs[canonicalLocale] ?? localeSlugs.en ?? localeSlugs.fr;

    if (!canonicalSlug) {
      continue;
    }

    const representativeRecipe = recipes.find((recipe) =>
      Object.values(localeSlugs).includes(recipe.slug),
    );

    const alternates = Object.fromEntries(
      SUPPORTED_LOCALES.map((locale) => {
        const localeSlug = localeSlugs[locale];
        if (!localeSlug) {
          return null;
        }

        return [
          locale,
          getAbsoluteUrl(recipePath(locale, localeSlug)),
        ] as const;
      }).filter((entry): entry is readonly [Locale, string] => entry !== null),
    );

    recipeEntries.push({
      url: getAbsoluteUrl(recipePath(canonicalLocale, canonicalSlug)),
      // Any locale variant in the group can represent freshness for this entry.
      lastModified: new Date(representativeRecipe?.updatedAt ?? Date.now()),
      changeFrequency: "daily",
      priority: 0.8,
      alternates: {
        languages: alternates,
      },
    });
  }

  return [...localeEntries, ...recipeEntries];
}
