#!/usr/bin/env node
// Fetch & store YouTube engagement metrics for posts.
//
// Hybrid approach:
//   - Data API v3 (API key): channel uploads listing → auto-discover videoIds
//   - Analytics API v2 (OAuth): time-series views, retention, watch time
//
// Usage:
//   node pipeline/metrics.mjs yt setup                              One-time OAuth handshake
//   node pipeline/metrics.mjs yt sync                               Auto-match videoIds from channel uploads
//   node pipeline/metrics.mjs yt id <post-id> <videoId-or-URL>      Manual videoId fallback
//   node pipeline/metrics.mjs yt list                               Tracking status overview
//   node pipeline/metrics.mjs yt analytics <post-id>                Pull time-series for one post
//   node pipeline/metrics.mjs yt analytics-all                      Pull time-series for all tracked
//   node pipeline/metrics.mjs yt show <post-id>                     Show stored time-series + milestones
//   node pipeline/metrics.mjs yt rank                               Comparison table (sorted by views@24h)
//
// Config files (in ~/.config/echt-bamberg/):
//   youtube-api-key                   Data API key (single line)
//   youtube-oauth-client.json         Downloaded from Google Cloud (OAuth Desktop client)
//   youtube-oauth-token.json          Auto-created on `yt setup` (refresh token)
//
// Channel handle (in pipeline/plan.json under config.youtube.handle, default "@echt.bamberg")

import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { join, resolve, dirname } from "path";
import { homedir } from "os";
import { createServer } from "http";
import { spawn } from "child_process";

const ROOT = resolve(new URL("..", import.meta.url).pathname.replace(/\/$/, ""));
const PLAN = join(ROOT, "pipeline/plan.json");
const CONFIG_DIR = join(homedir(), ".config/echt-bamberg");
const KEY_FILE = join(CONFIG_DIR, "youtube-api-key");
const OAUTH_CLIENT_FILE = join(CONFIG_DIR, "youtube-oauth-client.json");
const OAUTH_TOKEN_FILE = join(CONFIG_DIR, "youtube-oauth-token.json");

const GREEN = "\x1b[32m";
const RED = "\x1b[31m";
const YELLOW = "\x1b[33m";
const DIM = "\x1b[2m";
const BOLD = "\x1b[1m";
const RESET = "\x1b[0m";

const SCOPES = [
  "https://www.googleapis.com/auth/youtube.readonly",
  "https://www.googleapis.com/auth/yt-analytics.readonly",
];

const USAGE = `Usage:
  node pipeline/metrics.mjs yt setup                              One-time OAuth handshake
  node pipeline/metrics.mjs yt sync                               Auto-match videoIds from channel uploads
  node pipeline/metrics.mjs yt id <post-id> <videoId-or-URL>      Manual videoId fallback
  node pipeline/metrics.mjs yt list                               Tracking status overview
  node pipeline/metrics.mjs yt analytics <post-id>                Pull time-series for one post
  node pipeline/metrics.mjs yt analytics-all                      Pull time-series for all tracked
  node pipeline/metrics.mjs yt show <post-id>                     Show stored time-series + milestones
  node pipeline/metrics.mjs yt rank                               Comparison table (sorted by views@24h)
  node pipeline/metrics.mjs yt agg [type|design|topic]            Aggregate stats by type / design / topic / combo
`;

// ── plan.json read/write ─────────────────────────────────────────────────────

function loadPlan() { return JSON.parse(readFileSync(PLAN, "utf8")); }
function savePlan(plan) { writeFileSync(PLAN, JSON.stringify(plan, null, 2) + "\n"); }

function getChannelHandle(plan) {
  return plan.config?.youtube?.handle || "@echt.bamberg";
}

function setChannelMeta(plan, key, value) {
  if (!plan.config) plan.config = {};
  if (!plan.config.youtube) plan.config.youtube = {};
  plan.config.youtube[key] = value;
}

// ── Fuzzy post lookup (mirrors edit.mjs:212-230) ────────────────────────────

function findPost(plan, query) {
  let post = plan.posts.find((p) => p.id === query);
  if (post) return post;
  const matches = plan.posts.filter((p) => p.id.includes(query));
  if (matches.length === 1) return matches[0];
  if (matches.length > 1) {
    console.log(`"${query}" matches ${matches.length} posts:`);
    matches.slice(0, 20).forEach((p) => {
      console.log(`  ${GREEN}${p.id}${RESET}  ${p.type} | ${p.design} | ${p.status}`);
    });
    if (matches.length > 20) console.log(`  ... and ${matches.length - 20} more`);
    process.exit(1);
  }
  console.error(`No post matching "${query}".`);
  process.exit(1);
}

