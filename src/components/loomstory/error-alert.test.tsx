import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ErrorAlert } from "./error-alert";

describe("ErrorAlert", () => {
  it("renders error message", () => {
    render(<ErrorAlert message="Something went wrong" />);
    expect(screen.getByText("Something went wrong")).toBeInTheDocument();
  });

  it("has alert role", () => {
    render(<ErrorAlert message="Error" />);
    expect(screen.getByRole("alert")).toBeInTheDocument();
  });

  it("applies custom className", () => {
    render(<ErrorAlert message="Error" className="mt-4" />);
    const alert = screen.getByRole("alert");
    expect(alert.className).toContain("mt-4");
  });
});
