#!/usr/bin/env node
// @herdom.bamberg — plan.json Editor
//
// Single-post viewer & editor with fuzzy ID matching and dot-notation for nested fields.
// Replaces manual node -e JSON editing for all plan.json operations.
//
// SHOW a post:     node edit.mjs <id>
// SET fields:      node edit.mjs <id> field=value [field=value ...]
// NEW post:        node edit.mjs --new <id> type=<type> design=<design> topic=<topic> [field=value ...]
// FIND posts:      node edit.mjs --find <query>        (search id, type, design, topic, content)
// LIST a week:     node edit.mjs --week 2026-KW14      (all posts in that week, by slotIndex)
// LIST a status:   node edit.mjs --status ready         (all posts with that status)
//
// Field syntax:
//   field=value              top-level field (status, targetWeek, slotIndex, topic, ...)
//   content.act2="text"      nested field (content.act1Setup, content.aside, ...)
//   social.tiktok.caption=.. deeply nested (social.youtube.title, social.instagram.hashtags, ...)
//   field=null               remove a field
//   field=true/false         boolean
//   field=42                 auto-parsed as number
//
// ID matching:
//   Exact match first, then substring. If substring matches multiple posts,
//   all matches are listed so you can pick the right one.
//
// Examples:
//   node edit.mjs informatik-trocken                              # show (fuzzy match)
//   node edit.mjs informatik-trocken status=ready                 # set status
//   node edit.mjs informatik-trocken targetWeek=2026-KW15 slotIndex=3
//   node edit.mjs informatik-trocken content.act2="Da lernt man..."
//   node edit.mjs foto-pruefungstag social.tiktok.caption="..."
//   node edit.mjs --new foto-test type=aphorismus design=raw-photo topic=studium notes="Testpost"
//   node edit.mjs --find datenschutz                              # all datenschutz posts
//   node edit.mjs --find contrarian                               # all contrarian posts
//   node edit.mjs --week 2026-KW15                                # week overview
//   node edit.mjs --status draft                                  # all drafts

import { readFileSync, writeFileSync } from "fs";
import { join } from "path";

const ROOT = new URL(".", import.meta.url).pathname.replace(/\/$/, "");
const PLAN = join(ROOT, "pipeline/plan.json");

const plan = JSON.parse(readFileSync(PLAN, "utf8"));
const args = process.argv.slice(2);

// ── Help ────────────────────────────────────────────────────────────────────

if (args.length === 0 || args[0] === "--help" || args[0] === "-h") {
  console.log(`plan.json editor — show, search, edit, create posts

\x1b[1mUsage:\x1b[0m
  node edit.mjs <id> [field=value ...]    Show or edit a post
  node edit.mjs --new <id> type=T design=D topic=T [field=value ...]   Create a new post
  node edit.mjs --find <query>            Search posts (id, type, design, topic, content)
  node edit.mjs --week <week>             List posts in a week (e.g. 2026-KW14)
  node edit.mjs --status <status>         List posts by status (ready, draft, idea, published)

\x1b[1mField syntax:\x1b[0m
  status=ready                  Top-level field
  content.act2="Neuer Text"     Nested via dot-notation
  social.tiktok.caption="..."   Deeply nested, objects created automatically
  field=null                    Remove field
  slotIndex=3                   Numbers auto-parsed

\x1b[1mExamples:\x1b[0m
  node edit.mjs netflix                                    # fuzzy find by ID substring
  node edit.mjs informatik-trocken content.act3="Punchline"
  node edit.mjs --new foto-test type=aphorismus design=raw-photo topic=studium notes="Foto: ..."
  node edit.mjs --find datenschutz                         # all datenschutz posts
  node edit.mjs --week 2026-KW15                           # week overview`);
  process.exit(0);
}

// ── New post: --new <id> type=T design=D topic=T [field=value ...] ──────────

