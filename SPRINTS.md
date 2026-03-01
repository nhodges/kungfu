# KUNGFU.SH — Sprint Plan

## Overview

KUNGFU.SH is a web application that ingests bookmarks from connected social accounts and exposes them via REST API + agent skill for LLM consumption.

## Tech Stack

- **Framework:** Next.js 16 (App Router, TypeScript, Tailwind)
- **Database:** Postgres + Prisma ORM
- **Auth:** NextAuth v5 with email magic link (Resend)
- **Source OAuth:** Arctic library (X OAuth 2.0 PKCE)
- **Background Jobs:** pg-boss (Postgres-backed)
- **Search:** Postgres full-text search (tsvector + GIN)
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
| Rate limiting | In-memory (upgradeable to Postgres store) |
| X OAuth | Arctic library (PKCE) |
| Error handling | Zod + typed error classes + withErrorHandler |
| Module pattern | SourceProvider interface |
| Email | Resend |
| Connection pool | Prisma singleton |
| Sync throttle | Rate-limit-aware re-enqueue via pg-boss |
| Bulk upsert | createMany + skipDuplicates |
| Logging | Pino structured JSON |

---

## Sprint 1: Foundation

**Commit:** `55f299a`

- Next.js 16 with App Router, TypeScript, Tailwind
- Prisma schema with auth models (User, Account, Session, VerificationToken)
- NextAuth v5 with email magic link (Resend)
- Typed error classes + Zod utilities + withErrorHandler
- Structured logging with Pino
- Environment variable validation via Zod
- Dashboard + settings page shells
- Health check endpoint
- Railway deploy config, GitHub Actions CI

## Sprint 2: X Integration

**Commit:** `077fd9e`

- Prisma models: SourceConnection, Bookmark, SyncJob, ApiKey
- AES-256-GCM token encryption
- SourceProvider interface + XProvider (Arctic OAuth 2.0 PKCE)
- X OAuth connect/disconnect with PKCE cookie state
- pg-boss background job infrastructure
- Sync orchestration: pagination, rate-limit-aware re-enqueue
- Sync API: trigger (POST /api/sync/x), status polling (GET /api/sync/status/:id)
- Settings page: Connect X, Sync Now with progress
- MSW-backed X API tests (7 scenarios)

## Sprint 3: Search + Dashboard

**Commit:** `b0300ee`

- Raw SQL search query builder (tsvector + filters + cursor pagination)
- Search params Zod validation
- Internal bookmarks API (GET /api/bookmarks)
- BookmarkList with search bar, author filter, load more
- BookmarkCard component
- Bookmark detail view (/dashboard/bookmarks/:id)

## Sprint 4: Public API

**Commit:** `098cc5f`

- API key generation (kf_ prefix), SHA-256 hashing, validation
- API key CRUD routes (POST/GET/DELETE /api/keys)
- API key auth middleware
- In-memory rate limiter (100 req/min per key)
- Public API: GET /api/v1/bookmarks (search/filter/paginate, JSON+markdown)
- Public API: GET /api/v1/bookmarks/:id
- Public API: GET /api/v1/stats
- API key management UI in settings
- Agent skill definition (skill/SKILL.md)

## Sprint 5: Polish

- Landing page with hero, features, CTA
- Removed unused components

---

## Test Coverage: 45 tests across 9 test files

- `env.test.ts` (4) — Environment variable validation
- `errors.test.ts` (11) — Error class serialization + subclasses
- `logger.test.ts` (2) — Pino logger setup
- `crypto.test.ts` (7) — AES-256-GCM encrypt/decrypt
- `x.test.ts` (7) — X API: pagination, rate limit, 401, 403, errors (MSW)
- `search.test.ts` (5) — Search params validation
- `api-key.test.ts` (5) — Key generation, hashing
- `rate-limit.test.ts` (3) — Rate limiting behavior
- `api-auth.test.ts` (1) — Auth module exports

## Future Work

- Instagram, Reddit source providers
- Playwright e2e tests (3 critical flows)
- Toast/notification system
- Connection expiry handling
- MCP server wrapper
- x402 payment integration
- Auto-tagging via LLM
