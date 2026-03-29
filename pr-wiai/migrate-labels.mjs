#!/usr/bin/env node
// Semi-automatic labeling migration for plan.json
// Step 1: Set `design` for all posts (deterministic from current type)
// Step 2: Reclassify billboard/terminal type posts + assign topics
// Step 3: Write review file, then apply on confirmation

import { readFileSync, writeFileSync } from "fs";

const PLAN_PATH = "pipeline/plan.json";
const plan = JSON.parse(readFileSync(PLAN_PATH, "utf8"));

// ── Step 1: Deterministic design mapping ────────────────────────────────────

const TYPE_TO_DESIGN = {
  contrarian:   "pixel-wall",
  parodie:      "pixel-wall",
  overselling:  "pixel-wall",
  "wusstest-du":"pixel-wall",
  witz:         "pixel-wall",
  "fake-stat":  "pixel-wall",
  billboard:    "billboard",
  "merkste-selber": "billboard",
  aphorismus:   "billboard",
  terminal:     "terminal",
  nachtgedanke: "terminal",
  nahkastchen:  "terminal",
  selbstironie: "terminal",
  newsjacking:  "newsjacking",
  stitch:       "pixel-wall",
};

let designSet = 0;
for (const post of plan.posts) {
  if (!post.design || post.design === null) {
    const mapped = TYPE_TO_DESIGN[post.type];
    if (mapped) {
      post.design = mapped;
      designSet++;
    }
  }
}
console.log(`Design set for ${designSet} posts (previously null)`);

// ── Step 2: Topic inference from content ────────────────────────────────────

const TOPIC_KEYWORDS = {
  "wiai-ad": [
    "wiai", "bamberg", "kein nc", "studien", "bachelor", "master", "fakultät",
    "uni bamberg", "informatik in bamberg", "brauereien", "bambirds",
  ],
  datenschutz: [
    "datenschutz", "privacy", "passwort", "phishing", "gehackt", "tracking",
    "social engineering", "verschlüssel", "sicherheit", "backdoor", "hacker",
    "daten", "verbergen", "überwach", "kamera", "mikrofon", "standort",
  ],
  "social-media": [
    "instagram", "tiktok", "algorithmus", "follower", "likes", "social media",
    "feed", "scroll", "sucht", "screen time", "influencer", "creator",
  ],
  tech: [
    "binary search", "algorithmus", "programmier", "code", "software", "hardware",
    "ki ", "künstliche intelligenz", "chatgpt", "llm", "machine learning",
    "akinator", "entscheidungsbaum", "logik", "computer", "server",
    "datenbank", "netzwerk", "api", "open source",
  ],
  studium: [
    "klausur", "prüfung", "semester", "vorlesung", "bulimie-lern", "prokrastin",
    "lerngruppe", "bibliothek", "erstsemester", "studiengang", "note", "creditpoints",
    "hörsaal", "dozent", "tutor",
  ],
  karriere: [
    "gehalt", "verdien", "job", "stelle", "beruf", "karriere", "arbeitgeber",
    "bewerbung", "ausbildung", "fachkräftemangel", "it-stellen", "einstieg",
  ],
  alltag: [
    "pdf", "formular", "drucken", "scannen", "cookie", "captcha", "beamer",
    "wlan", "wifi", "office", "word", "excel", "powerpoint", "drucker",
    "passwort-reg", "update", "neustart",
  ],
  uni: [
    "dekan", "gremium", "akkreditier", "prüfungsordnung", "verwaltung",
    "bürokratie", "antrag", "formular", "hochschul",
  ],
  ertappt: [
    "merkste selber", "ertappt", "denkfehler", "bias", "survivorship",
    "dunning", "kruger", "sunk cost", "statistik",
  ],
  meta: [
    "kanal", "dieser account", "content", "follower-zahl", "reichweite",
  ],
};

