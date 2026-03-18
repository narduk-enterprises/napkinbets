# Dashboard UI/UX review

Review based on the current dashboard screenshot and implementation in
`apps/web/app/pages/dashboard.vue`, metric card, filter chips, compact cards,
and napkinbets CSS.

---

## What’s working

- **Hierarchy:** Kicker → title → actions → metrics → filters → list is clear.
- **Consistency:** Rounded corners, cream/off-white surfaces, forest green
  accent, and spacing feel consistent.
- **Layout:** Max-width, padding, and grid for metrics/list are in good shape.
- **Interactivity:** Filter chips and bet rows have hover; primary CTA is
  obvious.

---

## 1. Color and contrast

**Issue:** Light grey subtext (hints, meta) can sit close to background; “light
grey on white” was called out for accessibility.

**Recommendations:**

- Use **semantic tokens** everywhere: `text-muted` for secondary (already in
  use); avoid any raw `text-dimmed` or custom light grey for body copy. Ensure
  `--napkinbets-muted` (or your `text-muted` token) meets **4.5:1** on the hero
  and card backgrounds.
- **Metric card hints:** Keep `napkinbets-support-copy` but ensure it maps to
  `text-muted` (or a token with sufficient contrast). If you use a lighter
  custom color, darken it to meet WCAG AA.
- **Bet list meta** (e.g. “Yankees vs Rays · Group chat”): Already `text-muted`
  in `NapkinbetsNapkinSummaryCard.vue`; confirm in dev tools that the computed
  color is not too light on the card background.

