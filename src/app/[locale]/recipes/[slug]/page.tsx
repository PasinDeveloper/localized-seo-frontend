import { notFound } from "next/navigation";
import { Metadata } from "next";
import { RecipeDetail } from "@/components/RecipeDetail";
import { isSupportedLocale, Locale } from "@/lib/i18n";
import { getServerT } from "@/lib/i18nServer";
import {
  getAbsoluteUrl,
  getLocaleAlternates,
  getOpenGraphAlternateLocales,
  getOpenGraphLocale,
  getRecipeForSeo,
  getRecipeImageAbsoluteUrl,
  localizeRecipeSlug,
} from "@/lib/seo";

/*
  Localized recipe detail route.

  Responsibilities:
  - Resolve locale and slug.
  - Generate per-recipe metadata from backend API data.
  - Expose canonical + hreflang alternates across localized recipe variants.
*/

interface RecipePageProps {
  params: Promise<{ locale: string; slug: string }>;
}

export async function generateMetadata({
  params,
}: RecipePageProps): Promise<Metadata> {
  const { locale, slug } = await params;

  if (!isSupportedLocale(locale)) {
    return {};
  }

  const typedLocale = locale as Locale;
  const t = await getServerT(typedLocale);
  const recipe = await getRecipeForSeo(slug, typedLocale);

  if (!recipe) {
    return {
      title: t("recipeNotFound"),
      robots: {
        // Avoid indexing missing variants while still allowing crawl discovery.
        index: false,
        follow: true,
      },
    };
  }

  const canonicalPath = `/${typedLocale}/recipes/${recipe.slug}`;
  const imageUrl = getRecipeImageAbsoluteUrl(recipe.imagePath);

  return {
    title: recipe.title,
    description: recipe.description,
    alternates: {
      canonical: canonicalPath,
      languages: {
        ...getLocaleAlternates(
          (supportedLocale) =>
            `/${supportedLocale}/recipes/${localizeRecipeSlug(recipe.slug, supportedLocale)}`,
        ),
        // Explicit default locale for crawlers that do not match hreflang.
        "x-default": `/en/recipes/${localizeRecipeSlug(recipe.slug, "en")}`,
      },
    },
    openGraph: {
      type: "article",
      locale: getOpenGraphLocale(typedLocale),
      alternateLocale: getOpenGraphAlternateLocales(typedLocale),
      url: getAbsoluteUrl(canonicalPath),
      title: recipe.title,
      description: recipe.description,
      images: [
        {
          url: imageUrl,
          alt: recipe.title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: recipe.title,
      description: recipe.description,
      images: [imageUrl],
    },
  };
}

export default async function RecipePage({ params }: RecipePageProps) {
  const { locale, slug } = await params;

  if (!isSupportedLocale(locale)) {
    notFound();
  }

  return <RecipeDetail locale={locale} slug={slug} />;
}
