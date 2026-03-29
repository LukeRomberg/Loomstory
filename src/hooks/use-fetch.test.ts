import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useFetch } from "./use-fetch";

vi.mock("sonner", () => ({
  toast: {
    loading: vi.fn(() => "toast-id"),
    success: vi.fn(),
    error: vi.fn(),
    dismiss: vi.fn(),
  },
}));

describe("useFetch", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns initial state with loading=false, data=null, error=null", () => {
    const { result } = renderHook(() => useFetch());
    expect(result.current.loading).toBe(false);
    expect(result.current.data).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it("returns an execute function", () => {
    const { result } = renderHook(() => useFetch());
    expect(typeof result.current.execute).toBe("function");
  });

  it("sets loading=true while executing", async () => {
    const { result } = renderHook(() => useFetch());
    let resolvePromise: (v: string) => void;
    const promise = new Promise<string>((resolve) => { resolvePromise = resolve; });

    act(() => {
      result.current.execute(() => promise, { loadingMessage: "Loading..." });
    });

    expect(result.current.loading).toBe(true);

    await act(async () => { resolvePromise!("done"); });
    expect(result.current.loading).toBe(false);
  });

  it("sets data on successful execution", async () => {
    const { result } = renderHook(() => useFetch());
    await act(async () => {
      await result.current.execute(() => Promise.resolve({ name: "Gareth" }), {
        successMessage: "Loaded!",
      });
    });
    expect(result.current.data).toEqual({ name: "Gareth" });
  });

  it("sets error on failed execution", async () => {
    const { result } = renderHook(() => useFetch());
    await act(async () => {
      await result.current.execute(
        () => Promise.reject(new Error("Network error")),
        { errorMessage: "Failed" }
      );
    });
    expect(result.current.error).toBe("Network error");
  });

  it("shows loading toast when loadingMessage is provided", async () => {
    const { toast } = await import("sonner");
    const { result } = renderHook(() => useFetch());
    await act(async () => {
      await result.current.execute(() => Promise.resolve("ok"), {
        loadingMessage: "Saving...",
      });
    });
    expect(toast.loading).toHaveBeenCalledWith("Saving...");
  });

  it("shows success toast when successMessage is provided", async () => {
    const { toast } = await import("sonner");
    const { result } = renderHook(() => useFetch());
    await act(async () => {
      await result.current.execute(() => Promise.resolve("ok"), {
        successMessage: "Saved!",
      });
    });
    expect(toast.success).toHaveBeenCalledWith("Saved!");
  });

  it("shows error toast on failure", async () => {
    const { toast } = await import("sonner");
    const { result } = renderHook(() => useFetch());
    await act(async () => {
      await result.current.execute(
        () => Promise.reject(new Error("Oops")),
        { errorMessage: "Something went wrong" }
      );
    });
    expect(toast.error).toHaveBeenCalledWith("Something went wrong", expect.objectContaining({ description: "Oops" }));
  });

  it("returns the result from execute", async () => {
    const { result } = renderHook(() => useFetch());
    let returned: unknown;
    await act(async () => {
      returned = await result.current.execute(() => Promise.resolve(42));
    });
    expect(returned).toBe(42);
  });
});
