import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import {
  useGameIcons,
  __resetGameIconsCacheForTests,
  FALLBACK_GAME_ICONS,
} from "./use-game-icons";

describe("useGameIcons", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    __resetGameIconsCacheForTests();
  });

  afterEach(() => {
    global.fetch = originalFetch;
    vi.clearAllMocks();
  });

  it("fetches the game-icons collection on first call", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ uncategorized: ["wolf-head", "castle"] }),
    });
    global.fetch = fetchMock as unknown as typeof fetch;

    const { result } = renderHook(() => useGameIcons());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    expect(result.current.icons).toEqual([
      "game-icons:wolf-head",
      "game-icons:castle",
    ]);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("returns cached results on subsequent renders without re-fetching", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ uncategorized: ["wolf-head"] }),
    });
    global.fetch = fetchMock as unknown as typeof fetch;

    const first = renderHook(() => useGameIcons());
    await waitFor(() => expect(first.result.current.loading).toBe(false));

    const second = renderHook(() => useGameIcons());
    // Cached — should resolve synchronously on next tick
    await waitFor(() => expect(second.result.current.loading).toBe(false));

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(second.result.current.icons.length).toBeGreaterThan(0);
  });

  it("falls back to the curated 9 when the fetch errors out", async () => {
    global.fetch = vi
      .fn()
      .mockRejectedValue(new Error("network down")) as unknown as typeof fetch;

    const { result } = renderHook(() => useGameIcons());

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.icons).toEqual(FALLBACK_GAME_ICONS);
    expect(result.current.error).toBeTruthy();
  });

  it("falls back when the response is not ok", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
    }) as unknown as typeof fetch;

    const { result } = renderHook(() => useGameIcons());

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.icons).toEqual(FALLBACK_GAME_ICONS);
  });
});
