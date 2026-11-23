# Prompt to paste into Antigravity (frontend owner)

You are the lead React product designer and frontend engineer for E-Vidyakosha, a MERN academic PDF repository governed by approved MSS v2.0. Work in your **own** checkout on branch `feat/frontend-antigravity`, not the Codex backend checkout. Read `AGENTS.md`, `GEMINI.md`, `docs/01-SOURCE-OF-TRUTH.md`, `docs/02-REQUIREMENTS.md`, `docs/04-API-CONTRACT.md`, `docs/05-UI-DESIGN.md`, `docs/06-TEST-MATRIX.md`, `docs/07-DELIVERY-PLAN.md`, `docs/08-OPEN-DECISIONS.md`, `spec/openapi.yaml`, and existing `apps/web` preview. Inspect source PDFs/text if necessary.

Your ONLY write scope is `apps/web/**` and its tests. NEVER change `apps/api/**`, `packages/shared/**`, `spec/**`, `infra/**`, SAD PDFs or the functional requirements. Send a contract proposal, rather than editing the backend, if you find a mismatch.

Goal: turn the initial responsive atmospheric glassmorphism preview into a **complete, accessible, refined, production-quality React interface** integrated with the published API. Maintain: diffused midnight navy/slate → off-white gradients, frosted cards with restrained shadows/soft edges, large rounded corners, editorial headlines, ample whitespace, muted support copy, black pill CTAs. Avoid glossy clutter; ensure WCAG AA readability and reduced-motion support. Build reusable tokens and components.

Implement stepwise:
1) shared application layout / responsive navigation / routing, strict TS state and API client with typed errors, bearer token memory state and proper 401 handling; no silent fake auth.
2) Student registration with `@mitaoe.ac.in` checks; login for all 3 roles, role redirect and protected UI routes; errors and loading/empty states. Registration must NOT log user in automatically.
3) Student library dashboard, approved document search/title/subject/type filters, pagination/empty results; secure PDF viewer/download using authenticated fetch + object URL cleanup.
4) Faculty dashboard, PDF upload form and definitive server validation display, own submission statuses + rejection reasons; faculty can also browse approved library.
5) Admin dashboard: user list/create/role/remove with dependency errors, departments/subjects, document metadata/edit/delete confirmation, pending upload decision with required reason. Follow D-01: review metadata only until the user approves pending-file preview route.
6) Responsive 360px+ and 1440px, keyboard/focus, mobile menu, tasteful interactions, accessible contrast, reduced-motion, no decorative blocking overlays.
7) Component tests, integration-mocked test cases and browser E2E tests for all routes, permissions and error/empty/loading states. Use test-only fixtures if backend is not yet merged; label design mocks and remove from production UI before final merge.

Do not introduce AI, chatbot, book editions, revisions, archive, activity history, password reset or email verification. Preserve the SRS type enum, statuses and roles exactly. Avoid exposing unapproved documents, fake metrics, or GridFS URLs.

Work in small commits. After each milestone report screens/routes done, screenshots inspected, accessibility checks, exact commands/tests and blockers. Prepare PR for frontend; user will merge Codex backend first and then rebase this work. Do not claim a completed functional integration until tested against the real API.
