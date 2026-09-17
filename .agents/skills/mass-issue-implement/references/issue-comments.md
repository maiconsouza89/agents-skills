# Issue comments and the pull request

Three comments carry the record of an implementation: the plan, any change of course, and the
closing report. Each one is written for someone who opens the issue months later and needs to
know what was decided and why, without the chat. Write them in the language of the thread;
keep identifiers, paths and commands as they are.

Post with a file, so Markdown survives quoting:

```bash
gh issue comment <N> --body-file <scratch>/plan.md
```

## 1. The plan comment

Post it once, after reading the thread and checking it against the code, before the first
implementation commit. When the thread already has a plan, title it as a review of that plan
and write only what changes and why: repeating what stands adds nothing.

```markdown
### Plano de implementação            <!-- or: Revisão do plano antes de implementar -->

**O que existe hoje**
- <what the code does now, with paths; what the thread had already decided>

**Decisões**
1. **<decision, as a sentence>** — <the reason, tied to a fact: a test, a rule, a doc>.
   Fonte: <official doc URL or path in the repo>.
2. ...

**Passos**
1. <step, with the files it touches>
2. ...

**Fora de escopo**
- <good idea from the thread that this PR does not do, and why>

**Em aberto** (at most two, each with a recommendation)
- <question> — recomendo <option>, porque <reason>. Sigo com ela salvo aviso.
```

Rules that make this comment useful:

- One reason per decision, tied to something checkable. "More readable" is not a reason; "the
  test `zero client js` forbids it" is.
- Sources are links to official docs or paths in the repo. A decision without a source is an
  opinion, and the next reader cannot tell whether it still holds.
- Open questions state the recommendation and that you proceed with it. A comment that ends
  with "please confirm" and stops blocks the work on a reply that may take days.

## 2. The change-of-course comment

Post it at the moment the plan stops matching reality, not at the end. Short: what was found,
what changes, what stays.

```markdown
### Mudança de rumo: <one line>

Ao implementar <step>, <the fact found: a test, a behaviour, a doc>. Por isso:
- <what changes, and the new reason>
- <what stays as planned>
```

Post one per change of direction. Renaming a variable is not a change of direction; dropping a
`<select>` for a `<details>` menu is.

## 3. The closing comment

Post it after the PR exists, so it can name the PR number.

```markdown
### Implementação concluída: #<PR>

- <what was delivered, one bullet per visible change, in user terms>

Critérios de aceitação:
- [x] <criterion, in the issue's own words> (<how, or why it changed>)
- [ ] <criterion not met> — <why, and where it went: another issue, out of scope>

Verificação: `<command>` — <what it printed: counts, time, the checks that ran>.

**Limitações conhecidas:** <what the PR does not do that a reader might expect, and whether an
issue exists for it>.
```

## The pull request

Fill the repository template section by section (`.github/PULL_REQUEST_TEMPLATE.md`; the
`mass-pr-description` skill has the details). Two things matter here beyond that skill:

- **Linked issue** is `Closes #<N>`, so the merge closes the issue and the board moves.
- **Changes** ends with a link to the plan comment (`https://github.com/<owner>/<repo>/issues/<N>#issuecomment-<id>`) instead of repeating the decisions. Get the id from
  `gh api repos/<owner>/<repo>/issues/<N>/comments --jq '.[-1].html_url'` right after posting.

Then:

```bash
gh pr create --base main --title "<type>(<scope>): <summary>" --body-file <scratch>/pr.md
```

The title is the squash commit's subject, so it follows Conventional Commits and stays in
English. Tick a checklist item only when it is true; write why next to an item that does not
apply ("no skill changed").
