# KUNGFU.SH Sprint Plan Review

## Numbered Suggestions

### 1. CRITICAL: Move CI pipeline from Sprint 5 to Sprint 1
**Issue:** Task 5.6 (CI pipeline) is in the final sprint. The project would run without CI for ~80% of development.
**Why it matters:** Without CI, regressions accumulate silently. Every subsequent sprint's "Validation" steps are manual-only, which defeats the purpose of having tests. CI is foundational infrastructure, not polish.
**Change:** Create a new **Task 1.7: CI pipeline (GitHub Actions)** — lint → typecheck → vitest → build. Add Playwright + Testcontainers to CI in Sprint 2 (Task 2.4 or a new 2.8) once there are integration tests that need them. Remove Task 5.6; replace with "CI hardening / caching optimization" if needed.

---

### 2. Split Task 1.2 (Prisma schema) — it's too large and premature
**Issue:** Task 1.2 defines ALL models (User, SourceConnection, ApiKey, Bookmark, SyncJob), the searchVector generated column with GIN index, compound indexes, the Prisma singleton, AND a seed script. This is ~4 tasks worth of work, and most models aren't exercised until Sprints 2–4.
**Why it matters:** Defining Bookmark's searchVector in Sprint 1 means writing raw SQL migrations for a feature (full-text search) that won't be used until Sprint 3. If the search design evolves, you'll need additional migrations. Also, the seed script can't create meaningful test data for models with no business logic yet.
**Change:**
- **Task 1.2a (Sprint 1):** Prisma setup + NextAuth models only (User, Account, Session, VerificationToken) + Prisma singleton + connection_limit. Seed: test users only.
- **Task 2.0 (Sprint 2, first task):** Add SourceConnection, Bookmark, SyncJob models + compound indexes `[userId, source, sourceId]`, `[userId, source]`, `[userId, createdAt]`. Seed: add fixture bookmarks.
- **Task 3.0 (Sprint 3, first task):** Add searchVector generated column via raw SQL migration + GIN index. (This pairs naturally with Task 3.1 search query builder.)

---

### 3. Clarify Task 2.2 scope — fetchBookmarks overlaps with Task 2.5
**Issue:** Task 2.2 lists implementing `fetchBookmarks(connection, cursor?)` as part of the XProvider, but Task 2.5 is titled "X bookmark fetch implementation" and implements the same method. The boundary is unclear.
**Why it matters:** Ambiguous task boundaries lead to either duplicate work or gaps where neither task fully owns the implementation.
**Change:** Task 2.2 should explicitly state it implements only `getAuthUrl()`, `handleCallback()`, and `refreshToken()`. The `fetchBookmarks()` method should be a stub that throws `NotImplementedError`. Task 2.5 then replaces the stub with the real implementation. Update Task 2.2's title to "SourceProvider interface + X OAuth auth methods (Arctic)".

---

### 4. Split Task 5.2 (Error states + edge cases) — it's a grab-bag, not atomic
**Issue:** Task 5.2 bundles: expired connection handling, sync failure UX, empty search results, API rate limit feedback, a toast/notification system, AND cancelling jobs when a connection is deleted. These are independent concerns spanning different subsystems.
**Why it matters:** A non-atomic task can't be independently committed, reviewed, or tested. If any one piece stalls, the whole task is blocked. The toast system alone is a meaningful task.
**Change:** Split into:
- **Task 5.2a:** Toast/notification system (reusable component + hook)
- **Task 5.2b:** Connection expiry handling (detect expired X token → prompt reconnect on dashboard + settings)
- **Task 5.2c:** Sync error states (sync failure display + retry button + cancel on disconnect)
- **Task 5.2d:** Empty/edge states audit (empty search results, rate limit feedback in UI, no connection state)

---

