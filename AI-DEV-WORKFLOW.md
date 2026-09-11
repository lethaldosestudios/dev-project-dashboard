# AI Development Workflow

**Date:** 2026-07-29
**Project:** `dev-project-dashboard`
**Status:** Active plan

> **Note:** AI-assisted *development* is a dev-time workflow used to build this
> repository — not a product phase of the dashboard. See `README.md` / `TODO.md`
> for the roadmap (Phase 4 = Polish & Iterate, Phase 5 = Optional AI features).

## Decision

The NVIDIA Build models are external development tools. They help build, review, and verify this repository; they are not application features and are not routed into the deployed dashboard.

The dashboard remains fully functional with no NVIDIA credentials, model client, AI API routes, AI database tables, or browser-side provider configuration.

## Model assignments

### DeepSeek V4 Flash

Use as the primary implementation model for:

- repository exploration and focused code changes;
- API and database implementation;
- debugging and refactoring;
- writing targeted tests;
- small, repeatable development tasks.

### Kimi K2.6

Use as the visual/design model for:

- screenshot and responsive-layout review;
- visual hierarchy, spacing, typography, and interaction critique;
- proposing visual direction before UI changes;
- checking the result at desktop and mobile breakpoints.

Kimi's image-capable endpoint is used by the development workflow only. The dashboard does not upload screenshots or call Kimi at runtime.

### Nemotron 3 Super

Use as the architecture and verification model for:

- reviewing implementation plans and tradeoffs;
- checking data flow, security, and maintainability;
- designing test strategy;
- auditing completed changes against the requested behavior;
- identifying regressions before a commit.

## Development loop

1. Inspect the repository documentation, current implementation, and relevant tests.
2. Ask DeepSeek to propose or implement the smallest coherent code change.
3. Use Kimi to review screenshots when the change affects layout, styling, interaction, or responsive behavior.
4. Use Nemotron to review architecture, edge cases, security, and verification coverage.
5. Run local type checks, builds, and targeted API/UI tests.
6. Review the diff, update project documentation, and commit only the verified change.

## Secret handling

Use one development-only NVIDIA API key per coding assistant app for any/all available free-endpoint models:


Store these in encrypted/locked file (only Porter has access) or the development environment used by the model-invocation workflow. Do not place them in the dashboard's `.env.example`, application runtime, browser bundle, Git history, or public deployment.

## Guardrails

- Never add a model provider dependency to the dashboard merely to use a model during development.
- Never make a dashboard feature depend on NVIDIA availability.
- Never send production or private project data to a model without an explicit task requiring it.
- Keep visual review human-directed; Kimi critiques and proposes, but does not silently rewrite the UI.
- Verify every implementation independently with local checks and a diff review.

## Next implementation target

Continue with the next user-visible dashboard milestone. Use the three-model workflow above to plan and implement it. Do not create runtime AI routes in the shipped app unless the product requirement explicitly changes to an in-app AI feature (see Phase 5 — Optional AI features in `README.md` / `TODO.md`).
