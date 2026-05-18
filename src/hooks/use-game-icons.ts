"use client";

import { useEffect, useState } from "react";

const ICONIFY_COLLECTION_URL =
  "https://api.iconify.design/collection?prefix=game-icons";

export const FALLBACK_GAME_ICONS: readonly string[] = [
  "game-icons:crossed-swords",
  "game-icons:spell-book",
  "game-icons:treasure-map",
  "game-icons:battle-axe",
  "game-icons:knight-banner",
  "game-icons:broadsword",
  "game-icons:castle",
  "game-icons:wolf-head",
  "game-icons:potion-ball",
];

type CacheState =
  | { status: "idle" }
  | { status: "loading"; promise: Promise<string[]> }
  | { status: "ready"; icons: string[] }
  | { status: "error"; icons: string[]; error: Error };

let cache: CacheState = { status: "idle" };

export function __resetGameIconsCacheForTests() {
  cache = { status: "idle" };
}

async function loadGameIcons(): Promise<string[]> {
  try {
    const res = await fetch(ICONIFY_COLLECTION_URL);
    if (!res.ok) {
      throw new Error(`Iconify collection fetch failed: ${res.status}`);
    }
    const data: { uncategorized?: string[] } = await res.json();
    const names = (data.uncategorized ?? []).map((n) => `game-icons:${n}`);
    if (names.length === 0) {
      throw new Error("Iconify collection returned no icons");
    }
    return names;
  } catch (err) {
    cache = {
      status: "error",
      icons: [...FALLBACK_GAME_ICONS],
      error: err instanceof Error ? err : new Error(String(err)),
    };
    throw err;
  }
}

export interface UseGameIconsResult {
  icons: string[];
  loading: boolean;
  error: Error | null;
}

export function useGameIcons(): UseGameIconsResult {
  const [icons, setIcons] = useState<string[]>(() =>
    cache.status === "ready" || cache.status === "error" ? cache.icons : []
  );
  const [loading, setLoading] = useState<boolean>(
    () => cache.status !== "ready" && cache.status !== "error"
  );
  const [error, setError] = useState<Error | null>(() =>
    cache.status === "error" ? cache.error : null
  );

  useEffect(() => {
    if (cache.status === "ready" || cache.status === "error") {
      setIcons(cache.icons);
      setLoading(false);
      setError(cache.status === "error" ? cache.error : null);
      return;
    }

    let cancelled = false;
    const promise =
      cache.status === "loading"
        ? cache.promise
        : (() => {
            const p = loadGameIcons();
            cache = { status: "loading", promise: p };
            return p;
          })();

    promise
      .then((names) => {
        cache = { status: "ready", icons: names };
        if (cancelled) return;
        setIcons(names);
        setLoading(false);
        setError(null);
      })
      .catch((err) => {
        const fallback = [...FALLBACK_GAME_ICONS];
        cache = {
          status: "error",
          icons: fallback,
          error: err instanceof Error ? err : new Error(String(err)),
        };
        if (cancelled) return;
        setIcons(fallback);
        setLoading(false);
        setError(err instanceof Error ? err : new Error(String(err)));
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return { icons, loading, error };
}