function extractYtId(input) {
  if (/^[a-zA-Z0-9_-]{11}$/.test(input)) return input;
  const m = input.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|shorts\/|embed\/|v\/))([a-zA-Z0-9_-]{11})/);
  if (m) return m[1];
  console.error(`Could not extract YouTube video ID from: ${input}`);
  process.exit(1);
}

// ── Data API key resolution ──────────────────────────────────────────────────

function getApiKey() {
  if (process.env.YOUTUBE_API_KEY) return process.env.YOUTUBE_API_KEY.trim();
  if (existsSync(KEY_FILE)) {
    const k = readFileSync(KEY_FILE, "utf8").trim();
    if (k) return k;
  }
  console.error(`${RED}YOUTUBE_API_KEY not set.${RESET}

Setup:
  1. https://console.cloud.google.com → enable "YouTube Data API v3"
  2. Credentials → Create credentials → API key
  3. mkdir -p ${CONFIG_DIR}
     echo "AIzaSy..." > ${KEY_FILE}
     chmod 600 ${KEY_FILE}
`);
  process.exit(1);
}

// ── OAuth (Desktop loopback flow) ────────────────────────────────────────────

function loadOauthClient() {
  if (!existsSync(OAUTH_CLIENT_FILE)) {
    console.error(`${RED}OAuth client config missing: ${OAUTH_CLIENT_FILE}${RESET}

Setup (one-time, ~5 min):
  1. https://console.cloud.google.com → APIs & Services → Library
     → enable "YouTube Analytics API" AND "YouTube Data API v3"
  2. APIs & Services → OAuth consent screen
     → External, fill required fields, add YOUR email as Test user
     → Add scopes: ${SCOPES.map(s => "\n        " + s).join("")}
  3. APIs & Services → Credentials → Create credentials → OAuth client ID
     → Application type: Desktop app
     → Download JSON → save as:
        mkdir -p ${CONFIG_DIR}
        mv ~/Downloads/client_secret_*.json ${OAUTH_CLIENT_FILE}
        chmod 600 ${OAUTH_CLIENT_FILE}
  4. Run: node pipeline/metrics.mjs yt setup
`);
    process.exit(1);
  }
  const j = JSON.parse(readFileSync(OAUTH_CLIENT_FILE, "utf8"));
  // Google ships the client config wrapped in either "installed" or "web"
  const c = j.installed || j.web || j;
  if (!c.client_id || !c.client_secret) {
    console.error(`${RED}Invalid OAuth client file (missing client_id/client_secret): ${OAUTH_CLIENT_FILE}${RESET}`);
    process.exit(1);
  }
  return { clientId: c.client_id, clientSecret: c.client_secret };
}

function loadOauthToken() {
  if (!existsSync(OAUTH_TOKEN_FILE)) return null;
  return JSON.parse(readFileSync(OAUTH_TOKEN_FILE, "utf8"));
}

function saveOauthToken(token) {
  if (!existsSync(CONFIG_DIR)) mkdirSync(CONFIG_DIR, { recursive: true, mode: 0o700 });
  writeFileSync(OAUTH_TOKEN_FILE, JSON.stringify(token, null, 2) + "\n", { mode: 0o600 });
}

async function oauthSetup() {
  const { clientId, clientSecret } = loadOauthClient();

  // Spin up loopback server on a free port
  const { port, codePromise, server } = await startLoopbackServer();
  const redirectUri = `http://127.0.0.1:${port}`;

  const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  authUrl.searchParams.set("client_id", clientId);
  authUrl.searchParams.set("redirect_uri", redirectUri);
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("scope", SCOPES.join(" "));
  authUrl.searchParams.set("access_type", "offline");
  // select_account forces the account picker (so user can switch to the brand-channel-managing account);
  // consent forces re-consent so we always get a fresh refresh_token.
  authUrl.searchParams.set("prompt", "select_account consent");

  console.log(`${BOLD}OAuth setup${RESET} — granting YouTube Analytics access\n`);
  console.log(`  ${DIM}Opening browser for consent...${RESET}`);
  console.log(`  If browser doesn't open, visit:\n  ${authUrl.toString()}\n`);

  // Try to open browser (mac: open, linux: xdg-open, windows: start)
  const opener = process.platform === "darwin" ? "open" : process.platform === "win32" ? "start" : "xdg-open";
  spawn(opener, [authUrl.toString()], { detached: true, stdio: "ignore" }).unref();

  let code;
  try {
    code = await codePromise;
  } finally {
    server.close();
  }

  // Exchange code for refresh token
  const tokenResp = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
  });
  if (!tokenResp.ok) {
    console.error(`${RED}Token exchange failed: ${tokenResp.status}${RESET}\n${await tokenResp.text()}`);
    process.exit(1);
  }
  const token = await tokenResp.json();
  if (!token.refresh_token) {
    console.error(`${RED}No refresh_token in response. Try again, or revoke prior consent at https://myaccount.google.com/permissions${RESET}`);
    process.exit(1);
  }
  saveOauthToken({ refresh_token: token.refresh_token });
  console.log(`${GREEN}✓${RESET} Refresh token saved to ${OAUTH_TOKEN_FILE}`);
  console.log(`  Test with: node pipeline/metrics.mjs yt analytics-all`);
}

