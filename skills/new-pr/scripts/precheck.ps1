#!/usr/bin/env pwsh
# new-pr precheck (Windows / PowerShell)
# Dung: precheck.ps1 <base-branch>
# KHONG tu dong sua gi ca - chi doc va bao cao.
# Output giu DUNG format key=value giong precheck.sh de SKILL.md doc chung mot kieu.

param([string]$Base)

$ErrorActionPreference = 'Continue'
$ProgressPreference = 'SilentlyContinue'

function Fail($msg) {
  Write-Output "STATUS=ERROR"
  Write-Output "ERROR=$msg"
  exit 1
}

if ([string]::IsNullOrWhiteSpace($Base)) {
  Fail "Thieu base branch. Dung: /new-pr <branch>"
}

# --- Cong cu can co ---
if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
  Fail "Khong tim thay git. Cai Git for Windows: https://git-scm.com/download/win"
}
if (-not (Get-Command gh -ErrorAction SilentlyContinue)) {
  Fail "Khong tim thay gh CLI. Cai tai: https://cli.github.com/"
}

# --- Repo & gh ---
git rev-parse --is-inside-work-tree 2>$null | Out-Null
if ($LASTEXITCODE -ne 0) { Fail "Khong phai git repository" }

gh auth status 2>$null | Out-Null
if ($LASTEXITCODE -ne 0) { Fail "gh CLI chua dang nhap. Chay: gh auth login" }

# --- Repo phai co remote thi moi tao PR duoc ---
$remotes = (git remote 2>$null | Out-String).Trim()
if ([string]::IsNullOrWhiteSpace($remotes)) {
  Fail "Repo khong co git remote nao - khong the tao PR. Them remote truoc: git remote add origin <url>"
}

$repo = (gh repo view --json nameWithOwner -q .nameWithOwner 2>$null | Out-String).Trim()
if ([string]::IsNullOrWhiteSpace($repo)) {
  Fail "gh khong nhan dien duoc repo GitHub tu remote hien tai (co the remote khong phai GitHub)"
}

$current = (git rev-parse --abbrev-ref HEAD 2>$null | Out-String).Trim()

Write-Output "REPO=$repo"
Write-Output "CURRENT_BRANCH=$current"
Write-Output "BASE_BRANCH=$Base"

# --- Nhanh hien tai trung base? ---
if ($current -eq $Base) {
  Fail "Nhanh hien tai ($current) trung voi base branch. Checkout sang nhanh feature truoc."
}

# --- Base co ton tai tren remote? ---
git ls-remote --exit-code --heads origin $Base 2>$null | Out-Null
if ($LASTEXITCODE -eq 0) {
  Write-Output "BASE_EXISTS_REMOTE=yes"
} else {
  Write-Output "BASE_EXISTS_REMOTE=no"
}

# --- [BUOC 1] File chua commit ---
$dirty = @(git status --porcelain 2>$null)
if ($dirty.Count -gt 0) {
  Write-Output "UNCOMMITTED=yes"
  Write-Output "UNCOMMITTED_COUNT=$($dirty.Count)"
  Write-Output "--- UNCOMMITTED_FILES ---"
  foreach ($line in $dirty) {
    $code = $line.Substring(0, 2)
    $f = $line.Substring(3)
    switch -CaseSensitive ($code) {
      '??' { $label = 'untracked' }
      ' M' { $label = 'modified (chua stage)' }
      'MM' { $label = 'modified (chua stage)' }
      'M ' { $label = 'staged' }
      'A ' { $label = 'staged' }
      'D ' { $label = 'staged' }
      ' D' { $label = 'deleted' }
      default { $label = $code }
    }
    Write-Output ("  [{0}] {1}" -f $label, $f)
  }
  Write-Output "--- END ---"
} else {
  Write-Output "UNCOMMITTED=no"
}

# --- Nhanh da push chua? ---
git rev-parse --abbrev-ref "@{upstream}" 2>$null | Out-Null
if ($LASTEXITCODE -eq 0) {
  Write-Output "HAS_UPSTREAM=yes"
  $ahead = (git rev-list --count "@{upstream}..HEAD" 2>$null | Out-String).Trim()
  if ([string]::IsNullOrWhiteSpace($ahead)) { $ahead = "0" }
  Write-Output "UNPUSHED_COMMITS=$ahead"
} else {
  Write-Output "HAS_UPSTREAM=no"
  Write-Output "UNPUSHED_COMMITS=?"
}

# --- PR da ton tai chua? ---
$existing = (gh pr list --head $current --base $Base --json number,url,title --limit 1 2>$null | Out-String).Trim()
if ($existing -and $existing -ne "[]") {
  Write-Output "PR_EXISTS=yes"
  Write-Output "PR_INFO=$existing"
} else {
  Write-Output "PR_EXISTS=no"
}

# --- Pham vi thay doi (dung 3 cham: chi phan nhanh nay them vao) ---
# Uu tien origin/<base>, fallback ve <base> local. Khong resolve duoc ca hai -> ERROR.
git rev-parse --verify "origin/$Base" 2>$null | Out-Null
if ($LASTEXITCODE -eq 0) {
  $range = "origin/$Base...HEAD"
} else {
  git rev-parse --verify $Base 2>$null | Out-Null
  if ($LASTEXITCODE -eq 0) {
    $range = "$Base...HEAD"
  } else {
    Fail "Khong tim thay base branch '$Base' (ca origin/$Base lan $Base local). Kiem tra ten branch, hoac chay: git fetch origin"
  }
}

Write-Output "DIFF_RANGE=$range"

$commitCount = (git rev-list --count $range 2>$null | Out-String).Trim()
if ([string]::IsNullOrWhiteSpace($commitCount)) { $commitCount = "?" }
Write-Output "COMMIT_COUNT=$commitCount"

$filesChanged = @(git diff --name-only $range 2>$null).Count
Write-Output "FILES_CHANGED=$filesChanged"

Write-Output "--- COMMITS ---"
@(git log --oneline --no-decorate $range 2>$null) | Select-Object -First 30 | ForEach-Object { Write-Output ("  " + $_) }
Write-Output "--- END ---"

Write-Output "--- DIFFSTAT ---"
@(git diff --stat $range 2>$null) | Select-Object -Last 40 | ForEach-Object { Write-Output ("  " + $_) }
Write-Output "--- END ---"

Write-Output "STATUS=OK"
