#!/usr/bin/env bash
# Exports what a fresh clone would contain (tracked + untracked-but-not-ignored files) into a temp dir and prints its path.
# Ignored paths such as .claude/skills/ and node_modules/ are left out, exactly as in a clone.
set -euo pipefail
cd "$(dirname "$0")/../../.."
tmp=$(mktemp -d -t mass-clone-XXXXXX)
git ls-files -z --cached --others --exclude-standard | tar --null -T - -cf - | tar -xf - -C "$tmp"
echo "$tmp"
