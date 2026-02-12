"use client";

import {
  QueryKey,
  UseQueryOptions,
  UseQueryResult,
  useQuery,
} from "@tanstack/react-query";

/*
  Shared API query hook.

  Centralizes common React Query defaults for API-backed reads.
*/

type UseApiQueryOptions<TData, TError> = Omit<
  UseQueryOptions<TData, TError, TData, QueryKey>,
  "queryKey" | "queryFn"
>;

export function useApiQuery<TData, TError = Error>(
  queryKey: QueryKey,
  queryFn: () => Promise<TData>,
  options?: UseApiQueryOptions<TData, TError>,
): UseQueryResult<TData, TError> {
  return useQuery<TData, TError, TData, QueryKey>({
    queryKey,
    queryFn,
    staleTime: 60_000,
    throwOnError: false,
    ...options,
  });
}

