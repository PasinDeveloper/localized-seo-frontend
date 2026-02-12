"use client";

import axios from "axios";
import { apiClient } from "./axios.instance";
import { useApiQuery } from "./useApiQuery";

/*
  Client-side recipe data access layer.

  Responsibilities:
  - Fetch recipes and recipe details from backend API.
  - Normalize locale-aware slug lookups.
  - Expose React Query hooks used by recipe list/detail components.
*/

export interface Recipe {
  id: string;
  slug: string;
  locale: string;
  title: string;
  description: string;
  ingredients: string[];
  steps: string[];
  imagePath: string;
  createdAt: string;
  updatedAt: string;
}

export interface ApiErrorResponse {
  message?: string;
}

export interface SeedRecipesResponse {
  seeded: number;
  amount: number;
}

export const MAX_SEED_AMOUNT = 50;

function readApiError(error: unknown): string {
  const fallback = "Unable to load recipes.";
  if (!axios.isAxiosError<ApiErrorResponse>(error)) {
    return fallback;
  }

  return error.response?.data?.message ?? fallback;
}

async function fetchRecipes(locale: string): Promise<Recipe[]> {
  const response = await apiClient.get<Recipe[]>("/recipes", {
    params: { locale },
  });

  return response.data;
}

async function fetchRecipe(idOrSlug: string): Promise<Recipe> {
  const response = await apiClient.get<Recipe>(`/recipes/${idOrSlug}`);
  return response.data;
}

function normalizeRecipeSlugByLocale(idOrSlug: string, locale: string): string {
  return idOrSlug.replace(/^(en|fr)-/, `${locale}-`);
}

function extractSlugNumber(slug: string): number | null {
  const match = slug.match(/recipe-(\d+)$/);
  if (!match) {
    return null;
  }

  return Number.parseInt(match[1], 10);
}

function buildSlug(locale: string, numberValue: number): string {
  return `${locale}-recipe-${String(numberValue).padStart(3, "0")}`;
}

async function fetchRecipeForLocale(
  idOrSlug: string,
  locale: string,
): Promise<Recipe> {
  // Translate route slug to the requested locale namespace.
  const normalized = normalizeRecipeSlugByLocale(idOrSlug, locale);

  try {
    return await fetchRecipe(normalized);
  } catch (error) {
    if (!axios.isAxiosError(error) || error.response?.status !== 404) {
      throw error;
    }

    const recipes = await fetchRecipes(locale);
    if (!recipes.length) {
      throw error;
    }

    const currentNumber = extractSlugNumber(idOrSlug);
    if (currentNumber !== null) {
      // Prefer exact same recipe index across locales (e.g., 001 -> 001).
      const sameIndexSlug = buildSlug(locale, currentNumber);
      const sameIndex = recipes.find((recipe) => recipe.slug === sameIndexSlug);
      if (sameIndex) {
        return sameIndex;
      }
    }

    return recipes[0];
  }
}

export function useRecipesQuery(locale: string) {
  return useApiQuery(["recipes", locale], () => fetchRecipes(locale), {
    enabled: Boolean(locale),
  });
}

export function useRecipeQuery(idOrSlug: string, locale: string) {
  const normalized = normalizeRecipeSlugByLocale(idOrSlug, locale);

  return useApiQuery(
    ["recipe", idOrSlug, normalized],
    () => fetchRecipeForLocale(idOrSlug, locale),
    {
      enabled: Boolean(normalized),
    },
  );
}

export function getRecipesErrorMessage(error: unknown): string {
  return readApiError(error);
}

export async function triggerSeedRecipes(
  amount: number,
): Promise<SeedRecipesResponse> {
  const internalApiKey = process.env.NEXT_PUBLIC_INTERNAL_API_KEY;
  if (!internalApiKey) {
    throw new Error("NEXT_PUBLIC_INTERNAL_API_KEY is not configured.");
  }

  try {
    const response = await apiClient.post<SeedRecipesResponse>(
      "/recipes/seed",
      { amount },
      {
        headers: {
          "x-internal-api-key": internalApiKey,
        },
      },
    );

    return response.data;
  } catch (error) {
    if (axios.isAxiosError<ApiErrorResponse>(error)) {
      throw new Error(
        error.response?.data?.message ?? "Unable to seed recipes.",
      );
    }

    throw new Error("Unable to seed recipes.");
  }
}

export function getRecipeImageUrl(imagePath: string): string {
  if (/^https?:\/\//i.test(imagePath)) {
    return imagePath;
  }

  const baseUrl =
    process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ??
    "http://localhost:3010";
  const normalizedPath = imagePath.startsWith("/")
    ? imagePath
    : `/${imagePath}`;
  return `${baseUrl}${normalizedPath}`;
}

export function isExternalImageUrl(url: string): boolean {
  return /^https?:\/\//i.test(url);
}
