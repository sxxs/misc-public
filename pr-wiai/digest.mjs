#!/usr/bin/env node
// @herdom.bamberg — Pipeline Digest
// Reads plan.json, JSON posts, and idea files to produce a status summary.
// Usage: node digest.mjs [--json]

import { readFileSync, readdirSync, statSync } from "fs";
import { join } from "path";

const ROOT = new URL(".", import.meta.url).pathname.replace(/\/$/, "");
const POSTS_DIR = join(ROOT, "wiai-social/posts");
const PLAN_PATH = join(ROOT, "pipeline/plan.json");
const IDEAS_DIR = join(ROOT, "pipeline/ideen");
const DRAFTS_DIR = join(ROOT, "pipeline/entwuerfe");

// ── Helpers ──────────────────────────────────────────────────────────────────

function bar(count, max, width = 30) {
  const filled = Math.round((count / max) * width);
  return "\u2588".repeat(filled) + " ".repeat(width - filled);
}

function countAllTags(dir, tags) {
  const counts = Object.fromEntries(tags.map((t) => [t, 0]));
  const regexes = tags.map((t) => [t, new RegExp(`^${t}`, "gm")]);
  try {
    for (const f of readdirSync(dir).filter((f) => f.endsWith(".md"))) {
      const text = readFileSync(join(dir, f), "utf8");
      for (const [tag, re] of regexes) {
        re.lastIndex = 0;
        const matches = text.match(re);
        if (matches) counts[tag] += matches.length;
      }
    }
  } catch (e) {
    if (e.code !== "ENOENT") throw e;
  }
  return counts;
}

function getWeekNumber(d) {
  const date = new Date(d);
  const jan1 = new Date(date.getFullYear(), 0, 1);
  const days = Math.floor((date - jan1) / 86400000);
  return Math.ceil((days + jan1.getDay() + 1) / 7);
}

// ── Read data ────────────────────────────────────────────────────────────────

const plan = JSON.parse(readFileSync(PLAN_PATH, "utf8"));
const posts = plan.posts;

// Count JSON files (production vs test)
const allJsonFiles = readdirSync(POSTS_DIR).filter((f) => f.endsWith(".json"));
const prodJsons = allJsonFiles.filter((f) => !f.startsWith("test-"));
const testJsons = allJsonFiles.filter((f) => f.startsWith("test-"));

// Status counts
const statusCounts = {};
posts.forEach((p) => {
  statusCounts[p.status] = (statusCounts[p.status] || 0) + 1;
});

// Type counts
const typeCounts = {};
posts.forEach((p) => {
  typeCounts[p.type] = (typeCounts[p.type] || 0) + 1;
});

// Design counts
const designCounts = {};
posts.forEach((p) => {
  designCounts[p.design] = (designCounts[p.design] || 0) + 1;
});

// Scheduled posts by week
const scheduled = posts
  .filter((p) => p.targetWeek)
  .sort((a, b) => (a.targetWeek > b.targetWeek ? 1 : -1));

// Published posts
const published = posts.filter((p) => p.status === "published");

// Variable Reward check: consecutive same types in schedule
const vrWarnings = [];
for (let i = 1; i < scheduled.length; i++) {
  if (scheduled[i].type === scheduled[i - 1].type) {
    vrWarnings.push(
      `${scheduled[i - 1].id} und ${scheduled[i].id} sind beide ${scheduled[i].type}`
    );
  }
}

// Ideas backlog (single pass over all files)
const ideenTags = countAllTags(IDEAS_DIR, ["#stark", "#geht", "#nein"]);
const starkIdeen = ideenTags["#stark"];
const gehtIdeen = ideenTags["#geht"];
const neinIdeen = ideenTags["#nein"];

// Drafts stats (single pass, with ENOENT guard)
const draftTags = countAllTags(DRAFTS_DIR, ["\\[#ok\\]", "\\[#ja\\]"]);
const okDrafts = draftTags["\\[#ok\\]"];
const jaDrafts = draftTags["\\[#ja\\]"];

// plan.json last modified
let planMtime = "unbekannt";
try {
  planMtime = statSync(PLAN_PATH).mtime.toISOString().split("T")[0];
} catch {}

// ── Output ───────────────────────────────────────────────────────────────────

const jsonOutput = process.argv.includes("--json");

if (jsonOutput) {
  console.log(
    JSON.stringify(
      { posts, statusCounts, typeCounts, designCounts, scheduled, published, starkIdeen, gehtIdeen, vrWarnings },
      null,
      2
    )
  );
  process.exit(0);
}

const now = new Date().toISOString().split("T")[0];
const currentWeek = "KW " + getWeekNumber(new Date());
const maxType = Math.max(...Object.values(typeCounts));

console.log(`\n=== @herdom.bamberg — Stand ${now} ===\n`);

console.log(`POSTS: ${prodJsons.length} production JSONs, ${testJsons.length} test JSONs`);
console.log(
  `STATUS: ${statusCounts.scheduled || 0} eingeplant, ${statusCounts.published || 0} veroeffentlicht, ${statusCounts.ready || 0} ready (JSON, kein Datum)`
);

console.log(`\nFORMAT-VERTEILUNG (${posts.length} Posts im Plan):`);
Object.entries(typeCounts)
  .sort((a, b) => b[1] - a[1])
  .forEach(([type, count]) => {
    const pct = Math.round((count / posts.length) * 100);
    console.log(`  ${type.padEnd(22)} ${bar(count, maxType)}  ${String(count).padStart(2)}  (${String(pct).padStart(2)}%)`);
  });

console.log(`\nDESIGN-VERTEILUNG:`);
Object.entries(designCounts)
  .sort((a, b) => b[1] - a[1])
  .forEach(([design, count]) => {
    console.log(`  ${design.padEnd(22)} ${count}`);
  });

if (typeCounts.contrarian && typeCounts.contrarian / posts.length > 0.6) {
  console.log(`\n\u26A0  WARNUNG: Starker Contrarian-Skew (${Math.round((typeCounts.contrarian / posts.length) * 100)}%). Billboard + Terminal fuer Launch-Mix fehlen.`);
}

console.log(`\nIDEEN-BACKLOG:`);
console.log(`  #stark: ${starkIdeen}`);
console.log(`  #geht:  ${gehtIdeen}`);
console.log(`  #nein:  ${neinIdeen}`);

if (scheduled.length > 0) {
  console.log(`\nEINGEPLANT (naechste 5):`);
  scheduled.slice(0, 5).forEach((p) => {
    console.log(`  ${p.targetWeek}  ${p.id.padEnd(30)} ${p.type} (${p.design})`);
  });
} else {
  console.log(`\nEINGEPLANT: (leer — kein Post hat ein Zieldatum)`);
}

if (vrWarnings.length > 0) {
  console.log(`\n\u26A0  VARIABLE REWARD WARNUNG:`);
  vrWarnings.forEach((w) => console.log(`  ${w}`));
}

if (published.length > 0) {
  console.log(`\nLETZTE VEROEFFENTLICHUNGEN:`);
  published
    .sort((a, b) => (a.publishedDate > b.publishedDate ? -1 : 1))
    .slice(0, 5)
    .forEach((p) => {
      console.log(`  ${p.publishedDate}  ${p.id}  ${Object.keys(p.platforms).join(", ")}`);
    });
}

console.log(`\nplan.json zuletzt geaendert: ${planMtime}`);
console.log(`Aktuelle Woche: ${currentWeek}\n`);
