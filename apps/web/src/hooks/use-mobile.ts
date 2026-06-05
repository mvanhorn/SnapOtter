import { useEffect, useState } from "react";

const MOBILE_BREAKPOINT = 768;

/**
 * Generic media-query hook. Returns true when the query matches.
 * Guards against missing `window.matchMedia` for test environments.
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") return false;
    return window.matchMedia(query).matches;
  });

  useEffect(() => {
    if (typeof window.matchMedia !== "function") return;
    const mq = window.matchMedia(query);
    const handler = (e: MediaQueryListEvent) => setMatches(e.matches);
    mq.addEventListener("change", handler);
    setMatches(mq.matches);
    return () => mq.removeEventListener("change", handler);
  }, [query]);

  return matches;
}

/**
 * Returns true when the viewport width is below the mobile breakpoint (768px).
 */
export function useMobile(): boolean {
  return useMediaQuery(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
}

/**
 * Returns true when the primary input device is a coarse pointer (touch).
 */
export function useTouchDevice(): boolean {
  return useMediaQuery("(pointer: coarse)");
}
