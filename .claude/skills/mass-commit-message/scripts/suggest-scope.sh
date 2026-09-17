#!/usr/bin/env bash
# Lists the top-level directories touched by the staged changes, one per line, most files first.
set -euo pipefail
git diff --cached --name-only \
  | awk -F/ '{ print (NF > 1 ? $1 : ".") }' \
  | sort \
  | uniq -c \
  | sort -rn \
  | awk '{ print $2 }'
