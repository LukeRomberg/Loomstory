/**
 * Session Prep — prompt builders for each GM prep tool.
 * Each function returns { system, user } strings for Claude.
 */

// ─── Types ────────────────────────────────────────────────

export interface UnresolvedEvent {
  id: string;
  content: string;
  summary: string | null;
  event_type: string;
  trigger_condition: string | null;
  narrative_day: number | null;
}

export interface PlotThreadContext {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
}

export interface NpcContext {
  id: string;
  name: string;
  description: string | null;
  personality: string | null;
  status: string;
  recent_events: { content: string; event_type: string }[];
}

export interface LocationContext {
  id: string;
  name: string;
  description: string | null;
  type: string | null;
  related_events: { content: string; event_type: string }[];
}

// ─── Helpers ──────────────────────────────────────────────

function formatEvents(events: UnresolvedEvent[]): string {
  return events
    .map((e) => {
      let line = `- [${e.event_type}] ${e.summary ?? e.content}`;
      if (e.trigger_condition) line += `\n  Trigger: ${e.trigger_condition}`;
      if (e.narrative_day != null) line += `\n  Day: ${e.narrative_day}`;
      return line;
    })
    .join("\n\n");
}

function formatThreads(threads: PlotThreadContext[]): string {
  return threads
    .map(
      (t) =>
        `- **${t.title}** (${t.priority}, ${t.status})\n  ${t.description}`
    )
    .join("\n\n");
}

function formatNpcs(npcs: NpcContext[]): string {
  return npcs
    .map((n) => {
      let block = `### ${n.name} (${n.status})`;
      if (n.description) block += `\n${n.description}`;
      if (n.personality) block += `\nPersonality: ${n.personality}`;
      if (n.recent_events.length > 0) {
        block += `\nRecent events:`;
        for (const e of n.recent_events) {
          block += `\n- [${e.event_type}] ${e.content}`;
        }
      }
      return block;
    })
    .join("\n\n");
}

// ─── PREP-01: Unresolved Summary ──────────────────────────

export function buildUnresolvedPrompt(events: UnresolvedEvent[]): {
  system: string;
  user: string;
} {
  const system = `You are a session prep assistant for a tabletop RPG campaign. The GM wants a summary of all unresolved threads — promises made, todos, and upcoming triggers that haven't been resolved yet.

RULES:
- Group items by type (promises, todos, upcoming events).
- For each item, explain what was left open and what might trigger it.
- Highlight the most urgent or dramatically interesting threads.
- Suggest which ones might naturally come up in the next session.
- Write concisely in a tone appropriate for GM prep notes.
- Use markdown formatting with headers and bullet points.`;

  let user: string;
  if (events.length === 0) {
    user = `There are currently no unresolved promises, todos, or upcoming events in this campaign.`;
  } else {
    user = `UNRESOLVED EVENTS (${events.length}):\n\n${formatEvents(events)}`;
  }

  return { system, user };
}

// ─── PREP-02: Next Session Planner ────────────────────────

export function buildPlannerPrompt(
  userIdeas: string,
  threads: PlotThreadContext[],
  events: UnresolvedEvent[]
): { system: string; user: string } {
  const system = `You are a session prep assistant for a tabletop RPG campaign. The GM has shared their ideas for the next session. Using those ideas plus the active plot threads and unresolved events, suggest a scene-by-scene structure for the session.

RULES:
- Build on the GM's ideas — don't replace them, enhance them.
- Suggest 3-5 scenes with a clear narrative arc (opening, rising action, climax or cliffhanger).
- For each scene, note which plot threads or unresolved events could naturally surface.
- Include at least one moment of player choice or branching.
- Suggest pacing notes (fast/slow, tense/lighthearted).
- Write in markdown with clear scene headers and bullet points.
- Keep it practical — this is a prep outline, not a novel.`;

  let user = `GM'S IDEAS:\n${userIdeas}\n\n`;
  if (threads.length > 0) {
    user += `ACTIVE PLOT THREADS:\n${formatThreads(threads)}\n\n`;
  }
  if (events.length > 0) {
    user += `UNRESOLVED EVENTS:\n${formatEvents(events)}`;
  }

  return { system, user };
}

// ─── PREP-03: Plot Hook Generator ─────────────────────────

export function buildHookPrompt(
  threads: PlotThreadContext[],
  events: UnresolvedEvent[]
): { system: string; user: string } {
  const system = `You are a session prep assistant for a tabletop RPG campaign. The GM wants ideas for how to reintroduce or surface unresolved plot threads and events in upcoming sessions.

RULES:
- For each thread or unresolved event, suggest 1-2 concrete hooks the GM could use to bring it back into play.
- Hooks should feel organic — encounters, rumors, NPCs mentioning things, environmental clues, consequences of inaction.
- Vary the hook types: some direct, some subtle, some urgent.
- Prioritize hooks that connect multiple threads together.
- Write in markdown with a section per thread/event.
- Keep each hook to 2-3 sentences.`;

  let user = "";
  if (threads.length > 0) {
    user += `ACTIVE PLOT THREADS:\n${formatThreads(threads)}\n\n`;
  }
  if (events.length > 0) {
    user += `UNRESOLVED EVENTS:\n${formatEvents(events)}`;
  }
  if (!user.trim()) {
    user = "There are currently no active plot threads or unresolved events.";
  }

  return { system, user };
}

