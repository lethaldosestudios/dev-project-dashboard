# Phase 4 Design — AI Intelligence MVP

**Project:** dev-project-dashboard  
**Date:** 2026-07-29  
**Status:** Proposed  
**Scope:** Resource enrichment and project-level attention summaries using NVIDIA Build

## Decision

Build a narrow, manual-triggered AI enrichment layer first. Do not start with a general AI chat interface or automatic processing of every record.

The first release will let Porter analyze a captured resource and request a project attention review. Results will be stored in D1, shown with their source/model/status, and remain editable or dismissible. Automatic enrichment is deferred until the outputs prove useful on real dashboard data.

## Why this phase

The repository already has:

- working resource CRUD and quick-capture routes;
- `resources.summary` for generated summaries;
- `tags` and `resource_tags` with `source` and `confidence` fields;
- project notes, GitHub activity, and stale detection;
- an existing dashboard whose central job is identifying what needs attention.

The repository does not yet have an AI client, AI route, AI-run persistence, tag assignment logic, or UI controls for AI actions. The current `.env.example` has `NVIDIA_BUILD_API_KEY`, but no model configuration or request policy.

## Model routing

Use one NVIDIA OpenAI-compatible client and one API key. All three models use the same service root:

```text
https://integrate.api.nvidia.com/v1
```

Model-specific responsibilities:

| Model | ID | First-release responsibility | Reason |
|---|---|---|---|
| DeepSeek V4 Flash | `deepseek-ai/deepseek-v4-flash` | Resource summary, tag suggestions, resource classification | Fast coding/agentic model with 1M context; default path for high-volume text enrichment |
| Kimi K2.6 | `moonshotai/kimi-k2.6` | Optional visual resource analysis and screenshot/image review | Multimodal model; use only when the input includes an image or visual artifact |
| Nemotron 3 Super | `nvidia/nemotron-3-super-120b-a12b` | Project attention review and cross-record reasoning | Strong fit for planning, tool use, architecture, and long-context project synthesis |

Do not call all three models for one request. Model routing is a product rule, not an ensemble. This keeps cost, latency, and rate-limit pressure predictable.

## User-facing capabilities

### 1. Analyze resource

Add an `Analyze` action to each resource. The action sends the resource's available metadata to DeepSeek:

- URL and domain;
- title;
- note;
- existing summary, if present;
- associated project name, description, and stack;
- a bounded amount of relevant project context.

The first version does not scrape arbitrary web pages. It analyzes data already stored in the dashboard. This avoids SSRF, scraping instability, privacy surprises, and oversized prompts.

Expected structured result:

```json
{
  "summary": "Short useful summary.",
  "tags": [
    { "name": "cloudflare", "confidence": 0.94 },
    { "name": "deployment", "confidence": 0.81 }
  ],
  "content_type": "documentation",
  "actionability": "reference",
  "next_action": "Review the Workers deployment caveat before migration."
}
```

The server validates this response before writing anything. Invalid JSON or unknown fields produce a failed AI run and no partial resource mutation.

### 2. Review project attention

Add a project-level `Review attention` action. It sends Nemotron:

- project metadata;
- recent notes;
- recent resources and summaries;
- recent GitHub activity;
- stale status and last activity date.

Expected structured result:

```json
{
  "headline": "What needs attention first",
  "priority": "high",
  "items": [
    {
      "title": "Resolve deployment adapter issue",
      "reason": "The project is blocked by a known adapter build failure.",
      "source_ids": ["resource-or-note-id"],
      "recommended_action": "Schedule the OpenNext migration pass."
    }
  ],
  "confidence": 0.86
}
```

Store the review as a dated snapshot. Do not overwrite project description, priority, or status automatically.

### 3. Visual analysis seam for Kimi

Do not make visual analysis a prerequisite for the first AI release. Add the provider interface and request shape so a later UI action can pass an image URL or approved asset reference to Kimi.

The first Kimi slice should support screenshot review only after the resource model has a safe, explicit image reference. Do not fetch arbitrary URLs from the server and do not put the NVIDIA key in browser code.

## Architecture

Create a small server-only AI layer:

