# Safe GitHub handoff — one repository, two agents

Remote repository: `https://github.com/Sarthak-1229/E-Vidyakosha`.

This prepared ZIP is **not** directly connected/pushed to GitHub. The remote was publicly observed to contain README only when preparation began. Back up any intervening changes before copying this starter.

## Safest setup using separate clones (PowerShell or terminal)

```bash
git clone https://github.com/Sarthak-1229/E-Vidyakosha.git
cd E-Vidyakosha
# Extract the starter ZIP's CONTENTS into this folder; preserve .github/.gitignore hidden files.
git status
git add .
git commit -m "chore: add architecture-first MERN scaffold and SAD agent handoff"
git push -u origin main
```

**PRIVATE SOURCE COPY — important:** The ZIP includes 8 original PDFs and extracted text containing team names/PRNs; `.gitignore` excludes those from public commits. Keep the extracted ZIP available as `STARTER_FOLDER` and copy `STARTER_FOLDER/docs/reference/` to `E-Vidyakosha-Codex/docs/reference/` and `E-Vidyakosha-Antigravity/docs/reference/` before starting agents. PowerShell example: `Copy-Item -Recurse -Force "STARTER_FOLDER\docs\reference" "E-Vidyakosha-Codex\docs\"`. Do this for both. These untracked/ignored files stay available for reading locally.

`git` may ask you to authenticate via GitHub browser / credential manager. **Do not paste a PAT or SSH private key into an AI prompt.**

For independent development, make two additional clones from `main` (or worktrees):

```bash
git clone https://github.com/Sarthak-1229/E-Vidyakosha.git E-Vidyakosha-Codex
cd E-Vidyakosha-Codex
git switch -c feat/backend-codex
# Open this directory in Codex; give it prompts/CODEX_START.md

# In a separate terminal/folder:
git clone https://github.com/Sarthak-1229/E-Vidyakosha.git E-Vidyakosha-Antigravity
cd E-Vidyakosha-Antigravity
git switch -c feat/frontend-antigravity
# Open this directory in Antigravity; give it prompts/ANTIGRAVITY_START.md
```

Each agent commits and pushes its **own branch**. Open 2 GitHub PRs, review checks. Merge backend first, then update frontend and merge. NEVER work on same main checkout concurrently, force-push main or copy `.env` secrets into Git.
