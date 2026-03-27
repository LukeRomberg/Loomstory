# Loomstory — Claude Code Guidelines

## Development Workflow — TDD First

### The Rule: Tests Before Code

**Every feature, fix, or change MUST follow this order:**

1. **Write the tests first.** Define what the component/function/route should do via test cases. Present these to the user for review before writing any implementation code.
2. **Get user approval on the tests.** The test file IS the Definition of Done. If the tests are wrong, the implementation will be wrong.
3. **Write the implementation** to make the tests pass.
4. **Run the full test suite** (`npm test`) — all tests must pass before considering the task complete.
5. **Never skip tests.** Even "small" changes get tests. If it's worth building, it's worth testing.

### What to Test

- **Components**: Render output, user interactions (click, type, submit), conditional rendering, error states, loading states, accessibility (roles, labels).
- **API routes**: Request/response shape, error handling, auth checks, database operations (mocked).
- **Pure functions**: Input/output, edge cases, error conditions.
- **Hooks**: State changes, side effects, cleanup.

### Test File Conventions

- Test files live next to the code they test: `component.tsx` → `component.test.tsx`
- Use `describe` blocks named after the component/function
- Use `it` descriptions that read as sentences: `it("shows error toast on save failure")`
- Mock Supabase via `createMockSupabaseClient()` from `@/test/mocks`
- Mock Next.js navigation via the global mock in `src/test/setup.ts`

### CI Pipeline

- **GitHub Actions** runs on every push to `main` and every PR
- Tests run first — if they fail, the build doesn't run
- Build runs second with placeholder env vars
- Vercel deploys from `main` on successful CI

### Commands

```bash
npm test          # Run all tests once
npm run test:watch    # Run tests in watch mode (during development)
npm run test:coverage # Run tests with coverage report
```

---

## /ui — UI Best Practices

### User Feedback
- **Always provide feedback for every user action.** No action should complete silently.
- **Use Sonner toasts** (`import { toast } from "sonner"`) for all success, error, and loading feedback on async operations.
  - `toast.success("Notes saved")` — for successful writes
  - `toast.error("Failed to save", { description: error.message })` — for errors, always include the description
  - `toast.loading("Processing...")` — for long-running operations
- **Never use inline success/error state** (green/red divs) for async operations. Toasts are the standard.
- **Auth pages are the exception** — login/register/reset forms keep inline errors since they're form validation, not async feedback.
- **Loading states on buttons** — always disable the button and show "Saving...", "Creating...", etc. while an async operation is in progress.

### Component Patterns
- **This project uses `@base-ui/react` (base-nova style), NOT Radix.**
  - Use `render={<Component />}` instead of `asChild` on trigger components (`DialogTrigger`, `DropdownMenuTrigger`, `SelectTrigger`, etc.)
  - `Select.onValueChange` passes `string | null`, not `string` — always handle: `onValueChange={(v) => setValue(v ?? "")}`
- **Tiptap editor** — always set `immediatelyRender: false` in `useEditor()` to avoid SSR hydration errors.
- **Create actions open modals** — when a user clicks "New Session", "New Campaign", etc., open a Dialog inline. Never navigate to a separate page for creation.
- **Soft delete with confirmation** — all delete operations use a confirmation Dialog and perform soft delete (`deleted_at` timestamp).

### Navigation
- **Always provide a way back** — every sub-page has a `ChevronLeft` back button linking to the parent page.
- **Breadcrumb pattern**: `← Campaign Name — Sessions` style, using `text-muted-foreground hover:text-foreground` styling.

### Styling Conventions
- **`gold-glow`** — add to primary action buttons and clickable cards for the gold hover shadow effect.
- **`grain`** — add to Card components for the parchment texture overlay.
- **`font-heading`** (Outfit) — use for all headings, section titles, button text, badges.
- **`font-lore`** (Lora) — use for narrative/story content, empty state messages.
- **`font-mono`** (JetBrains Mono) — use for session numbers, technical labels.
- **`prose-fantasy`** — use on containers rendering markdown/rich text content for themed typography.
- **`text-gold`** — use for accent text, icon highlights.
- **`text-muted-foreground`** — use for secondary text, metadata, timestamps.
- **Badge variants**: `default` (gold) for primary status, `secondary` (dark with gold text) for secondary, `outline` for metadata labels.

### Layout
- **Protected pages** use the `(protected)` route group with `AppHeader` (Loomstory branding + user menu).
- **Auth pages** use the `(auth)` route group with centered card layout.
- **Max width**: `max-w-6xl` for main content areas, `max-w-2xl` for settings/form pages.
- **Responsive**: use `sm:grid-cols-2 lg:grid-cols-3` for card grids.

### Data Fetching
- **Server components** fetch data and pass it to client components as props.
- **Client components** handle mutations (create, update, delete) using `createClient()` from `@/lib/supabase/client`.
- **Always check membership/role** server-side before rendering campaign pages.
- **Always filter `deleted_at IS NULL`** (via `.is("deleted_at", null)`) on all queries.
