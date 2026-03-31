import { describe, it, expect } from "vitest";
import {
  buildUnresolvedPrompt,
  buildPlannerPrompt,
  buildHookPrompt,
  buildNpcEncounterPrompt,
  buildEncounterPrompt,
  buildLocationDressingPrompt,
  buildOutlinePrompt,
} from "./prep-prompts";
import type {
  UnresolvedEvent,
  PlotThreadContext,
  NpcContext,
  LocationContext,
} from "./prep-prompts";

// ─── Shared test data ─────────────────────────────────────

const unresolvedEvents: UnresolvedEvent[] = [
  {
    id: "evt-1",
    content: "Gareth promised safe passage through the mountains if the party clears the bandit camp.",
    summary: "Gareth's promise of safe passage",
    event_type: "promise",
    trigger_condition: "When the party clears the bandit camp",
    narrative_day: 1,
  },
  {
    id: "evt-2",
    content: "The party needs to find the Warden's seal before entering the northern district.",
    summary: "Find the Warden's seal",
    event_type: "todo",
    trigger_condition: null,
    narrative_day: 3,
  },
  {
    id: "evt-3",
    content: "The Crimson Hand will attack at the next full moon.",
    summary: "Crimson Hand attack imminent",
    event_type: "upcoming",
    trigger_condition: "Next full moon (narrative day 7)",
    narrative_day: null,
  },
];

const plotThreads: PlotThreadContext[] = [
  {
    id: "thread-1",
    title: "The Crimson Conspiracy",
    description: "The Crimson Hand is infiltrating the city guard.",
    status: "active",
    priority: "main",
  },
  {
    id: "thread-2",
    title: "The Missing Miners",
    description: "Miners have been disappearing into the deep tunnels.",
    status: "active",
    priority: "side",
  },
];

const npcs: NpcContext[] = [
  {
    id: "npc-1",
    name: "Gareth the Bold",
    description: "A tall, scarred warrior with a commanding presence",
    personality: "Loyal but secretive, harboring guilt",
    status: "alive",
    recent_events: [
      { content: "Gareth warned the party about the Crimson Hand", event_type: "scene" },
      { content: "Gareth promised safe passage", event_type: "promise" },
    ],
  },
  {
    id: "npc-2",
    name: "Marta the Innkeeper",
    description: "A stout woman with kind eyes who runs the Silver Hart",
    personality: "Warm, gossip-loving, well-connected",
    status: "alive",
    recent_events: [
      { content: "Marta overheard guards talking about the Warden's secret meetings", event_type: "discovery" },
    ],
  },
];

const location: LocationContext = {
  id: "loc-1",
  name: "Ironhold",
  description: "A fortified city perched on a mountain pass",
  type: "city",
  related_events: [
    { content: "Party arrived at Ironhold", event_type: "scene" },
    { content: "The mayor was assassinated", event_type: "milestone" },
  ],
};

// ─── PREP-01: Unresolved Summary ──────────────────────────

describe("buildUnresolvedPrompt (PREP-01)", () => {
  it("returns system and user messages", () => {
    const result = buildUnresolvedPrompt(unresolvedEvents);
    expect(result.system).toBeDefined();
    expect(result.user).toBeDefined();
  });

  it("includes instructions to summarize unresolved threads", () => {
    const result = buildUnresolvedPrompt(unresolvedEvents);
    expect(result.system.toLowerCase()).toContain("unresolved");
  });

  it("includes all unresolved events in context", () => {
    const result = buildUnresolvedPrompt(unresolvedEvents);
    expect(result.user).toContain("Gareth's promise of safe passage");
    expect(result.user).toContain("Find the Warden's seal");
    expect(result.user).toContain("Crimson Hand attack imminent");
  });

  it("includes event types so AI can distinguish promises from todos", () => {
    const result = buildUnresolvedPrompt(unresolvedEvents);
    expect(result.user).toContain("promise");
    expect(result.user).toContain("todo");
    expect(result.user).toContain("upcoming");
  });

  it("includes trigger conditions when present", () => {
    const result = buildUnresolvedPrompt(unresolvedEvents);
    expect(result.user).toContain("When the party clears the bandit camp");
    expect(result.user).toContain("Next full moon");
  });

  it("handles empty events list gracefully", () => {
    const result = buildUnresolvedPrompt([]);
    expect(result.system).toBeDefined();
    expect(result.user).toContain("no unresolved");
  });
});

