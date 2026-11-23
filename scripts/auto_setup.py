#!/usr/bin/env python3
"""E-Vidyakosha one-run bootstrap. Requires Python 3.10+ and Git.

Never force-pushes, deletes branches, commits .env, or publishes the original SAD PDFs.
"""
from __future__ import annotations

import argparse
import os
from pathlib import Path
import secrets
import shutil
import subprocess
import sys
import time

ROOT = Path(__file__).resolve().parents[1]
DEFAULT_REPO = "https://github.com/Sarthak-1229/E-Vidyakosha.git"
BRANCHES = (("feat/backend-codex", "E-Vidyakosha-Codex"),
            ("feat/frontend-antigravity", "E-Vidyakosha-Antigravity"))
EXCLUDED_DIRS = {".git", "node_modules", "dist", "coverage", ".venv", "__pycache__"}
EXCLUDED_FILES = {".env", ".DS_Store"}


def invoke(cmd, cwd=None, fatal=True, capture=False):
    shown = " ".join(map(str, cmd))
    print(f"  $ {shown}", flush=True)
    result = subprocess.run([str(x) for x in cmd], cwd=cwd, text=True,
                            stdout=subprocess.PIPE if capture else None,
                            stderr=subprocess.PIPE if capture else None,
                            check=False)
    if fatal and result.returncode:
        detail = (result.stderr or result.stdout or "").strip()
        raise RuntimeError(f"Command failed ({result.returncode}): {shown}\n{detail}")
    return result


def git(*args, cwd, fatal=True, capture=False):
    return invoke(["git", *args], cwd=cwd, fatal=fatal, capture=capture)


def ignored_source(relative: Path):
    if any(p in EXCLUDED_DIRS for p in relative.parts):
        return True
    if relative.name in EXCLUDED_FILES or (relative.name.startswith(".env.") and relative.name != ".env.example"):
        return True
    return False


def transplant(target: Path):
    count = 0
    for source in ROOT.rglob("*"):
        if not source.is_file() or source.is_symlink():
            continue
        rel = source.relative_to(ROOT)
        if ignored_source(rel):
            continue
        destination = target / rel
        destination.parent.mkdir(parents=True, exist_ok=True)
        if destination.exists() and destination.read_bytes() == source.read_bytes():
            continue
        if str(rel) == "README.md" and destination.is_file():
            backup = target.parent / "E-Vidyakosha-original-README.backup.md"
            if not backup.exists():
                shutil.copy2(destination, backup)
        shutil.copy2(source, destination)
        count += 1
    return count


def ensure_env(checkout: Path):
    for rel in ("apps/api", "apps/web"):
        example = checkout / rel / ".env.example"
        env = checkout / rel / ".env"
        if example.exists() and not env.exists():
            contents = example.read_text(encoding="utf-8")
            if rel == "apps/api":
                contents = contents.replace("JWT_SECRET=", "JWT_SECRET=" + secrets.token_urlsafe(48))
            env.write_text(contents, encoding="utf-8")
            print(f"  Created local private {env.relative_to(checkout)}")


def copy_private_sources(checkout: Path):
    from_root = ROOT / "docs/reference"
    to_checkout = checkout / "docs/reference"
    if not from_root.exists():
        print("  Note: SAD originals not packaged here; summaries and contracts remain available.")
        return
    for file in from_root.rglob("*"):
        if file.is_file() and not file.is_symlink():
            target = to_checkout / file.relative_to(from_root)
            target.parent.mkdir(parents=True, exist_ok=True)
            if not target.exists():
                shutil.copy2(file, target)


