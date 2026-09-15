"use client";

import { useEffect } from "react";

/**
 * Prevents mobile Safari and other browsers from auto-scrolling to the bottom of the page
 * on reload or initial page visit by turning off automatic scroll restoration and ensuring
 * the viewport stays pinned at the top.
 */
export function ScrollRestoration() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    if ("scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }

    if (!window.location.hash) {
      window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    }
  }, []);

  return null;
}
