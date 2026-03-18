# Playwright screenshot corpus — design system audit and fixes

## Purpose

Use the **48 baseline screenshots** in
`apps/web/tests/e2e/playwright-snapshots/` as the primary audit tool to improve
the app’s **design system**: fix layout and styling bugs, align with UI/UX best
practices, resolve consistency and sizing issues, and fix missing or wrong data.
The design system is currently inconsistent and needs a structured pass driven
by these screenshots.

---

## Screenshot corpus summary

- **48 baseline PNGs** across **10 spec files**: admin, dashboard, events,
  games, groups, guest, napkins/detail, napkins/closeout, settings, shell.
- **Viewport:** 1280×720, `fullPage: true`. Config:
  [playwright.config.ts](playwright.config.ts) (`maxDiffPixels: 2500`,
  `maxDiffPixelRatio: 0.02`).
- **Gap:** `admin-taxonomy-league-nba.png` is expected by a test but missing on
  disk — generate or adjust the test.

---

## 1. Must-fix

### 1.1 Code and token violations

| #   | File                                                                                                         | Issue                                                                         |
| --- | ------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------- |
| 1   | [NapkinbetsWagerScoreboard.vue](apps/web/app/components/napkinbets/NapkinbetsWagerScoreboard.vue) (line 128) | Raw Tailwind: `bg-white/50` on center divider → use semantic token.           |
| 2   | [admin/taxonomy/[league].vue](apps/web/app/pages/admin/taxonomy/[league].vue) (line 202)                     | Raw Tailwind: `bg-white p-0.5` on UAvatar → use `bg-default` / `bg-elevated`. |
| 3   | [AdminEventsTab.vue](apps/web/app/components/admin/AdminEventsTab.vue)                                       | UInput (search) missing `class="w-full"`.                                     |
| 4   | [AdminBetsTab.vue](apps/web/app/components/admin/AdminBetsTab.vue)                                           | UInput (search) missing `class="w-full"`.                                     |
| 5   | [cards-lists-forms.css](apps/web/app/assets/css/napkinbets/cards-lists-forms.css) (lines 34, 238)            | `color: white` on pills → use semantic/theme token (on-accent).               |
| 6   | [notifications.css](apps/web/app/assets/css/napkinbets/notifications.css) (line 7)                           | `color: white` on badge → use semantic token.                                 |

### 1.2 Visual regression checklist (verify via screenshots)

From
[VISUAL_REGRESSION_VERIFY_PROMPT.md](.cursor/plans/VISUAL_REGRESSION_VERIFY_PROMPT.md).
Confirm on napkin/closeout snapshots; fix if wrong.

- Paid count (only confirmed settlements in “At a glance”).
- ENTRY note (no duplicate “• entry” on closeout).
- Settlement ledger (proof image or initials pill; no empty white squares).
- Settle up button visibility (hidden when live/upcoming).
- Form alignment (“Log a pick” vs “Submit payment proof” rows aligned).
- Draft order (status badges at end of row; no large mid-row gap).
- Empty states (correct placeholder copy for ledger, payout, draft order,
  leaderboard).
- Closeout Draft summary (button + description same row, vertically aligned).
- Friday Hoops (NBA/basketball tags, not MLB).
- Buttons (“Save proof” / “Save pick” equal secondary style).
- Contrast (“$10 open” / “Stake each” readable, e.g. text-muted).

### 1.3 Missing baseline

- Generate or fix test for **admin-taxonomy-league-nba.png**.

---

## 2. UI/UX review and best practices

Use each screenshot to verify these; flag violations as issues to fix.

### 2.1 Icons and visual elements

- **No emoji as UI icons** — use Lucide (or agreed set) only; replace any emoji
  used as icons.
- **Stable hover states** — color/opacity transitions only; no scale or
  transforms that cause layout shift.
- **Consistent icon size** — e.g. 24×24 viewBox with consistent Tailwind size
  (e.g. w-6 h-6) across admin, dashboard, napkins, settings, shell.
- **Correct brand/asset usage** — logos and external assets match design system.

