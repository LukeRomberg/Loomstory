import { describe, it, expect } from "vitest";
import { domainCardToPickerCard } from "./character-wizard";
import { DAGGERHEART_DOMAIN_THEMES } from "@/lib/character/configs/daggerheart-domain-themes";
import type { ClassTheme } from "@/lib/character/wizard-types";
import { Sword, Swords, Crosshair } from "lucide-react";

// A stand-in class theme used to prove the function ignores the class theme
// when a domain theme is available. Picked deliberately distinct colors so a
// regression (falling back to class theme) shows up as a string mismatch.
const FAKE_WARRIOR_THEME: ClassTheme = {
  gradient: "from-FAKE-CLASS to-FAKE-CLASS",
  borderColor: "border-FAKE-CLASS",
  textColor: "text-FAKE-CLASS",
  icon: Sword,
  domains: ["Blade", "Bone"],
};

function makeCard(domain: string, overrides: Record<string, unknown> = {}) {
  return {
    id: `card-${domain.toLowerCase()}-test`,
    name: `${domain} Test Card`,
    ability_type: "domain_card" as const,
    description: "Test description.",
    level: 1,
    classes: ["Warrior"],
    source: "Daggerheart SRD",
    data: { domain, card_type: "ability", recall_cost: 0, ...overrides },
  };
}

describe("domainCardToPickerCard", () => {
  it("uses the domain theme's gradient/border/text — not the class theme", () => {
    const card = makeCard("Blade");
    const result = domainCardToPickerCard(card, FAKE_WARRIOR_THEME);

    const bladeTheme = DAGGERHEART_DOMAIN_THEMES.Blade;
    expect(result.gradient).toBe(bladeTheme.gradient);
    expect(result.borderColor).toBe(bladeTheme.borderColor);
    expect(result.textColor).toBe(bladeTheme.textColor);

    // Sanity: did NOT fall back to the class theme.
    expect(result.gradient).not.toContain("FAKE-CLASS");
  });

  it("picks the matching theme per domain so two cards from the same class look different", () => {
    const bladeCard = domainCardToPickerCard(makeCard("Blade"), FAKE_WARRIOR_THEME);
    const boneCard = domainCardToPickerCard(makeCard("Bone"), FAKE_WARRIOR_THEME);

    expect(bladeCard.borderColor).toBe(DAGGERHEART_DOMAIN_THEMES.Blade.borderColor);
    expect(boneCard.borderColor).toBe(DAGGERHEART_DOMAIN_THEMES.Bone.borderColor);
    expect(bladeCard.borderColor).not.toBe(boneCard.borderColor);
  });

  it("sets the domain icon on the picker card", () => {
    const bladeCard = domainCardToPickerCard(makeCard("Blade"), FAKE_WARRIOR_THEME);
    const boneCard = domainCardToPickerCard(makeCard("Bone"), FAKE_WARRIOR_THEME);

    expect(bladeCard.icon).toBe(Swords);
    expect(boneCard.icon).toBe(Crosshair);
  });

  it("falls back to the class theme when the card has no domain", () => {
    const card = makeCard("Blade", { domain: undefined });
    const result = domainCardToPickerCard(card, FAKE_WARRIOR_THEME);

    expect(result.gradient).toBe(FAKE_WARRIOR_THEME.gradient);
    expect(result.borderColor).toBe(FAKE_WARRIOR_THEME.borderColor);
    expect(result.textColor).toBe(FAKE_WARRIOR_THEME.textColor);
  });

  it("falls back to the class theme when the domain name is unknown", () => {
    const card = makeCard("NotARealDomain");
    const result = domainCardToPickerCard(card, FAKE_WARRIOR_THEME);

    expect(result.gradient).toBe(FAKE_WARRIOR_THEME.gradient);
    expect(result.borderColor).toBe(FAKE_WARRIOR_THEME.borderColor);
  });

  it("still emits the domain/recall/card_type badges", () => {
    const card = makeCard("Blade", { recall_cost: 2 });
    const result = domainCardToPickerCard(card, FAKE_WARRIOR_THEME);

    const labels = (result.badges ?? []).map((b) => b.label);
    expect(labels).toContain("Blade");
    expect(labels).toContain("Recall 2");
    expect(labels).toContain("ability");
  });
});
