import type {
  FetcherWithComponents,
  UseDataFunctionReturn,
} from "@remix-run/react/dist/components";
import { useFetcher as remixUseFetcher } from "@remix-run/react/dist/components";

type TypedFetcherWithComponents<T> = Omit<FetcherWithComponents<T>, "data"> & {
  data: UseDataFunctionReturn<T> | null;
};
export function useFetcher<T>(): TypedFetcherWithComponents<T> {
  return remixUseFetcher<T>() as TypedFetcherWithComponents<T>;
}