function startLoopbackServer() {
  return new Promise((resolveStart) => {
    let resolveCode;
    const codePromise = new Promise((r) => { resolveCode = r; });
    const server = createServer((req, res) => {
      const url = new URL(req.url, `http://127.0.0.1`);
      const code = url.searchParams.get("code");
      const error = url.searchParams.get("error");
      res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
      if (error) {
        res.end(`<h1>Auth failed</h1><p>${error}</p>`);
        process.nextTick(() => process.exit(1));
        return;
      }
      res.end(`<h1>OK</h1><p>You can close this tab and return to the terminal.</p>`);
      resolveCode(code);
    });
    server.listen(0, "127.0.0.1", () => {
      const port = server.address().port;
      resolveStart({ port, codePromise, server });
    });
  });
}

// Refresh access token slightly before Google reports it as expired, so in-flight requests don't 401
const TOKEN_EXPIRY_BUFFER_MS = 60_000;
let cachedAccessToken = null;

async function getAccessToken() {
  if (cachedAccessToken && cachedAccessToken.expiresAt > Date.now()) {
    return cachedAccessToken.token;
  }
  const { clientId, clientSecret } = loadOauthClient();
  const stored = loadOauthToken();
  if (!stored?.refresh_token) {
    console.error(`${RED}OAuth not set up. Run: node pipeline/metrics.mjs yt setup${RESET}`);
    process.exit(1);
  }
  const r = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: stored.refresh_token,
      grant_type: "refresh_token",
    }),
  });
  if (!r.ok) {
    console.error(`${RED}Token refresh failed: ${r.status}${RESET}\n${await r.text()}`);
    console.error(`Try re-running: node pipeline/metrics.mjs yt setup`);
    process.exit(1);
  }
  const j = await r.json();
  cachedAccessToken = {
    token: j.access_token,
    expiresAt: Date.now() + j.expires_in * 1000 - TOKEN_EXPIRY_BUFFER_MS,
  };
  return j.access_token;
}

// ── Data API: channel uploads → videoId discovery ────────────────────────────

async function fetchChannelId(handle, key) {
  const url = new URL("https://www.googleapis.com/youtube/v3/channels");
  url.searchParams.set("part", "id,contentDetails");
  url.searchParams.set("forHandle", handle);
  url.searchParams.set("key", key);
  const r = await fetch(url);
  if (!r.ok) {
    console.error(`${RED}channels.list failed: ${r.status}${RESET}\n${await r.text()}`);
    process.exit(1);
  }
  const j = await r.json();
  if (!j.items?.length) {
    console.error(`${RED}No channel found for handle: ${handle}${RESET}`);
    process.exit(1);
  }
  return {
    channelId: j.items[0].id,
    uploadsPlaylistId: j.items[0].contentDetails.relatedPlaylists.uploads,
  };
}

async function fetchAllUploads(uploadsPlaylistId, key) {
  const uploads = [];
  let pageToken = "";
  while (true) {
    const url = new URL("https://www.googleapis.com/youtube/v3/playlistItems");
    url.searchParams.set("part", "snippet,contentDetails");
    url.searchParams.set("playlistId", uploadsPlaylistId);
    url.searchParams.set("maxResults", "50");
    if (pageToken) url.searchParams.set("pageToken", pageToken);
    url.searchParams.set("key", key);
    const r = await fetch(url);
    if (!r.ok) {
      console.error(`${RED}playlistItems.list failed: ${r.status}${RESET}\n${await r.text()}`);
      process.exit(1);
    }
    const j = await r.json();
    for (const item of j.items || []) {
      uploads.push({
        videoId: item.contentDetails.videoId,
        title: item.snippet.title,
        publishedAt: item.contentDetails.videoPublishedAt || item.snippet.publishedAt,
      });
    }
    if (!j.nextPageToken) break;
    pageToken = j.nextPageToken;
  }
  return uploads;
}

