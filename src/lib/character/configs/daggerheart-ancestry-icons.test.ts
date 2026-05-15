import { describe, it, expect } from "vitest";
import {
  DAGGERHEART_ANCESTRY_ICONS,
  DAGGERHEART_ANCESTRY_IMAGES,
  getAncestryImage,
} from "./daggerheart-ancestry-icons";

// Every Daggerheart SRD ancestry — keep this list canonical with the seed
// migration. Any new ancestry added in the SRD should fail this test until an
// icon is picked.
const ALL_DAGGERHEART_ANCESTRIES = [
  "Clank",
  "Drakona",
  "Dwarf",
  "Elf",
  "Faerie",
  "Faun",
  "Firbolg",
  "Fungril",
  "Galapa",
  "Giant",
  "Goblin",
  "Halfling",
  "Human",
  "Infernis",
  "Katari",
  "Orc",
  "Ribbet",
  "Simiah",
];

describe("DAGGERHEART_ANCESTRY_ICONS", () => {
  it("provides an icon for all 18 Daggerheart ancestries", () => {
    for (const ancestry of ALL_DAGGERHEART_ANCESTRIES) {
      expect(
        DAGGERHEART_ANCESTRY_ICONS[ancestry],
        `Missing icon for ancestry: ${ancestry}`
      ).toBeDefined();
    }
  });

  it("has no extra entries beyond the canonical 18 ancestries", () => {
    const keys = Object.keys(DAGGERHEART_ANCESTRY_ICONS).sort();
    expect(keys).toEqual([...ALL_DAGGERHEART_ANCESTRIES].sort());
  });

  it("every entry is a truthy Lucide component", () => {
    for (const [ancestry, icon] of Object.entries(DAGGERHEART_ANCESTRY_ICONS)) {
      expect(icon, `${ancestry} icon must not be null/undefined`).toBeTruthy();
    }
  });
});

describe("DAGGERHEART_ANCESTRY_IMAGES", () => {
  it("only references ancestries that exist in the canonical list", () => {
    for (const ancestry of Object.keys(DAGGERHEART_ANCESTRY_IMAGES)) {
      expect(
        ALL_DAGGERHEART_ANCESTRIES,
        `${ancestry} is in the images map but not in the canonical ancestry list`
      ).toContain(ancestry);
    }
  });

  it("every variant path lives under /ancestries/ and ends in .png", () => {
    for (const [ancestry, art] of Object.entries(DAGGERHEART_ANCESTRY_IMAGES)) {
      for (const [variant, path] of Object.entries(art)) {
        expect(path, `${ancestry}.${variant} path must start with /ancestries/`).toMatch(
          /^\/ancestries\//
        );
        expect(path, `${ancestry}.${variant} path must end with .png`).toMatch(/\.png$/);
      }
    }
  });

  it("every entry has at least one variant", () => {
    for (const [ancestry, art] of Object.entries(DAGGERHEART_ANCESTRY_IMAGES)) {
      expect(
        Object.keys(art).length,
        `${ancestry} must have at least one of female/male/neutral`
      ).toBeGreaterThan(0);
    }
  });
});

describe("getAncestryImage", () => {
  it("returns neutral art for ungendered ancestries regardless of variant (Clank)", () => {
    expect(getAncestryImage("Clank", "female")).toBe("/ancestries/Clank.png");
    expect(getAncestryImage("Clank", "male")).toBe("/ancestries/Clank.png");
  });

  it("returns the preferred variant when both exist", () => {
    expect(getAncestryImage("Drakona", "female")).toBe("/ancestries/Drakona-f.png");
    expect(getAncestryImage("Drakona", "male")).toBe("/ancestries/Drakona-m.png");
  });

  it("falls back to the other variant when the preferred one is missing", () => {
    // Firbolg only has male art; asking for female should still return male.
    expect(getAncestryImage("Firbolg", "female")).toBe("/ancestries/Firbolg-m.png");
    expect(getAncestryImage("Firbolg", "male")).toBe("/ancestries/Firbolg-m.png");

    // Fungril only has female art.
    expect(getAncestryImage("Fungril", "male")).toBe("/ancestries/Fungril-f.png");
  });

  it("returns null for ancestries without any art (forward-compat)", () => {
    expect(getAncestryImage("Nonexistent", "female")).toBeNull();
  });
});