### 5. MISSING: PKCE code_verifier storage for X OAuth
**Issue:** X OAuth 2.0 with PKCE requires storing the `code_verifier` between the authorization redirect (Task 2.3 GET route) and the callback (Task 2.3 callback route). No task mentions where or how this is persisted.
**Why it matters:** Without persisting the code_verifier (typically in a short-lived encrypted cookie or server-side session), the OAuth callback will fail every time. This is a hard blocker.
**Change:** Add to Task 2.2 or 2.3: "Store PKCE code_verifier + state in an encrypted HTTP-only cookie during auth redirect; retrieve and validate in callback." Include a test case for state mismatch.

---

### 6. MISSING: pg-boss worker lifecycle design
**Issue:** Task 2.4 says "Integrate pg-boss startup into Next.js server (start workers on app boot)." Next.js in production (especially on platforms like Railway) may run in serverless mode or have multiple instances. Starting pg-boss workers inside the Next.js process is fragile — workers could start multiple times, or not at all in serverless cold starts.
**Why it matters:** If this isn't explicitly addressed, sync jobs may silently fail in production, or you'll get duplicate job processing from multiple instances.
**Change:** Add a design note to Task 2.4: explicitly decide between (a) a custom server entry point (`server.ts`) that starts both Next.js and pg-boss workers, or (b) a separate worker process with its own Railway service. Option (a) is simpler for a single Railway service. Document this decision and configure Railway accordingly (update Task 1.6 or add a new Task 2.4b for Railway worker config).

---

### 7. MISSING: Environment variable documentation + validation
**Issue:** The plan references many env vars (DATABASE_URL, NEXTAUTH_SECRET, RESEND_API_KEY, ENCRYPTION_KEY, X OAuth client ID/secret, etc.) but no task creates `.env.example`, documents required variables, or validates them at startup.
**Why it matters:** Missing or misconfigured env vars cause cryptic runtime errors. A `.env.example` file is essential for onboarding and deployment.
**Change:** Add to Task 1.1 or create Task 1.1b: Create `.env.example` with all required vars (commented with descriptions), add a `lib/env.ts` that validates required env vars at startup using Zod (fail fast with clear error messages). Update this file as new vars are introduced in later sprints.

---

### 8. Reorder Task 4.5 (API key management UI) before Task 4.3/4.4
**Issue:** Task 4.5 (API key UI) depends only on Task 4.1 (key generation logic), not on 4.2–4.4. But it's sequenced last, after all middleware and endpoints are built.
**Why it matters:** Having the UI available early lets you manually create API keys to test the middleware (4.2), rate limiter (4.3), and public endpoints (4.4) during development. Without the UI, you'd need to create keys via seed scripts or raw SQL.
**Change:** Reorder Sprint 4 to: 4.1 → 4.5 → 4.2 → 4.3 → 4.4 → 4.6. This gives you a working key creation UI before you start building the endpoints that require keys.

---

### 9. MISSING: Production migration strategy
**Issue:** Task 1.6 (Railway deployment) configures build/start commands but doesn't mention how database migrations run in production. Prisma needs `prisma migrate deploy` to run before the app starts.
**Why it matters:** First deploy and every subsequent schema change requires migrations. If forgotten, the app will crash on startup with schema mismatches.
**Change:** Add to Task 1.6: Configure Railway build command to include `npx prisma migrate deploy` before `npm run build`, or add it to a `prestart` script. Verify migrations run correctly on first deploy and on subsequent deploys with schema changes.

---

### 10. MISSING: Structured logging
**Issue:** No task mentions logging. The sync pipeline (Sprint 2) involves background jobs, rate limiting, token refresh, pagination — all things that need observability.
**Why it matters:** When a sync job fails in production, you need logs to diagnose it. `console.log` is insufficient for structured querying. Without logging planned from the start, you end up retrofitting it later across dozens of files.
**Change:** Add **Task 1.3b: Structured logging utility** — Create `lib/logger.ts` using `pino` or similar (JSON output, log levels, request IDs). Use throughout all subsequent tasks. This is lightweight and pays dividends immediately.

---

