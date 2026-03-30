#!/usr/bin/env node
// @herdom.bamberg — Pipeline Digest
// Reads plan.json, JSON posts, and idea files to produce a compact status summary.
// Usage:
//   node digest.mjs               -> counts + planned posts (text)
//   node digest.mjs --planned-only -> same as default
//   node digest.mjs --all         -> counts + all posts (text)
//   node digest.mjs --json        -> counts + planned posts (JSON)
//   node digest.mjs --json --all  -> counts + all posts (JSON)

import { readFileSync, readdirSync, statSync } from "fs";
import { join } from "path";

const ROOT = new URL(".", import.meta.url).pathname.replace(/\/$/, "");
const POSTS_DIR = join(ROOT, "wiai-social/posts");
const PLAN_PATH = join(ROOT, "pipeline/plan.json");
const IDEAS_DIR = join(ROOT, "pipeline/ideen");
const DRAFTS_DIR = join(ROOT, "pipeline/entwuerfe");

// ── Helpers ──────────────────────────────────────────────────────────────────

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

function oneLine(s = "", max = 120) {
  return String(s).replace(/\s+/g, " ").trim().slice(0, max);
}

function fmtPairs(obj, sortFn) {
  return Object.entries(obj)
    .sort(sortFn || ((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])))
    .map(([k, v]) => `${k}=${v}`)
    .join(" | ");
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

// Planned posts by week (same semantic as UI: any targetWeek, not published)
// Sort by targetWeek first, then slotIndex within each week
const planned = posts
  .filter((p) => p.targetWeek)
  .sort((a, b) =>
    a.targetWeek > b.targetWeek ? 1 : a.targetWeek < b.targetWeek ? -1 :
    (a.slotIndex ?? 99) - (b.slotIndex ?? 99)
  );

const plannedActive = planned.filter((p) => p.status !== "published");

const plannedByWeek = {};
for (const p of plannedActive) {
  if (!plannedByWeek[p.targetWeek]) plannedByWeek[p.targetWeek] = [];
  plannedByWeek[p.targetWeek].push(p);
}

// Published posts
const published = posts.filter((p) => p.status === "published");

// Variable Reward check: consecutive same types or designs in schedule
const vrWarnings = [];
for (let i = 1; i < plannedActive.length; i++) {
  const prev = plannedActive[i - 1];
  const curr = plannedActive[i];
  if (curr.type === prev.type) {
    vrWarnings.push(
      `${prev.id} → ${curr.id}: type=${curr.type} (${prev.targetWeek}#${prev.slotIndex ?? "?"}→${curr.targetWeek}#${curr.slotIndex ?? "?"})`
    );
  }
  if (curr.design === prev.design) {
    vrWarnings.push(
      `${prev.id} → ${curr.id}: design=${curr.design} (${prev.targetWeek}#${prev.slotIndex ?? "?"}→${curr.targetWeek}#${curr.slotIndex ?? "?"})`
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

const args = process.argv.slice(2);
const jsonOutput = args.includes("--json");
const allMode = args.includes("--all");
const plannedOnly = args.includes("--planned-only") || !allMode;
const scope = plannedOnly ? "planned" : "all";

function makeCompactPost(p) {
  const c = p.content || {};
  return {
    id: p.id,
    type: p.type,
    design: p.design,
    status: p.status,
    week: p.targetWeek || null,
    topic: p.topic || null,
    hook: oneLine(c.act1Setup || c.act1Reveal || c.act2 || c.act3 || p.notes || p.id, 140),
  };
}

if (jsonOutput) {
  const selectedPosts = plannedOnly ? plannedActive : posts;
  const out = JSON.stringify(
    {
      scope,
      counts: {
        posts: posts.length,
        prod_json: prodJsons.length,
        test_json: testJsons.length,
        planned: plannedActive.length,
        ready: statusCounts.ready || 0,
        draft: statusCounts.draft || 0,
        idea: statusCounts.idea || 0,
        published: statusCounts.published || 0,
      },
      statusCounts,
      typeCounts,
      designCounts,
      ideas: { stark: starkIdeen, geht: gehtIdeen, nein: neinIdeen },
      draftTags: { ok: okDrafts, ja: jaDrafts },
      vrWarnings,
      posts: selectedPosts.map(makeCompactPost),
    },
    null,
    2
  ) + "\n";
  await new Promise((resolve, reject) => {
    process.stdout.write(out, (err) => (err ? reject(err) : resolve()));
  });
  process.exit(0);
}

const now = new Date().toISOString().split("T")[0];
const currentWeek = "KW " + getWeekNumber(new Date());

console.log(`@herdom digest | date=${now} | week=${currentWeek} | plan_mtime=${planMtime}`);
console.log(
  `counts | posts=${posts.length} | prod_json=${prodJsons.length} | test_json=${testJsons.length} | eingeplant=${plannedActive.length} | ready=${statusCounts.ready || 0} | draft=${statusCounts.draft || 0} | idea=${statusCounts.idea || 0} | published=${statusCounts.published || 0}`
);
console.log(`hint | default=--planned-only | use --all for all posts | use --json for JSON | use --json --all for all posts as JSON`);
console.log(`types | ${fmtPairs(typeCounts)}`);
console.log(`designs | ${fmtPairs(designCounts)}`);
console.log(`ideas | stark=${starkIdeen} | geht=${gehtIdeen} | nein=${neinIdeen}`);
console.log(`draft_tags | ok=${okDrafts} | ja=${jaDrafts}`);

if (plannedOnly) {
  if (Object.keys(plannedByWeek).length === 0) {
    console.log("planned | none");
  } else {
    console.log("planned |");
    for (const week of Object.keys(plannedByWeek).sort()) {
      const weekPosts = plannedByWeek[week];
      const byStatus = {};
      for (const p of weekPosts) byStatus[p.status] = (byStatus[p.status] || 0) + 1;
      console.log(`  ${week} | n=${weekPosts.length} | ${fmtPairs(byStatus)}`);
      for (const p of weekPosts) {
        const c = p.content || {};
        const hook = oneLine(c.act1Setup || c.act1Reveal || c.act2 || c.act3 || p.notes || p.id, 90);
        console.log(`    - ${p.id} | ${p.type} | ${p.design} | ${p.status} | ${p.topic || "-"} | ${hook}`);
      }
    }
  }
} else {
  console.log("posts |");
  for (const p of posts) {
    const c = p.content || {};
    const hook = oneLine(c.act1Setup || c.act1Reveal || c.act2 || c.act3 || p.notes || p.id, 90);
    console.log(`  - ${p.id} | ${p.type} | ${p.design} | ${p.status} | ${p.targetWeek || "-"} | ${p.topic || "-"} | ${hook}`);
  }
}

if (vrWarnings.length > 0) {
  console.log("vr_warnings |");
  vrWarnings.forEach((w) => console.log(`  - ${w}`));
}

if (published.length > 0) {
  console.log("published_recent |");
  published
    .sort((a, b) => (a.publishedDate > b.publishedDate ? -1 : 1))
    .slice(0, 5)
    .forEach((p) => {
      const plats = Object.keys(p.platforms || {}).join(",") || "-";
      console.log(`  - ${p.publishedDate} | ${p.id} | ${plats}`);
    });
}
