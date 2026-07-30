# General Code Review Standards — Dev Project Dashboard

## Purpose

Repository-wide baseline for Copilot code review. This project is a solo-use,
self-hosted dashboard on Next.js 15 + Cloudflare Workers + D1. Detailed,
priority-tiered review rules live in
`.github/instructions/code-review-dev-project-dashboard.instructions.md` — read
that file for the full checklist. This file is the short baseline that applies
everywhere, including files not covered by a path-specific instruction file.

## Security Critical Issues

- Never allow hardcoded secrets: `GITHUB_PAT`, `DASHBOARD_PASSWORD`, or any AI
  model API key used for development tooling
- All D1 queries must use `?` placeholders with `.bind()` — never string-
  concatenate or template-literal user input into SQL
- All request bodies must be validated (type-checked, trimmed, length-limited)
  before use
- URLs accepted from user input must be restricted to `http:`/`https:`

## Performance Red Flags

- Loops that issue a database query per iteration without a stated reason
- Unbounded external API calls (missing pagination limits)
- Blocking or CPU-heavy synchronous work inside a request handler (this runs
  on Cloudflare Workers, which has a per-request CPU time limit)

## Code Quality Essentials

- Functions should be focused and reasonably sized
- Use clear, descriptive naming
- Handle errors explicitly — no silent `catch` blocks that swallow failures
- Remove dead code and unused imports
- Avoid unnecessary `any` on request/response shapes

## Review Style

- Be specific: name the file and the exact pattern, not a general category
- Explain why it matters for this project's actual runtime (Workers/D1) and
  single-user trust model, not generic enterprise reasoning
- Acknowledge good patterns when you see them, especially adherence to this
  repo's existing parameterized-query and manual-validation conventions
- This is a solo, low-cost project — don't push heavyweight abstraction,
  config layers, or process that don't fit its scale

## Testing Standards

- This repository has no automated test suite yet — do not flag "missing
  tests" as a blocking issue
- Do flag unhandled edge cases in code paths that have no test coverage to
  catch them (sync jobs, capture/dedupe logic, validation logic)
