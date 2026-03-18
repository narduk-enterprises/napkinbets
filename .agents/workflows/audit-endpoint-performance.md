---
description:
  Codebase-wide sweep to identify slow or inefficient server endpoints — heavy
  queries, redundant fetches, missing pagination, and N+1 patterns.
---

# Audit Endpoint Performance

A systematic workflow for finding and fixing slow API endpoints across the
entire codebase. Designed for Nuxt 4 + Drizzle ORM + Cloudflare Workers but the
patterns apply broadly.

## Phase 1 — Inventory all server endpoints

// turbo

1. List every API route handler:

```bash
fd -e ts . apps/web/server/api --type f
```

2. For each endpoint file, note:
   - **HTTP method** (GET endpoints are the primary concern for page loads)
   - **Auth guard** (`requireAdmin`, `requireAuth`, or public)
   - **Which service functions it calls** (look for imports from
     `#server/services/`)

## Phase 2 — Flag query anti-patterns

For each service function called by an endpoint, search for these red flags:

// turbo 3. **Full-table scans used only for counting:**

```bash
rg 'db\.select\(\)\.from\(' apps/web/server/services/ --type ts -n
```

Look for results where the returned array is only used for `.length`. These
should be `SELECT count(*)`.

// turbo 4. **Missing LIMIT on queries that don't need all rows:**

```bash
rg '\.from\(' apps/web/server/services/ --type ts -n | grep -v '\.limit('
```

Cross-reference with how the result is used — if it's sliced, filtered in
memory, or only the first N items are used, add a SQL `LIMIT`.

// turbo 5. **Unbounded `inArray` queries (potential D1 bind-param limit):**

```bash
rg 'inArray\(' apps/web/server/ --type ts -n
```

Check if the array passed to `inArray` could grow unboundedly. D1 has a
100-parameter limit per query. Large arrays need chunking (see `chunkItems`
pattern).

// turbo 6. **N+1 query patterns — loops with await inside:**

```bash
rg 'for.*of.*\{' apps/web/server/services/ --type ts -A5 | grep -B2 'await db\.'
```

These should be batched with `Promise.all` or rewritten as a single query with
`inArray`.

// turbo 7. **`SELECT *` when only a few columns are needed:**

```bash
rg '\.select\(\)\.from\(' apps/web/server/ --type ts -n
```

If the handler only uses a subset of columns (e.g., just `id` and `name`), use a
projection: `db.select({ id: table.id, name: table.name })`.

## Phase 3 — Flag frontend fetching anti-patterns

// turbo 8. **Multiple components triggering the same heavy endpoint:**

```bash
rg 'useNapkinbetsAdmin\(\)|useAsyncData.*admin' apps/web/app/ --type vue -l
```

If multiple tab components or child components call the same composable that
fetches a heavy endpoint, the request may fire multiple times. Each
tab/component should either:

- Share one parent-level fetch via props, OR
- Use its own lightweight endpoint

// turbo 9. **Eager loading of tab/modal content that isn't visible:**

```bash
rg 'await use' apps/web/app/components/ --type vue -n
```

Components inside `<UTabs>` slots or `<UModal>` bodies should use
`useLazyAsyncData` or fetch on-demand, not `await useAsyncData` (which blocks
the parent render).

// turbo 10. **Composables that call `ensureSeedData` or other setup functions
on every request:**

```bash
rg 'ensureSeedData\|ensureDefaults\|ensureInit' apps/web/server/ --type ts -n
```

These should be guarded by a per-isolate flag (`let initialized = false`) so
they only run once per worker lifecycle.

## Phase 4 — Quantify impact

11. For each flagged issue, estimate severity:

| Severity    | Pattern                                                  | Typical fix                                 |
| ----------- | -------------------------------------------------------- | ------------------------------------------- |
| 🔴 Critical | Full-table scan + in-memory aggregation on a large table | Replace with `count(*)` or `GROUP BY` query |
| 🔴 Critical | `loadAllData()` called when only counts/summaries needed | Write a dedicated lightweight endpoint      |
| 🟡 Moderate | `SELECT *` when only a few columns are needed            | Add column projection                       |
| 🟡 Moderate | Unbatched N+1 inside a loop                              | Use `Promise.all` + `inArray`               |
| 🟢 Minor    | Missing `LIMIT` on a small table                         | Add `.limit(N)`                             |
| 🟢 Minor    | Seed guard running repeatedly                            | Add per-isolate flag                        |

12. Prioritize fixes by: **(table size) × (request frequency) × (fix
    complexity)**

## Phase 5 — Apply fixes

13. For each fix:
    - Modify the server endpoint or service function
    - Update TypeScript types if the response shape changes
    - Update any composables/components that consume the changed response
    - Run `npx nuxi typecheck` to verify no type errors

14. After all fixes, verify the admin page (or affected pages) load correctly in
    the browser and check the Network tab to confirm smaller/faster responses.

## Quick one-liner: find the heaviest endpoints

This grep chain finds endpoints that call service functions doing `SELECT *` on
tables with no filters:

```bash
# Find endpoints → trace to service calls → find unfiltered selects
for f in $(fd -e ts . apps/web/server/api --type f); do
  imports=$(grep '#server/services' "$f" | grep -oP "import.*from '\K[^']+")
  for svc in $imports; do
    resolved=$(echo "$svc" | sed 's|#server/|apps/web/server/|' | sed 's|$|.ts|')
    if [ -f "$resolved" ]; then
      heavy=$(grep -c '\.select()\.from(' "$resolved" 2>/dev/null || echo 0)
      if [ "$heavy" -gt 2 ]; then
        echo "⚠️  $f → $resolved ($heavy unfiltered selects)"
      fi
    fi
  done
done
```
