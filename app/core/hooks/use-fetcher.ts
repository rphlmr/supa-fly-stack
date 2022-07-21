import { useFetcher } from "@remix-run/react";
import type { FetcherWithComponents } from "@remix-run/react";
import type { UseDataFunctionReturn } from "@remix-run/react/dist/components";

type TypedFetcherWithComponents<T> = Omit<FetcherWithComponents<T>, "data"> & {
  data: UseDataFunctionReturn<T> | null;
};
export function useTypedFetcher<T>(): TypedFetcherWithComponents<T> {
  return useFetcher<T>() as TypedFetcherWithComponents<T>;
}
