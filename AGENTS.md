# Persistent agent instructions — E-Vidyakosha

Applies to **both Codex and Antigravity**. Do not treat a future user prompt as permission to silently change these project requirements.

## Truth and scope

1. The **approved MSS v2.0** as represented by `docs/reference/01-SRS.pdf` is the primary requirements baseline. The 7 other SAD practicals specify implementation/behavioral/structural detail; consult `docs/01-SOURCE-OF-TRUTH.md` for precedence and mapped extracted text. Original PDFs are **private local copies** ignored by Git; use the approved detailed summary if they are absent and request source access when a source dispute actually requires it.
2. Exactly three roles: `STUDENT`, `FACULTY`, `ADMIN`. Exactly twelve primary functional requirements: FR-01 through FR-12. Keep 6 app collections plus MongoDB GridFS, and the 10 named core UML types. Do not invent features/entities or treat helper types as new domain entities.
3. Follow the explicit out-of-scope list in `docs/02-REQUIREMENTS.md`. AI, recommendations, notifications, password reset/email verification, native mobile, book editions, revisions, audit history, physical lending are excluded.
4. New branding is **E-Vidyakosha**; business semantics remain those of Smart Library documents.
5. Do not claim tests pass unless you executed them. Do not silently disable validation, security, tests, types or lint. If blocked, report exact failure, reproduction, affected FR and next action.

## Contracts & architecture

- TypeScript strict; modular monolith, no microservices. React SPA -> Express REST API -> MongoDB/Mongoose + GridFS.
- `spec/openapi.yaml` and `packages/shared` define client/server contract. Breaking changes require a small ADR and both-agent coordination before editing.
- JWT checked server-side for every protected request. Roles are NEVER trusted from browser input. Student signup always creates `STUDENT` and only accepts `@mitaoe.ac.in`.
- PDF <= 50 * 1024 * 1024 bytes, valid readable unencrypted PDF, unique SHA-256 across retained assets. Enforce in backend, not UI only.
- Browse/search/inline/download return approved docs only. Never expose raw GridFS IDs or public asset URLs. Faculty sees own upload statuses only. Admin alone changes statuses. Final statuses never return to pending.
- `UploadRequest` has **no separate stored status**; status comes from `Document.status`. Review writes document + review metadata atomically (MongoDB metadata transaction); a second decision fails.
- GridFS **cannot be included in MongoDB multi-document transactions**. Use explicit compensation + reconciliation and failure-injection tests; never claim one transaction covers GridFS bytes.
- Data integrity: no dangling references on deletion, no user/category deletion with dependent records, unique indexes + duplicate-key mapping.

## Work ownership

- **Codex** owns `apps/api/`, `packages/shared/`, `spec/`, `infra/` and backend tests. Do not modify `apps/web/` except in an approved integration PR.
- **Antigravity** owns `apps/web/` and frontend tests. Read, but DO NOT modify, `spec/`, `packages/shared/`, `apps/api/` or `infra/` without explicit contract-change approval.
- Both may propose doc changes, but must never quietly change a requirements file, source PDF, or shared contract.
- Make small commits on separate branches and open PRs. No rewriting history; never force push to main.

## Quality gates (after npm packages are installed)

`npm run lint`, `npm run typecheck`, `npm run test`, `npm run build`, plus full manual and browser verification in `docs/06-TEST-MATRIX.md`.

A feature is done only with correct permission checks, schema validation, empty/loading/error states, tests of happy and failure paths, and no console warnings or secret leaks. Preserve accessibility and keyboard functionality.

## If conflict/ambiguity

Read `docs/08-OPEN-DECISIONS.md`. Prefer the explicit SRS over contradictory diagram captions. Stop **only the affected feature**, record the ambiguity, and proceed with other nonconflicting work. Do not alter MSS without user approval.