// ─── PREP-02: Next Session Planner ────────────────────────

describe("buildPlannerPrompt (PREP-02)", () => {
  it("returns system and user messages", () => {
    const result = buildPlannerPrompt(
      "I want the party to finally confront Gareth about his secrets",
      plotThreads,
      unresolvedEvents
    );
    expect(result.system).toBeDefined();
    expect(result.user).toBeDefined();
  });

  it("includes the GM's session ideas in the prompt", () => {
    const result = buildPlannerPrompt(
      "The party heads north to deal with the bandits",
      plotThreads,
      unresolvedEvents
    );
    expect(result.user).toContain("heads north to deal with the bandits");
  });

  it("includes active plot threads as context", () => {
    const result = buildPlannerPrompt("My ideas", plotThreads, unresolvedEvents);
    expect(result.user).toContain("The Crimson Conspiracy");
    expect(result.user).toContain("The Missing Miners");
  });

  it("includes unresolved events as context", () => {
    const result = buildPlannerPrompt("My ideas", plotThreads, unresolvedEvents);
    expect(result.user).toContain("Gareth's promise");
    expect(result.user).toContain("Crimson Hand attack");
  });

  it("instructs AI to suggest scene structure", () => {
    const result = buildPlannerPrompt("My ideas", plotThreads, unresolvedEvents);
    expect(result.system.toLowerCase()).toMatch(/scene|structure|outline/);
  });
});

// ─── PREP-03: Plot Hook Generator ─────────────────────────

describe("buildHookPrompt (PREP-03)", () => {
  it("returns system and user messages", () => {
    const result = buildHookPrompt(plotThreads, unresolvedEvents);
    expect(result.system).toBeDefined();
    expect(result.user).toBeDefined();
  });

  it("includes plot threads in context", () => {
    const result = buildHookPrompt(plotThreads, unresolvedEvents);
    expect(result.user).toContain("The Crimson Conspiracy");
    expect(result.user).toContain("infiltrating the city guard");
  });

  it("includes unresolved events in context", () => {
    const result = buildHookPrompt(plotThreads, unresolvedEvents);
    expect(result.user).toContain("Gareth's promise");
  });

  it("instructs AI to generate hooks to reintroduce threads", () => {
    const result = buildHookPrompt(plotThreads, unresolvedEvents);
    expect(result.system.toLowerCase()).toMatch(/hook|reintroduce|surface/);
  });

  it("handles empty threads gracefully", () => {
    const result = buildHookPrompt([], unresolvedEvents);
    expect(result.system).toBeDefined();
    expect(result.user).toBeDefined();
  });
});

// ─── PREP-04: NPC Encounter Planner ───────────────────────

describe("buildNpcEncounterPrompt (PREP-04)", () => {
  it("returns system and user messages", () => {
    const result = buildNpcEncounterPrompt(
      "The party visits the Silver Hart tavern",
      npcs
    );
    expect(result.system).toBeDefined();
    expect(result.user).toBeDefined();
  });

  it("includes the scene description", () => {
    const result = buildNpcEncounterPrompt(
      "The party visits the Silver Hart tavern",
      npcs
    );
    expect(result.user).toContain("Silver Hart tavern");
  });

  it("includes NPC names and personalities", () => {
    const result = buildNpcEncounterPrompt("A scene", npcs);
    expect(result.user).toContain("Gareth the Bold");
    expect(result.user).toContain("Loyal but secretive");
    expect(result.user).toContain("Marta the Innkeeper");
    expect(result.user).toContain("Warm, gossip-loving");
  });

  it("includes NPC recent events for behavioral context", () => {
    const result = buildNpcEncounterPrompt("A scene", npcs);
    expect(result.user).toContain("warned the party about the Crimson Hand");
    expect(result.user).toContain("overheard guards talking");
  });

  it("instructs AI to suggest motivations and behaviors", () => {
    const result = buildNpcEncounterPrompt("A scene", npcs);
    expect(result.system.toLowerCase()).toMatch(/motivation|behavior/);
  });
});