### 2.2 Interaction and cursor

- **Clickable elements** — every card, button, link, and tab has
  `cursor-pointer`.
- **Hover feedback** — clear visual change (border, shadow, or color) on hover
  for interactive elements.
- **Transitions** — 150–300ms for hover/focus; no instant or very slow (>500ms)
  changes.
- **Focus states** — visible focus ring for keyboard navigation on forms and
  nav.

### 2.3 Contrast and light/dark mode

- **Text contrast** — body text meets 4.5:1 minimum; primary text uses semantic
  tokens (e.g. text-default), not faint neutrals.
- **Muted text** — secondary copy uses text-muted (or equivalent); readable, not
  too light.
- **Borders** — visible in both modes (e.g. border-default); no invisible
  borders.
- **Glass/transparent surfaces** — sufficient opacity in light mode so content
  is readable.

### 2.4 Layout and spacing

- **Floating/nav spacing** — if nav is floating, consistent inset (e.g.
  top/left/right) from viewport edges.
- **Content vs fixed chrome** — no content hidden behind fixed header/nav;
  adequate top padding.
- **Consistent max-width** — main content containers use a single max-width
  system (e.g. max-w-6xl or max-w-7xl) across dashboard, events, groups,
  napkins, settings.
- **Responsive** — no horizontal scroll at 1280px; note any breakpoints that
  need testing at 375px, 768px, 1024px.

### 2.5 Accessibility (audit from screenshots + code)

- **Images** — all meaningful images have alt text.
- **Forms** — inputs have visible labels or aria-label.
- **Indicators** — state/status not conveyed by color alone (e.g. icon + text).
- **Motion** — respect `prefers-reduced-motion` where animations are used.

---

## 3. Design system consistency issues

Use screenshots to find inconsistencies across pages; then fix in code.

### 3.1 Tokens and color

- **Semantic only** — no raw Tailwind color classes (text-neutral-_, bg-white,
  border-neutral-_); use text-default, text-muted, bg-default, bg-muted,
  border-default, text-error, text-success, etc.
- **Same meaning, same token** — e.g. all secondary labels use text-muted; all
  borders use border-default.
- **Napkinbets vs layer** — ensure napkinbets CSS and components use the same
  token set as the rest of the app (no one-off hex or raw colors).

### 3.2 Typography

- **Heading scale** — consistent use of font size/weight for h1, h2, h3, section
  titles across admin, dashboard, events, groups, napkins, settings.
- **Body and captions** — one body size, one muted/caption size used
  consistently.
- **Font stack** — single sans (and optional display) from layer/app config; no
  ad-hoc font classes.

### 3.3 Components and patterns

- **Buttons** — primary vs secondary vs ghost usage consistent; same padding and
  height within variant.
- **Cards** — same border radius, shadow, and padding for card surfaces (e.g.
  UCard, custom cards in napkins).
- **Forms** — UFormField + UInput/UTextarea pattern; all inputs `w-full` unless
  intentionally narrow; same label style.
- **Lists and rows** — consistent row height, spacing, and alignment (e.g.
  ledger, draft order, event list).
- **Badges and pills** — one style for status (confirmed/submitted/pending); one
  for tags/categories; consistent size and padding.

### 3.4 Spacing and density

- **Section gaps** — consistent vertical rhythm between sections (e.g. space-y-6
  or space-y-8).
- **Inline spacing** — consistent gap between label and value, between icon and
  text, between actions.
- **Grids** — consistent column counts and gaps for card grids (events, groups,
  dashboard).

---

## 4. Missing data issues

Use screenshots to confirm correct data and placeholders.

### 4.1 Empty states

- **Copy** — every empty list/section has explicit placeholder text (no raw “No
  data” or missing copy).
- **Reuse** — same empty-state pattern (icon + message + optional CTA) where
  appropriate (ledger, payout breakdown, draft order, leaderboard,
  notifications, friends).
- **Screenshots to check** — dashboard (filters), events list/detail, groups
  list/detail, napkin detail/closeout, settings, shell (friends, ledger,
  notifications).

