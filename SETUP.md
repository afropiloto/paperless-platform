# Publishing to its own GitHub repo

The ATTN index is a **standalone project** — not part of paperless-platform.

This branch (`cursor/attn-index-repo-e902`) contains the complete codebase at the repository root.

## Option A — One command (recommended)

From your machine with `gh` authenticated as **afropiloto**:

```bash
git clone -b cursor/attn-index-repo-e902 https://github.com/afropiloto/paperless-platform.git attn-index
cd attn-index
./scripts/publish-repo.sh
```

This creates `https://github.com/afropiloto/attn-index` and pushes `main`.

## Option B — Manual

1. Create an empty repo: [github.com/new?name=attn-index](https://github.com/new?name=attn-index&description=ATTN+%E2%80%94+Social+Media+Attention+Index+for+810&visibility=public)

2. Push this branch:

```bash
git clone -b cursor/attn-index-repo-e902 https://github.com/afropiloto/paperless-platform.git attn-index
cd attn-index
git remote set-url origin https://github.com/afropiloto/attn-index.git
git branch -M main
git push -u origin main
```

## Why not auto-created?

The Cursor cloud agent GitHub integration can push to existing repos but cannot create new ones (`createRepository` is forbidden). Running `publish-repo.sh` locally uses your personal `gh` auth which has full permissions.

## After publishing

```bash
npm install
npm run dev
# http://localhost:8101/
```

Disconnect this project from paperless-platform once `afropiloto/attn-index` exists.
