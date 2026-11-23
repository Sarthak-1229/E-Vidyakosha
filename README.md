# E-Vidyakosha

**Smart Library E-Book & Reference Document Repository** — academic MERN implementation of the **approved MSS v2.0**, branded **E-Vidyakosha**.

> **Status: architecture-first starter scaffold, not a finished application.** The UI previews the visual language and the API offers a scaffold health endpoint. Authentication, repository operations, persistence, and full end-to-end workflows are work items for Codex and Antigravity. Never claim they work until tested.

## The two-agent workflow

- **Codex**: `apps/api/`, `packages/shared/`, storage, contract/API integration tests. Work on branch `feat/backend-codex`.
- **Antigravity**: `apps/web/`, styling, accessibility, UI behavior and browser tests. Work on branch `feat/frontend-antigravity`.
- **You**: approve contract changes and merge PRs. Both agents read root `AGENTS.md`; Antigravity also reads `GEMINI.md`.
- Agents **must not** work simultaneously in the same checkout/branch. Use two separate clones or Git worktrees.

## Read first

1. [`docs/01-SOURCE-OF-TRUTH.md`](docs/01-SOURCE-OF-TRUTH.md) — 8 original PDFs and extracted text.
2. [`docs/02-REQUIREMENTS.md`](docs/02-REQUIREMENTS.md) — immutable FR-01 ... FR-12 and scope boundaries.
3. [`docs/03-ARCHITECTURE.md`](docs/03-ARCHITECTURE.md) — modules, security, consistency, storage.
4. [`docs/04-API-CONTRACT.md`](docs/04-API-CONTRACT.md) and [`spec/openapi.yaml`](spec/openapi.yaml) — integration contract.
5. [`docs/05-UI-DESIGN.md`](docs/05-UI-DESIGN.md) — user-approved atmospheric glassmorphism.
6. [`docs/06-TEST-MATRIX.md`](docs/06-TEST-MATRIX.md) — acceptance and negative-path evidence.
7. [`docs/07-DELIVERY-PLAN.md`](docs/07-DELIVERY-PLAN.md) — responsibilities and milestones.
8. [`docs/08-OPEN-DECISIONS.md`](docs/08-OPEN-DECISIONS.md) — documented ambiguities and decisions.

## Local prerequisites

- Node **24 LTS** recommended (compatible Node 22.12+ also permitted by the scaffold).
- npm, Git; MongoDB replica set (local Docker setup in `infra/README.md` or managed development database).
- Copy environment examples and provide **your own credentials**. Never commit `.env` or password values.

```bash
npm install                     # first bootstrap; commit package-lock.json before switching CI to npm ci
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env
npm run dev                     # web http://localhost:5173 ; API http://localhost:4000
npm run typecheck
npm run test
npm run build
```

On Windows PowerShell use `Copy-Item apps/api/.env.example apps/api/.env` and similarly for `apps/web`.

**Important:** `npm install` and full app tests could not be executed in the scaffold creation environment because npm registry access was unavailable. The code is a working *starting shape*, not a certified build. Codex's first task includes installing dependencies, generating the lockfile, and proving green CI.

## Confidential source files

The starter ZIP contains all 8 original source PDFs and their searchable text under `docs/reference/`. **They are excluded from Git by default** because the PDFs contain students' names and PRNs. Copy `docs/reference/` from this ZIP into **each agent's separate checkout**, but do not force-add them to a public GitHub repository unless all participants approve. Requirements summaries and engineering contracts under `docs/` are included in Git and are enough for normal coding; inspect the private originals for source disputes.

## Original project

Repo: https://github.com/Sarthak-1229/E-Vidyakosha

The existing GitHub repo initially contained only a README. See `docs/09-GIT-HANDOFF.md` for safe Git commands, ownership and merge order. This ZIP does **not** automatically push or connect to GitHub.

## Automated setup (recommended)

For a one-command clone + scaffold + environment + Docker/npm checks + two isolated agent worktrees, see [`docs/11-ONE-COMMAND-BOOTSTRAP.md`](docs/11-ONE-COMMAND-BOOTSTRAP.md).

- **Windows:** `powershell -ExecutionPolicy Bypass -File .\RUN_SETUP_WINDOWS.ps1`
- **macOS/Linux:** `bash ./RUN_SETUP_MAC_LINUX.sh`

Then paste the prompts from [`COPY_PASTE_TO_AGENTS.md`](COPY_PASTE_TO_AGENTS.md) into Codex and Antigravity. Setup may require GitHub login and installed local prerequisites; it never bypasses authentication or silently hides failed tests.