### 4.2 Wrong or missing content

- **Counts and labels** — “Paid”, “Unpaid”, “Participants” etc. match seed/data
  and business rules (see visual regression checklist).
- **Tags and metadata** — event/game tags (e.g. NBA vs MLB for demo-hoops-night)
  correct per seed.
- **User/group names** — no “undefined” or missing names in lists and cards.
- **Dates and amounts** — formatted consistently; no raw ISO strings or missing
  currency.

### 4.3 Error and edge states

- **Not found** — events/groups/napkins “not found” pages have consistent layout
  and message (e.g. events-detail-not-found.png).
- **Auth-required** — create napkin / protected routes show clear “sign in” or
  “account required” messaging (guest vs authenticated screenshots).

---

## 5. Element size issues

Use screenshots to spot sizing problems; standardize in code.

### 5.1 Buttons and CTAs

- **Primary actions** — consistent height and padding (e.g. UButton default
  size) across pages.
- **Secondary actions** — “Save proof”, “Save pick”, “Cancel” etc. same size and
  weight where they are peers.
- **Icon buttons** — consistent hit area and icon size (e.g. header actions,
  card actions).

### 5.2 Inputs and controls

- **Text inputs** — full-width where appropriate (`w-full`); consistent height
  with design system.
- **Selects and dropdowns** — same height as inputs where they sit in a row.
- **File inputs** — styled consistently; clear label and optional hint.

### 5.3 Cards and list items

- **Card min/max** — no overly narrow or oversized cards; consistent aspect or
  min-height where it helps layout.
- **List rows** — ledger, draft order, wager list: consistent row height and
  padding; avatars/icons same size.
- **Compact vs expanded** — if both exist (e.g. event cards), clear size tiers
  and consistent spacing.

### 5.4 Typography and spacing

- **Headlines** — not too large or too small for viewport; consistent with
  design scale.
- **Body text** — readable line length; consistent line-height.
- **Gaps** — no single outlier gap (e.g. one huge gap in a form or table); use
  spacing scale (2, 4, 6, 8…).

---

## 6. How to use this plan with the screenshots

1. **Run and capture** — Ensure E2E visual tests pass or update baselines:  
   `pnpm test:e2e` or
   `pnpm exec playwright test --project=web --update-snapshots` after
   intentional UI changes.
2. **Per-area review** — For each of the 10 snapshot folders, open every PNG and
   walk:
   - Must-fix (tokens, regression checklist, missing baseline).
   - UI/UX (icons, cursor, hover, contrast, layout, a11y).
   - Consistency (tokens, typography, components, spacing).
   - Missing data (empty states, wrong counts, tags, names, dates).
   - Size (buttons, inputs, cards, rows, gaps).
3. **Log issues** — Maintain a simple list or spreadsheet: screenshot name,
   category, description, component/file.
4. **Fix in code** — Address must-fix first, then batch by category (e.g. all
   token fixes, then all empty states, then all sizing).
5. **Re-run and re-snapshot** — After each batch, run tests and update snapshots
   if needed; repeat until design system is consistent and screenshots reflect
   the desired state.

---

## 7. Suggested order of work

1. **Must-fix code** — Token and `w-full` fixes (§1.1); resolve missing admin
   snapshot (§1.3).
2. **Visual regression** — Verify and fix checklist items (§1.2) using
   napkin/closeout screenshots.
3. **Consistency** — Tokens and typography (§3.1–3.2) across all 48 screens;
   then components and spacing (§3.3–3.4).
4. **Sizing** — Buttons, inputs, cards, rows (§5) so elements feel uniform.
5. **Missing data** — Empty states and wrong/missing content (§4).
6. **UI/UX polish** — Icons, cursor, hover, contrast, layout, a11y (§2) as a
   final pass.

Reference:
[VISUAL_REGRESSION_VERIFY_PROMPT.md](.cursor/plans/VISUAL_REGRESSION_VERIFY_PROMPT.md)
for commands and paths. AGENTS.md for semantic tokens, Nuxt UI rules, and lint
rules.