// ── Sync: match channel uploads → posts ──────────────────────────────────────

async function cmdSync() {
  const plan = loadPlan();
  const handle = getChannelHandle(plan);
  const key = getApiKey();

  console.log(`${DIM}Channel: ${handle}${RESET}`);

  let channelId = plan.config?.youtube?.channelId;
  let uploadsPlaylistId = plan.config?.youtube?.uploadsPlaylistId;
  if (!channelId || !uploadsPlaylistId) {
    const meta = await fetchChannelId(handle, key);
    channelId = meta.channelId;
    uploadsPlaylistId = meta.uploadsPlaylistId;
    setChannelMeta(plan, "channelId", channelId);
    setChannelMeta(plan, "uploadsPlaylistId", uploadsPlaylistId);
    console.log(`  ${GREEN}✓${RESET} Channel resolved: ${channelId}`);
  }

  const uploads = await fetchAllUploads(uploadsPlaylistId, key);
  console.log(`  ${GREEN}✓${RESET} Fetched ${uploads.length} uploads from channel\n`);

  // Mark uploads that are ALREADY assigned in plan.json — they're off-limits for new matches
  const used = new Set();
  for (const p of plan.posts) {
    const vid = p.posted?.youtube?.videoId;
    if (vid) used.add(vid);
  }

  // Posts to match: published-to-YT, no videoId yet
  const candidates = plan.posts.filter(
    (p) => p.status === "published" && p.posted?.youtube?.video && !p.posted?.youtube?.videoId
  );
  if (candidates.length === 0) {
    console.log(`All published-to-YT posts already have videoIds. Nothing to do.`);
    savePlan(plan);
    detectDuplicates(plan);
    return;
  }

  // Multi-pass: strongest strategies first, each pass sees fewer available uploads
  const strategies = [
    { name: "title-exact",     fn: matchExactTitle,    days: 3 },
    { name: "title-fuzzy",     fn: matchFuzzyTitle,    days: 3 },
    { name: "title-substring", fn: matchSubstring,     days: 3 },
    { name: "date-unique",     fn: matchDateUnique,    days: 0 },
  ];

  const matched = [];
  const remaining = new Map(candidates.map((p) => [p.id, p]));

  for (const strat of strategies) {
    if (remaining.size === 0) break;
    for (const [id, post] of [...remaining]) {
      const m = strat.fn(post, uploads, used, strat.days);
      if (m) {
        if (!post.posted.youtube) post.posted.youtube = {};
        post.posted.youtube.videoId = m.videoId;
        used.add(m.videoId);
        matched.push({ post, videoId: m.videoId, reason: strat.name, title: m.title });
        remaining.delete(id);
      }
    }
  }
  savePlan(plan);

  for (const { post, videoId, reason, title } of matched) {
    console.log(
      `  ${GREEN}✓${RESET} ${post.id.padEnd(42)} → ${videoId}  ${DIM}(${reason})${RESET}\n      ${DIM}YT: ${title}${RESET}`
    );
  }

  console.log(`\n${matched.length}/${candidates.length} matched.`);
  if (remaining.size > 0) {
    console.log(`\n${YELLOW}Unmatched (need manual yt id):${RESET}`);
    for (const post of remaining.values()) {
      const expected = post.social?.youtube?.title || "(no title set)";
      console.log(`  ${post.id}  ${DIM}(posted ${post.posted.youtube.video}, expected: "${expected}")${RESET}`);
      // List uploads near that date for convenience
      const nearby = uploads.filter((u) => withinDays(u.publishedAt, post.posted.youtube.video, 3) && !used.has(u.videoId));
      for (const u of nearby) {
        console.log(`     ${DIM}${u.publishedAt.slice(0, 10)} ${u.videoId}  ${u.title}${RESET}`);
      }
    }
  }
  detectDuplicates(plan);
}

function detectDuplicates(plan) {
  const seen = new Map();
  for (const p of plan.posts) {
    const vid = p.posted?.youtube?.videoId;
    if (!vid) continue;
    if (!seen.has(vid)) seen.set(vid, []);
    seen.get(vid).push(p.id);
  }
  const dupes = [...seen.entries()].filter(([, posts]) => posts.length > 1);
  if (dupes.length === 0) return;
  console.log(`\n${RED}⚠ Duplicate videoIds detected:${RESET}`);
  for (const [vid, posts] of dupes) {
    console.log(`  ${vid} → ${posts.join(", ")}`);
  }
  console.log(`  ${DIM}Fix manually: node edit.mjs <wrong-post-id> posted.youtube.videoId=null${RESET}`);
  console.log(`  ${DIM}Then re-run: node pipeline/metrics.mjs yt sync${RESET}`);
}

