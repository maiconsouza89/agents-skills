#!/usr/bin/env bash
# C40: `npx skills add ./ --list` at the root of a clone lists exactly the catalog skills (skills/mass-*) and nothing else.
set -euo pipefail
here="$(cd "$(dirname "$0")" && pwd)"
clone=$("$here/export-tree.sh")
trap 'rm -rf "$clone"' EXIT
cd "$clone"
expected=$(find skills -mindepth 1 -maxdepth 1 -type d -name 'mass-*' -printf '%f\n' | sort)
count=$(printf '%s\n' "$expected" | wc -l)
output=$(npx -y skills@latest add ./ --list 2>&1 | sed 's/\x1b\[[0-9;]*m//g')
listed=$(printf '%s\n' "$output" | grep -oE '^[│ ]*[a-z0-9-]+$' | sed 's/^[│ ]*//' | grep -vE '^(skills|list)$' | sort -u || true)
if ! printf '%s\n' "$output" | grep -q "Found ${count} skill"; then
  echo "FAIL: expected 'Found ${count} skills' in the npx skills output"; printf '%s\n' "$output"; exit 1
fi
if [ "$listed" != "$expected" ]; then
  echo "FAIL: listed skills differ from skills/mass-*"; echo "expected:"; echo "$expected"; echo "listed:"; echo "$listed"; exit 1
fi
echo "PASS: npx skills lists exactly: $(printf '%s' "$expected" | tr '\n' ' ')"
