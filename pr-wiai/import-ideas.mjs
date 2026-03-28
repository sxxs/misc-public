#!/usr/bin/env node
// Clean import: rebuild plan.json from scratch.
// Reads: wiai-social/posts/*.json, pipeline/entwuerfe/*.md, pipeline/ideen/*.md
// Usage: node import-ideas.mjs [--dry-run]

import { readFileSync, writeFileSync, readdirSync } from "fs";
import { join, basename } from "path";

const ROOT = new URL(".", import.meta.url).pathname.replace(/\/$/, "");
const POSTS_DIR = join(ROOT, "wiai-social/posts");
const IDEAS_DIR = join(ROOT, "pipeline/ideen");
const DRAFTS_DIR = join(ROOT, "pipeline/entwuerfe");
const PLAN = join(ROOT, "pipeline/plan.json");

const dryRun = process.argv.includes("--dry-run");
const posts = [];
const seenIds = new Set();

// Track slide texts from Remotion JSONs for dedup
const remotionTexts = new Set();

// ── 1. Import Remotion JSON posts ────────────────────────────────────────────

function importRemotionPosts() {
  const files = readdirSync(POSTS_DIR).filter((f) => f.endsWith(".json") && !f.startsWith("test-"));
  for (const file of files) {
    const data = JSON.parse(readFileSync(join(POSTS_DIR, file), "utf8"));
    const id = data.id || file.replace(".json", "");
    if (seenIds.has(id)) continue;
    seenIds.add(id);

    // Track text for dedup
    const s2text = (data.slide2?.text || "").trim();
    if (s2text) remotionTexts.add(normalize(s2text));

    posts.push({
      id,
      type: data.type || "contrarian",
      design: guessDesign(data.type),
      status: "ready",
      json: "wiai-social/posts/" + file,
      source: null,
      targetWeek: null,
      publishedDate: null,
      platforms: {},
      notes: "",
      tag: null,
      slides: {
        bigText: data.slide1?.bigText || "",
        smallText: data.slide1?.smallText || "",
        s2: data.slide2?.text || "",
        s3: data.slide3?.text || "",
        button: data.slide3?.button || undefined,
        uebrigens: data.slide3?.übrigensText || undefined,
      },
    });
  }
  console.log("Remotion JSONs: " + files.length + " posts");
}

// ── 2. Import drafts from pipeline/entwuerfe/*.md ────────────────────────────