// ── Match strategies (each returns {videoId, title} or null) ─────────────────

function normTitle(s) {
  // Strip hashtags entirely, then case-fold + strip non-letter/digit
  return s.replace(/#\S+/g, "").toLowerCase().replace(/[^a-z0-9äöüß]/g, "");
}

function matchExactTitle(post, uploads, used, days) {
  const expected = post.social?.youtube?.title;
  if (!expected) return null;
  for (const u of uploads) {
    if (used.has(u.videoId)) continue;
    if (u.title.trim() !== expected.trim()) continue;
    if (!withinDays(u.publishedAt, post.posted.youtube.video, days)) continue;
    return u;
  }
  return null;
}

function matchFuzzyTitle(post, uploads, used, days) {
  const expected = post.social?.youtube?.title;
  if (!expected) return null;
  const target = normTitle(expected);
  if (target.length < 8) return null; // too short to be reliable
  for (const u of uploads) {
    if (used.has(u.videoId)) continue;
    if (normTitle(u.title) !== target) continue;
    if (!withinDays(u.publishedAt, post.posted.youtube.video, days)) continue;
    return u;
  }
  return null;
}

function matchSubstring(post, uploads, used, days) {
  // Handles "Expected Title" vs "Expected Title. Suffix #hashtag"
  const expected = post.social?.youtube?.title;
  if (!expected) return null;
  const target = normTitle(expected);
  if (target.length < 12) return null; // too short → false positives
  for (const u of uploads) {
    if (used.has(u.videoId)) continue;
    const candidate = normTitle(u.title);
    if (!candidate.includes(target) && !target.includes(candidate)) continue;
    if (!withinDays(u.publishedAt, post.posted.youtube.video, days)) continue;
    return u;
  }
  return null;
}

function matchDateUnique(post, uploads, used) {
  const postedDate = post.posted.youtube.video;
  const free = uploads.filter((u) => !used.has(u.videoId) && u.publishedAt.slice(0, 10) === postedDate);
  if (free.length === 1) return free[0];
  return null;
}

function withinDays(isoDateA, isoDateB, days) {
  const a = new Date(isoDateA.slice(0, 10)).getTime();
  const b = new Date(isoDateB.slice(0, 10)).getTime();
  return Math.abs(a - b) <= days * 86400000;
}

// ── Analytics API: time-series stats ─────────────────────────────────────────

async function fetchAnalytics(videoId, startDate, endDate) {
  const token = await getAccessToken();
  const url = new URL("https://youtubeanalytics.googleapis.com/v2/reports");
  url.searchParams.set("ids", "channel==MINE");
  url.searchParams.set("startDate", startDate);
  url.searchParams.set("endDate", endDate);
  url.searchParams.set("metrics", [
    "views",
    "likes",
    "comments",
    "shares",
    "subscribersGained",
    "estimatedMinutesWatched",
    "averageViewDuration",
    "averageViewPercentage",
  ].join(","));
  url.searchParams.set("dimensions", "day");
  url.searchParams.set("filters", `video==${videoId}`);
  url.searchParams.set("sort", "day");
  const r = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (!r.ok) {
    const body = await r.text();
    throw new Error(`Analytics API ${r.status}: ${body}`);
  }
  const j = await r.json();
  // Shape: columnHeaders [{name}], rows [[day, views, likes, ...]]
  const cols = (j.columnHeaders || []).map((c) => c.name);
  const rows = j.rows || [];
  return rows.map((row) => {
    const o = {};
    for (let i = 0; i < cols.length; i++) o[cols[i]] = row[i];
    return {
      date: o.day,
      views: o.views ?? 0,
      likes: o.likes ?? 0,
      comments: o.comments ?? 0,
      shares: o.shares ?? 0,
      subsGained: o.subscribersGained ?? 0,
      watchMinutes: o.estimatedMinutesWatched ?? 0,
      avgDurationSec: round1(o.averageViewDuration ?? 0),
      avgViewPct: round1(o.averageViewPercentage ?? 0),
    };
  });
}

function round1(n) { return Math.round(n * 10) / 10; }

function todayISO() { return new Date().toISOString().slice(0, 10); }

async function pullAnalyticsForPost(post) {
  const videoId = post.posted?.youtube?.videoId;
  const startDate = post.posted?.youtube?.video;
  if (!videoId) return { ok: false, reason: "no videoId" };
  if (!startDate) return { ok: false, reason: "no posting date" };
  const endDate = todayISO();
  let daily;
  try {
    daily = await fetchAnalytics(videoId, startDate, endDate);
  } catch (e) {
    return { ok: false, reason: e.message };
  }
  if (!post.metrics) post.metrics = {};
  post.metrics.youtube = {
    videoId,
    lastFetched: endDate,
    daily,
  };
  return { ok: true, days: daily.length, totalViews: daily.reduce((s, d) => s + d.views, 0) };
}

async function cmdAnalytics(args) {
  const [postId] = args;
  if (!postId) { console.error("Usage: yt analytics <post-id>"); process.exit(1); }
  const plan = loadPlan();
  const post = findPost(plan, postId);
  const result = await pullAnalyticsForPost(post);
  if (!result.ok) {
    console.error(`${RED}✗${RESET} ${post.id}: ${result.reason}`);
    process.exit(1);
  }
  savePlan(plan);
  const m = post.metrics.youtube;
  const v0 = m.daily[0]?.views ?? 0;
  console.log(`${GREEN}✓${RESET} ${post.id}  ${result.days} days, ${result.totalViews} total views (day0: ${v0})`);
}

async function cmdAnalyticsAll() {
  const plan = loadPlan();
  const tracked = plan.posts.filter((p) => p.posted?.youtube?.videoId);
  if (tracked.length === 0) {
    console.log("No posts with youtube.videoId set. Run: yt sync (or yt id)");
    return;
  }
  // Warm the access-token cache once so the parallel batch doesn't trigger N concurrent token refreshes
  await getAccessToken();
  // Concurrency 6 keeps us well under Analytics API's 720 req/min limit while parallelizing meaningfully
  const CONCURRENCY = 6;
  const results = await mapWithConcurrency(tracked, CONCURRENCY, (post) => pullAnalyticsForPost(post));
  let ok = 0, failed = 0;
  for (let i = 0; i < tracked.length; i++) {
    const post = tracked[i];
    const result = results[i];
    if (result.ok) {
      ok++;
      const v0 = post.metrics.youtube.daily[0]?.views ?? 0;
      console.log(`  ${GREEN}✓${RESET} ${post.id.padEnd(42)} ${String(result.days).padStart(3)}d  Σ${String(result.totalViews).padStart(6)}  d0=${String(v0).padStart(5)}`);
    } else {
      failed++;
      console.log(`  ${RED}✗${RESET} ${post.id.padEnd(42)} ${result.reason}`);
    }
  }
  savePlan(plan);
  console.log(`\n${GREEN}${ok}${RESET}/${tracked.length} updated${failed ? `, ${RED}${failed}${RESET} failed` : ""}.`);
}

async function mapWithConcurrency(items, limit, fn) {
  const results = new Array(items.length);
  let next = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (true) {
      const i = next++;
      if (i >= items.length) return;
      results[i] = await fn(items[i]);
    }
  });
  await Promise.all(workers);
  return results;
}