```text
src/lib/ai/
  client.ts       NVIDIA client and shared request settings
  models.ts       model IDs and routing constants
  schemas.ts      response validation and normalized result types
  prompts.ts      resource and project prompt builders
  enrich.ts       resource analysis and project review functions
  errors.ts       safe error classification
```

Use the existing Next.js route handlers and Edge-compatible APIs. Do not introduce a heavyweight AI framework for three JSON workflows.

`client.ts` should read:

```text
NVIDIA_BUILD_API_KEY
NVIDIA_BUILD_BASE_URL=https://integrate.api.nvidia.com/v1
NVIDIA_BUILD_PRIMARY_MODEL=deepseek-ai/deepseek-v4-flash
NVIDIA_BUILD_MULTIMODAL_MODEL=moonshotai/kimi-k2.6
NVIDIA_BUILD_REASONING_MODEL=nvidia/nemotron-3-super-120b-a12b
```

The key must only be read by server code. The browser receives model status and result data, never credentials.

## Database changes

Add a migration after `0001_init.sql`.

### `ai_runs`

```text
id TEXT PRIMARY KEY
operation TEXT NOT NULL
model TEXT NOT NULL
resource_id TEXT REFERENCES resources(id)
project_id TEXT REFERENCES projects(id)
status TEXT NOT NULL
input_hash TEXT
result_json TEXT
error_code TEXT
error_message TEXT
started_at TEXT NOT NULL
completed_at TEXT
created_at TEXT DEFAULT CURRENT_TIMESTAMP
```

Recommended operation values:

- `resource_enrichment`
- `project_attention_review`
- `resource_visual_analysis`

Recommended status values:

- `queued`
- `running`
- `completed`
- `failed`
- `rate_limited`

Add indexes for `(resource_id, created_at)`, `(project_id, created_at)`, and `(status, created_at)`.

### Resource/tag persistence

When resource enrichment succeeds:

1. update `resources.summary`, `content_type`, and `updated_at`;
2. upsert normalized tag rows into `tags`;
3. upsert `resource_tags` with `source = 'ai'` and the returned confidence;
4. preserve manual tags and manual edits;
5. never delete manual tags because an AI run returns a different suggestion.

Tag normalization should lowercase, trim, collapse whitespace, convert spaces to hyphens for slugs, and reject empty names.

## API surface

Add these routes:

### `POST /api/ai/resources/:id/analyze`

- Load the resource and bounded project context.
- Reject missing resources with `404`.
- Return `409` when an identical analysis is already running.
- Reuse a recent successful result for the same `input_hash` unless `force=true`.
- Create an `ai_runs` row before calling NVIDIA.
- Call DeepSeek.
- Validate the result.
- Persist the resource enrichment and tags atomically through D1 batch operations.
- Return the run and normalized result.

### `GET /api/ai/runs`

Support filters for `resourceId`, `projectId`, `operation`, and a small bounded `limit`. This powers status/history UI and debugging without exposing prompts or secrets.

### `POST /api/ai/projects/:id/review`

- Load the project and bounded recent context.
- Call Nemotron.
- Persist a completed or failed `ai_runs` snapshot.
- Return the normalized review.

### `POST /api/ai/resources/:id/visual-analyze`

Create the route only when the approved image-reference input is defined. It will route to Kimi and share the same run/error/persistence system.

## Request policy

NVIDIA's free endpoints are rate-limited and the exact limit varies by model and traffic. The app must behave correctly under 429 responses.

Implement:

- one request per user action;
- no parallel fan-out across models;
- a short timeout;
- one retry only for transient 429/5xx errors, with backoff;
- no automatic retry for malformed requests or authentication failures;
- clear `rate_limited`, `auth_failed`, `timeout`, `invalid_response`, and `provider_error` classifications;
- bounded prompt sizes and bounded result tokens;
- input hashes for deduplication;
- logs containing operation, model, run ID, status, and latency, but never the API key or full private prompt.

Do not silently fall back from DeepSeek to Nemotron. A fallback changes output behavior and makes debugging harder. Show the failure and let Porter retry or choose a different action.

## UI changes

### Resource list

Add:

