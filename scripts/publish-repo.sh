#!/usr/bin/env bash
# Creates afropiloto/attn-index on GitHub and publishes this codebase.
# Requires: gh CLI authenticated with repo creation scope (run locally).
set -euo pipefail

REPO_OWNER="${REPO_OWNER:-afropiloto}"
REPO_NAME="${REPO_NAME:-attn-index}"

if ! command -v gh &>/dev/null; then
  echo "Install GitHub CLI: https://cli.github.com/"
  exit 1
fi

if gh repo view "${REPO_OWNER}/${REPO_NAME}" &>/dev/null; then
  echo "Repository ${REPO_OWNER}/${REPO_NAME} already exists."
else
  echo "Creating ${REPO_OWNER}/${REPO_NAME}..."
  gh repo create "${REPO_OWNER}/${REPO_NAME}" \
    --public \
    --description "ATTN — Social Media Attention Index (S&P 500 for social attention). Built for 810."
fi

if git remote get-url origin &>/dev/null; then
  git remote set-url origin "https://github.com/${REPO_OWNER}/${REPO_NAME}.git"
else
  git remote add origin "https://github.com/${REPO_OWNER}/${REPO_NAME}.git"
fi

git branch -M main
git push -u origin main

echo ""
echo "Done: https://github.com/${REPO_OWNER}/${REPO_NAME}"