// ── Display ──────────────────────────────────────────────────────────────────

function cmdList() {
  const plan = loadPlan();
  const onYt = plan.posts.filter(
    (p) => p.status === "published" && p.posted?.youtube?.video
  );
  const tracked = onYt.filter((p) => p.posted?.youtube?.videoId);
  const withMetrics = tracked.filter((p) => p.metrics?.youtube?.daily?.length);
  console.log(
    `\n${onYt.length} on YouTube — ${GREEN}${tracked.length} have videoId${RESET}, ${withMetrics.length} with stats, ${YELLOW}${onYt.length - tracked.length} need sync/id${RESET}\n`
  );
  onYt.sort((a, b) => (a.posted.youtube.video || "").localeCompare(b.posted.youtube.video || ""));
  for (const p of onYt) {
    const date = p.posted.youtube.video;
    const vid = p.posted?.youtube?.videoId;
    const m = p.metrics?.youtube;
    const idTag = vid ? `${GREEN}✓${RESET} ${vid}` : `${YELLOW}✗${RESET} no videoId   `;
    const stats = m?.daily?.length
      ? `Σ${String(totalViews(m)).padStart(6)}  d0=${String(m.daily[0]?.views ?? 0).padStart(5)}  ret=${String(retention(m)).padStart(4)}%`
      : DIM + "no stats" + RESET;
    console.log(`  ${date}  ${p.id.padEnd(42)}  ${idTag}  ${stats}`);
  }
}

