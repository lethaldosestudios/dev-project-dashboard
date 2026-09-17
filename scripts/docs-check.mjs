#!/usr/bin/env node
/**
 * docs:check — verify that documentation claims still match the code.
 *
 * Every check below exists because that specific claim drifted in this repo at least
 * once. The script is intentionally narrow: it asserts the things that have actually
 * gone stale, rather than trying to parse prose.
 *
 * Usage:
 *   node scripts/docs-check.mjs                # enforce (exit 1 on any finding)
 *   node scripts/docs-check.mjs --report-only  # report and exit 0 regardless
 *
 * See AGENTS.md -> "Documentation Contract" for the rules this enforces.
 */

import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { join } from "node:path";

const ROOT = process.cwd();
const REPORT_ONLY = process.argv.includes("--report-only");

/** Docs that make claims about the CURRENT state. Must stay true. */
const STATE_DOCS = [
  "README.md",
  "TODO.md",
  "AGENTS.md",
  "DESIGN.md",
  "AI-DEV-WORKFLOW.md",
];

/** History only. May quote the past, so phase numbers are legal here. */
const HISTORY_DOCS = ["CHANGELOG.md"];

const findings = [];
const notes = [];
const fail = (check, file, detail) => findings.push({ check, file, detail });

const read = (rel) => readFileSync(join(ROOT, rel), "utf8");

function walk(dir, filter, acc = []) {
  const abs = join(ROOT, dir);
  if (!existsSync(abs)) return acc;
  for (const entry of readdirSync(abs, { withFileTypes: true })) {
    const rel = join(dir, entry.name);
    if (entry.isDirectory()) walk(rel, filter, acc);
    else if (filter(rel)) acc.push(rel);
  }
  return acc;
}

const isMarkdown = (p) => p.endsWith(".md");
const githubDocs = () => walk(".github", isMarkdown);

// ---------------------------------------------------------------------------
// 1. Auth coverage on mutation routes
//
// AGENTS.md mandates requireAuth() on every POST/PATCH/DELETE handler. Two routes
// historically violated it, so the rule is now machine-checked. Exemptions must be
// declared here with a reason — they can never be silently skipped. This list is
// currently EMPTY, so the rule is unconditionally true; remove an entry the moment
// its exception closes.
// ---------------------------------------------------------------------------
const AUTH_EXEMPT = new Map([]);

function checkAuthCoverage() {
  const routes = walk("src/app/api", (p) => p.endsWith("route.ts"));
  for (const route of routes) {
    const src = read(route);
    // Split into exported function bodies so a guarded GET can't mask an unguarded PATCH.
    const decls = [...src.matchAll(/export\s+async\s+function\s+(POST|PATCH|PUT|DELETE)\s*\(/g)];
    for (let i = 0; i < decls.length; i++) {
      const start = decls[i].index;
      const end = i + 1 < decls.length ? decls[i + 1].index : src.length;
      const body = src.slice(start, end);
      if (body.includes("requireAuth(")) continue;
      if (AUTH_EXEMPT.has(route)) {
        notes.push(`auth exemption honored: ${decls[i][1]} ${route}`);
        continue;
      }
      fail(
        "auth-coverage",
        route,
        `${decls[i][1]} does not call requireAuth() and is not a declared exemption`,
      );
    }
  }
  for (const route of AUTH_EXEMPT.keys()) {
    if (!routes.includes(route)) {
      fail("auth-coverage", route, "allowlisted route no longer exists — remove the exemption");
    }
  }
}

// ---------------------------------------------------------------------------
// 2. .env.example hygiene
//
// AGENTS.md forbids GITHUB_PAT / DASHBOARD_PASSWORD from .env.example. Both were
// present. Also: only variables the code actually reads may be listed.
// ---------------------------------------------------------------------------
const ENV_FORBIDDEN = ["GITHUB_PAT", "DASHBOARD_PASSWORD"];
const ENV_ALLOWED = ["GITHUB_TOKEN"];

function checkEnvExample() {
  const file = ".env.example";
  if (!existsSync(join(ROOT, file))) {
    fail("env-example", file, "missing");
    return;
  }
  const lines = read(file).split("\n");
  lines.forEach((line, idx) => {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=/);
    if (!m) return;
    const key = m[1];
    if (ENV_FORBIDDEN.includes(key)) {
      fail("env-example", `${file}:${idx + 1}`, `forbidden secret name "${key}"`);
    } else if (!ENV_ALLOWED.includes(key)) {
      fail(
        "env-example",
        `${file}:${idx + 1}`,
        `"${key}" is not read by the code (allowed: ${ENV_ALLOWED.join(", ")})`,
      );
    }
  });
}

