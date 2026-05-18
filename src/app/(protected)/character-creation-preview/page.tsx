"use client";

import { useTransitionRouter } from "@/hooks/use-transition-router";
import { Button } from "@/components/ui/button";
import { CharacterCreationShell } from "@/components/loomstory/wizard/character-creation-shell";

// Throwaway preview route — lets the user tune the zone positions visually
// against character-creation.png before any real wizard wiring happens.
// Delete once the shell positions are locked.
export default function CharacterCreationPreviewPage() {
  const router = useTransitionRouter();

  const fakeSteps = [
    "CONCEPT",
    "ANCESTRY",
    "COMMUNITY",
    "CLASS",
    "SUBCLASS",
    "TRAITS",
    "WEAPON",
    "ARMOR",
    "POTION",
    "TRAINING",
    "EXPERIENCES",
    "CARDS",
    "BEHOLD",
  ];

  return (
    <CharacterCreationShell
      debugBorder
      onClose={() => router.push("/dashboard")}
      topBar={
        <div className="flex w-full items-center justify-between gap-2 px-2 text-[10px] uppercase tracking-[0.16em] sm:text-xs">
          {fakeSteps.map((label, i) => (
            <span
              key={label}
              className={
                i === 3
                  ? "rounded bg-gold/20 px-2 py-0.5 font-bold text-gold ring-1 ring-gold/60"
                  : "text-gold/55"
              }
            >
              {label}
            </span>
          ))}
        </div>
      }
      leftPage={
        <div className="flex h-full flex-col gap-2 overflow-y-auto">
          <h2 className="font-heading text-base uppercase tracking-[0.18em] text-leather">
            Choose a Class
          </h2>
          <p className="text-xs italic text-leather/70">
            A defining path — a distinct purpose.
          </p>
          <div className="mt-2 space-y-1.5">
            {["Bard", "Druid", "Guardian", "Ranger", "Rogue", "Seraph", "Sorcerer", "Warrior", "Wizard"].map(
              (klass, i) => (
                <button
                  key={klass}
                  className={`w-full rounded border px-3 py-2 text-left text-sm transition ${
                    i === 2
                      ? "border-leather/40 bg-leather/10 font-heading text-leather"
                      : "border-leather/15 text-leather hover:bg-leather/5"
                  }`}
                >
                  {klass}
                </button>
              )
            )}
          </div>
        </div>
      }
      rightPage={
        <div className="flex h-full flex-col gap-3 overflow-y-auto">
          <h3 className="font-heading text-lg uppercase tracking-[0.15em] text-leather">
            Guardian
          </h3>
          <p className="text-xs uppercase tracking-[0.1em] text-leather/65">
            Valor · Blade
          </p>
          <p className="text-sm text-leather sm:text-base">
            Stand as the bulwark between danger and those you swear to protect.
          </p>
          <p className="text-xs italic text-leather/60">
            Starting evasion · 10 · Starting HP · 7
          </p>
        </div>
      }
      sheetPage={
        <div className="flex h-full flex-col gap-2 text-leather">
          <div className="text-center">
            <div className="font-heading text-xs uppercase tracking-[0.18em] text-leather/65">
              Character
            </div>
            <h3 className="font-heading text-base uppercase tracking-[0.12em] text-leather">
              Unnamed
            </h3>
          </div>
          <div className="text-xs text-leather/70">
            <div>Ancestry: —</div>
            <div>Community: —</div>
            <div>Class: Guardian</div>
            <div>Subclass: —</div>
          </div>
          <div className="mt-2 grid grid-cols-2 gap-1 text-[11px] text-leather/70">
            <div>STR —</div>
            <div>AGI —</div>
            <div>FIN —</div>
            <div>INS —</div>
            <div>PRE —</div>
            <div>KNO —</div>
          </div>
        </div>
      }
      footer={
        <>
          <Button variant="ghost" className="font-subheading">
            ← Previous
          </Button>
          <span className="font-subheading text-xs uppercase tracking-[0.18em] text-gold/70">
            Step 4 of 13
          </span>
          <Button className="gold-glow font-subheading">Continue →</Button>
        </>
      }
    />
  );
}
