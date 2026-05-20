import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach, vi } from "vitest";

afterEach(() => {
  cleanup();
});

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    refresh: vi.fn(),
    back: vi.fn(),
    replace: vi.fn(),
  }),
  usePathname: () => "/",
  useSearchParams: () => new URLSearchParams(),
  redirect: vi.fn(),
  notFound: vi.fn(),
}));

// Mock next/headers
vi.mock("next/headers", () => ({
  cookies: () => ({
    getAll: () => [],
    set: vi.fn(),
  }),
  headers: async () => ({
    get: () => null,
  }),
}));

// Mock @iconify/react so tests don't trigger its lazy async loader, which
// schedules a setTimeout that fires after JSDOM tears down `window` and
// crashes inside React's dispatchSetState.
const { mockReact } = vi.hoisted(() => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  return { mockReact: require("react") };
});
vi.mock("@iconify/react", () => ({
  Icon: ({
    icon,
    className,
    ...rest
  }: {
    icon: string;
    className?: string;
    [key: string]: unknown;
  }) =>
    mockReact.createElement("span", {
      "data-icon": icon,
      className,
      ...rest,
    }),
}));
