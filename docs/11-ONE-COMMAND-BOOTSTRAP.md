# E-Vidyakosha: automated repo setup

The kit already contains the eight source SAD documents, source-text extracts, requirements, implementation contracts, work ownership, design specification, existing React/Express scaffolds, MongoDB development configuration, testing checklist, and both full AI-agent prompts. **The application is not yet fully implemented**; the agents build it.

## Windows (the primary target)

Unzip the kit once into a folder. In PowerShell, while inside the extracted folder, run:

```powershell
powershell -ExecutionPolicy Bypass -File .\RUN_SETUP_WINDOWS.ps1
```

## macOS / Linux

```bash
bash ./RUN_SETUP_MAC_LINUX.sh
```

Both invoke `scripts/auto_setup.py`. This script is deliberately idempotent for a freshly initialized repo; it refuses overwriting an existing application's tracked files. **It does not force-push or delete existing commits.**

## What it does automatically

1. Clone `https://github.com/Sarthak-1229/E-Vidyakosha.git` into a sibling `E-Vidyakosha-Repo` folder. Requires existing Git authentication to push.
2. Transfer the repository-ready starter files while preserving any old GitHub README as a separate local backup.
3. Keep eight original PDFs and extracted plain-text copies locally, but omit them from Git commits because they contain student identities.
4. Create a private `.env` from each example, with a randomly generated JWT development secret.
5. When Docker Compose is installed and running, start localhost MongoDB and initialize the development replica set.
6. When Node/npm is installed, install dependencies, write `package-lock.json`, switch CI to `npm ci`, and attempt lint/typecheck/unit tests/build. **Failures are reported, not concealed.**
7. Commit scaffolding on the repository default branch and attempt a normal `git push` with the user's credentials.
8. Create two physically separate Git worktrees and branches: `E-Vidyakosha-Codex` (`feat/backend-codex`) and `E-Vidyakosha-Antigravity` (`feat/frontend-antigravity`). Distribute original source references privately into each; initialize each agent's environment and npm dependencies; try publishing the branches.

The script can perform the clone and create local branches even when GitHub push authentication is unavailable; it reports any push failures. It does not sign in to GitHub, install software, configure external database credentials, or deploy a website without user-authenticated access.

## Dependencies

- Python >= 3.10 and Git: mandatory to run the setup script.
- GitHub authentication: needed for push; Git Credential Manager / GitHub CLI or SSH credentials are acceptable.
- Node >= 22.12 (24 LTS recommended), npm: needed to install and test.
- Docker Desktop / Docker Compose: optional; else provide an external MongoDB replica set in `.env`.

## Optional flags

```powershell
# Create everything locally without pushing yet
powershell -ExecutionPolicy Bypass -File .\RUN_SETUP_WINDOWS.ps1 --skip-push

# Skip npm and Docker where unavailable; let agents install and test
powershell -ExecutionPolicy Bypass -File .\RUN_SETUP_WINDOWS.ps1 --skip-install --skip-docker

# Select a different checked-out repository location
powershell -ExecutionPolicy Bypass -File .\RUN_SETUP_WINDOWS.ps1 --destination "C:\Dev\E-Vidyakosha-Repo"
```

## After bootstrap

Open `E-Vidyakosha-Codex` in Codex and paste `prompts/CODEX_START.md`. Open `E-Vidyakosha-Antigravity` in Antigravity and paste `prompts/ANTIGRAVITY_START.md`. Both agents must follow `AGENTS.md` and their scope-specific instructions.

Do **not** have two tools edit the same checkout at once. Merge independent PRs only after tests pass. Review `docs/08-OPEN-DECISIONS.md` for differences or ambiguities in the SAD sources; do not silently change the approved MSS v2.0.

## Safety guarantees and limitations

- No `.env` passwords, private secrets, `node_modules`, or original SAD PDFs are committed by ordinary Git staging.
- No undocumented feature creep or SRS change permitted to either agent.
- A starter skeleton does **not** equal a bug-free, deployed project. Full regression testing and manual review are mandatory before release.