### 11. Task 3.1 depends on search vector being populated — verify tsvector trigger/generation
**Issue:** Task 1.2 defines `searchVector` as a "generated column (via raw SQL migration)." Postgres generated columns with `tsvector` type using `to_tsvector()` work only if the generation expression references columns in the same table. However, if bookmark content is in a `text` column, the generated column approach works. But the plan doesn't verify this end-to-end.
**Why it matters:** If the generated column doesn't correctly populate (e.g., due to NULL content, or needing a trigger instead of a generated column for multi-column search), Sprint 3 search will silently return no results.
**Change:** When searchVector setup is moved to Sprint 3 (per suggestion #2), Task 3.0 should include: (a) write the migration, (b) verify via an integration test that inserting a bookmark auto-populates the search vector, (c) verify `to_tsquery` matches against it. This validates the foundation before building the query builder.

---

### 12. MISSING: Bookmark content sanitization
**Issue:** Bookmarks contain user-generated content from X (tweet text, author names). This content is rendered in the dashboard (Task 3.2) and returned via API (Task 4.4). No task addresses XSS prevention or content sanitization.
**Why it matters:** Rendering unsanitized tweet content in React is mostly safe (JSX auto-escapes), but the markdown API format (`?format=md`) in Task 4.4 could be an injection vector. Additionally, stored XSS via malicious tweet content is a real concern if any `dangerouslySetInnerHTML` is used.
**Change:** Add a note to Task 3.2: "Ensure all bookmark content is rendered via JSX text interpolation (not dangerouslySetInnerHTML). For markdown format in Task 4.4, escape content before embedding in markdown output." Not a full task, but should be in the acceptance criteria.

---

### 13. Task 2.7 "don't allow concurrent syncs" needs more design
**Issue:** Task 2.7 says "Handle edge cases: don't allow concurrent syncs for same user+source" but doesn't specify the mechanism. This could be a DB constraint, a pg-boss singleton queue, or an application-level check.
**Why it matters:** Race conditions between "check if sync is running" and "start new sync" can lead to duplicates. pg-boss has built-in singleton job support (`singletonKey`) that's the natural fit here.
**Change:** Add to Task 2.6 or 2.7: "Use pg-boss `singletonKey: userId-source` to prevent concurrent syncs. Return 409 Conflict from the API if a sync is already in progress for this user+source."

---

### 14. Consider merging Tasks 5.3, 5.4, 5.5 (E2E tests) into fewer tasks
**Issue:** Three separate E2E test tasks (sign-up flow, connect+sync, API key+API) are individually small. Each creates 1-2 Playwright test files.
**Why it matters:** The overhead of three separate PRs/commits for closely related E2E tests adds coordination cost without much benefit. They share test setup (authenticated user fixture, mock servers).
**Change:** Merge into two tasks: **Task 5.3: E2E — auth + dashboard flow** (sign up → empty dashboard → connect X → sync → bookmarks appear) and **Task 5.4: E2E — API key + public API** (create key → call API → verify response). This reduces to two focused, meaningful E2E test suites.

---

### 15. MISSING: Rate limit handling for X API during initial sync
**Issue:** Task 2.5 handles 429 responses, and Task 2.6 re-enqueues with `startAfter`. But the X bookmarks endpoint has a very low rate limit (180 requests per 15 minutes for app-level, even lower for user-level). A user with thousands of bookmarks could hit the limit quickly.
**Why it matters:** The first sync for a power user could take hours due to rate limits. The UI (Task 2.7) needs to communicate this clearly — "Sync paused, resuming in 12 minutes" not just "syncing...".
**Change:** Add to Task 2.7's acceptance criteria: "Progress indicator shows rate-limit pause state with estimated resume time. User understands that initial sync may take multiple cycles." Also add a note in Task 2.6 to store `rateLimitResetAt` on the SyncJob record so the UI can display it.

---

### 16. MISSING: Graceful handling of X API scope/permission changes
**Issue:** The X API v2 bookmarks endpoint requires specific OAuth scopes (`bookmark.read`, `tweet.read`, `users.read`). If X changes permissions or the user revokes app access, fetches will fail with 403.
**Why it matters:** Without handling 403 specifically (separate from 401 unauthorized), the app might endlessly retry or show confusing errors.
**Change:** Add to Task 2.5 test cases: "Handle 403 Forbidden — mark connection as needing re-authorization, surface to user in dashboard." Quick addition to the existing task's scope.

---

### 17. Task 4.3 rate limiting — verify Postgres store doesn't add excessive load
**Issue:** Task 4.3 uses `rate-limiter-flexible` with a Postgres store. Every API request will hit Postgres for rate limit checks, adding load to the same database used for bookmarks, sessions, and pg-boss.
**Why it matters:** Under high API load, rate limit queries could degrade database performance for all features. For an MVP this is likely fine, but the decision should be conscious.
**Change:** Add a note to Task 4.3: "Use a lightweight Postgres table for rate limiting. Monitor query overhead. If performance becomes an issue, migrate to in-memory store (node-cache) or Redis in a future sprint." No code change needed, just documented awareness.

---

### 18. MISSING: API versioning strategy
**Issue:** Task 4.4 creates endpoints under `/api/v1/`. Good. But no task documents the versioning strategy or sets up infrastructure for it.
**Why it matters:** When v2 is needed, having a clear pattern from day one prevents ad-hoc solutions.
**Change:** Minor — add a note in Task 4.4: "All public API routes under `/api/v1/`. Document versioning approach (URL-based, v1 stays stable, breaking changes go to v2). No additional code needed."

---

## Overall Assessment

**The plan is solid and well-structured, but needs one more pass before execution.** The sprint progression makes sense (foundation → integration → search → API → polish), each sprint is demoable, and most tasks are well-scoped.

### Critical blockers (fix before starting):
1. **Move CI to Sprint 1** (#1) — non-negotiable for a quality-focused project
2. **Split Task 1.2** (#2) — the all-models-upfront approach creates premature coupling and an oversized task
3. **PKCE storage** (#5) — OAuth will not work without this
4. **pg-boss lifecycle** (#6) — production sync will fail without a clear worker strategy
5. **Production migrations** (#9) — first deploy will fail without this

### Important improvements (strongly recommended):
6. Env var validation (#7)
7. Structured logging (#10)
8. Reorder Sprint 4 for API key UI first (#8)
9. Split Task 5.2 (#4)
10. SearchVector verification (#11)

### Nice-to-have refinements:
11. Clarify Task 2.2 scope (#3)
12. Merge E2E tests (#14)
13. Content sanitization note (#12)
14. Concurrent sync mechanism (#13)
15. Rate limit UX (#15)

### What's done well:
- Sprint boundaries produce demoable increments ✓
- Testing strategy (Vitest + MSW + Testcontainers + Playwright) is comprehensive ✓
- Security considerations (encryption, API key hashing, auth middleware) are present from the start ✓
- The SourceProvider interface pattern enables future extensibility ✓
- Task ordering within sprints is mostly correct (foundation before features) ✓
- Test requirements per task are specific and realistic ✓

### Suggested Revised Sprint Structure:
- **Sprint 1:** Tasks 1.1, 1.2a (NextAuth models only), 1.3, 1.3b (logging), 1.4, 1.5, 1.6 (with migrations), 1.7 (CI)
- **Sprint 2:** Tasks 2.0 (remaining models), 2.1, 2.2 (auth methods only), 2.3 (with PKCE storage), 2.4 (with worker lifecycle decision), 2.5, 2.6 (with singleton key), 2.7 (with rate limit UX)
- **Sprint 3:** Tasks 3.0 (searchVector migration + verification), 3.1, 3.2, 3.3, 3.4
- **Sprint 4:** Tasks 4.1, 4.5 (UI first), 4.2, 4.3, 4.4, 4.6
- **Sprint 5:** Tasks 5.1, 5.2a-d (split error handling), 5.3-5.4 (merged E2E), 5.7
