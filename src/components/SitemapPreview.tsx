"use client";

import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useQueryClient } from "@tanstack/react-query";
import { useApiMutation } from "@/lib/useApiMutation";
import { useApiQuery } from "@/lib/useApiQuery";
import { MAX_SEED_AMOUNT, triggerSeedRecipes } from "@/lib/recipesApi";
import { revalidate } from "@/app/sitemap";

const MIN_REVALIDATE_SECONDS = 5;
const MAX_REVALIDATE_SECONDS = 300;
const DEFAULT_REVALIDATE_SECONDS = revalidate;

async function fetchSitemapXml(): Promise<string> {
  const response = await fetch("/sitemap.xml", { cache: "no-store" });
  if (!response.ok) {
    throw new Error("Unable to load sitemap.");
  }

  return response.text();
}

export function SitemapPreview() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [revalidateSeconds, setRevalidateSeconds] = useState(
    DEFAULT_REVALIDATE_SECONDS,
  );
  const [countdown, setCountdown] = useState(DEFAULT_REVALIDATE_SECONDS);
  const [dialogSeedAmount, setDialogSeedAmount] = useState(1);
  const [dialogSeedMessage, setDialogSeedMessage] = useState<string | null>(
    null,
  );

  const {
    data: sitemapXml,
    error: sitemapError,
    isLoading: isSitemapLoading,
    isFetching: isSitemapFetching,
    refetch: refetchSitemap,
  } = useApiQuery(["sitemap-preview"], fetchSitemapXml, {
    staleTime: 0,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  useEffect(() => {
    setCountdown(revalidateSeconds);
  }, [revalidateSeconds]);

  useEffect(() => {
    const timerId = window.setTimeout(() => {
      if (isSitemapFetching) {
        return;
      }

      if (countdown <= 1) {
        setCountdown(revalidateSeconds);
        void refetchSitemap();
        return;
      }

      setCountdown((value) => value - 1);
    }, 1000);

    return () => window.clearTimeout(timerId);
  }, [countdown, isSitemapFetching, revalidateSeconds, refetchSitemap]);

  const seedMutation = useApiMutation(triggerSeedRecipes, {
    onSuccess: async (result) => {
      setDialogSeedMessage(
        t("seedSuccess", {
          amount: result.amount,
          seeded: result.seeded,
        }),
      );
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["recipes"] }),
        queryClient.invalidateQueries({ queryKey: ["recipe"] }),
      ]);
      // Keep sitemap refresh timer-driven to demonstrate revalidation delay.
      setCountdown(revalidateSeconds);
    },
    onError: (seedError: Error) => {
      setDialogSeedMessage(
        seedError instanceof Error ? seedError.message : t("seedFailed"),
      );
    },
  });

  const handleDialogSeedSubmit = async (
    event: React.SyntheticEvent<HTMLFormElement, SubmitEvent>,
  ) => {
    event.preventDefault();

    if (
      !Number.isInteger(dialogSeedAmount) ||
      dialogSeedAmount < 1 ||
      dialogSeedAmount > MAX_SEED_AMOUNT
    ) {
      setDialogSeedMessage(t("seedRange", { max: MAX_SEED_AMOUNT }));
      return;
    }

    setDialogSeedMessage(null);
    try {
      await seedMutation.mutateAsync(dialogSeedAmount);
    } catch {
      // Error state is handled in mutation onError.
    }
  };

  return (
    <section>
      <div className="rounded-2xl border border-violet-200/70 bg-white/85 p-4 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-sm font-semibold tracking-wide text-slate-800">
            {t("sitemapPreviewTitle")}
          </h3>

          <div className="flex items-center gap-3">
            <div className="text-xs text-slate-600">
              {isSitemapFetching
                ? t("sitemapRevalidating")
                : t("sitemapCountdown", { seconds: countdown })}
            </div>

            <button
              type="button"
              onClick={() => setIsDialogOpen(true)}
              className="rounded-md border border-violet-300 bg-white px-2 py-1 text-xs font-medium text-violet-700 hover:bg-violet-50"
            >
              {t("sitemapOpenDialog")}
            </button>
          </div>
        </div>

        <p className="mt-2 text-xs text-slate-500">{t("sitemapPreviewHint")}</p>

        <div className="relative mt-3 h-44 overflow-auto rounded-xl border border-slate-200 bg-slate-950/95 p-3">
          {isSitemapLoading ? (
            <p className="text-xs text-slate-200">{t("sitemapLoading")}</p>
          ) : null}

          {!isSitemapLoading && sitemapError ? (
            <p className="text-xs text-red-300">{t("sitemapLoadFailed")}</p>
          ) : null}

          {!isSitemapLoading && !sitemapError && sitemapXml ? (
            <pre className="whitespace-pre-wrap break-all text-[11px] leading-5 text-emerald-200">
              {sitemapXml}
            </pre>
          ) : null}

          {isSitemapFetching ? (
            <div className="absolute inset-0 flex items-center justify-center bg-slate-950/50">
              <span className="rounded-md bg-slate-900/80 px-2 py-1 text-xs text-slate-100">
                {t("sitemapLoading")}
              </span>
            </div>
          ) : null}
        </div>
      </div>

      {isDialogOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="w-full max-w-5xl rounded-2xl border border-violet-200 bg-white p-5 shadow-2xl">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-base font-semibold text-slate-900">
                {t("sitemapPreviewTitle")}
              </h3>

              <button
                type="button"
                onClick={() => setIsDialogOpen(false)}
                className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                {t("sitemapCloseDialog")}
              </button>
            </div>

            <div className="flex items-start justify-between space-x-5 mt-4">
              <div className=" flex flex-col justify-start space-y-2.5">
                <label className="flex flex-col text-sm text-slate-700">
                  <span className="mb-1 font-medium">
                    {t("sitemapIntervalLabel")}
                  </span>

                  <input
                    type="number"
                    min={MIN_REVALIDATE_SECONDS}
                    max={MAX_REVALIDATE_SECONDS}
                    value={revalidateSeconds}
                    onChange={(event) => {
                      const nextValue = Number(event.target.value);
                      if (!Number.isInteger(nextValue)) {
                        return;
                      }

                      if (
                        nextValue < MIN_REVALIDATE_SECONDS ||
                        nextValue > MAX_REVALIDATE_SECONDS
                      ) {
                        return;
                      }

                      setRevalidateSeconds(nextValue);
                    }}
                    className="w-36 rounded-lg border border-violet-200 bg-white px-3 py-2 text-slate-900"
                  />
                </label>

                <div className="text-base text-emerald-600">
                  {isSitemapFetching
                    ? t("sitemapRevalidating")
                    : t("sitemapCountdown", { seconds: countdown })}
                </div>
              </div>

              <form
                onSubmit={handleDialogSeedSubmit}
                className="flex flex-col items-end gap-3"
              >
                <div className="flex items-end space-x-5">
                  <label className="flex flex-col text-sm text-slate-700">
                    <span className="mb-1 font-medium">
                      {t("seedAmountLabel")}
                    </span>
                    <input
                      type="number"
                      min={1}
                      max={MAX_SEED_AMOUNT}
                      value={dialogSeedAmount}
                      onChange={(event) =>
                        setDialogSeedAmount(Number(event.target.value))
                      }
                      className="w-28 rounded-lg border border-violet-200 bg-white px-3 py-2 text-slate-900"
                    />
                  </label>

                  <button
                    type="submit"
                    disabled={seedMutation.isPending}
                    className="rounded-full mb-0.5 bg-linear-to-r from-violet-600 to-sky-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {seedMutation.isPending ? t("seeding") : t("seedNow")}
                  </button>
                </div>

                <p className="text-sm self-start text-slate-600">
                  {t("seedLimitHint", { max: MAX_SEED_AMOUNT })}
                </p>
              </form>
            </div>

            {dialogSeedMessage ? (
              <p className="mt-4 text-sm text-slate-700">{dialogSeedMessage}</p>
            ) : null}

            <div className="relative mt-4 h-[60vh] overflow-auto rounded-xl border border-slate-200 bg-slate-950/95 p-4">
              {isSitemapLoading ? (
                <p className="text-xs text-slate-200">{t("sitemapLoading")}</p>
              ) : null}

              {!isSitemapLoading && sitemapError ? (
                <p className="text-xs text-red-300">{t("sitemapLoadFailed")}</p>
              ) : null}

              {!isSitemapLoading && !sitemapError && sitemapXml ? (
                <pre className="whitespace-pre-wrap break-all text-[12px] leading-6 text-emerald-200">
                  {sitemapXml}
                </pre>
              ) : null}

              {isSitemapFetching ? (
                <div className="absolute inset-0 flex items-center justify-center bg-slate-950/50">
                  <span className="rounded-md bg-slate-900/80 px-2 py-1 text-xs text-slate-100">
                    {t("sitemapLoading")}
                  </span>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
