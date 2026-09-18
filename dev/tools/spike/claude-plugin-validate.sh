#!/usr/bin/env bash
# C41: `claude plugin validate .` exits 0 at the repo root.
set -euo pipefail
cd "$(dirname "$0")/../../.."
claude plugin validate .
echo "PASS: claude plugin validate . exited 0"
