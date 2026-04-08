import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TextFieldGroup } from "./text-field-group";
import type { TextField } from "./text-field-group";

const fields: TextField[] = [
  { key: "ancestry", label: "Ancestry", placeholder: "e.g. Firbolg, Katari" },
  { key: "community", label: "Community", placeholder: "e.g. Highborne" },
];

describe("TextFieldGroup", () => {
  it("renders all field labels", () => {
    render(<TextFieldGroup fields={fields} values={{}} onChange={vi.fn()} />);
    expect(screen.getByText("Ancestry")).toBeInTheDocument();
    expect(screen.getByText("Community")).toBeInTheDocument();
  });

  it("renders placeholders", () => {
    render(<TextFieldGroup fields={fields} values={{}} onChange={vi.fn()} />);
    expect(screen.getByPlaceholderText("e.g. Firbolg, Katari")).toBeInTheDocument();
  });

  it("shows current values", () => {
    render(
      <TextFieldGroup
        fields={fields}
        values={{ ancestry: "Firbolg", community: "Wanderborne" }}
        onChange={vi.fn()}
      />
    );
    expect(screen.getByDisplayValue("Firbolg")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Wanderborne")).toBeInTheDocument();
  });

  it("calls onChange when field value changes", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<TextFieldGroup fields={fields} values={{}} onChange={onChange} />);

    await user.type(screen.getByPlaceholderText("e.g. Firbolg, Katari"), "Katari");
    // onChange is called per keystroke
    expect(onChange).toHaveBeenCalled();
    const lastCall = onChange.mock.calls[onChange.mock.calls.length - 1][0];
    expect(lastCall).toHaveProperty("ancestry");
  });

  it("renders help text when provided", () => {
    const fieldsWithHelp: TextField[] = [
      { key: "ancestry", label: "Ancestry", helpText: "Choose your heritage" },
    ];
    render(<TextFieldGroup fields={fieldsWithHelp} values={{}} onChange={vi.fn()} />);
    expect(screen.getByText("Choose your heritage")).toBeInTheDocument();
  });

  it("renders textarea when multiline is true", () => {
    const multilineFields: TextField[] = [
      { key: "backstory", label: "Backstory", multiline: true },
    ];
    render(<TextFieldGroup fields={multilineFields} values={{}} onChange={vi.fn()} />);
    expect(screen.getByRole("textbox")).toBeInTheDocument();
    expect(screen.getByRole("textbox").tagName).toBe("TEXTAREA");
  });
});
