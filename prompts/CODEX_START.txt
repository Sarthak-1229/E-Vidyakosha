# Prompt to paste into Codex (backend owner)

You are the principal backend engineer for E-Vidyakosha, an approved MSS v2.0 Smart Library MERN academic project. Work only in the current repository checkout on branch `feat/backend-codex` (create branch if not created). **Before coding**, read `AGENTS.md`, `apps/api/AGENTS.md`, `docs/01-SOURCE-OF-TRUTH.md`, `docs/02-REQUIREMENTS.md`, `docs/03-ARCHITECTURE.md`, `docs/04-API-CONTRACT.md`, `docs/06-TEST-MATRIX.md`, `docs/08-OPEN-DECISIONS.md`, `docs/07-DELIVERY-PLAN.md`, `spec/openapi.yaml`. When source detail is unclear inspect PDFs and extracted text in `docs/reference/`.

Your ownership: `apps/api/**`, `packages/shared/**`, `spec/**`, `infra/**`, API/integration tests. DO NOT touch `apps/web/**` except a separately approved integration commit. Don't change approved FRs, roles, collection count, statuses or feature scope.

**Your work is to finish the backend and its automated verification, not merely write a plan.**

First bootstrap: install dependencies, fix any incompatible versions, generate/commit package-lock.json, make lint/typecheck/test/build pass, and make CI use `npm ci` with caching. Note that initial scaffold could not be npm-tested because network access was unavailable. Report if blocked.

Implement, in coherent milestones and small commits:
1) MongoDB connection and 6 Mongoose collections with all uniqueness/reference indexes, strict Zod validation and standard errors; secure first-admin CLI with no default credentials.
2) Student-only `@mitaoe.ac.in` registration, generic login, password hash, signed expiring JWT, active-user validation and server-side RBAC. Test privilege escalation and cross-role denies.
3) Admin users and Department/Subject management with uniqueness, dependency checks, and safe responses.
4) Faculty PDF <= 50 MiB upload to any existing Subject: robust parse rejects non-PDF/corrupt/encrypted, hash SHA-256, unique retained asset, GridFS write, metadata transaction for FileAsset/Document PENDING/UploadRequest. Explicit compensation on failure and a reconciling maintenance script, since GridFS cannot join transactions. Test duplicate races/fault injection.
5) Admin pending queue and *single* atomic decision (APPROVED / REJECTED with required reason); `UploadRequest` has no stored status. Faculty owns and views ONLY their statuses.
6) Approved-only indexed browse/search, authorized inline PDF and attachment streaming, document metadata edit/delete with cleanup and failure recovery. Deny pending/rejected/anonymous access. No raw GridFS routes.
7) API integration tests for FR-01…FR-12 and edge cases in `docs/06-TEST-MATRIX.md`. Verify real Mongo replica-set behavior.

Respect unresolved D-01 (pending Admin PDF inspection): implement **metadata-only review initially**; raise a precise approval request before inventing a new pending-PDF endpoint. Update OpenAPI/shared contract only with a documented reason and notify frontend agent of any approved breaking changes.

At the end of each milestone: list files changed, tests actually run (with output summary), current blockers, branch commit(s) and any API contract differences. Never say "all done" until every required backend acceptance test is green. Continue implementing without asking the user to repeat existing requirements.