if (args[0] === "--new" || args[0] === "-n") {
  const newId = args[1];
  if (!newId || newId.includes("=")) {
    console.error("Usage: node edit.mjs --new <id> type=<type> design=<design> topic=<topic> [field=value ...]");
    process.exit(1);
  }

  if (plan.posts.some((p) => p.id === newId)) {
    console.error(`Post "${newId}" already exists. Use: node edit.mjs ${newId} field=value`);
    process.exit(1);
  }

  // Parse all field=value pairs after the id
  const newAssignments = args.slice(2).map((a) => {
    const eq = a.indexOf("=");
    if (eq === -1) { console.error(`Bad assignment: ${a} (expected field=value)`); process.exit(1); }
    return [a.slice(0, eq), a.slice(eq + 1)];
  });

  const fields = Object.fromEntries(newAssignments.map(([k, v]) => [k, v]));

  // Require type, design, topic
  const missing = ["type", "design", "topic"].filter((f) => !fields[f]);
  if (missing.length > 0) {
    console.error(`Missing required fields: ${missing.join(", ")}`);
    console.error("Usage: node edit.mjs --new <id> type=<type> design=<design> topic=<topic>");
    process.exit(1);
  }

  // Build post with defaults
  const newPost = {
    id: newId,
    type: null,
    design: null,
    status: "idea",
    json: null,
    source: null,
    targetWeek: null,
    publishedDate: null,
    platforms: {},
    notes: null,
    tag: null,
    tagComment: null,
    slotIndex: null,
    topic: null,
    format: "both",
    content: {},
  };

  // Apply all assignments (supports dot-notation for content.act1Reveal etc.)
  for (const [path, rawVal] of newAssignments) {
    const val = parseValue(rawVal);
    const parts = path.split(".");
    let target = newPost;
    for (let i = 0; i < parts.length - 1; i++) {
      if (target[parts[i]] == null || typeof target[parts[i]] !== "object") {
        target[parts[i]] = {};
      }
      target = target[parts[i]];
    }
    target[parts[parts.length - 1]] = val;
  }

  plan.posts.push(newPost);
  writeFileSync(PLAN, JSON.stringify(plan, null, 2) + "\n");

  console.log(`\x1b[32m✓ created\x1b[0m ${newId}`);
  showPost(newPost);
  process.exit(0);
}

// ── Search mode: --find <query> ─────────────────────────────────────────────

if (args[0] === "--find" || args[0] === "-f") {
  const q = (args[1] || "").toLowerCase();
  if (!q) { console.error("Usage: node edit.mjs --find <query>"); process.exit(1); }
  const hits = plan.posts.filter((p) => {
    const c = p.content || {};
    const haystack = [
      p.id, p.type, p.design, p.status, p.topic,
      p.targetWeek, p.tag, p.notes,
      c.act1Setup, c.act1Reveal, c.act2, c.act3, c.aside,
    ].filter(Boolean).join(" ").toLowerCase();
    return haystack.includes(q);
  });
  if (hits.length === 0) { console.log("No matches."); process.exit(0); }
  console.log(`${hits.length} matches for "${q}":\n`);
  for (const p of hits) {
    const week = p.targetWeek ? ` ${p.targetWeek}` : "";
    const hook = oneLineHook(p, 60);
    console.log(`  \x1b[32m${p.id}\x1b[0m`);
    console.log(`    ${p.type} | ${p.design} | ${p.status}${week} | ${p.topic || "-"} | ${hook}`);
  }
  process.exit(0);
}

// ── Week mode: --week <week> ────────────────────────────────────────────────

if (args[0] === "--week" || args[0] === "-w") {
  const week = args[1];
  if (!week) { console.error("Usage: node edit.mjs --week 2026-KW15"); process.exit(1); }
  const weekPosts = plan.posts
    .filter((p) => p.targetWeek === week)
    .sort((a, b) => (a.slotIndex ?? 99) - (b.slotIndex ?? 99));
  if (weekPosts.length === 0) { console.log(`No posts in ${week}.`); process.exit(0); }
  console.log(`${week} (${weekPosts.length} posts):\n`);
  for (const p of weekPosts) {
    const hook = oneLineHook(p, 55);
    console.log(`  ${String(p.slotIndex ?? "?").padStart(2)}. \x1b[32m${p.id}\x1b[0m`);
    console.log(`      ${p.type} | ${p.design} | ${p.status} | ${p.topic || "-"} | ${hook}`);
  }
  process.exit(0);
}

// ── Status mode: --status <status> ──────────────────────────────────────────

if (args[0] === "--status" || args[0] === "-s") {
  const status = args[1];
  if (!status) { console.error("Usage: node edit.mjs --status ready"); process.exit(1); }
  const hits = plan.posts.filter((p) => p.status === status);
  if (hits.length === 0) { console.log(`No ${status} posts.`); process.exit(0); }
  console.log(`${hits.length} posts with status=${status}:\n`);
  for (const p of hits) {
    const week = p.targetWeek ? ` ${p.targetWeek}` : "";
    const hook = oneLineHook(p, 55);
    console.log(`  \x1b[32m${p.id}\x1b[0m`);
    console.log(`    ${p.type} | ${p.design}${week} | ${p.topic || "-"} | ${hook}`);
  }
  process.exit(0);
}

// ── Find post (exact or substring match) ────────────────────────────────────

const query = args[0];
let post = plan.posts.find((p) => p.id === query);

