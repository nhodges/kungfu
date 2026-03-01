# KUNGFU.SH — Sprint Plan

## Tech Stack
- **Framework:** Next.js 16 (App Router, TypeScript, Tailwind)
- **Database:** Postgres + Prisma ORM
- **Auth:** NextAuth v5 (email magic link via Resend)
- **Source OAuth:** Arctic library (X OAuth 2.0 PKCE)
- **Background Jobs:** pg-boss (Postgres-backed)
- **Search:** Postgres full-text search (tsvector + GIN index)
- **Testing:** Vitest + Playwright + MSW
- **Logging:** Pino (structured JSON)
- **Deployment:** Railway

## Architecture Decisions
| Decision | Choice |
|----------|--------|
| Background jobs | pg-boss from day 1 |
| Token security | AES-256-GCM + refresh-on-use |
| Search | Postgres tsvector/GIN |
| API keys | SHA-256 hashed, shown once |
| Rate limiting | In-memory (upgrade to Postgres store if needed) |
| X OAuth | Arctic library (PKCE) |
| Error handling | Zod + typed error classes + API wrapper |
| Module pattern | SourceProvider interface (one file/source) |
| Email | Resend |
| Connection pool | Prisma singleton |

---

## Sprint 1: Foundation
**Commit:** `Sprint 1: Foundation — Next.js, Prisma, NextAuth, CI, Railway`

| Task | Description | Validation |
|------|-------------|------------|
| 1.1 | Init Next.js + tooling + env validation | Build, lint, test pass |
| 1.2 | Prisma schema (auth models only) | Prisma generate succeeds |
| 1.3 | Typed error classes + Zod utilities | Unit tests pass |
| 1.4 | Structured logging (Pino) | Logger outputs JSON |
| 1.5 | Magic link auth (NextAuth + Resend) | Auth flow works |
| 1.6 | Dashboard + settings page shells | Auth-gated pages render |
| 1.7 | Railway deployment config | Build command includes migrations |
| 1.8 | CI pipeline (GitHub Actions) | Lint, typecheck, test, build |

---

## Sprint 2: X Integration
**Commit:** `Sprint 2: X Integration — OAuth, sync, pg-boss`

| Task | Description | Validation |
|------|-------------|------------|
| 2.0 | Add SourceConnection, Bookmark, SyncJob, ApiKey models | Migration succeeds |
| 2.1 | Token encryption (AES-256-GCM) | Round-trip, wrong key, tamper tests |
| 2.2 | SourceProvider interface + XProvider auth | MSW tests pass |
| 2.3 | X OAuth connect/disconnect + PKCE cookie | OAuth flow, state mismatch |
| 2.4 | pg-boss setup + worker lifecycle | Jobs enqueue and execute |
| 2.5 | X bookmark fetch implementation | MSW: pagination, 429, 401, 403 |
| 2.6 | Sync orchestration job | Multi-page + rate limit re-enqueue |
| 2.7 | Sync trigger UI + progress | Progress states render |

---

## Sprint 3: Search + Dashboard
**Commit:** `Sprint 3: Search + Dashboard — full-text search, browse, filters`

| Task | Description | Validation |
|------|-------------|------------|
| 3.0 | searchVector migration (tsvector + GIN) | SQL migration file |
| 3.1 | Raw SQL search query builder | Zod validation, search params |
| 3.2 | Bookmark list + infinite scroll | Dashboard shows bookmarks |
| 3.3 | Search bar + author filter | Search + filters work |
| 3.4 | Bookmark detail view | All fields render |

---

## Sprint 4: Public API
**Commit:** `Sprint 4: Public API — API keys, rate limiting, REST endpoints`

| Task | Description | Validation |
|------|-------------|------------|
| 4.1 | API key generation + SHA-256 hashing | Key format, hash tests |
| 4.2 | API key management UI | Create, copy, list, delete |
| 4.3 | API key auth middleware | All auth scenarios |
| 4.4 | Rate limiting (100 req/min) | 101st request gets 429 |
| 4.5 | Public API endpoints | /v1/bookmarks, /v1/bookmarks/:id, /v1/stats |
| 4.6 | Agent skill definition | SKILL.md with tool definitions |

---

## Sprint 5: Polish
**Commit:** `Sprint 5: Polish — landing page, cleanup`

| Task | Description | Validation |
|------|-------------|------------|
| 5.1 | Landing page | Hero, features, CTA |

---

## File Structure
```
src/
  app/
    page.tsx                          # Landing page
    auth/signin/page.tsx              # Magic link sign-in
    auth/verify/page.tsx              # Email sent confirmation
    (authenticated)/
      layout.tsx                      # Auth-gated layout with nav
      dashboard/page.tsx              # Browse/search bookmarks
      dashboard/bookmarks/[id]/page.tsx # Bookmark detail
      settings/page.tsx               # Connections, API keys
    api/
      health/route.ts                 # Health check
      auth/[...nextauth]/route.ts     # NextAuth
      bookmarks/route.ts              # Internal search (session auth)
      connections/x/route.ts          # X OAuth initiate + disconnect
      connections/x/callback/route.ts # X OAuth callback
      sync/x/route.ts                # Trigger sync
      sync/status/[id]/route.ts      # Sync progress
      keys/route.ts                  # API key CRUD
      keys/[id]/route.ts             # Delete API key
      v1/bookmarks/route.ts          # Public search API
      v1/bookmarks/[id]/route.ts     # Public bookmark detail
      v1/stats/route.ts              # Public stats
  lib/
    env.ts                           # Zod env validation
    db.ts                            # Prisma singleton
    logger.ts                        # Pino structured logging
    auth.ts                          # NextAuth config
    crypto.ts                        # AES-256-GCM encrypt/decrypt
    errors.ts                        # Typed error classes
    api-utils.ts                     # withErrorHandler, Zod helpers
    api-key.ts                       # Key generation, hashing
    api-auth.ts                      # API key auth middleware
    rate-limit.ts                    # Rate limiting
    search.ts                        # Raw SQL search builder
    jobs/
      index.ts                       # pg-boss singleton
      sync-bookmarks.ts             # Sync orchestration
    sources/
      types.ts                       # SourceProvider interface
      x.ts                           # XProvider
  components/
    nav.tsx                          # Navigation bar
    bookmark-card.tsx                # Bookmark card
    bookmark-list.tsx                # Search + list + load more
    x-connection-card.tsx            # Connect/sync X
    api-keys.tsx                     # API key management
  middleware.ts                      # Auth middleware
prisma/
  schema.prisma                      # Database schema
  migrations/add_search_vector.sql   # Full-text search migration
skill/
  SKILL.md                           # Agent skill definition
tests/
  fixtures/x/                        # X API mock responses
```

## Test Coverage
- **45 tests** across 9 test files
- Environment validation (4 tests)
- Error classes and serialization (11 tests)
- Logging (2 tests)
- AES-256-GCM encryption (7 tests)
- X API integration via MSW (7 tests: pagination, 429, 401, 403, empty, errors)
- Search param validation (5 tests)
- API key generation + hashing (5 tests)
- Rate limiting (3 tests)
- API auth module (1 test)
