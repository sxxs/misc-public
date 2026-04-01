#!/usr/bin/env node
// @echt.bamberg — Sync Root.tsx from posts/*.json
// Scans wiai-social/posts/ (excluding archive/) and regenerates the
// import + composition block in Root.tsx between marker comments.
//
// Usage:
//   node sync-root.mjs          # sync and show what's registered
//   node sync-root.mjs --quiet  # sync silently (for render.sh/preview)

import { readFileSync, writeFileSync, readdirSync } from "fs";
import { join, basename } from "path";

const ROOT = new URL(".", import.meta.url).pathname.replace(/\/$/, "");
const POSTS_DIR = join(ROOT, "wiai-social/posts");
const ROOT_TSX = join(ROOT, "wiai-social/src/Root.tsx");

const quiet = process.argv.includes("--quiet");

// ── Scan posts/*.json (skip archive/) ────────────────────────────────────────

const jsonFiles = readdirSync(POSTS_DIR)
  .filter((f) => f.endsWith(".json"))
  .sort();

if (!quiet) {
  console.log(`sync-root: ${jsonFiles.length} post(s) in posts/`);
  for (const f of jsonFiles) console.log(`  ${f}`);
}

// ── Generate import + cp lines ───────────────────────────────────────────────

function toVarName(filename) {
  const id = basename(filename, ".json");
  let name = id.replace(/[^a-zA-Z0-9]/g, "_");
  if (/^\d/.test(name)) name = "post_" + name;
  return name;
}

const imports = [];
const compositions = [];

for (const f of jsonFiles) {
  const varName = toVarName(f);
  const postId = basename(f, ".json");
  imports.push(`import ${varName} from "../posts/${f}";`);
  compositions.push(`{cp("WiaiPost-${postId}", ${varName} as unknown as Post)}`);
}

// ── Replace between markers in Root.tsx ──────────────────────────────────────

const IMPORT_START = "// @sync-root:imports-start";
const IMPORT_END = "// @sync-root:imports-end";
const CP_START = "{/* @sync-root:compositions-start */}";
const CP_END = "{/* @sync-root:compositions-end */}";

let rootContent = readFileSync(ROOT_TSX, "utf8");

// Replace import block
const importStartIdx = rootContent.indexOf(IMPORT_START);
const importEndIdx = rootContent.indexOf(IMPORT_END);
if (importStartIdx === -1 || importEndIdx === -1) {
  console.error("Root.tsx missing sync-root markers. Expected:");
  console.error("  " + IMPORT_START);
  console.error("  " + IMPORT_END);
  process.exit(1);
}
const importBlock = imports.length > 0 ? "\n" + imports.join("\n") + "\n" : "\n";
rootContent =
  rootContent.substring(0, importStartIdx + IMPORT_START.length) +
  importBlock +
  rootContent.substring(importEndIdx);

// Replace composition block
const cpStartIdx = rootContent.indexOf(CP_START);
const cpEndIdx = rootContent.indexOf(CP_END);
if (cpStartIdx === -1 || cpEndIdx === -1) {
  console.error("Root.tsx missing sync-root markers. Expected:");
  console.error("  " + CP_START);
  console.error("  " + CP_END);
  process.exit(1);
}
const cpBlock =
  compositions.length > 0
    ? "\n    " + compositions.join("\n    ") + "\n    "
    : "\n    ";
rootContent =
  rootContent.substring(0, cpStartIdx + CP_START.length) +
  cpBlock +
  rootContent.substring(cpEndIdx);

writeFileSync(ROOT_TSX, rootContent);

if (!quiet) {
  console.log(`Root.tsx synced: ${jsonFiles.length} composition(s)`);
}
