#!/usr/bin/env bash
# Dong goi moi skill trong skills/ thanh 1 file zip rieng trong dist/.
#
# Zip lay tu cay da commit (git archive HEAD), nen file chua commit hoac dang
# bi .gitignore chan se KHONG co trong zip.
#
# Giai nen ra duoc thu muc <ten-skill>/ — tha thang vao ~/.claude/skills/ la chay.

set -euo pipefail

cd "$(dirname "$0")/.."

OUT_DIR="dist"
rm -rf "$OUT_DIR"
mkdir -p "$OUT_DIR"

count=0
total=0

for dir in skills/*/; do
  name="$(basename "$dir")"

  # Skill khong co file nao duoc track thi bo qua, khong tao zip rong
  if [ -z "$(git ls-files "$dir")" ]; then
    echo "bo qua $name (khong co file nao duoc track)"
    continue
  fi

  git archive --format=zip --prefix="$name/" "HEAD:$dir" -o "$OUT_DIR/$name.zip"

  size="$(wc -c < "$OUT_DIR/$name.zip" | tr -d ' ')"
  printf '%-24s %8s bytes\n' "$name.zip" "$size"

  count=$((count + 1))
  total=$((total + size))
done

echo "---"
echo "$count skill, tong $total bytes, nam trong $OUT_DIR/"
