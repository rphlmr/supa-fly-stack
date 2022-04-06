import { useEffect, useMemo, useRef } from "react";

import { useMatches } from "@remix-run/react";

/**
 * This base hook is used in other hooks to quickly search for specific data
 * across all loader data using useMatches.
 * @param {string} id The route id
 * @returns {JSON|undefined} The router data or undefined if not found
 */
export function useMatchesData<T>(id: string): T | undefined {
  const matchingRoutes = useMatches();
  const route = useMemo(
    () => matchingRoutes.find((route) => route.id === id),
    [matchingRoutes, id]
  );
  return (route?.data as T) || undefined;
}

// https://overreacted.io/making-setinterval-declarative-with-react-hooks/
/**
 * useInterval
 * @param callback
 * @param delay - in seconds
 */
export function useInterval(callback: () => void, delay?: number) {
  const savedCallback = useRef<() => void>();

  // Remember the latest callback.
  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  // Set up the interval.
  useEffect(() => {
    function tick() {
      savedCallback.current?.();
    }
    if (delay) {
      const id = setInterval(tick, delay * 1_000);
      return () => clearInterval(id);
    }
  }, [delay]);
}
