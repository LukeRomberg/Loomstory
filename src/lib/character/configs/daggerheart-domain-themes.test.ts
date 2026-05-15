import { describe, it, expect } from "vitest";
import {
  BookOpen, Crosshair, HeartPulse, Mic, Moon, ShieldCheck,
  Sprout, Swords, Zap,
} from "lucide-react";
import { DAGGERHEART_DOMAIN_THEMES } from "./daggerheart-domain-themes";

// Canonical list of the 9 Daggerheart SRD domains (page 7). Any new domain
// added to the SRD must also be added here — this test will fail until it is.
const ALL_DAGGERHEART_DOMAINS = [
  "Arcana",
  "Blade",
  "Bone",
  "Codex",
  "Grace",
  "Midnight",
  "Sage",
  "Splendor",
  "Valor",
];

describe("DAGGERHEART_DOMAIN_THEMES", () => {
  it("provides a theme for all 9 Daggerheart domains", () => {
    for (const domain of ALL_DAGGERHEART_DOMAINS) {
      expect(
        DAGGERHEART_DOMAIN_THEMES[domain],
        `Missing theme for domain: ${domain}`
      ).toBeDefined();
    }
  });

  it("has no extra entries beyond the canonical 9 domains", () => {
    const keys = Object.keys(DAGGERHEART_DOMAIN_THEMES).sort();
    expect(keys).toEqual([...ALL_DAGGERHEART_DOMAINS].sort());
  });

  it("every theme has gradient, borderColor, textColor, and icon", () => {
    for (const [domain, theme] of Object.entries(DAGGERHEART_DOMAIN_THEMES)) {
      expect(theme.gradient, `${domain} missing gradient`).toBeTruthy();
      expect(theme.borderColor, `${domain} missing borderColor`).toBeTruthy();
      expect(theme.textColor, `${domain} missing textColor`).toBeTruthy();
      expect(theme.icon, `${domain} missing icon`).toBeTruthy();
    }
  });

  it("uses the locked-in icon for each domain", () => {
    // These pairings were chosen with the user — see PR / chat context. Changing
    // an icon here is a deliberate design choice and should update this test.
    expect(DAGGERHEART_DOMAIN_THEMES.Arcana.icon).toBe(Zap);
    expect(DAGGERHEART_DOMAIN_THEMES.Blade.icon).toBe(Swords);
    expect(DAGGERHEART_DOMAIN_THEMES.Bone.icon).toBe(Crosshair);
    expect(DAGGERHEART_DOMAIN_THEMES.Codex.icon).toBe(BookOpen);
    expect(DAGGERHEART_DOMAIN_THEMES.Grace.icon).toBe(Mic);
    expect(DAGGERHEART_DOMAIN_THEMES.Midnight.icon).toBe(Moon);
    expect(DAGGERHEART_DOMAIN_THEMES.Sage.icon).toBe(Sprout);
    expect(DAGGERHEART_DOMAIN_THEMES.Splendor.icon).toBe(HeartPulse);
    expect(DAGGERHEART_DOMAIN_THEMES.Valor.icon).toBe(ShieldCheck);
  });

  it("uses the locked-in color family in each border class", () => {
    // Sanity check — borderColor uses the agreed Tailwind family per domain.
    expect(DAGGERHEART_DOMAIN_THEMES.Arcana.borderColor).toContain("violet");
    expect(DAGGERHEART_DOMAIN_THEMES.Blade.borderColor).toContain("red");
    expect(DAGGERHEART_DOMAIN_THEMES.Bone.borderColor).toContain("stone");
    expect(DAGGERHEART_DOMAIN_THEMES.Codex.borderColor).toContain("indigo");
    expect(DAGGERHEART_DOMAIN_THEMES.Grace.borderColor).toContain("pink");
    expect(DAGGERHEART_DOMAIN_THEMES.Midnight.borderColor).toContain("slate");
    expect(DAGGERHEART_DOMAIN_THEMES.Sage.borderColor).toContain("green");
    expect(DAGGERHEART_DOMAIN_THEMES.Splendor.borderColor).toContain("amber");
    expect(DAGGERHEART_DOMAIN_THEMES.Valor.borderColor).toContain("blue");
  });
});