function totalViews(m) { return m.daily.reduce((s, d) => s + d.views, 0); }
function retention(m) {
  // weighted average view percentage (by views)
  const views = m.daily.reduce((s, d) => s + d.views, 0);
  if (views === 0) return 0;
  const weighted = m.daily.reduce((s, d) => s + d.views * d.avgViewPct, 0);
  return Math.round(weighted / views);
}

function viewsAtAge(m, days) {
  // Sum of first `days` daily entries (1 = day0 only, 7 = week)
  return m.daily.slice(0, days).reduce((s, d) => s + d.views, 0);
}

function cmdShow(args) {
  const [postId] = args;
  if (!postId) { console.error("Usage: yt show <post-id>"); process.exit(1); }
  const plan = loadPlan();
  const post = findPost(plan, postId);
  const m = post.metrics?.youtube;
  console.log(`\n${BOLD}${post.id}${RESET}`);
  if (post.posted?.youtube?.videoId) {
    console.log(`  ${DIM}https://youtube.com/shorts/${post.posted.youtube.videoId}${RESET}`);
  }
  if (!m?.daily?.length) {
    console.log(`  ${DIM}no analytics pulled yet — run: yt analytics ${post.id}${RESET}`);
    return;
  }
  const total = totalViews(m);
  const v24 = m.daily[0]?.views ?? 0;
  const v7 = viewsAtAge(m, 7);
  const v30 = viewsAtAge(m, 30);
  const ret = retention(m);
  console.log(`  ${DIM}fetched ${m.lastFetched}, ${m.daily.length} days of data${RESET}`);
  console.log(`\n  ${BOLD}Milestones${RESET}`);
  console.log(`    views @ day 0 (24h):  ${BOLD}${v24}${RESET}`);
  if (m.daily.length >= 2) console.log(`    views @ first 7d:     ${v7}`);
  if (m.daily.length >= 8) console.log(`    views @ first 30d:    ${v30}`);
  console.log(`    views total (${m.daily.length}d):  ${total}`);
  console.log(`    avg retention:        ${ret}%`);
  console.log(`\n  ${DIM}date         views   likes  cmnts  shrs  subs  watch(min)  avgDur(s)  ret%${RESET}`);
  for (const d of m.daily) {
    console.log(
      `  ${d.date}  ${String(d.views).padStart(5)}   ${String(d.likes).padStart(4)}  ${String(d.comments).padStart(4)}  ${String(d.shares).padStart(4)}  ${String(d.subsGained).padStart(4)}  ${String(d.watchMinutes).padStart(9)}  ${String(d.avgDurationSec).padStart(7)}   ${String(d.avgViewPct).padStart(4)}`
    );
  }
}

function cmdAgg(args) {
  const [filterField] = args; // optional: "type", "design", "topic" — default = all three
  const plan = loadPlan();
  const tracked = plan.posts.filter((p) => {
    const m = p.metrics?.youtube;
    if (!m?.daily?.length) return false;
    // Exclude posts without 24h-settled data (typically today's posts, day0 still pending)
    const v24 = m.daily[0]?.views ?? 0;
    return v24 > 0;
  });
  if (tracked.length === 0) {
    console.log("No posts with settled analytics. Run: yt analytics-all (or wait 24h after posting)");
    return;
  }

  const fields = filterField ? [filterField] : ["type", "design", "topic"];
  for (const f of fields) {
    aggByField(tracked, f);
  }

  if (!filterField) {
    aggByField(tracked, ["type", "design"], "type · design");
  }

  console.log(`\n${DIM}Sample: ${tracked.length} posts (>=24h since posting). Sorted by avg v@24h.${RESET}`);
}

