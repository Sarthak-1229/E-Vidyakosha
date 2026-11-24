# E-Vidyakosha

**Smart Library E-Book & Reference Document Repository** — academic MERN implementation of the **approved MSS v2.0**, branded **E-Vidyakosha**.

The Express API implements FR-01 through FR-12. The React checkout contains the design preview. See the [backend traceability and verification matrix](docs/12-BACKEND-TRACEABILITY.md).

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

- Node **24 LTS** recommended, or Node 22.12+.
- npm, Git; MongoDB replica set (local Docker setup in `infra/README.md` or managed development database).
- Copy environment examples and provide **your own credentials**. Never commit `.env` or password values.

```bash
npm ci
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env
npm run dev
npm run lint
npm run typecheck
npm run test
npm run test:integration -w @evidy/api
npx playwright install chromium
npm run test:e2e -w @evidy/api
npm run build
```

On Windows PowerShell use `Copy-Item apps/api/.env.example apps/api/.env` and similarly for `apps/web`.

The API listens at `http://localhost:4000/api/v1`. Configure the database and JWT secret, then provision the initial administrator as described in the [backend operations guide](infra/README.md). The integration tests start their own MongoDB replica set, independent of the development database.

## Confidential source files

The starter ZIP contains all 8 original source PDFs and their searchable text under `docs/reference/`. **They are excluded from Git by default** because the PDFs contain students' names and PRNs. Copy `docs/reference/` from this ZIP into **each agent's separate checkout**, but do not force-add them to a public GitHub repository unless all participants approve. Requirements summaries and engineering contracts under `docs/` are included in Git and are enough for normal coding; inspect the private originals for source disputes.

## Original project

Repo: https://github.com/Sarthak-1229/E-Vidyakosha

See [the Git handoff](docs/09-GIT-HANDOFF.md) for ownership and merge order. Use the one-command bootstrap when starting from the extracted kit.

## Automated setup (recommended)

For a one-command clone + scaffold + environment + Docker/npm checks + two isolated agent worktrees, see [`docs/11-ONE-COMMAND-BOOTSTRAP.md`](docs/11-ONE-COMMAND-BOOTSTRAP.md).

- **Windows:** `powershell -ExecutionPolicy Bypass -File .\RUN_SETUP_WINDOWS.ps1`
- **macOS/Linux:** `bash ./RUN_SETUP_MAC_LINUX.sh`

Then paste the prompts from [`COPY_PASTE_TO_AGENTS.md`](COPY_PASTE_TO_AGENTS.md) into Codex and Antigravity. Setup may require GitHub login and installed local prerequisites; it never bypasses authentication or silently hides failed tests.
