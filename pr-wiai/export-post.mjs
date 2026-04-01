#!/usr/bin/env node
// Export a post from plan.json → Remotion JSON + Root.tsx registration
// Usage: node export-post.mjs <post-id> [--dry-run]
// Also: node export-post.mjs --list  (show all ready/draft posts without JSON)

import { readFileSync, writeFileSync, existsSync } from "fs";
import { join } from "path";

const ROOT = new URL(".", import.meta.url).pathname.replace(/\/$/, "");
const PLAN = join(ROOT, "pipeline/plan.json");
const POSTS_DIR = join(ROOT, "wiai-social/posts");

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const listMode = args.includes("--list");

const plan = JSON.parse(readFileSync(PLAN, "utf8"));

// ── List mode ────────────────────────────────────────────────────────────────

if (listMode) {
  const exportable = plan.posts.filter((p) =>
    !p.json && p.content && (p.status === "ready" || p.status === "draft")
  );
  console.log("\nExportable posts (" + exportable.length + "):\n");
  for (const p of exportable) {
    const c = p.content;
    const preview = [c.act1Setup, c.act2, c.act3].filter(Boolean).join(" / ").substring(0, 70);
    console.log("  " + p.status.padEnd(10) + (p.design || p.type).padEnd(14) + p.id);
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

if (!post.content || !(post.content.act2 || post.content.act3)) {
  console.error("Post has no content. Edit content fields first in the UI.");
  process.exit(1);
}

// ── Build Remotion JSON ──────────────────────────────────────────────────────

const c = post.content;
const remotionType = mapDesignToRemotionType(post);

const remotionPost = {
  id: post.id,
  type: remotionType,
};

// Optional top-level fields
if (post.design) remotionPost.design = post.design;
if (post.tag === "ad") remotionPost.isAd = true;
if (post.accentColor) remotionPost.accentColor = post.accentColor;

// timing (led-wall only)
if (post.timing) remotionPost.timing = post.timing;

// terminal config — color only (prompt is now in content.act1Setup)
if (remotionType === "terminal") {
  const termColor = post.terminalColor || "green";
  remotionPost.terminal = { color: termColor };
}

// Copy content directly — same structure in plan.json and Remotion JSON
remotionPost.content = buildContent(c, remotionType);

// ── Output ───────────────────────────────────────────────────────────────────

const jsonFilename = post.id + ".json";
const jsonPath = join(POSTS_DIR, jsonFilename);
const jsonRelative = "wiai-social/posts/" + jsonFilename;

console.log("\n=== Export: " + post.id + " ===\n");
console.log("Type:   " + remotionType);
console.log("Design: " + (post.design || "default"));
console.log("Format: " + (post.format || "both"));
console.log();
console.log("act1Setup:  " + (c.act1Setup || "").substring(0, 60));
console.log("act1Reveal: " + (c.act1Reveal || "").substring(0, 60));
console.log("act2:       " + (c.act2 || "").substring(0, 60));
console.log("act3:       " + (c.act3 || "").substring(0, 60));
if (c.aside) console.log("aside:      " + c.aside.substring(0, 60) + (c.asideStyle ? " [" + c.asideStyle + "]" : ""));
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

// Root.tsx is auto-managed by sync-root.mjs (called by render.sh)
console.log("Root.tsx will be synced automatically by render.sh or: node sync-root.mjs");

// Update plan.json — set json path and status
post.json = jsonRelative;
if (post.status === "draft" || post.status === "idea") {
  post.status = "ready";
}
writeFileSync(PLAN, JSON.stringify(plan, null, 2) + "\n");
console.log("plan.json updated: json=" + jsonRelative + ", status=" + post.status);

console.log("\nDone! Next: cd wiai-social && ./render.sh posts/" + jsonFilename);

// ── Helpers ──────────────────────────────────────────────────────────────────

function buildContent(c, remotionType) {
  const out = {};

  // act1Setup: for terminal this is the prompt; for others it's the setup line
  if (c.act1Setup) out.act1Setup = c.act1Setup;

  // act1Reveal: reaction word / hook reveal (not used by terminal)
  if (remotionType !== "terminal" && c.act1Reveal) out.act1Reveal = c.act1Reveal;

  // act2 and act3 are always present
  out.act2 = c.act2 || "";
  out.act3 = c.act3 || "";

  // aside with optional style
  if (c.aside) {
    out.aside = c.aside;
    if (c.asideStyle && c.asideStyle !== "button") out.asideStyle = c.asideStyle;
  }

  // optional fields
  if (c.url) out.url = c.url;
  if (c.textAlign && remotionType === "led-wall") out.textAlign = c.textAlign;
  if (c.image) out.image = c.image;

  return out;
}

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