// ---------------------------------------------------------------------------
// 3. Retired phase numbering
//
// Numbering above 3 was retired because "Phase 4" came to mean three different
// things at once. Phase 1-3 remain as closed historical eras.
// ---------------------------------------------------------------------------
function checkPhaseNumbers() {
  const docs = [...STATE_DOCS, ...githubDocs()];
  for (const doc of docs) {
    if (!existsSync(join(ROOT, doc))) continue;
    read(doc)
      .split("\n")
      .forEach((line, idx) => {
        const m = line.match(/\bPhase\s+(\d+)\b/i);
        if (m && Number(m[1]) > 3) {
          fail(
            "phase-numbering",
            `${doc}:${idx + 1}`,
            `"Phase ${m[1]}" — numbering above 3 is retired; name the workstream instead`,
          );
        }
      });
  }
}

// ---------------------------------------------------------------------------
// 4. Referenced files exist
//
// DESIGN.md described a companion token-proof HTML page that was never committed.
// Any repo-relative path a doc names must resolve.
// ---------------------------------------------------------------------------
const PATH_PREFIX = /^(src|db|scripts|public|docs|archives|reports|\.github)\//;
const ROOT_FILES = new Set([
  "README.md",
  "TODO.md",
  "AGENTS.md",
  "DESIGN.md",
  "AI-DEV-WORKFLOW.md",
  "CHANGELOG.md",
  "package.json",
  "wrangler.jsonc",
  "tsconfig.json",
  "jest.config.cjs",
  "jest.setup.ts",
  "next.config.mjs",
  "open-next.config.ts",
  "postcss.config.mjs",
  "tailwind.config.ts",
  ".env.example",
  ".dev.vars.example",
]);

/**
 * Paths a doc legitimately names as *not yet written* (e.g. the fix for an open
 * issue). Declared here so a real missing-file reference can never hide among them;
 * if one is later created, the staleness check below fails until it is removed.
 */
const PLANNED_PATHS = new Map([
  [
    "src/app/api/notes/[id]/route.ts",
    "Proposed in TODO.md — the notes edit/delete gap",
  ],
]);

function checkReferencedFiles() {
  const docs = [...STATE_DOCS, ...HISTORY_DOCS, ...githubDocs()];
  for (const doc of docs) {
    if (!existsSync(join(ROOT, doc))) continue;
    const text = read(doc);
    for (const m of text.matchAll(/`([^`\n]+)`/g)) {
      let token = m[1].trim();
      if (/[\s*<>{}|]/.test(token)) continue; // flags, globs, generics — not a plain path
      token = token.replace(/:\d+(?::\d+)?$/, ""); // strip :line:col
      token = token.replace(/#.*$/, ""); // strip #anchor
      token = token.replace(/[.,;)]+$/, "");
      if (!token) continue;
      if (!PATH_PREFIX.test(token) && !ROOT_FILES.has(token)) continue;
      if (token.endsWith("/")) continue; // directory reference
      // Resolve owner-scoped/absolute references and obvious placeholders.
      if (token.startsWith("/") || token.startsWith("~")) continue;
      if (!existsSync(join(ROOT, token))) {
        if (PLANNED_PATHS.has(token)) {
          notes.push(`planned path named by ${doc}: ${token}`);
          continue;
        }
        fail("referenced-file", doc, `references \`${token}\` which does not exist`);
      }
    }
  }
  for (const planned of PLANNED_PATHS.keys()) {
    if (existsSync(join(ROOT, planned))) {
      fail(
        "referenced-file",
        planned,
        "is now committed — remove it from the PLANNED_PATHS allowlist",
      );
    }
  }
}

