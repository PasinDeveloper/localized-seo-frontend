"use client";

import Link from "next/link";
import Image from "next/image";
import { useTranslation } from "react-i18next";
import { Locale } from "@/lib/i18n";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import {
  getRecipeImageUrl,
  getRecipesErrorMessage,
  isExternalImageUrl,
  useRecipeQuery,
} from "@/lib/recipesApi";

/*
  Localized recipe detail UI.

  Fetches a single recipe for the active locale and renders full content sections.
*/

interface RecipeDetailProps {
  locale: Locale;
  slug: string;
}

export function RecipeDetail({ locale, slug }: RecipeDetailProps) {
  const { t } = useTranslation();
  const { data, isLoading, error } = useRecipeQuery(slug, locale);
  const imageUrl = data ? getRecipeImageUrl(data.imagePath) : "";

  return (
    <main className="recipe-shell py-10 md:py-14">
      <header className="flex items-center justify-between">
        <Link
          href={`/${locale}`}
          className="flex rounded-full border border-violet-200 bg-white/90 px-4 py-2 text-sm font-semibold text-violet-700 transition-all duration-200 hover:-translate-y-0.5 hover:bg-violet-50"
        >
          {t("backToHome")}
        </Link>

        <LanguageSwitcher currentLocale={locale} />
      </header>

      {isLoading ? (
        <div className="mt-6 space-y-4">
          <div className="h-80 animate-pulse rounded-3xl border border-violet-200/70 bg-white/80" />
          <div className="h-8 w-2/3 animate-pulse rounded-lg border border-violet-200/70 bg-white/80" />
          <div className="h-28 animate-pulse rounded-2xl border border-violet-200/70 bg-white/80" />
        </div>
      ) : null}

      {error ? (
        <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-5 text-red-700">
          {getRecipesErrorMessage(error)}
        </div>
      ) : null}

      {!isLoading && !error && data ? (
        <article className="mt-6 overflow-hidden rounded-3xl border border-violet-200/70 bg-white/95 shadow-lg">
          <Image
            src={imageUrl}
            alt={data.title}
            width={1440}
            height={832}
            unoptimized={isExternalImageUrl(imageUrl)}
            className="h-72 w-full object-cover md:h-104"
          />

          <div className="space-y-8 p-7 md:p-10">
            <header className="space-y-4 rounded-2xl bg-linear-to-r from-violet-50 via-sky-50 to-fuchsia-50 p-6">
              <h1 className="text-3xl font-bold tracking-tight text-slate-900 md:text-5xl">
                {data.title}
              </h1>
              <p className="text-base leading-7 text-slate-700 md:text-lg">
                {data.description}
              </p>
            </header>

            <section className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-6">
              <h2 className="text-2xl font-semibold tracking-tight text-emerald-900">
                {t("ingredients")}
              </h2>
              <ul className="mt-3 list-disc space-y-2 pl-5 text-emerald-950/80">
                {data.ingredients.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </section>

            <section className="rounded-2xl border border-sky-200 bg-sky-50/70 p-6">
              <h2 className="text-2xl font-semibold tracking-tight text-sky-900">
                {t("steps")}
              </h2>
              <ol className="mt-3 list-decimal space-y-3 pl-5 text-sky-950/80">
                {data.steps.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ol>
            </section>
          </div>
        </article>
      ) : null}
    </main>
  );
}
