#!/bin/bash
# new-pr precheck: gom moi du kien co hoc de agent quyet dinh.
# Dung: precheck.sh <base-branch>
# KHONG tu dong sua gi ca — chi doc va bao cao.

set -uo pipefail
BASE="${1:-}"

if [ -z "$BASE" ]; then
  echo "STATUS=ERROR"
  echo "ERROR=Thieu base branch. Dung: /new-pr <branch>"
  exit 1
fi

# --- Repo & gh ---
if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  echo "STATUS=ERROR"
  echo "ERROR=Khong phai git repository"
  exit 1
fi

if ! gh auth status >/dev/null 2>&1; then
  echo "STATUS=ERROR"
  echo "ERROR=gh CLI chua dang nhap. Chay: gh auth login"
  exit 1
fi

# --- Repo phai co remote thi moi tao PR duoc ---
if [ -z "$(git remote 2>/dev/null)" ]; then
  echo "STATUS=ERROR"
  echo "ERROR=Repo khong co git remote nao — khong the tao PR. Them remote truoc: git remote add origin <url>"
  exit 1
fi

REPO=$(gh repo view --json nameWithOwner -q .nameWithOwner 2>/dev/null || echo "")
if [ -z "$REPO" ]; then
  echo "STATUS=ERROR"
  echo "ERROR=gh khong nhan dien duoc repo GitHub tu remote hien tai (co the remote khong phai GitHub)"
  exit 1
fi

CURRENT=$(git rev-parse --abbrev-ref HEAD)

echo "REPO=$REPO"
echo "CURRENT_BRANCH=$CURRENT"
echo "BASE_BRANCH=$BASE"

# --- Nhanh hien tai trung base? ---
if [ "$CURRENT" = "$BASE" ]; then
  echo "STATUS=ERROR"
  echo "ERROR=Nhanh hien tai ($CURRENT) trung voi base branch. Checkout sang nhanh feature truoc."
  exit 1
fi

# --- Base co ton tai tren remote? ---
if git ls-remote --exit-code --heads origin "$BASE" >/dev/null 2>&1; then
  echo "BASE_EXISTS_REMOTE=yes"
else
  echo "BASE_EXISTS_REMOTE=no"
fi

# --- [BUOC 1] File chua commit ---
DIRTY=$(git status --porcelain)
if [ -n "$DIRTY" ]; then
  echo "UNCOMMITTED=yes"
  echo "UNCOMMITTED_COUNT=$(echo "$DIRTY" | wc -l | tr -d ' ')"
  echo "--- UNCOMMITTED_FILES ---"
  git status --porcelain | while read -r line; do
    code="${line:0:2}"; f="${line:3}"
    case "$code" in
      "??") label="untracked" ;;
      " M"|"MM") label="modified (chua stage)" ;;
      "M "|"A "|"D ") label="staged" ;;
      " D") label="deleted" ;;
      *) label="$code" ;;
    esac
    printf "  [%s] %s\n" "$label" "$f"
  done
  echo "--- END ---"
else
  echo "UNCOMMITTED=no"
fi

# --- Nhanh da push chua? ---
if git rev-parse --abbrev-ref "@{upstream}" >/dev/null 2>&1; then
  echo "HAS_UPSTREAM=yes"
  AHEAD=$(git rev-list --count "@{upstream}..HEAD" 2>/dev/null || echo 0)
  echo "UNPUSHED_COMMITS=$AHEAD"
else
  echo "HAS_UPSTREAM=no"
  echo "UNPUSHED_COMMITS=?"
fi

# --- PR da ton tai chua? ---
EXISTING=$(gh pr list --head "$CURRENT" --base "$BASE" --json number,url,title --limit 1 2>/dev/null)
if [ -n "$EXISTING" ] && [ "$EXISTING" != "[]" ]; then
  echo "PR_EXISTS=yes"
  echo "PR_INFO=$EXISTING"
else
  echo "PR_EXISTS=no"
fi

# --- Pham vi thay doi (dung 3 cham: chi phan nhanh nay them vao) ---
# Uu tien origin/<base>, fallback ve <base> local. Khong resolve duoc ca hai -> ERROR.
if git rev-parse --verify "origin/$BASE" >/dev/null 2>&1; then
  RANGE="origin/$BASE...HEAD"
elif git rev-parse --verify "$BASE" >/dev/null 2>&1; then
  RANGE="$BASE...HEAD"
else
  echo "STATUS=ERROR"
  echo "ERROR=Khong tim thay base branch '$BASE' (ca origin/$BASE lan $BASE local). Kiem tra ten branch, hoac chay: git fetch origin"
  exit 1
fi

echo "DIFF_RANGE=$RANGE"
echo "COMMIT_COUNT=$(git rev-list --count "$RANGE" 2>/dev/null || echo '?')"
echo "FILES_CHANGED=$(git diff --name-only "$RANGE" 2>/dev/null | wc -l | tr -d ' ')"

echo "--- COMMITS ---"
git log --oneline --no-decorate "$RANGE" 2>/dev/null | head -30 | sed 's/^/  /'
echo "--- END ---"

echo "--- DIFFSTAT ---"
git diff --stat "$RANGE" 2>/dev/null | tail -40 | sed 's/^/  /'
echo "--- END ---"

echo "STATUS=OK"
