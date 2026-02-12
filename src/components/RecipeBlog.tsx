"use client";

import Link from "next/link";
import Image from "next/image";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQueryClient } from "@tanstack/react-query";
import { Locale } from "@/lib/i18n";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { SitemapPreview } from "@/components/SitemapPreview";
import { useApiMutation } from "@/lib/useApiMutation";
import {
  MAX_SEED_AMOUNT,
  getRecipeImageUrl,
  getRecipesErrorMessage,
  isExternalImageUrl,
  triggerSeedRecipes,
  useRecipesQuery,
} from "@/lib/recipesApi";

/*
  Localized recipe list UI.

  Fetches recipe cards for the active locale and renders loading/error/content states.
*/

interface RecipeBlogProps {
  locale: Locale;
}

export function RecipeBlog({ locale }: RecipeBlogProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { data, isLoading, error } = useRecipesQuery(locale);
  const [seedAmount, setSeedAmount] = useState<number>(10);
  const [seedMessage, setSeedMessage] = useState<string | null>(null);

  const seedMutation = useApiMutation(triggerSeedRecipes, {
    onSuccess: async (
      result: Awaited<ReturnType<typeof triggerSeedRecipes>>,
    ) => {
      setSeedMessage(
        t("seedSuccess", {
          amount: result.amount,
          seeded: result.seeded,
        }),
      );
      await queryClient.invalidateQueries({ queryKey: ["recipes", locale] });
    },
    onError: (seedError: Error) => {
      setSeedMessage(
        seedError instanceof Error ? seedError.message : t("seedFailed"),
      );
    },
  });

  const handleSeedSubmit = async (
    event: React.SyntheticEvent<HTMLFormElement, SubmitEvent>,
  ) => {
    event.preventDefault();

    if (
      !Number.isInteger(seedAmount) ||
      seedAmount < 1 ||
      seedAmount > MAX_SEED_AMOUNT
    ) {
      setSeedMessage(t("seedRange", { max: MAX_SEED_AMOUNT }));
      return;
    }

    setSeedMessage(null);
    try {
      await seedMutation.mutateAsync(seedAmount);
    } catch {
      // Error state is handled in mutation onError.
    }
  };

  return (
    <main className="recipe-shell py-10 md:py-14">
      <header className="flex pt-6 items-start justify-between gap-8 overflow-hidden rounded-3xl border border-violet-200/70 bg-linear-to-br from-white via-violet-50 to-sky-50 p-8 shadow-sm md:p-12">
        <div className="min-w-0 flex-1">
          <div className="inline-flex rounded-full border border-fuchsia-200 bg-fuchsia-100/80 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-fuchsia-700">
            {t("localizedRecipeJournal")}
          </div>
          <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-900 md:text-5xl">
            {t("siteName")}
          </h1>
          <p className="mt-3 max-w-2xl text-base text-slate-700 md:text-lg">
            {t("siteTagline")}
          </p>
          <p className="mt-4 text-sm text-slate-500">{t("dataNotice")}</p>

          <form
            onSubmit={handleSeedSubmit}
            className="mt-5 flex flex-wrap items-end gap-3"
          >
            <label className="flex flex-col text-sm text-slate-700">
              <span className="mb-1 font-medium">{t("seedAmountLabel")}</span>
              <input
                type="number"
                min={1}
                max={MAX_SEED_AMOUNT}
                value={seedAmount}
                onChange={(event) => setSeedAmount(Number(event.target.value))}
                className="w-28 rounded-lg border border-violet-200 bg-white px-3 py-2 text-slate-900"
              />
            </label>

            <button
              type="submit"
              disabled={seedMutation.isPending}
              className="rounded-full bg-linear-to-r from-violet-600 to-sky-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {seedMutation.isPending ? t("seeding") : t("seedNow")}
            </button>

            <p className="text-sm text-slate-600">
              {t("seedLimitHint", { max: MAX_SEED_AMOUNT })}
            </p>
          </form>

          {seedMessage ? (
            <p className="mt-2 text-sm text-slate-700">{seedMessage}</p>
          ) : null}
        </div>

        <div className="w-full max-w-xl space-y-4">
          <div className="flex justify-end">
            <LanguageSwitcher currentLocale={locale} />
          </div>
          <SitemapPreview locale={locale} />
        </div>
      </header>

      <section className="mt-8 md:mt-10">
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">
          {t("featuredRecipes")}
        </h2>

        {isLoading ? (
          <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <div
                key={index}
                className="h-72 animate-pulse rounded-2xl border border-violet-200/70 bg-white/80"
              />
            ))}
          </div>
        ) : null}

        {error ? (
          <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-5 text-red-700">
            {getRecipesErrorMessage(error)}
          </div>
        ) : null}

        {!isLoading && !error ? (
          <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {data?.map((recipe) => {
              const imageUrl = getRecipeImageUrl(recipe.imagePath);

              return (
                <article
                  key={recipe.id}
                  className="group overflow-hidden rounded-2xl border border-violet-200/70 bg-white/95 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
                >
                  <Image
                    src={imageUrl}
                    alt={recipe.title}
                    width={640}
                    height={352}
                    unoptimized={isExternalImageUrl(imageUrl)}
                    className="h-48 w-full object-cover transition group-hover:scale-[1.03]"
                  />
                  <div className="space-y-3 p-5">
                    <h3 className="line-clamp-2 text-xl font-semibold tracking-tight text-slate-900">
                      {recipe.title}
                    </h3>
                    <p className="line-clamp-3 text-sm leading-6 text-slate-600">
                      {recipe.description}
                    </p>
                    <Link
                      href={`/${locale}/recipes/${recipe.slug}`}
                      className="inline-flex rounded-full bg-linear-to-r from-fuchsia-500 to-violet-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:scale-[1.02] hover:opacity-95"
                    >
                      {t("ctaBrowse")}
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        ) : null}
      </section>
    </main>
  );
}