function inferTopic(post) {
  const text = [
    post.slides?.bigText, post.slides?.smallText, post.slides?.s2,
    post.slides?.s3, post.slides?.button, post.slides?.uebrigens,
    post.notes, post.id,
  ].filter(Boolean).join(" ").toLowerCase();

  let bestTopic = null;
  let bestScore = 0;

  for (const [topic, keywords] of Object.entries(TOPIC_KEYWORDS)) {
    let score = 0;
    for (const kw of keywords) {
      if (text.includes(kw)) score++;
    }
    if (score > bestScore) {
      bestScore = score;
      bestTopic = topic;
    }
  }

  return bestScore >= 1 ? bestTopic : null;
}

// ── Step 3: Reclassify billboard/terminal type posts ────────────────────────

// Heuristic: look at content to guess the actual content approach
function inferTypeForBillboard(post) {
  const text = [
    post.slides?.bigText, post.slides?.smallText, post.slides?.s2,
    post.slides?.s3, post.slides?.button,
  ].filter(Boolean).join(" ").toLowerCase();

  if (text.includes("merkste selber") || text.includes("oder?")) return "merkste-selber";
  if (text.length < 80) return "aphorismus"; // very short = aphorism
  // Check if it has the "Merkste selber" pattern: statement → counter → "oder?"
  const slideCount = [post.slides?.bigText, post.slides?.s2, post.slides?.s3].filter(Boolean).length;
  if (slideCount >= 3) return "merkste-selber";
  return "aphorismus";
}

function inferTypeForTerminal(post) {
  const text = [
    post.slides?.bigText, post.slides?.smallText, post.slides?.s2,
    post.slides?.s3,
  ].filter(Boolean).join(" ").toLowerCase();

  if (text.includes("23") || text.includes("nacht") || text.includes("uhr") || text.includes("nachts")) return "nachtgedanke";
  if (text.includes("ich") && (text.includes("habe") || text.includes("frage"))) return "nahkastchen";
  return "nahkastchen"; // default for terminal posts
}

let typeChanged = 0;
let topicSet = 0;

for (const post of plan.posts) {
  // Reclassify billboard/terminal types
  if (post.type === "billboard") {
    post.type = inferTypeForBillboard(post);
    typeChanged++;
  } else if (post.type === "terminal") {
    post.type = inferTypeForTerminal(post);
    typeChanged++;
  }

  // Infer topic
  if (!post.topic) {
    post.topic = inferTopic(post);
    if (post.topic) topicSet++;
  }
}

console.log(`Type reclassified for ${typeChanged} posts (billboard/terminal → content type)`);
console.log(`Topic inferred for ${topicSet} posts`);

// ── Write review file ───────────────────────────────────────────────────────

const lines = ["# Label Review", "", "| ID | type | design | topic | S1 (bigText) |", "|---|---|---|---|---|"];

for (const post of plan.posts) {
  const bigText = (post.slides?.bigText || post.slides?.smallText || post.notes || "").substring(0, 50).replace(/\n/g, " ");
  lines.push(`| ${post.id} | ${post.type} | ${post.design || "?"} | ${post.topic || "?"} | ${bigText} |`);
}

const noTopic = plan.posts.filter(p => !p.topic).length;
const noDesign = plan.posts.filter(p => !p.design).length;
lines.push("", `## Summary`, `- ${noTopic} posts ohne topic`, `- ${noDesign} posts ohne design`);

writeFileSync("pipeline/label-review.md", lines.join("\n") + "\n");
console.log(`\nReview file written to pipeline/label-review.md`);
console.log(`Posts without topic: ${noTopic}`);
console.log(`Posts without design: ${noDesign}`);

// ── Apply to plan.json ──────────────────────────────────────────────────────

if (process.argv.includes("--apply")) {
  writeFileSync(PLAN_PATH, JSON.stringify(plan, null, 2) + "\n");
  console.log("\n✓ Changes applied to plan.json");
} else {
  console.log("\nDry run — use --apply to write changes to plan.json");
}