**Concrete:** In `hero-typography.css` and any dashboard-specific CSS, avoid
overriding muted copy with a lighter value. If `napkinbets-support-copy` uses
`var(--napkinbets-muted)` (#334155), it’s likely fine; if it’s lighter, switch
to the same variable as `text-muted` or a darker shade.

---

## 2. Metric cards — differentiation and hierarchy

**Issue:** All five metric cards look the same (same icon treatment, same green
pill). Numbers and labels don’t feel visually prioritized; categories don’t feel
distinct.

**Recommendations:**

- **Slight category color** (optional): Keep one primary green, but give each
  metric a very subtle tint (e.g. icon or left border) so “Bets You Started” vs
  “Open Settlements” scan faster. Use semantic colors: e.g. `success` for “Bets
  You Joined”, `warning` for “Pending Invites” / “Open Settlements”, `info` for
  “Queued Reminders”. Implement via a `metric.type` or icon color on
  `NapkinbetsMetricCard` so the icon (or a thin left border) uses that color;
  card background stays neutral.
- **Value prominence:** Keep `napkinbets-metric-value` (display font, 1.5rem).
  Optionally bump to 1.65rem on larger viewports so the number is clearly the
  focal point.
- **Icon vs number:** Ensure the icon doesn’t compete with the number. Right now
  the green pill with icon is strong; consider a softer icon (e.g. `text-muted`
  or `text-primary` with lower opacity) so the numeric value dominates.

**Concrete:** In `NapkinbetsMetricCard.vue`, add an optional `color` or
`variant` prop from the metric and apply it to the icon wrapper (e.g.
`text-primary`, `text-warning`, `text-info`) so the icon color reflects the
metric type. In `cards-lists-forms.css`, the `.napkinbets-order-pill` is full
accent; for metric cards you could use a softer variant (e.g.
`background: rgb(27 124 71 / 0.08)` and
`color: var(--napkinbets-accent-strong)`) so the pill is supporting, not
dominant.

---

## 3. Filter chips — clarity and active state

**Issue:** With six pills (All, Upcoming, Live, Finished, Settled, Unsettled),
the active state could be clearer so “which filter I’m on” is obvious at a
glance.

**Recommendations:**

- **Stronger active state:** Keep `.napkinbets-nav-link-active` (green tint,
  green border). Optionally make the active chip **solid** green with white text
  (e.g.
  `background: var(--napkinbets-accent-strong); color: var(--napkinbets-on-accent)`)
  so it reads as a selected segment, not just a tint.
- **Inactive chips:** Slightly reduce emphasis so they don’t compete: e.g.
  `color: var(--napkinbets-muted)` for inactive and reserve full `text-default`
  (or ink) for the active chip only.
- **Spacing:** Current `gap-2` is fine; ensure chips don’t wrap awkwardly on
  mid-width viewports (you already have `flex-wrap`).

**Concrete:** In `header-footer.css`, add a variant for “active filter chip”
that uses solid accent background and on-accent text (e.g.
`.napkinbets-filter-chip-active`), and apply it in
`NapkinbetsWagerListFilters.vue` when `modelValue === chip.value`. Optionally
set inactive chips to `color: var(--napkinbets-muted)` in the same file or via a
class.

---

## 4. Bet list — density and scannability

**Issue:** “Airy” padding is good for clarity but can limit how many bets are
visible; list rows could be easier to scan.

**Recommendations:**

- **Row density (optional):** Keep current padding for touch targets. If you
  want more density on desktop only, add a media query in `compact-card.css` to
  reduce `padding` (e.g. from 0.75rem 1rem to 0.6rem 0.85rem) at
  `min-width: 1024px`. Don’t go below ~44px tap height.
- **Visual separation:** List rows already have borders/shadows. Ensure there’s
  a clear **divider or gap** between rows (e.g. `space-y-2` on the parent) so
  rows don’t blur together.
- **Stake and players:** Right-aligned stake and “X players” is good. Keep type
  hierarchy: stake slightly bolder than player count; both use semantic tokens
  (`text-default`, `text-muted`).

**Concrete:** In `dashboard.vue` the list uses `space-y-2`; that’s sufficient.
In `NapkinbetsNapkinSummaryCard.vue`, the chevron already has
`group-hover:text-default`; consider a subtle hover background on the whole row
(e.g. `hover:bg-muted/50` on `.napkinbets-compact-card`) so the clickable area
is obvious.

---

## 5. Hero section — actions and hierarchy

**Issue:** “Create Napkin” plus Friends, Groups, Ledger are all in one row;
primary action could be even clearer.

**Recommendations:**

- **Primary vs secondary:** You already use primary for “Create Napkin” and soft
  neutral for the others. Keep that. Optionally add a **short supporting line**
  under the title (e.g. “Manage your bets and invitations”) so the hero isn’t
  only title + buttons.
- **Button order:** Order is good (Create first, then Friends, Groups, Ledger).
  No change required unless you want Ledger more prominent for a settle-up
  focus.

**Concrete:** In `dashboard.vue`, the hero already has kicker + title; you could
add a single `<p class="napkinbets-hero-lede">` line under the title (e.g.
“Manage your bets and invitations.”) and reuse the same class for consistency.
Optional.

---

## 6. Summary cards (metric row) — count and grid

**Issue:** Five metric cards in a row; at 768px the grid is 3 columns so the
last row has two cards. Layout is fine; only refinement is visual balance.

**Recommendations:**

- **5-column at large viewport:** You already use
  `repeat(auto-fit, minmax(0, 1fr))` at 1280px, so five cards get equal width.
  That’s good.
- **Icon consistency:** All metrics use the same “green pill + icon” style.
  Differentiating icon color by metric type (see §2) will help without changing
  structure.

---

## 7. Quick wins (high impact, low effort)

| Change                                                              | Where                                                                        | Effect                                      |
| ------------------------------------------------------------------- | ---------------------------------------------------------------------------- | ------------------------------------------- |
| Ensure all secondary text uses `text-muted` (or one semantic token) | Dashboard, metric card, compact card                                         | Better contrast and consistency.            |
| Softer metric icon pill                                             | `NapkinbetsMetricCard` or `.napkinbets-order-pill` in context of metric card | Value stands out; less “all green” feel.    |
| Stronger active filter chip (solid green + white text)              | `NapkinbetsWagerListFilters` + `header-footer.css`                           | Clearer “current filter” at a glance.       |
| Optional hover background on bet row                                | `.napkinbets-compact-card:hover` in `compact-card.css`                       | Clearer affordance that rows are clickable. |
| Optional one-line hero lede under title                             | `dashboard.vue`                                                              | Slightly clearer context without clutter.   |

---

## 8. What to avoid

- **Don’t** add more borders or shadows; you’re already consistent.
- **Don’t** shrink tap targets below ~44px; keep padding on list rows.
- **Don’t** introduce new raw Tailwind colors; use semantic tokens
  (`text-default`, `text-muted`, `bg-muted`, `border-default`, `text-primary`,
  etc.) per AGENTS.md.
- **Don’t** make metric cards dramatically different in size or shape; subtle
  color/icon differentiation is enough.

---

## Implementation order

1. **Contrast:** Audit `napkinbets-support-copy` and any dashboard copy; ensure
   they use a single muted token that passes 4.5:1.
2. **Filter chip active state:** Add solid active style and optionally mute
   inactive chips.
3. **Metric card icon:** Softer pill or per-metric icon color so the numeric
   value is the focus.
4. **Optional:** Hero lede, bet row hover background, and (if you add metric
   types) metric card color variants.

This keeps the current “clean, modern, friendly” look while improving clarity,
contrast, and scannability.