function aggByField(posts, fieldOrFields, label) {
  const isArray = Array.isArray(fieldOrFields);
  const groupName = label || (isArray ? fieldOrFields.join(" · ") : fieldOrFields);
  const keyOf = (p) => isArray ? fieldOrFields.map((f) => p[f] || "—").join(" · ") : (p[fieldOrFields] || "—");

  const groups = new Map();
  for (const p of posts) {
    const key = keyOf(p);
    if (!groups.has(key)) groups.set(key, []);
    const m = p.metrics.youtube;
    groups.get(key).push({
      v24: m.daily[0]?.views ?? 0,
      v7: viewsAtAge(m, 7),
      total: totalViews(m),
      ret: retention(m),
    });
  }
  const rows = [...groups.entries()].map(([key, items]) => ({
    key,
    n: items.length,
    avgV24: Math.round(avg(items.map((i) => i.v24))),
    medV24: Math.round(median(items.map((i) => i.v24))),
    avgV7: Math.round(avg(items.map((i) => i.v7))),
    avgTotal: Math.round(avg(items.map((i) => i.total))),
    avgRet: Math.round(avg(items.map((i) => i.ret))),
  }));
  rows.sort((a, b) => b.avgV24 - a.avgV24);

  console.log(`\n${BOLD}By ${groupName}${RESET}`);
  console.log(`  ${DIM}n   avg v@24h  median  avg v@7d  avg total  avg ret%  ${groupName}${RESET}`);
  for (const r of rows) {
    const trend = r.n === 1 ? DIM + "  (n=1)" + RESET : "";
    console.log(
      `  ${String(r.n).padStart(2)}     ${String(r.avgV24).padStart(5)}   ${String(r.medV24).padStart(5)}     ${String(r.avgV7).padStart(5)}      ${String(r.avgTotal).padStart(5)}      ${String(r.avgRet).padStart(4)}  ${r.key}${trend}`
    );
  }
}

function avg(arr) { return arr.length ? arr.reduce((s, x) => s + x, 0) / arr.length : 0; }
function median(arr) {
  if (arr.length === 0) return 0;
  const s = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

function cmdRank() {
  const plan = loadPlan();
  const tracked = plan.posts
    .filter((p) => p.metrics?.youtube?.daily?.length)
    .map((p) => {
      const m = p.metrics.youtube;
      return {
        id: p.id,
        date: p.posted.youtube.video,
        type: p.type,
        design: p.design,
        topic: p.topic,
        v24: m.daily[0]?.views ?? 0,
        v7: viewsAtAge(m, 7),
        total: totalViews(m),
        ret: retention(m),
        days: m.daily.length,
      };
    });
  if (tracked.length === 0) {
    console.log("No posts with analytics. Run: yt analytics-all");
    return;
  }
  tracked.sort((a, b) => b.v24 - a.v24);
  console.log(`\n${BOLD}Ranked by views @ day 0 (first 24h)${RESET}\n`);
  console.log(`  ${DIM}rank  posted      v@24h   v@7d    total  ret%  type · design · topic${RESET}`);
  tracked.forEach((p, i) => {
    const meta = `${p.type} · ${p.design} · ${p.topic || "-"}`;
    console.log(
      `  ${String(i + 1).padStart(3)}.  ${p.date}  ${String(p.v24).padStart(5)}   ${String(p.v7).padStart(5)}  ${String(p.total).padStart(6)}  ${String(p.ret).padStart(4)}  ${p.id.padEnd(42)} ${DIM}${meta}${RESET}`
    );
  });
}

// ── ID command (manual fallback) ─────────────────────────────────────────────

function cmdId(args) {
  const [postId, input] = args;
  if (!postId || !input) { console.error("Usage: yt id <post-id> <videoId-or-URL>"); process.exit(1); }
  const plan = loadPlan();
  const post = findPost(plan, postId);
  const videoId = extractYtId(input);
  if (!post.posted) post.posted = {};
  if (!post.posted.youtube) post.posted.youtube = {};
  const old = post.posted.youtube.videoId;
  post.posted.youtube.videoId = videoId;
  savePlan(plan);
  console.log(`${GREEN}✓${RESET} ${post.id}`);
  console.log(`  posted.youtube.videoId: ${old ? old + " → " : ""}${videoId}`);
}

// ── Dispatch ─────────────────────────────────────────────────────────────────

const argv = process.argv.slice(2);
const platform = argv[0];
const cmd = argv[1];
const rest = argv.slice(2);

if (!platform || platform === "--help" || platform === "-h") {
  console.log(USAGE);
  process.exit(0);
}
if (platform !== "yt") {
  console.error(`Unknown platform: ${platform}\n\n${USAGE}`);
  process.exit(1);
}

switch (cmd) {
  case "setup":         await oauthSetup(); break;
  case "sync":          await cmdSync(); break;
  case "id":            cmdId(rest); break;
  case "list":          cmdList(); break;
  case "analytics":     await cmdAnalytics(rest); break;
  case "analytics-all": await cmdAnalyticsAll(); break;
  case "show":          cmdShow(rest); break;
  case "rank":          cmdRank(); break;
  case "agg":           cmdAgg(rest); break;
  default:
    console.error(`Unknown command: yt ${cmd || "(none)"}\n\n${USAGE}`);
    process.exit(1);
}