function importDrafts() {
  const files = readdirSync(DRAFTS_DIR).filter((f) => f.endsWith(".md") && f !== "README.md");
  let imported = 0;
  let dupes = 0;

  for (const file of files) {
    const text = readFileSync(join(DRAFTS_DIR, file), "utf8");
    const source = "pipeline/entwuerfe/" + file;
    const formatSlug = basename(file, ".md");

    // Match all variant headers: ### Post NN — Variante X [#tag] or [#tag] [#tag2]
    const headerRe = /^### (Post (\d+) — Variante (\S+?))\s+(\[#\w+\](?:\s*\[#\w+\])*)/gm;
    let match;

    while ((match = headerRe.exec(text)) !== null) {
      const variantName = match[1];
      const postNum = match[2];
      const variant = match[3];
      const tagStr = match[4];

      // Parse tags: [#ok] [#ton-check] → extract the main tag
      const tags = [...tagStr.matchAll(/\[#(\w+(?:-\w+)*)\]/g)].map((m) => m[1]);
      // Skip ton-check only variants
      if (tags.length === 1 && tags[0] === "ton-check") continue;

      const mainTag = tags.find((t) => ["ok", "ja", "ad", "rewrite"].includes(t)) || tags[0];

      // Extract the block after this header until next --- or ### or EOF
      const startIdx = match.index + match[0].length;
      const nextBreak = text.substring(startIdx).search(/\n---|\n### /);
      const block = nextBreak > 0 ? text.substring(startIdx, startIdx + nextBreak) : text.substring(startIdx, startIdx + 1000);

      const s1 = extractQuotedField(block, "S1");
      const s2 = extractQuotedField(block, "S2");
      const s3 = extractQuotedField(block, "S3");
      const button = extractQuotedField(block, "Button");
      const uebrigens = extractQuotedField(block, "Übrigens") || extractQuotedField(block, "Uebrigens");

      // Dedup: check if s2 text matches a Remotion post
      if (s2 && remotionTexts.has(normalize(s2))) { dupes++; continue; }

      const id = "draft-" + formatSlug + "-p" + postNum + variant.toLowerCase();
      if (seenIds.has(id)) continue;
      seenIds.add(id);

      posts.push({
        id,
        type: guessTypeFromFile(formatSlug),
        design: null,
        status: "draft",
        json: null,
        source: source + "#" + variantName.replace(/\s+/g, "-"),
        targetWeek: null,
        publishedDate: null,
        platforms: {},
        notes: "",
        tag: mainTag,
        slides: {
          bigText: s1 || "",
          smallText: "",
          s2: s2 || "",
          s3: s3 || "",
          ...(button ? { button } : {}),
          ...(uebrigens ? { uebrigens } : {}),
        },
      });
      imported++;
    }
  }
  console.log("Drafts: " + imported + " imported, " + dupes + " duplicates skipped");
}

// ── 3. Import ideas from pipeline/ideen/*.md ─────────────────────────────────

function importIdeas() {
  const files = readdirSync(IDEAS_DIR).filter((f) => f.endsWith(".md"));
  let imported = 0;

  for (const file of files) {
    const text = readFileSync(join(IDEAS_DIR, file), "utf8");
    const source = "pipeline/ideen/" + file;
    const slug = basename(file, ".md");

    // For neue-postideen.md: has S1/S2/S3 structure
    if (file.includes("neue-postideen")) {
      imported += importStructuredIdeas(text, source, slug);
      continue;
    }

    // For stoffsammlungen: #tag followed by bullet text
    const lines = text.split("\n");
    let currentSection = "";
    let i = 0;

    while (i < lines.length) {
      if (lines[i].startsWith("## ")) {
        currentSection = lines[i].replace(/^#+\s*/, "").trim();
      }

      const tagMatch = lines[i].trim().match(/^#(stark|geht)\b(.*)/);
      if (tagMatch) {
        const tag = tagMatch[1];
        const tagComment = tagMatch[2].replace(/^\s*-?\s*/, "").trim();

        // Collect full text (may span multiple lines)
        let ideaText = "";
        let j = i + 1;
        while (j < lines.length) {
          const line = lines[j].trim();
          if (line === "" || line.startsWith("#")) break;
          const cleaned = line.replace(/^-\s*/, "");
          ideaText += (ideaText ? " " : "") + cleaned;
          j++;
        }

        if (ideaText) {
          // Dedup against Remotion posts
          if (!remotionTexts.has(normalize(ideaText))) {
            const words = ideaText.substring(0, 40).replace(/[^a-zA-Z0-9\s]/g, "").trim()
              .split(/\s+/).slice(0, 5).join("-").toLowerCase()
              .replace(/[äöüß]/g, (c) => ({ "ä": "ae", "ö": "oe", "ü": "ue", "ß": "ss" }[c]));
            const id = "idea-" + slug.replace("stoffsammlung-", "") + "-" + words;

            if (!seenIds.has(id)) {
              seenIds.add(id);
              posts.push({
                id,
                type: guessType(ideaText, currentSection),
                design: null,
                status: "idea",
                json: null,
                source,
                targetWeek: null,
                publishedDate: null,
                platforms: {},
                notes: "",
                tag,
                tagComment: tagComment || null,
                slides: {
                  bigText: ideaText,
                  smallText: "",
                  s2: "",
                  s3: "",
                },
              });
              imported++;
            }
          }
        }
        i = j;
      } else {
        i++;
      }
    }
  }
  console.log("Ideas: " + imported + " imported");
}

function importStructuredIdeas(text, source, slug) {
  let imported = 0;
  // Split by ### headers, but also stop at ## headers (section boundaries)
  const sections = text.split(/\n(?=###? )/).filter((s) => s.startsWith("### "));
  for (const section of sections) {
    const headerMatch = section.match(/^### .*?: (.+)/);
    if (!headerMatch) continue;
    const title = headerMatch[1].trim();

    const s1 = extractField(section, "S1");
    const s2 = extractField(section, "S2");
    const s3 = extractField(section, "S3");

    // If no S1/S2, treat as single-text idea (stop at section boundaries)
    const bodyLines = section.split("\n").slice(1);
    const bodyEnd = bodyLines.findIndex((l) => l.startsWith("## "));
    const body = (bodyEnd >= 0 ? bodyLines.slice(0, bodyEnd) : bodyLines).join(" ").replace(/\*[^*]+\*/g, "").trim();
    const mainText = s1 || s2 || body.substring(0, 500);

    if (!mainText || remotionTexts.has(normalize(mainText))) continue;

    const words = title.substring(0, 30).replace(/[^a-zA-Z0-9\s]/g, "").trim()
      .split(/\s+/).slice(0, 4).join("-").toLowerCase()
      .replace(/[äöüß]/g, (c) => ({ "ä": "ae", "ö": "oe", "ü": "ue", "ß": "ss" }[c]));
    const id = "idea-neue-" + words;

    if (seenIds.has(id)) continue;
    seenIds.add(id);

    posts.push({
      id,
      type: guessType(mainText, title),
      design: null,
      status: "idea",
      json: null,
      source,
      targetWeek: null,
      publishedDate: null,
      platforms: {},
      notes: "",
      tag: "stark",
      slides: {
        bigText: s1 || mainText,
        smallText: "",
        s2: s2 || "",
        s3: s3 || "",
      },
    });
    imported++;
  }
  return imported;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function extractQuotedField(block, key) {
  // Match: > **S1:** "text" or > **S1:** text or **Button:** *(gedimmt)* text
  const re = new RegExp("\\*\\*" + key + ":\\*\\*\\s*(?:\\*\\([^)]*\\)\\*\\s*)?\"?([^\"\\n]*?)\"?\\s*$", "m");
  const m = block.match(re);
  if (!m) return "";
  return m[1].trim();
}

function extractField(block, key) {
  const re = new RegExp("^" + key + ":\\s*(?:\"|\\u201C)?(.+?)(?:\"|\\u201D)?\\s*$", "m");
  const m = block.match(re);
  return m ? m[1].trim() : "";
}

function normalize(text) {
  return text.toLowerCase().replace(/\s+/g, " ").replace(/[^\w\säöüß]/g, "").trim().substring(0, 100);
}

function guessDesign(type) {
  const map = {
    contrarian: "pixel-wall", newsjacking: "pixel-wall", "wusstest-du": "pixel-wall",
    selbstironie: "pixel-wall", witz: "pixel-wall",
    terminal: "terminal", nachtgedanke: "terminal",
    billboard: "billboard",
  };
  return map[type] || "pixel-wall";
}

function guessType(text, section) {
  const lower = (text + " " + section).toLowerCase();
  if (lower.includes("clickbait") || lower.includes("parodie") || lower.includes("hack") && lower.includes("klausur")) return "parodie";
  if (lower.includes("overselling") || lower.includes("airbnb") || lower.includes("uni-webseite")) return "overselling";
  if (lower.includes("nachtgedanke") || /\d{2}:\d{2}/.test(lower)) return "nachtgedanke";
  if (lower.includes("ich habe fragen")) return "terminal";
  if (lower.includes("merkste selber")) return "contrarian";
  if (lower.includes("sicherheit") || lower.includes("passwort") || lower.includes("hack")) return "terminal";
  return "billboard";
}

function guessTypeFromFile(slug) {
  const map = {
    "merkste-selber": "contrarian", "ertappt": "contrarian", "contrarian": "contrarian",
    "newsjacking": "newsjacking", "meta": "selbstironie", "mythen": "contrarian",
    "korrelationen": "contrarian", "project-stories": "contrarian",
    "behind-the-scenes": "selbstironie", "gaming": "contrarian",
    "social-engineering": "terminal", "gehalt-karriere": "contrarian",
    "saisonal": "contrarian", "informatik-plus-x": "contrarian",
    "unpopular-opinion": "contrarian", "informatik-angst": "nachtgedanke",
    "informatik-tricks": "contrarian", "person-stories": "nachtgedanke",
    "thought-experiments": "billboard", "selbstzerstoerung": "terminal",
    "wusstest-du-schon": "wusstest-du",
  };
  return map[slug] || "contrarian";
}

// ── Run ──────────────────────────────────────────────────────────────────────

importRemotionPosts();
importDrafts();
importIdeas();

const byStatus = {};
const byType = {};
const byTag = {};
posts.forEach((p) => {
  byStatus[p.status] = (byStatus[p.status] || 0) + 1;
  byType[p.type] = (byType[p.type] || 0) + 1;
  if (p.tag) byTag[p.tag] = (byTag[p.tag] || 0) + 1;
});

console.log("\n=== RESULT ===");
console.log("Total: " + posts.length);
console.log("Status:", JSON.stringify(byStatus));
console.log("Types:", JSON.stringify(byType));
console.log("Tags:", JSON.stringify(byTag));

if (dryRun) {
  console.log("\n--dry-run: not saved.");
  console.log("\nSample (last 10):");
  posts.slice(-10).forEach((p) =>
    console.log("  " + p.status.padEnd(6) + (p.tag || "").padEnd(8) + p.type.padEnd(14) + (p.slides?.bigText || "").substring(0, 50))
  );
} else {
  writeFileSync(PLAN, JSON.stringify({ posts }, null, 2) + "\n");
  console.log("\nplan.json written: " + posts.length + " posts");
}
