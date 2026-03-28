#!/usr/bin/env node
// Import #stark/#geht ideas and #ok/#ja drafts into plan.json
// Usage: node import-ideas.mjs [--dry-run]

import { readFileSync, writeFileSync, readdirSync } from "fs";
import { join, basename } from "path";

const ROOT = new URL(".", import.meta.url).pathname.replace(/\/$/, "");
const PLAN = join(ROOT, "pipeline/plan.json");
const IDEAS_DIR = join(ROOT, "pipeline/ideen");
const DRAFTS_DIR = join(ROOT, "pipeline/entwuerfe");

const dryRun = process.argv.includes("--dry-run");
const plan = JSON.parse(readFileSync(PLAN, "utf8"));
const existingIds = new Set(plan.posts.map((p) => p.id));
let added = 0;

// ── Import #stark/#geht ideas from Stoffsammlungen ───────────────────────────

function importIdeas() {
  const files = readdirSync(IDEAS_DIR).filter((f) => f.endsWith(".md"));

  for (const file of files) {
    const text = readFileSync(join(IDEAS_DIR, file), "utf8");
    const lines = text.split("\n");
    const source = "pipeline/ideen/" + file;
    const slug = basename(file, ".md");

    let currentSection = "";
    let i = 0;

    while (i < lines.length) {
      if (lines[i].startsWith("## ")) {
        currentSection = lines[i].replace(/^#+\s*/, "").replace(/[^a-zA-Z0-9äöüß\s-]/g, "").trim();
      }

      // Match #stark or #geht (with optional comment after dash/space)
      const tagMatch = lines[i].trim().match(/^#(stark|geht)\b(.*)/);
      if (tagMatch) {
        const tag = tagMatch[1];
        const tagComment = tagMatch[2].replace(/^\s*-?\s*/, "").trim();

        // Collect the idea text from following lines
        let ideaText = "";
        let j = i + 1;
        while (j < lines.length && lines[j].trim() !== "" && !lines[j].trim().startsWith("#")) {
          const line = lines[j].replace(/^-\s*/, "").trim();
          if (line) ideaText += (ideaText ? " " : "") + line;
          j++;
        }

        if (ideaText) {
          const words = ideaText.replace(/[^a-zA-Z0-9äöüß\s]/g, "").split(/\s+/).slice(0, 5).join("-").toLowerCase()
            .replace(/[äöüß]/g, (c) => ({ "ä": "ae", "ö": "oe", "ü": "ue", "ß": "ss" }[c]));
          const id = "idea-" + slug.replace("stoffsammlung-", "") + "-" + words;

          if (!existingIds.has(id)) {
            plan.posts.push({
              id,
              type: guessType(ideaText, currentSection),
              design: null,
              status: "idea",
              json: null,
              source,
              targetWeek: null,
              publishedDate: null,
              platforms: {},
              notes: ideaText.substring(0, 200),
              tag,
              tagComment: tagComment || null,
            });
            existingIds.add(id);
            added++;
          }
        }
        i = j;
      } else {
        i++;
      }
    }
  }
}

// ── Import #ok/#ja drafts from Entwuerfe ─────────────────────────────────────

function importDrafts() {
  const files = readdirSync(DRAFTS_DIR).filter((f) => f.endsWith(".md") && f !== "README.md");

  for (const file of files) {
    const text = readFileSync(join(DRAFTS_DIR, file), "utf8");
    const source = "pipeline/entwuerfe/" + file;
    const formatSlug = basename(file, ".md");

    const postRegex = /^### (Post \d+ — Variante \S+) \[#(ok|ja|ad|rewrite)\]/gm;
    let match;

    while ((match = postRegex.exec(text)) !== null) {
      const variantName = match[1];
      const tag = match[2];
      const startIdx = match.index;

      const blockEnd = text.indexOf("\n---", startIdx + 1);
      const block = blockEnd > 0 ? text.substring(startIdx, blockEnd) : text.substring(startIdx, startIdx + 500);

      const s1 = extractSlide(block, "S1");
      const s2 = extractSlide(block, "S2");
      const s3 = extractSlide(block, "S3");

      const postNum = variantName.match(/Post (\d+)/)?.[1] || "0";
      const variant = variantName.match(/Variante (\S+)/)?.[1] || "A";
      const id = "draft-" + formatSlug + "-p" + postNum + variant.toLowerCase();

      if (!existingIds.has(id)) {
        plan.posts.push({
          id,
          type: guessTypeFromFile(formatSlug),
          design: null,
          status: "draft",
          json: null,
          source: source + "#" + variantName.replace(/\s+/g, "-"),
          targetWeek: null,
          publishedDate: null,
          platforms: {},
          notes: [s1, s2, s3].filter(Boolean).join(" | ").substring(0, 200),
          tag,
        });
        existingIds.add(id);
        added++;
      }
    }
  }
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function extractSlide(block, slideKey) {
  const re = new RegExp("\\*\\*" + slideKey + ":\\*\\*\\s*\"?([^\"\\n]*)\"?", "m");
  const m = block.match(re);
  return m ? m[1].trim().replace(/^"|"$/g, "") : "";
}

function guessType(text, section) {
  const lower = (text + " " + section).toLowerCase();
  if (lower.includes("clickbait") || lower.includes("parodie")) return "parodie";
  if (lower.includes("overselling") || lower.includes("airbnb")) return "overselling";
  if (lower.includes("nachtgedanke") || lower.includes("23:") || lower.includes("02:")) return "nachtgedanke";
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

const before = plan.posts.length;
importIdeas();
importDrafts();

const ideas = plan.posts.filter((p) => p.status === "idea");
const drafts = plan.posts.filter((p) => p.status === "draft");
const starkIdeas = ideas.filter((p) => p.tag === "stark");
const gehtIdeas = ideas.filter((p) => p.tag === "geht");

console.log("\nImported " + added + " new entries (" + before + " -> " + plan.posts.length + ")");
console.log("  Ideas:  " + ideas.length + " (" + starkIdeas.length + " #stark, " + gehtIdeas.length + " #geht)");
console.log("  Drafts: " + drafts.length);
console.log("  Ready:  " + plan.posts.filter((p) => p.status === "ready").length);

if (dryRun) {
  console.log("\n--dry-run: nicht gespeichert.");
  const newPosts = plan.posts.slice(before);
  console.log("\nLetzte 15 importierte:");
  newPosts.slice(-15).forEach((p) =>
    console.log("  " + (p.tag || "").padEnd(6) + " " + p.status.padEnd(6) + " " + p.type.padEnd(12) + " " + (p.notes || "").substring(0, 60))
  );
} else {
  writeFileSync(PLAN, JSON.stringify(plan, null, 2) + "\n");
  console.log("\nplan.json aktualisiert.");
}