// ---------------------------------------------------------------------------
// 5. No README section-number citations
//
// README.md has no numbered sections, so "README.md §7" is always a dangling
// pointer. Cite file:line instead.
// ---------------------------------------------------------------------------
function checkSectionCitations() {
  const docs = [...STATE_DOCS, ...HISTORY_DOCS, ...githubDocs()];
  for (const doc of docs) {
    if (!existsSync(join(ROOT, doc))) continue;
    read(doc)
      .split("\n")
      .forEach((line, idx) => {
        if (/README(\.md)?\s*[§#]\s*\d/.test(line)) {
          fail(
            "section-citation",
            `${doc}:${idx + 1}`,
            "cites a README section number; README has no numbered sections",
          );
        }
      });
  }
}

// ---------------------------------------------------------------------------
// 6. Verification stamp
//
// Every state doc must record the commit its claims were verified against, and
// that commit must exist.
// ---------------------------------------------------------------------------
function checkVerifiedAgainst() {
  for (const doc of STATE_DOCS) {
    if (!existsSync(join(ROOT, doc))) {
      fail("verified-against", doc, "missing state doc");
      continue;
    }
    const m = read(doc).match(/verified-against:\s*([0-9a-f]{7,40})/);
    if (!m) {
      fail("verified-against", doc, "no `verified-against: <sha>` stamp");
      continue;
    }
    try {
      execFileSync("git", ["cat-file", "-e", `${m[1]}^{commit}`], { cwd: ROOT, stdio: "pipe" });
    } catch {
      fail("verified-against", doc, `stamped sha ${m[1]} does not resolve to a commit`);
    }
  }
}

// ---------------------------------------------------------------------------
// 7. Schema / migration sync
//
// AGENTS.md requires any edit to the schema to have a matching numbered migration,
// and the two must not diverge. Check that every migrated column is present in
// schema.sql.
// ---------------------------------------------------------------------------
function checkSchemaSync() {
  const migrations = walk("db/migrations", (p) => p.endsWith(".sql"));
  const schemaPath = "db/schema.sql";
  if (!existsSync(join(ROOT, schemaPath))) {
    fail("schema-sync", schemaPath, "missing");
    return;
  }
  const schema = read(schemaPath);
  for (const migration of migrations) {
    for (const m of read(migration).matchAll(/ADD\s+COLUMN\s+([A-Za-z_][A-Za-z0-9_]*)/gi)) {
      const column = m[1];
      if (!new RegExp(`\\b${column}\\b`).test(schema)) {
        fail("schema-sync", migration, `adds column "${column}" absent from ${schemaPath}`);
      }
    }
  }
}

// ---------------------------------------------------------------------------

const CHECKS = [
  ["auth-coverage", checkAuthCoverage],
  ["env-example", checkEnvExample],
  ["phase-numbering", checkPhaseNumbers],
  ["referenced-file", checkReferencedFiles],
  ["section-citation", checkSectionCitations],
  ["verified-against", checkVerifiedAgainst],
  ["schema-sync", checkSchemaSync],
];

for (const [, run] of CHECKS) run();

if (notes.length) {
  console.log("Notes:");
  for (const note of notes) console.log(`  - ${note}`);
}

if (findings.length === 0) {
  console.log(`docs:check passed (${CHECKS.length} checks).`);
  process.exit(0);
}

const byCheck = new Map();
for (const f of findings) {
  if (!byCheck.has(f.check)) byCheck.set(f.check, []);
  byCheck.get(f.check).push(f);
}

console.log(`docs:check found ${findings.length} issue(s) across ${byCheck.size} check(s):\n`);
for (const [check, items] of byCheck) {
  console.log(`[${check}]`);
  for (const item of items) console.log(`  - ${item.file}: ${item.detail}`);
  console.log("");
}

if (REPORT_ONLY) {
  console.log("(--report-only: exiting 0)");
  process.exit(0);
}
process.exit(1);
