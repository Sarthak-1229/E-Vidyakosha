# Independent two-agent implementation plan

## Phase 0 — Foundation (first, by Codex, short PR)

Install dependencies, resolve incompatible versions, generate and commit `package-lock.json`, get lint/typecheck/unit/build green, set up correct CI (`npm ci` after lock). Confirm OpenAPI parses and backend/test database connection to replica set. Keep `apps/web` untouched. Update `docs/09-GIT-HANDOFF.md` if necessary, no scope changes. This is a prerequisite to green integration.

## Phase 1 — Independent parallel work

**Codex / branch `feat/backend-codex` (owns API/shared/infra):** implement Mongoose 6 schemas and indexes; auth/register/login + JWT/RBAC; user/academic admin; document upload PDF validator/hash/GridFS and compensation; approval atomic metadata transaction; faculty ownership; approved search and authorized streams. Tests per FR; populate no synthetic production content. Build script for secure first-admin provisioning and GridFS orphan inspection/reconciliation. Never change web without agreement.

**Antigravity / branch `feat/frontend-antigravity` (owns web):** convert design preview to working React routes; reusable layout and glass components; registration/login, role dashboards, catalog search, PDF viewer, faculty upload/status, admin users/catalog/documents/review. Use `spec/openapi.yaml` + shared types as read-only. For offline frontend dev use explicit mock adapter and fixtures in test-only code, never claim implemented API works. Add frontend unit, browser and accessibility tests. Do not change backend/contracts.

## Phase 2 — Integration (single designated integrator, after PRs)

Merge backend PR first after CI. Rebase frontend branch on main, resolve API mismatches through reviewed contract changes, then merge frontend PR. Remove mock pathways and connect real API. Run Docker replica-set integration and full E2E role journeys with test identities. Fix real failures in small commits.

## Phase 3 — Release readiness

Audit permissions and approval states, duplicate races, cleanup compensation and reconciliation; monitor 50 MiB boundary, browser PDF render/download, keyboard and mobile navigation, HTTP/CORS/error behavior. Document setup, environment variables and demo script. Produce screenshots and test report. Never move unfinished TODOs to a hidden backlog to claim completion.

## Ownership matrix

| Area | Codex | Antigravity |
|---|---|---|
| `apps/api/**` | WRITE | READ ONLY |
| `packages/shared/**` | WRITE | READ ONLY |
| `spec/**` | WRITE, changes reviewed | READ ONLY |
| `infra/**` | WRITE | READ ONLY |
| `apps/web/**` | READ ONLY | WRITE |
| `docs/reference/**`, core requirements | READ ONLY | READ ONLY |
| `docs/08-OPEN-DECISIONS.md` | propose comment | propose comment |

Use two separate local clones or `git worktree add` per branch. Never run both agents in the same checkout or on the same feature branch. GitHub is the single merge point.
