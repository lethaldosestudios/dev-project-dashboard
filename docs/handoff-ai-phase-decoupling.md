# Handoff Plan — Decouple "AI-assisted development" from the product roadmap

> **Status:** Partially complete (roadmap renumber done — commit `94db462`).
> This file transfers the remaining work to the next session.

## Context / Background

The repo previously labeled "Phase 4" as **"AI-assisted development & visual/design
review."** This was a conceptual error: AI-assisted *development* is **how the repo is
built** (using external AI models as dev-time tools — which is exactly what happens in
these sessions), not a **product phase** of the dashboard itself.

The owner confirmed the correct model:

- **AI-assisted development is not a phase.** It's a dev-time workflow, orthogonal to the
  product roadmap. It should not appear as a roadmap milestone.
- **Roadmap (corrected):**
  - Phase 1 — Core CRUD ✅
  - Phase 2 — GitHub sync + stale detection ✅
  - Phase 3 — Bookmarklet quick capture ✅
  - Phase 4 — **Polish & Iterate** (next)
  - Phase 5 — **Optional AI features** (possible future *product* direction, not committed)

## What's already done (commit `94db462`)

- **README.md** — phase table now reads Phase 4 = "Polish & Iterate" (Next) and Phase 5 =
  "Optional AI features" (Later). The "Known limitations & roadmap" section was updated to
  distinguish Phase 5 (product AI) from the dev-time AI workflow.
- **TODO.md** — "Milestones" now has "Phase 4 — Polish & Iterate (Next)" and "Phase 5 —
  Optional AI features (Deferred)" with explanatory text.

## Remaining work (NOT yet done)

### 1. Move + rename the AI dev-workflow file

Current: `docs/plans/2026-07-29-ai-assisted-development-workflow.md`

- **Keep the content** (it accurately documents the three-model dev workflow: DeepSeek /
  Kimi / Nemotron as build tools, plus the NVIDIA API-key hygiene rules).
- **Rename it** away from "Phase 4 Plan" (its H1 title is literally "# Phase 4 Plan —").
- **Move it out of `docs/plans/`.** The owner wants a top-level markdown file at repo root,
  but NOT `CONTRIBUTING.md` or `DEVELOPMENT.md` (those names carry specific conventional
  meanings that don't fit this file's content).
- **Name decision (delegated to agent):** the agent should pick a clear, non-misleading
  top-level filename. Options floated: `AI-ECOSYSTEM.md`, `AI-MATRIX.md`, `MODEL-MATRIX.md`.
  A cleaner suggestion that better matches the content: **`AI-DEV-WORKFLOW.md`** or
  **`AI-TOOLCHAIN.md`** at repo root. The content is about the AI *development* toolchain,
  so the name should signal "dev tooling," not a product feature. Pick one and update all
  references.
- **Update references:** `README.md` (the known-limitations line, if it still points at the
  old path), `TODO.md` (the Phase 5 note references
  `docs/plans/2026-07-29-ai-assisted-development-workflow.md`), and
  `.github/instructions/code-review-dev-project-dashboard.instructions.md` (references it in
  "Phased build" context — see #3 below).

### 2. Add `docs/` guardrail to AGENTS.md

The owner uses `docs/` (and its `plans/` + `reviews/` subfolders) as **personal / organizing
space** that AI agents were never meant to read-as-source-of-truth or write into. Add a note
to **`AGENTS.md`** (the AI-facing instruction file at repo root) stating something like:

- `docs/` is the owner's private notes/research area (personal plans, ad-hoc code reviews,
  scratch ideas).
- AI agents should **not** treat `docs/` content as canonical project spec or source of truth.
- AI agents should **not write** into `docs/` unless the owner explicitly directs it.
- Note: the `docs/handoff-ai-phase-decoupling.md` file (this one) is an exception-by-design —
  but even so, prefer `TODO.md`/`README.md`/`AGENTS.md` (repo root) as the canonical living
  status docs.

### 3. Update `.github/instructions/code-review-dev-project-dashboard.instructions.md`

Relabel stale "Phase 4" references (there are ~8) so they no longer call the AI dev tooling a
roadmap phase, while **preserving the security intent**:

- "Phased build (see README.md and TODO.md) ... Phase 4 (…ai-assisted-development-workflow.md)
  is AI-assisted dev tooling — development-time only" → update to reflect Phase 4 = Polish &
  Iterate, Phase 5 = Optional AI features, and that AI dev tooling is a separate orthogonal
  workflow (see the renamed file).
- "the Phase 4 NVIDIA model API keys (DeepSeek/Kimi/Nemotron)" → relabel as the dev-time AI
  model keys (kept distinct from any future product AI).
- "Per README.md §9, the Phase 4 model keys..." → update section reference (README no longer
  has a §9 AI section after the rewrite — verify).
- The "Respect the phase boundary" architecture bullet — fix the phase reference.
- The "Checklist — No secrets … Phase 4 model keys" — relabel.
- Also fix: this file still says "**No test suite exists yet**" in the Project Context and
  Testing Standards sections — **this is now stale** (a minimal Jest suite exists: 2 component
  test suites). Mirror the wording already fixed in `AGENTS.md`.

### 4. Update `.github/copilot-instructions.md` (test-suite wording only)

- The "Testing Standards" section says "This repository has no automated test suite yet". Fix
  to reflect the minimal Jest suite now present. Double-check the whole file for any other
  stale statements while there, but keep edits minimal.

### 5. (Optional, flagged — not part of this doc task)

`docs/reviews/codebase-review.md` (2026-08-31) contains still-unresolved findings the owner may
want to act on separately, e.g. a 🔴 CRITICAL "SQL injection via template literal" finding in
`src/app/api/projects/[id]/route.ts` and `resources/[id]/route.ts`, plus `as any` body parsing.
**Do not fix these in the docs task** — but consider adding them as numbered open items in
`TODO.md` in a separate pass if the owner wants them tracked.

## Suggested commit plan for remaining work

1. `docs: move AI dev-workflow out of docs/plans and rename` (file move + reference updates in
   README/TODO/.github).
2. `docs: add docs/ guardrail to AGENTS.md and refresh AI review instruction files` (AGENTS.md
   guardrail + `.github/instructions` relabel + `copilot-instructions.md` test-suite fix).

(Or combine if preferred — the owner values clean, reviewable commits.)

## Decisions already locked (do not revisit)

- "AI-assisted development" is NOT a product phase. Done.
- Roadmap: Phase 4 = Polish & Iterate; Phase 5 = Optional AI features. Done.
- Keep the AI workflow file's content; only rename + relocate it.
- Guardrail for `docs/` belongs in `AGENTS.md`.
- Both `.github` instruction files need the test-suite wording fixed (and instructions file
  needs the phase relabel).