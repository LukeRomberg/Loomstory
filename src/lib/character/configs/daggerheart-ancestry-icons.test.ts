import { describe, it, expect } from "vitest";
import {
  DAGGERHEART_ANCESTRY_ICONS,
  DAGGERHEART_ANCESTRY_IMAGES,
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

  it("every path lives under /ancestries/ and ends in .png", () => {
    for (const [ancestry, path] of Object.entries(DAGGERHEART_ANCESTRY_IMAGES)) {
      expect(path, `${ancestry} path must start with /ancestries/`).toMatch(/^\/ancestries\//);
      expect(path, `${ancestry} path must end with .png`).toMatch(/\.png$/);
    }
  });
});
