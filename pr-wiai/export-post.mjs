#!/usr/bin/env node
// Export a post from plan.json → Remotion JSON + Root.tsx registration
// Usage: node export-post.mjs <post-id> [--dry-run]
// Also: node export-post.mjs --list  (show all ready/scheduled posts without JSON)

import { readFileSync, writeFileSync, existsSync } from "fs";
import { join } from "path";

const ROOT = new URL(".", import.meta.url).pathname.replace(/\/$/, "");
const PLAN = join(ROOT, "pipeline/plan.json");
const POSTS_DIR = join(ROOT, "wiai-social/posts");
const ROOT_TSX = join(ROOT, "wiai-social/src/Root.tsx");

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const listMode = args.includes("--list");

const plan = JSON.parse(readFileSync(PLAN, "utf8"));

// ── List mode ────────────────────────────────────────────────────────────────

if (listMode) {
  const exportable = plan.posts.filter((p) =>
    !p.json && p.slides?.bigText && (p.status === "ready" || p.status === "scheduled" || p.status === "draft")
  );
  console.log("\nExportable posts (" + exportable.length + "):\n");
  for (const p of exportable) {
    const s = p.slides;
    const preview = [s.bigText, s.s2, s.s3].filter(Boolean).join(" / ").substring(0, 70);
    console.log("  " + p.status.padEnd(10) + p.type.padEnd(14) + p.id);
    console.log("  " + " ".repeat(24) + preview);
    console.log();
  }
  process.exit(0);
}

// ── Export mode ──────────────────────────────────────────────────────────────

const postId = args.find((a) => !a.startsWith("--"));
if (!postId) {
  console.error("Usage: node export-post.mjs <post-id> [--dry-run]");
  console.error("       node export-post.mjs --list");
  process.exit(1);
}

const post = plan.posts.find((p) => p.id === postId);
if (!post) {
  console.error("Post not found: " + postId);
  process.exit(1);
}

if (!post.slides || !(post.slides.bigText || post.slides.smallText || post.slides.s2)) {
  console.error("Post has no slide content. Edit slides first in the UI.");
  process.exit(1);
}

// ── Build Remotion JSON ──────────────────────────────────────────────────────

const s = post.slides;
const remotionType = mapDesignToRemotionType(post);

const remotionPost = {
  id: post.id,
  type: remotionType,
};

// Optional fields
if (post.design) remotionPost.design = post.design;
if (post.tag === "ad") remotionPost.isAd = true;

if (remotionType === "terminal") {
  // Terminal: bigText → prompt, smallText+s2 → typing text, s3 → closing
  remotionPost.terminal = {
    color: s.terminalColor || "green",
    prompt: s.bigText || "$",
  };
  remotionPost.slide1 = {};
  const typingParts = [s.smallText, s.s2].filter(Boolean);
  remotionPost.slide2 = { text: typingParts.join("\n\n") };
  remotionPost.slide3 = { text: s.s3 || "" };
} else {
  // Pixel-Wall / Billboard / Newsjacking: standard 3-slide mapping
  remotionPost.slide1 = {};
  if (s.bigText) remotionPost.slide1.bigText = s.bigText;
  if (s.smallText) remotionPost.slide1.smallText = s.smallText;
  remotionPost.slide2 = { text: s.s2 || "" };
  remotionPost.slide3 = { text: s.s3 || "" };
  if (s.button) remotionPost.slide3.button = s.button;
  if (s.uebrigens) remotionPost.slide3["\u00fcbrigensText"] = s.uebrigens;
}

// ── Output ───────────────────────────────────────────────────────────────────

const jsonFilename = post.id + ".json";
const jsonPath = join(POSTS_DIR, jsonFilename);
const jsonRelative = "wiai-social/posts/" + jsonFilename;

console.log("\n=== Export: " + post.id + " ===\n");
console.log("Type:   " + remotionType);
console.log("Design: " + (post.design || "default"));
console.log("Format: " + (post.format || "both"));
console.log();
console.log("S1 bigText:  " + (s.bigText || "").substring(0, 60));
console.log("S1 smallText:" + (s.smallText || "").substring(0, 60));
console.log("S2 text:     " + (s.s2 || "").substring(0, 60));
console.log("S3 text:     " + (s.s3 || "").substring(0, 60));
if (s.button) console.log("S3 button:   " + s.button.substring(0, 60));
if (s.uebrigens) console.log("S3 uebrigens:" + s.uebrigens.substring(0, 60));
console.log();

if (post.description) console.log("Description: " + post.description.substring(0, 80));
if (post.hashtags) console.log("Hashtags:    " + post.hashtags);
console.log();

const jsonStr = JSON.stringify(remotionPost, null, 2);

if (dryRun) {
  console.log("JSON (dry-run):");
  console.log(jsonStr);
  console.log("\nWould write to: " + jsonPath);
  console.log("Would add to Root.tsx");
  process.exit(0);
}

// Write JSON
if (existsSync(jsonPath)) {
  console.log("JSON already exists, overwriting: " + jsonPath);
}
writeFileSync(jsonPath, jsonStr + "\n");
console.log("Written: " + jsonPath);

// Update Root.tsx — add import + cp() if not already there
const rootContent = readFileSync(ROOT_TSX, "utf8");
const importName = post.id.replace(/[^a-zA-Z0-9]/g, "_") + "Post";
const importLine = 'import ' + importName + ' from "../posts/' + jsonFilename + '";';
const cpLine = '    {cp("WiaiPost-' + post.id + '", ' + importName + ' as unknown as Post)}';

if (rootContent.includes(jsonFilename)) {
  console.log("Root.tsx already references " + jsonFilename);
} else {
  // Find last import line and add after it
  const importInsertIdx = rootContent.lastIndexOf("\nimport ");
  const nextNewline = rootContent.indexOf("\n", importInsertIdx + 1);
  let updated = rootContent.substring(0, nextNewline + 1) + importLine + "\n" + rootContent.substring(nextNewline + 1);

  // Find last cp() line and add after it
  const cpInsertIdx = updated.lastIndexOf("{cp(");
  const cpNewline = updated.indexOf("\n", cpInsertIdx);
  updated = updated.substring(0, cpNewline + 1) + cpLine + "\n" + updated.substring(cpNewline + 1);

  writeFileSync(ROOT_TSX, updated);
  console.log("Root.tsx updated: import + cp() added");
}

// Update plan.json — set json path and status
post.json = jsonRelative;
if (post.status === "draft" || post.status === "idea") {
  post.status = "ready";
}
writeFileSync(PLAN, JSON.stringify(plan, null, 2) + "\n");
console.log("plan.json updated: json=" + jsonRelative + ", status=" + post.status);

console.log("\nDone! Next: cd wiai-social && ./render.sh posts/" + jsonFilename);

// ── Helpers ──────────────────────────────────────────────────────────────────

function mapDesignToRemotionType(post) {
  // Design determines the Remotion composition type
  const designMap = {
    "pixel-wall": "led-wall",
    billboard: "billboard",
    terminal: "terminal",
    newsjacking: "newsjacking",
  };
  if (post.design && designMap[post.design]) return designMap[post.design];

  // Fallback: derive from content type
  const typeMap = {
    nachtgedanke: "terminal",
    nahkastchen: "terminal",
    selbstironie: "terminal",
    aphorismus: "billboard",
    "merkste-selber": "billboard",
    newsjacking: "newsjacking",
  };
  return typeMap[post.type] || "led-wall";
}