// ─── PREP-05: Encounter Builder ───────────────────────────

describe("buildEncounterPrompt (PREP-05)", () => {
  it("returns system and user messages", () => {
    const result = buildEncounterPrompt(
      "Ambush on the mountain road by Crimson Hand agents",
      ["The Crimson Hand is a shadowy guild of assassins"]
    );
    expect(result.system).toBeDefined();
    expect(result.user).toBeDefined();
  });

  it("includes the encounter description", () => {
    const result = buildEncounterPrompt(
      "Ambush on the mountain road",
      []
    );
    expect(result.user).toContain("Ambush on the mountain road");
  });

  it("includes campaign lore context", () => {
    const result = buildEncounterPrompt(
      "A battle",
      [
        "The Crimson Hand is a shadowy guild of assassins",
        "Ironhold's guard has been compromised",
      ]
    );
    expect(result.user).toContain("shadowy guild of assassins");
    expect(result.user).toContain("guard has been compromised");
  });

  it("instructs AI to draft encounter with stakes and consequences", () => {
    const result = buildEncounterPrompt("A battle", []);
    expect(result.system.toLowerCase()).toMatch(/stakes|consequence/);
  });
});

// ─── PREP-06: Location Dressing ───────────────────────────

describe("buildLocationDressingPrompt (PREP-06)", () => {
  it("returns system and user messages", () => {
    const result = buildLocationDressingPrompt(location);
    expect(result.system).toBeDefined();
    expect(result.user).toBeDefined();
  });

  it("includes location name and description", () => {
    const result = buildLocationDressingPrompt(location);
    expect(result.user).toContain("Ironhold");
    expect(result.user).toContain("fortified city perched on a mountain pass");
  });

  it("includes location type", () => {
    const result = buildLocationDressingPrompt(location);
    expect(result.user).toContain("city");
  });

  it("includes related events for atmosphere context", () => {
    const result = buildLocationDressingPrompt(location);
    expect(result.user).toContain("Party arrived at Ironhold");
    expect(result.user).toContain("mayor was assassinated");
  });

  it("instructs AI to suggest atmosphere and sensory details", () => {
    const result = buildLocationDressingPrompt(location);
    expect(result.system.toLowerCase()).toMatch(/atmosphere|sensory|detail/);
  });

  it("handles location with no related events", () => {
    const emptyLocation: LocationContext = {
      ...location,
      related_events: [],
    };
    const result = buildLocationDressingPrompt(emptyLocation);
    expect(result.system).toBeDefined();
    expect(result.user).toContain("Ironhold");
  });
});

// ─── PREP-07: Session Outline Builder ─────────────────────

describe("buildOutlinePrompt (PREP-07)", () => {
  it("returns system and user messages", () => {
    const result = buildOutlinePrompt(
      "Confrontation with the Crimson Hand",
      plotThreads,
      unresolvedEvents,
      npcs
    );
    expect(result.system).toBeDefined();
    expect(result.user).toBeDefined();
  });

  it("includes the GM's session theme/ideas", () => {
    const result = buildOutlinePrompt(
      "Confrontation with the Crimson Hand",
      plotThreads,
      unresolvedEvents,
      npcs
    );
    expect(result.user).toContain("Confrontation with the Crimson Hand");
  });

  it("includes plot threads, events, and NPCs as context", () => {
    const result = buildOutlinePrompt("My ideas", plotThreads, unresolvedEvents, npcs);
    expect(result.user).toContain("The Crimson Conspiracy");
    expect(result.user).toContain("Gareth's promise");
    expect(result.user).toContain("Gareth the Bold");
  });

  it("instructs AI to generate structured outline with sections", () => {
    const result = buildOutlinePrompt("My ideas", plotThreads, unresolvedEvents, npcs);
    expect(result.system.toLowerCase()).toMatch(/opening scene|encounter|fallback/);
  });
});