def prepare_database(checkout: Path):
    if not shutil.which("docker"):
        print("  Docker unavailable — skipping optional local MongoDB; use MongoDB Atlas or install Docker later.")
        return False
    ok = invoke(["docker", "compose", "version"], cwd=checkout, fatal=False).returncode == 0
    if not ok:
        print("  Docker Compose unavailable — local MongoDB skipped.")
        return False
    compose = ["docker", "compose", "-f", "infra/docker-compose.yml"]
    if invoke([*compose, "up", "-d"], cwd=checkout, fatal=False).returncode:
        print("  Docker daemon unavailable or MongoDB start failed — local MongoDB skipped.")
        return False
    for attempt in range(12):
        status = invoke([*compose, "exec", "-T", "mongodb", "mongosh", "--quiet", "--eval", "rs.status().ok"],
                        cwd=checkout, fatal=False, capture=True)
        if status.returncode == 0 and "1" in (status.stdout or ""):
            print("  MongoDB local replica set ready.")
            return True
        if attempt == 2:
            invoke([*compose, "exec", "-T", "mongodb", "mongosh", "--quiet", "--eval",
                    'rs.initiate({_id:"rs0",members:[{_id:0,host:"localhost:27017"}]})'], cwd=checkout, fatal=False)
        time.sleep(2)
    print("  MongoDB started but replica set is not verified; see infra/README.md.")
    return False


def npm_install(checkout: Path):
    if not shutil.which("npm"):
        print("  npm unavailable: install Node.js 24 LTS; agents will perform installs later.")
        return False
    result = invoke(["npm", "install", "--no-audit", "--no-fund"], cwd=checkout, fatal=False)
    if result.returncode:
        print(f"  npm install failed ({result.returncode}); agent must fix or retry. Not treating as success.")
        return False
    return True


def quality_gate(checkout: Path):
    results = {}
    for label in ("lint", "typecheck", "test", "build"):
        ok = invoke(["npm", "run", label], cwd=checkout, fatal=False).returncode == 0
        results[label] = ok
    for label, ok in results.items():
        print(f"  {label}: {'PASS' if ok else 'FAIL — agent action needed'}")
    return results


def update_ci_if_lockfile(checkout: Path):
    lock = checkout / "package-lock.json"
    workflow = checkout / ".github/workflows/ci.yml"
    if lock.exists() and workflow.exists():
        txt = workflow.read_text(encoding="utf-8")
        txt = txt.replace("run: npm install --no-audit --no-fund", "run: npm ci --no-audit --no-fund")
        txt = txt.replace("name: Install dependencies (bootstrap; change to npm ci after committing lockfile)",
                          "name: Install pinned dependencies")
        workflow.write_text(txt, encoding="utf-8")