if (!post) {
  const matches = plan.posts.filter((p) => p.id.includes(query));
  if (matches.length === 1) {
    post = matches[0];
  } else if (matches.length > 1) {
    console.log(`"${query}" matches ${matches.length} posts:`);
    matches.slice(0, 20).forEach((p) => {
      const week = p.targetWeek ? ` ${p.targetWeek}` : "";
      console.log(`  \x1b[32m${p.id}\x1b[0m  ${p.type} | ${p.design} | ${p.status}${week}`);
    });
    if (matches.length > 20) console.log(`  ... and ${matches.length - 20} more`);
    process.exit(1);
  } else {
    console.error(`No post matching "${query}". Try: node edit.mjs --find ${query}`);
    process.exit(1);
  }
}

// ── Parse field=value pairs ─────────────────────────────────────────────────

const assignments = args.slice(1).map((a) => {
  const eq = a.indexOf("=");
  if (eq === -1) { console.error(`Bad assignment: ${a} (expected field=value)`); process.exit(1); }
  return [a.slice(0, eq), a.slice(eq + 1)];
});

// ── Show mode (no assignments) ──────────────────────────────────────────────

if (assignments.length === 0) {
  showPost(post);
  process.exit(0);
}

// ── Set fields ──────────────────────────────────────────────────────────────

const changes = [];

for (const [path, rawVal] of assignments) {
  const val = parseValue(rawVal);
  const parts = path.split(".");
  let target = post;

  // Navigate to parent, creating intermediate objects as needed
  for (let i = 0; i < parts.length - 1; i++) {
    if (target[parts[i]] == null || typeof target[parts[i]] !== "object") {
      target[parts[i]] = {};
    }
    target = target[parts[i]];
  }

  const key = parts[parts.length - 1];
  const old = target[key];

  if (val === null) {
    delete target[key];
    changes.push(`  ${path}: ${fmt(old)} → (removed)`);
  } else {
    target[key] = val;
    changes.push(`  ${path}: ${fmt(old)} → ${fmt(val)}`);
  }
}

writeFileSync(PLAN, JSON.stringify(plan, null, 2) + "\n");

console.log(`\x1b[32m✓\x1b[0m ${post.id}`);
changes.forEach((c) => console.log(c));

// ── Helpers ─────────────────────────────────────────────────────────────────

function parseValue(s) {
  if (s === "null") return null;
  if (s === "true") return true;
  if (s === "false") return false;
  if (/^\d+$/.test(s)) return parseInt(s, 10);
  return s;
}

function fmt(v) {
  if (v === undefined) return "(unset)";
  if (v === null) return "null";
  const s = typeof v === "string" ? v : JSON.stringify(v);
  return s.length > 60 ? s.slice(0, 57) + "..." : s;
}

function oneLineHook(p, max) {
  const c = p.content || {};
  const raw = c.act1Setup || c.act1Reveal || c.act2 || c.act3 || p.notes || p.id;
  return String(raw).replace(/\s+/g, " ").trim().slice(0, max);
}

function showPost(p) {
  const c = p.content || {};
  const s = p.social || {};
  const dim = "\x1b[2m";
  const reset = "\x1b[0m";
  const green = "\x1b[32m";
  const yellow = "\x1b[33m";

  console.log(`${green}${p.id}${reset}`);
  console.log(`  type=${p.type}  design=${p.design}  status=${p.status}  topic=${p.topic || "-"}`);
  console.log(`  targetWeek=${p.targetWeek || "-"}  slot=${p.slotIndex ?? "-"}  format=${p.format || "both"}`);
  if (p.tag) console.log(`  tag=${p.tag}${p.tagComment ? "  tagComment=" + p.tagComment : ""}`);
  if (p.json) console.log(`  json=${p.json}`);
  if (p.terminalColor) console.log(`  terminalColor=${p.terminalColor}`);
  if (p.photoReveal) console.log(`  photoReveal=${p.photoReveal}`);
  if (p.accentColor) console.log(`  accentColor=${p.accentColor}`);

  // Content
  console.log(`${dim}── content ──${reset}`);
  for (const key of ["act1Setup", "act1Reveal", "act2", "act3", "aside", "asideStyle", "url", "image"]) {
    if (c[key]) console.log(`  ${yellow}${key}${reset}: ${c[key]}`);
  }

  // Notes
  if (p.notes) console.log(`${dim}── notes ──${reset}\n  ${p.notes}`);

  // Social
  if (Object.keys(s).length > 0) {
    console.log(`${dim}── social ──${reset}`);
    for (const [plat, fields] of Object.entries(s)) {
      for (const [k, v] of Object.entries(fields)) {
        console.log(`  ${yellow}${plat}.${k}${reset}: ${v}`);
      }
    }
  }

  // Platforms (published links)
  if (p.platforms && Object.keys(p.platforms).length > 0) {
    console.log(`${dim}── platforms ──${reset}`);
    for (const [k, v] of Object.entries(p.platforms)) {
      console.log(`  ${k}: ${v}`);
    }
  }
}