// ─── PREP-04: NPC Encounter Planner ───────────────────────

export function buildNpcEncounterPrompt(
  scene: string,
  npcs: NpcContext[]
): { system: string; user: string } {
  const system = `You are a session prep assistant for a tabletop RPG campaign. Given a scene description and NPC profiles (including their recent behavior in the campaign), suggest how each NPC would act, what their motivation is, and what they might say or do.

RULES:
- Base NPC behavior on their personality and recent event history — don't contradict established characterization.
- For each NPC, provide: current motivation, likely behavior in the scene, a sample line of dialogue, and potential secrets or tells.
- Note any tensions between NPCs that could create drama.
- Suggest how the scene might unfold differently depending on player choices.
- Write in markdown with a section per NPC.`;

  let user = `SCENE:\n${scene}\n\nNPCS IN THIS SCENE:\n${formatNpcs(npcs)}`;

  return { system, user };
}

// ─── PREP-05: Encounter Builder ───────────────────────────

export function buildEncounterPrompt(
  description: string,
  loreContext: string[]
): { system: string; user: string } {
  const system = `You are a session prep assistant for a tabletop RPG campaign. The GM wants to build an encounter (combat, social, exploration, or mixed). Draft a complete encounter using the description and campaign lore provided.

RULES:
- Include: setup (how it starts), stakes (what's at risk), consequences (success and failure outcomes).
- Suggest enemies, obstacles, or social dynamics appropriate to the situation.
- Include environmental details that could affect gameplay.
- Note tactical considerations and potential complications.
- Tie the encounter to existing campaign lore where possible.
- Write in markdown with clear sections.
- Keep it system-agnostic unless the GM specifies a system.`;

  let user = `ENCOUNTER DESCRIPTION:\n${description}`;
  if (loreContext.length > 0) {
    user += `\n\nCAMPAIGN CONTEXT:\n${loreContext.map((c, i) => `[${i + 1}] ${c}`).join("\n\n")}`;
  }

  return { system, user };
}

// ─── PREP-06: Location Dressing ───────────────────────────

export function buildLocationDressingPrompt(
  location: LocationContext
): { system: string; user: string } {
  const system = `You are a session prep assistant for a tabletop RPG campaign. The GM wants to bring a location to life with atmosphere, sensory details, and features that make it memorable and useful at the table.

RULES:
- Provide sensory details for all five senses (sight, sound, smell, touch, taste where relevant).
- Suggest 3-5 notable features or points of interest within the location.
- Include ambient atmosphere and mood appropriate to what's happened there.
- Suggest NPCs or creatures that might be found there.
- Note any details that could serve as hooks for exploration or interaction.
- Factor in recent events at this location to inform its current state.
- Write in markdown with clear sections (Atmosphere, Sensory Details, Points of Interest, Encounters).`;

  let user = `LOCATION: ${location.name}`;
  if (location.type) user += ` (${location.type})`;
  user += "\n";
  if (location.description) user += `\n${location.description}\n`;
  if (location.related_events.length > 0) {
    user += `\nRECENT EVENTS HERE:\n`;
    for (const e of location.related_events) {
      user += `- [${e.event_type}] ${e.content}\n`;
    }
  }

  return { system, user };
}

// ─── PREP-07: Session Outline Builder ─────────────────────

export function buildOutlinePrompt(
  userIdeas: string,
  threads: PlotThreadContext[],
  events: UnresolvedEvent[],
  npcs: NpcContext[]
): { system: string; user: string } {
  const system = `You are a session prep assistant for a tabletop RPG campaign. Generate a structured session outline that the GM can use as a complete prep document.

RULES:
- Structure the outline with these sections:
  1. **Opening Scene** — how the session begins, re-establishing context
  2. **Key Encounters** — 2-4 scenes or encounters planned for the session
  3. **Player Decision Points** — moments where player choice determines direction
  4. **NPC Cheat Sheet** — quick-reference for NPCs likely to appear (motivation, key line)
  5. **Fallback Plans** — what to do if players go off-script or skip content
  6. **Session Goals** — what the GM hopes to accomplish narratively
- Build on the GM's ideas and weave in active plot threads naturally.
- Reference unresolved events where they could organically surface.
- Keep it practical — bullet points and short paragraphs, not prose.
- Write in markdown.`;

  let user = `GM'S IDEAS / THEME:\n${userIdeas}\n\n`;
  if (threads.length > 0) {
    user += `ACTIVE PLOT THREADS:\n${formatThreads(threads)}\n\n`;
  }
  if (events.length > 0) {
    user += `UNRESOLVED EVENTS:\n${formatEvents(events)}\n\n`;
  }
  if (npcs.length > 0) {
    user += `KEY NPCS:\n${formatNpcs(npcs)}`;
  }

  return { system, user };
}