def main():
    parser = argparse.ArgumentParser(description="Clone, configure, install, push and prepare Codex/Antigravity worktrees")
    parser.add_argument("--repo", default=DEFAULT_REPO, help="Git remote URL (default: E-Vidyakosha GitHub repo)")
    parser.add_argument("--destination", default=str(ROOT.parent / "E-Vidyakosha-Repo"), help="Main clone directory")
    parser.add_argument("--skip-install", action="store_true", help="Skip npm dependency installation and checks")
    parser.add_argument("--skip-docker", action="store_true", help="Skip optional local MongoDB")
    parser.add_argument("--skip-push", action="store_true", help="Keep Git commits and branches local")
    parser.add_argument("--skip-worktrees", action="store_true", help="Only initialize main clone")
    args = parser.parse_args()
    target = Path(args.destination).expanduser().resolve()

    if not shutil.which("git"):
        raise RuntimeError("Git is required. Install Git and authenticate once if you want to push to GitHub.")
    if target == ROOT or ROOT in target.parents or target in ROOT.parents:
        raise RuntimeError("The destination must be separate from the extracted setup ZIP directory.")
    if not target.exists():
        target.parent.mkdir(parents=True, exist_ok=True)
        git("clone", args.repo, str(target), cwd=ROOT)
    elif not (target / ".git").exists():
        raise RuntimeError(f"Existing destination is not a Git clone: {target}")
    else:
        origin = git("remote", "get-url", "origin", cwd=target, capture=True).stdout.strip()
        if origin != args.repo:
            raise RuntimeError(f"Existing clone remote mismatch ({origin!r} != {args.repo!r})")
        if git("status", "--porcelain", cwd=target, capture=True).stdout.strip():
            raise RuntimeError("Clone has uncommitted changes; refusing to overwrite them. Commit or stash first.")

    tracked = set(git("ls-files", cwd=target, capture=True).stdout.splitlines())
    not_scaffold = tracked - {"README.md", ".gitignore", ".gitattributes", "LICENSE", "LICENSE.md"}
    if not_scaffold:
        # Safe re-runs are permitted only if every packaged starter file is still
        # byte-for-byte identical. Never clobber code that an agent has edited.
        changed = []
        for source in ROOT.rglob("*"):
            if not source.is_file() or source.is_symlink():
                continue
            rel = source.relative_to(ROOT)
            if ignored_source(rel):
                continue
            dest = target / rel
            if not dest.is_file() or dest.read_bytes() != source.read_bytes():
                # The lockfile and CI install command are intentionally generated.
                if str(rel) != ".github/workflows/ci.yml":
                    changed.append(str(rel))
        if changed:
            raise RuntimeError("Existing repo appears to have edited or incomplete application files; "
                               "refusing to overwrite: " + ", ".join(changed[:8]))

    print("\n[1/6] Install complete repository starter")
    transferred = transplant(target)
    print(f"  Copied/updated {transferred} files (SAD originals remain ignored by Git).")
    ensure_env(target)
    if not args.skip_docker:
        print("\n[2/6] Start optional local MongoDB")
        prepare_database(target)
    else:
        print("\n[2/6] Docker intentionally skipped")

    print("\n[3/6] Install dependencies and check scaffold")
    if not args.skip_install and npm_install(target):
        update_ci_if_lockfile(target)
        quality_gate(target)
    elif args.skip_install:
        print("  npm installation skipped by request; no quality checks performed.")

    print("\n[4/6] Commit starter to repository")
    git("add", "-A", cwd=target)
    staged = git("diff", "--cached", "--quiet", cwd=target, fatal=False).returncode != 0
    if staged:
        git("commit", "-m", "chore: initialize E-Vidyakosha MERN AI agent starter", cwd=target)
    else:
        print("  No new tracked changes to commit.")
    default_branch = git("branch", "--show-current", cwd=target, capture=True).stdout.strip()
    if not default_branch:
        raise RuntimeError("Could not determine default branch")
    if not args.skip_push:
        if git("push", "-u", "origin", default_branch, cwd=target, fatal=False).returncode:
            print("  Main branch push did not succeed; authenticate GitHub and retry with git push.")

    print("\n[5/6] Create independent agent worktrees")
    if not args.skip_worktrees:
        for branch, directory in BRANCHES:
            worktree = target.parent / directory
            if not worktree.exists():
                local_branch = git("branch", "--list", branch, cwd=target, capture=True).stdout.strip()
                remote_branch = git("branch", "-r", "--list", "origin/" + branch, cwd=target, capture=True).stdout.strip()
                if local_branch:
                    git("worktree", "add", str(worktree), branch, cwd=target)
                elif remote_branch:
                    git("worktree", "add", "--track", "-b", branch, str(worktree), "origin/" + branch, cwd=target)
                else:
                    git("worktree", "add", "-b", branch, str(worktree), cwd=target)
            else:
                print(f"  Existing worktree retained: {worktree}")
            copy_private_sources(worktree)
            ensure_env(worktree)
            if not args.skip_install:
                npm_install(worktree)
            if not args.skip_push:
                if git("push", "-u", "origin", branch, cwd=target, fatal=False).returncode:
                    print(f"  Could not publish {branch}; the local worktree is ready.")
    print("\n[6/6] Done: local folder setup")
    print(f"  Main:       {target}")
    if not args.skip_worktrees:
        print(f"  Codex:      {target.parent / BRANCHES[0][1]}")
        print(f"  Antigravity:{target.parent / BRANCHES[1][1]}")
    print("\nPaste prompt from 'prompts/CODEX_START.md' in the Codex checkout;")
    print("paste 'prompts/ANTIGRAVITY_START.md' in Antigravity's checkout.")
    print("Review docs/08-OPEN-DECISIONS.md before authorizing changes to the SRS.")
    print("NOTE: this creates the repo scaffold, NOT a finished app; agent implementation and passing tests are required.")

if __name__ == "__main__":
    try:
        main()
    except (RuntimeError, OSError, ValueError) as exc:
        print("\nSETUP FAILED SAFELY:", exc, file=sys.stderr)
        sys.exit(1)