- `Analyze` button;
- loading state tied to the current resource;
- success state showing summary and AI-suggested tags;
- failed/rate-limited state with retry action;
- last analyzed timestamp and model label;
- manual-vs-AI tag distinction.

### Project detail page

Add an `Attention review` panel near the existing stale/activity area:

- latest review headline;
- ordered attention items;
- source links back to notes/resources/activity;
- confidence shown as secondary metadata, not as a hard truth score;
- review timestamp and model label;
- `Review again` action.

Do not add a conversational chat panel in this phase. It is a separate product decision and would require a broader retrieval and interaction design.

### Settings page

Replace the current placeholder with a minimal AI status panel:

- configured model IDs;
- NVIDIA base URL without the secret;
- key configured/not configured status;
- latest run status;
- provider error count;
- no secret value and no raw prompt display.

## Testing plan

### Unit tests

- tag normalization and slug generation;
- prompt input bounding;
- input hash stability;
- response validation for valid, malformed, partial, and extra-field responses;
- error classification;
- model routing rules;
- preservation of manual tags;
- duplicate-run behavior.

### API tests

Mock NVIDIA at the fetch boundary. Test:

- successful DeepSeek resource enrichment;
- successful Nemotron project review;
- Kimi route rejection until image input is present;
- `401`, `429`, `500`, timeout, malformed JSON, and schema mismatch;
- D1 write failure after provider success;
- repeated identical requests and `force=true`;
- no API key exposure in responses or logs.

### Manual verification

Seed one resource and one project with realistic notes and GitHub activity. Verify:

1. Analyze produces a persisted summary and AI tags.
2. Running the same action again uses the cached result.
3. Manual tags remain intact after re-analysis.
4. The project review cites actual stored source records.
5. A simulated 429 shows a retryable state.
6. The page remains usable when AI is unavailable.

## Implementation order

1. Add the design and migration files.
2. Add model constants, server-only client, validation, prompts, and error types.
3. Add `ai_runs` migration and D1 persistence helpers.
4. Implement resource enrichment with DeepSeek.
5. Add resource UI and test the full manual flow.
6. Implement project attention review with Nemotron.
7. Add project review UI and source linking.
8. Add Kimi's visual-analysis seam, then implement it only after the image-reference contract is settled.
9. Replace the settings placeholder with AI health/status information.
10. Run build, lint/type checks, API tests, and a manual smoke test against the configured NVIDIA endpoint.
11. Update `README.md` and `TODO.md` only after the implementation is verified.

## Acceptance criteria

Phase 4 is complete when:

- one resource can be analyzed manually through the UI;
- DeepSeek produces a validated summary/tag result that persists in D1;
- manual tags and notes are never overwritten or deleted;
- one project can receive a dated Nemotron attention review;
- each result shows model, timestamp, and run status;
- provider errors are visible and retryable;
- duplicate requests do not create duplicate active runs;
- no browser bundle or response contains `NVIDIA_BUILD_API_KEY`;
- Kimi is configured and reachable through the shared client, with visual analysis either implemented against an explicit safe input contract or intentionally left behind a tested route seam;
- the dashboard remains fully usable when NVIDIA is unavailable;
- the repository builds successfully on the existing deployment path.

## Out of scope

- general AI chat over projects;
- arbitrary webpage scraping or server-side URL fetching;
- automatic analysis on every capture;
- autonomous edits to project status, priority, notes, or tags;
- embeddings/vector search;
- multi-user permissions;
- OpenNext/Next.js migration;
- Phase 5 widgets, Figma panel, reorder controls, and deploy widgets.

## Risks and controls

| Risk | Control |
|---|---|
| Free endpoint rate limits | Manual triggers, deduplication, one retry, visible status |
| Model returns unsafe or incorrect tags | Validation, confidence metadata, manual preservation, no destructive writes |
| Prompt growth from project context | Explicit record and character limits |
| NVIDIA outage blocks the dashboard | AI is additive; core CRUD/search/UI never depend on it |
| Secret leakage | Server-only environment access and response/log review |
| Cloudflare Edge incompatibility | Use existing Edge-compatible primitives and test against the current build before adapter migration |
| AI feature becomes a chat product by accident | Keep this phase to two bounded actions and stored results |
