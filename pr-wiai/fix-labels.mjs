#!/usr/bin/env node
// Fourth pass: Split the 163 contrarian posts into their actual rhetorical types.
// Also remove fake-stat as a type (it's a topic pattern, not a rhetorical type).

import { readFileSync, writeFileSync } from "fs";

const plan = JSON.parse(readFileSync("pipeline/plan.json", "utf8"));
let fixes = 0;

function ft(p) {
  const s = p.slides || {};
  const t = p.text || {};
  return [s.bigText, s.smallText, s.s2, s.s3, s.button, s.uebrigens,
    t.slide1, t.slide2, t.slide3, t.button, t.uebrigens, p.notes]
    .filter(Boolean).join(" ").toLowerCase();
}

function setType(p, newType) {
  if (p.type !== newType) { p.type = newType; fixes++; }
}

for (const p of plan.posts) {
  if (p.type !== "contrarian") continue;

  const text = ft(p);
  const bigText = (p.slides?.bigText || "").toLowerCase();
  const smallText = (p.slides?.smallText || "").toLowerCase();

  // 1. "Es wird ja immer gesagt..." → stays contrarian (classic myth-busting)
  if (/es wird ja immer gesagt|man sagt.*immer/i.test(text)) continue;

  // 2. "Unpopular Opinion:" → stays contrarian
  if (/unpopular opinion/i.test(text)) continue;

  // 3. Fake-stat pattern: "Hast du geglaubt? Gibt es nicht" → stays contrarian, topic should be ertappt
  if (/geglaubt\??.*gibt es nicht|erfunden.*geglaubt|geglaubt.*erfunden|studie.*gibt es nicht|statistik.*quatsch|hast du.*geglaubt.*die (studie|zahl)/i.test(text)) {
    if (p.topic !== "ertappt") { p.topic = "ertappt"; fixes++; }
    continue; // type stays contrarian — the rhetorical frame IS contrarian
  }

  // 4. "Merkste selber, oder?" pattern → merkste-selber
  if (/merkste selber|oder\?\s*$/i.test(text) || /oder\?/i.test(p.slides?.s3 || "")) {
    setType(p, "merkste-selber");
    continue;
  }

  // 5. Explains a CS concept (educational) → wusstest-du
  if (/heißt |das prinzip|das nennt man|funktioniert so|methode|binary search|entscheidungsbaum|verschlüsselung|algorithmus.*funktioniert|so funktioniert/i.test(text)
    && !/merkste|oder\?|es wird/i.test(text)
    && text.length > 150) {
    setType(p, "wusstest-du");
    continue;
  }

  // 6. Lifehack / practical tip → wusstest-du
  if (/lifehack|trick:|tipp:|tiktok.*algorithmus erklärt|so schützt du|so funktioniert/i.test(text)
    && text.length < 500) {
    setType(p, "wusstest-du");
    continue;
  }

  // 7. Pure observation, no counter-argument, short → aphorismus
  // Aphorisms are short, observational, no "but actually" structure
  const s = p.slides || {};
  const slideCount = [s.bigText, s.s2, s.s3].filter(Boolean).length;
  const hasCounterArgument = /aber |doch |falsch|stimmt nicht|im gegenteil|nein[,.]|das problem ist/i.test(text);

  if (!hasCounterArgument && slideCount <= 2 && text.length < 250) {
    setType(p, "aphorismus");
    continue;
  }

  // 8. "Informatik passt (nicht) zu dir" → stays contrarian but check if identitaet topic
  if (/informatik passt|passt.*nicht zu dir|muss ich.*programmier|mathe.*3.*reicht|durchbeißen/i.test(text)) {
    if (p.topic !== "identitaet") { p.topic = "identitaet"; fixes++; }
    continue;
  }

  // 9. Observation-style posts that are longer but still lack a counter-argument → aphorismus
  if (!hasCounterArgument && text.length < 400) {
    setType(p, "aphorismus");
    continue;
  }

  // Everything else stays contrarian — it has a genuine counter-argument structure
}

writeFileSync("pipeline/plan.json", JSON.stringify(plan, null, 2) + "\n");

// Stats
const types = {};
for (const p of plan.posts) { types[p.type] = (types[p.type] || 0) + 1; }
console.log(`Fixed ${fixes} labels\n`);
console.log("Type distribution:");
Object.entries(types).sort((a, b) => b[1] - a[1]).forEach(([k, v]) => console.log(`  ${k}: ${v}`));
