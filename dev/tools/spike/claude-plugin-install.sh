#!/usr/bin/env bash
# C42: adding a clone of this repo as a marketplace and installing the plugin yields exactly the 5 catalog skills.
# Side effects on the maintainer's Claude Code are undone at the end (uninstall + marketplace remove).
set -euo pipefail
here="$(cd "$(dirname "$0")" && pwd)"
clone=$("$here/export-tree.sh")
cleanup() {
  claude plugin uninstall mass-solutions-skills@mass-solutions >/dev/null 2>&1 || true
  claude plugin marketplace remove mass-solutions >/dev/null 2>&1 || true
  rm -rf "$clone"
}
trap cleanup EXIT
claude plugin uninstall mass-solutions-skills@mass-solutions >/dev/null 2>&1 || true
claude plugin marketplace remove mass-solutions >/dev/null 2>&1 || true
cd "$clone"
expected=$(find skills -mindepth 1 -maxdepth 1 -type d -name 'mass-*' -printf '%f\n' | sort)
claude plugin marketplace add "$clone"
claude plugin install mass-solutions-skills@mass-solutions
install_path=$(claude plugin list --json | node -e '
  const rows = JSON.parse(require("fs").readFileSync(0, "utf8"));
  const row = rows.find((r) => r.id === "mass-solutions-skills@mass-solutions");
  if (!row) { console.error("plugin not listed"); process.exit(1); }
  console.log(row.installPath);
')
echo "installPath: $install_path"
installed=$(find "$install_path/skills" -mindepth 1 -maxdepth 1 -type d -name 'mass-*' -printf '%f\n' | sort)
if [ "$installed" != "$expected" ]; then
  echo "FAIL: installed skills differ"; echo "expected:"; echo "$expected"; echo "installed:"; echo "$installed"; exit 1
fi
echo "PASS: plugin installs exactly: $(printf '%s' "$expected" | tr '\n' ' ')"
