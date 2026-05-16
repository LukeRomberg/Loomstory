import { describe, it, expect, vi, beforeEach } from "vitest";
import { getRequestUser, requireUser } from "./auth";

const headerMap = new Map<string, string>();

vi.mock("next/headers", () => ({
  headers: vi.fn(async () => ({
    get: (name: string) => headerMap.get(name) ?? null,
  })),
}));

describe("getRequestUser", () => {
  beforeEach(() => {
    headerMap.clear();
  });

  it("returns user when x-user-id header is set", async () => {
    headerMap.set("x-user-id", "user-abc");
    headerMap.set("x-user-email", "test@loomstory.app");

    const user = await getRequestUser();

    expect(user).toEqual({ id: "user-abc", email: "test@loomstory.app" });
  });

  it("returns user with null email when only id is set", async () => {
    headerMap.set("x-user-id", "user-abc");

    const user = await getRequestUser();

    expect(user).toEqual({ id: "user-abc", email: null });
  });

  it("returns null when x-user-id header is missing", async () => {
    const user = await getRequestUser();

    expect(user).toBeNull();
  });
});

describe("requireUser", () => {
  beforeEach(() => {
    headerMap.clear();
  });

  it("returns user when x-user-id header is set", async () => {
    headerMap.set("x-user-id", "user-abc");

    const user = await requireUser();

    expect(user.id).toBe("user-abc");
  });

  it("throws when x-user-id header is missing", async () => {
    await expect(requireUser()).rejects.toThrow(
      /requireUser called without authenticated user/,
    );
  });
});
