"use client";

import {
  DefaultError,
  MutationFunction,
  UseMutationOptions,
  UseMutationResult,
  useMutation,
} from "@tanstack/react-query";

/*
  Shared API mutation hook.

  Centralizes React Query mutation usage for API-backed writes.
*/

type UseApiMutationOptions<
  TData,
  TVariables,
  TError = DefaultError,
  TContext = unknown,
> = Omit<
  UseMutationOptions<TData, TError, TVariables, TContext>,
  "mutationFn"
>;

export type ApiMutationMethod = "POST" | "PUT" | "PATCH" | "DELETE";

export interface ApiMutationRequest<TBody = unknown> {
  url: string;
  method: ApiMutationMethod;
  body?: TBody;
  headers?: HeadersInit;
}

export interface ApiMethodMutationConfig<TVariables> {
  url: string | ((variables: TVariables) => string);
  method: ApiMutationMethod;
  headers?: HeadersInit | ((variables: TVariables) => HeadersInit);
  toBody?: (variables: TVariables) => unknown;
}

export async function runApiMutationRequest<TData, TBody = unknown>({
  url,
  method,
  body,
  headers,
}: ApiMutationRequest<TBody>): Promise<TData> {
  const hasBody = body !== undefined;

  const response = await fetch(url, {
    method,
    headers: {
      ...(hasBody ? { "Content-Type": "application/json" } : {}),
      ...(headers ?? {}),
    },
    body: hasBody ? JSON.stringify(body) : undefined,
    cache: "no-store",
  });

  const raw = await response.text();
  const payload: unknown = raw ? JSON.parse(raw) : undefined;

  if (!response.ok) {
    const message =
      typeof payload === "object" &&
      payload !== null &&
      "message" in payload &&
      typeof (payload as { message?: unknown }).message === "string"
        ? (payload as { message: string }).message
        : "Request failed.";
    throw new Error(message);
  }

  return payload as TData;
}

export function useApiMutation<
  TData,
  TVariables,
  TError = DefaultError,
  TContext = unknown,
>(
  mutationFn: MutationFunction<TData, TVariables>,
  options?: UseApiMutationOptions<TData, TVariables, TError, TContext>,
): UseMutationResult<TData, TError, TVariables, TContext> {
  return useMutation<TData, TError, TVariables, TContext>({
    mutationFn,
    ...options,
  });
}

export function useApiMethodMutation<
  TData,
  TVariables,
  TError = DefaultError,
  TContext = unknown,
>(
  config: ApiMethodMutationConfig<TVariables>,
  options?: UseApiMutationOptions<TData, TVariables, TError, TContext>,
): UseMutationResult<TData, TError, TVariables, TContext> {
  return useApiMutation<TData, TVariables, TError, TContext>(
    async (variables: TVariables) => {
      const url =
        typeof config.url === "function" ? config.url(variables) : config.url;
      const headers =
        typeof config.headers === "function"
          ? config.headers(variables)
          : config.headers;
      const body = config.toBody ? config.toBody(variables) : undefined;

      return runApiMutationRequest<TData>({
        url,
        method: config.method,
        headers,
        body,
      });
    },
    options,
  );
}
