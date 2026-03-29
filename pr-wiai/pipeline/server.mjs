#!/usr/bin/env node
// @herdom.bamberg — Swimlane Calendar Server
// Usage: node pipeline/server.mjs
// Opens at http://localhost:3847

import { createServer } from "http";
import { readFileSync, writeFileSync, statSync } from "fs";
import { join, extname } from "path";

const ROOT = new URL("..", import.meta.url).pathname.replace(/\/$/, "");
const PLAN = join(ROOT, "pipeline/plan.json");
const POSTS = join(ROOT, "wiai-social/posts");
const PORT = 3847;

// ── Cache ─────────────────────────────────────────────────────────────────────

let cachedPlan = null;
let cachedEnriched = null;
let cachedMtime = 0;

function planChanged() {
  try {
    const mtime = statSync(PLAN).mtimeMs;
    if (mtime !== cachedMtime) {
      cachedMtime = mtime;
      cachedPlan = null;
      cachedEnriched = null;
      return true;
    }
    return false;
  } catch {
    return true;
  }
}

function getPlan() {
  planChanged();
  if (cachedPlan) return cachedPlan;
  cachedPlan = JSON.parse(readFileSync(PLAN, "utf8"));
  cachedMtime = statSync(PLAN).mtimeMs;
  return cachedPlan;
}

function savePlan(data) {
  writeFileSync(PLAN, JSON.stringify(data, null, 2) + "\n");
  cachedPlan = data;
  cachedEnriched = null;
  cachedMtime = statSync(PLAN).mtimeMs;
}

function getPostText(jsonPath) {
  try {
    const full = join(ROOT, jsonPath);
    const data = JSON.parse(readFileSync(full, "utf8"));
    return {
      slide1: data.slide1?.bigText || data.slide1?.label || "",
      smallText: data.slide1?.smallText || "",
      slide2: data.slide2?.text || "",
      slide3: data.slide3?.text || "",
      button: data.slide3?.button || "",
      uebrigens: data.slide3?.übrigensText || "",
    };
  } catch {
    return null;
  }
}

function getEnrichedPlan() {
  planChanged();
  if (cachedEnriched) return cachedEnriched;
  const plan = getPlan();
  const enriched = {
    ...plan,
    posts: plan.posts.map((p) => ({
      ...p,
      text: p.json ? getPostText(p.json) : null,
    })),
  };
  cachedEnriched = enriched;
  return enriched;
}

// ── API ──────────────────────────────────────────────────────────────────────

function handleAPI(req, res) {
  const url = new URL(req.url, `http://localhost:${PORT}`);

  if (url.pathname === "/api/plan" && req.method === "GET") {
    try {
      const plan = getEnrichedPlan();
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify(plan));
    } catch (e) {
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: e.message }));
    }
    return true;
  }

  if (url.pathname === "/api/plan" && req.method === "PUT") {
    let body = "";
    req.on("data", (c) => (body += c));
    req.on("end", () => {
      try {
        const data = JSON.parse(body);
        savePlan(data);
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ ok: true }));
      } catch (e) {
        res.writeHead(400);
        res.end(JSON.stringify({ error: e.message }));
      }
    });
    return true;
  }

  if (url.pathname === "/api/week-note" && req.method === "PUT") {
    let body = "";
    req.on("data", (c) => (body += c));
    req.on("end", () => {
      try {
        const { week, note } = JSON.parse(body);
        const plan = getPlan();
        if (!plan.weekNotes) plan.weekNotes = {};
        if (note) plan.weekNotes[week] = note;
        else delete plan.weekNotes[week];
        savePlan(plan);
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ ok: true }));
      } catch (e) {
        res.writeHead(400);
        res.end(JSON.stringify({ error: e.message }));
      }
    });
    return true;
  }

  if (url.pathname === "/api/post" && req.method === "PUT") {
    let body = "";
    req.on("data", (c) => (body += c));
    req.on("end", () => {
      try {
        const { id, field, value } = JSON.parse(body);
        const plan = getPlan();
        const post = plan.posts.find((p) => p.id === id);
        if (!post) throw new Error("Post not found: " + id);
        post[field] = value;
        savePlan(plan);
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ ok: true }));
      } catch (e) {
        res.writeHead(400);
        res.end(JSON.stringify({ error: e.message }));
      }
    });
    return true;
  }

  return false;
}

// ── Static files ─────────────────────────────────────────────────────────────

const MIME = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".png": "image/png", ".svg": "image/svg+xml" };

function serveStatic(req, res) {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  let filePath = url.pathname === "/" ? "/index.html" : url.pathname;
  const fullPath = join(ROOT, "pipeline/ui", filePath);
  try {
    const data = readFileSync(fullPath);
    res.writeHead(200, { "Content-Type": MIME[extname(filePath)] || "text/plain" });
    res.end(data);
  } catch {
    res.writeHead(404);
    res.end("Not found");
  }
}

// ── Server ───────────────────────────────────────────────────────────────────

const server = createServer((req, res) => {
  if (req.url.startsWith("/api/")) {
    if (!handleAPI(req, res)) {
      res.writeHead(404);
      res.end("Not found");
    }
  } else {
    serveStatic(req, res);
  }
});

server.listen(PORT, () => {
  console.log(`\n  @herdom.bamberg Pipeline → http://localhost:${PORT}\n`);
});
