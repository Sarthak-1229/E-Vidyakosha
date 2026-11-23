# Antigravity workspace instructions

Read `AGENTS.md`, `docs/05-UI-DESIGN.md`, `docs/04-API-CONTRACT.md`, `docs/06-TEST-MATRIX.md`, and `docs/07-DELIVERY-PLAN.md` before editing.

Antigravity's scoped job: implement and polish **only `apps/web/`**. Work on `feat/frontend-antigravity`, preferably in a separate checkout. Backend and shared API contract are owned by Codex. Never run broad refactors in `apps/api`, `packages/shared`, `spec`, or `infra`.

Implement role-driven navigation, student registration/login, dashboards, searchable approved catalog, faculty upload/status, admin management/review, and secure PDF view/download integration **only via the published endpoints**. Use explicitly labeled temporary mock adapters during backend development; remove them before delivery. Never present mock results as actual data.

Visual direction: dark slate/midnight navy atmospheric gradients dissolving into airy off-white, frosted translucent glass panels, rounded 20-32px corners, subtle blur, minimal shadows/borders, bold editorial sans-serif text, muted supporting text, and high-contrast black pill CTAs. Motion tasteful and reduced-motion friendly. Responsive 360px to wide desktop, focus rings, accessible contrast, keyboard interactions, error/loading/empty states. Keep real security server-side.

When finished, report routes/screens, exact tests run and results, contract mismatches, and a PR summary. No claiming full app readiness before integration review.
