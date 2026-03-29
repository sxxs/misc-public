// @herdom.bamberg — Pipeline UI v5
// Two-mode dashboard: PLAN (operational) + MIX (strategic content mix).

// ── Content Type (rhetorical approach) ──────────────────────────────────────

const TYPES = {
  contrarian:     { short: "CTR",   full: "Contrarian",        color: "#facc15" },
  "merkste-selber": { short: "MERK", full: "Merkste selber",   color: "#38bdf8" },
  aphorismus:     { short: "APH",   full: "Aphorismus",        color: "#e0e0e0" },
  "wusstest-du":  { short: "WDU",   full: "Wusstest du",       color: "#34d399" },
  parodie:        { short: "PARO",  full: "Parodie",           color: "#06b6d4" },
  overselling:    { short: "OVER",  full: "Overselling",       color: "#f97316" },
  nachtgedanke:   { short: "NACHT", full: "Nachtgedanke",      color: "#c084fc" },
  nahkastchen:    { short: "NAEH",  full: "Naehkaestchen",     color: "#a78bfa" },
  selbstironie:   { short: "META",  full: "Selbstironie",      color: "#f472b6" },
  newsjacking:    { short: "NEWS",  full: "Newsjacking",       color: "#ef4444" },
  stitch:         { short: "STTCH", full: "Stitch",            color: "#fb923c" },
  witz:           { short: "WITZ",  full: "Witz",              color: "#fbbf24" },
  // Legacy: billboard/terminal kept for migration — will be relabeled
  billboard:      { short: "BILL",  full: "Billboard",         color: "#e0e0e0" },
  terminal:       { short: "TERM",  full: "Terminal",          color: "#33ff33" },
  other:          { short: "MISC",  full: "Sonstige",          color: "#555" },
};

function typeOf(t) { return TYPES[t] || TYPES.other; }

// ── Visual Design (how it looks) ────────────────────────────────────────────

const DESIGNS = {
  "pixel-wall":  { short: "PXL",  full: "Pixel Wall",    color: "#ef4444", letter: "W", bgColor: "#3a1111", letterColor: "#c44" },
  billboard:     { short: "BILL", full: "Billboard",      color: "#fafafa", letter: "B", bgColor: "#2a2a2a", letterColor: "#999" },
  terminal:      { short: "TERM", full: "Terminal",       color: "#33ff33", letter: "T", bgColor: "#0a2a0a", letterColor: "#2a2" },
  newsjacking:   { short: "NEWS", full: "Newsjacking",    color: "#f97316", letter: "N", bgColor: "#2a1a08", letterColor: "#b84" },
  "raw-photo":   { short: "RAW",  full: "Raw Photo",     color: "#d4a017", letter: "P", bgColor: "#2a2208", letterColor: "#a83" },
  other:         { short: "?",    full: "Nicht gesetzt",  color: "#333",    letter: "?", bgColor: "#1a1a1a", letterColor: "#444" },
};

function designOf(d) { return DESIGNS[d] || DESIGNS.other; }

// ── Topic (what it's about) ─────────────────────────────────────────────────

const TOPICS = {
  tech:           { short: "TECH",  full: "Technik / CS",        color: "#3b82f6" },
  datenschutz:    { short: "PRIV",  full: "Datenschutz",         color: "#ef4444" },
  studium:        { short: "STUD",  full: "Studium",             color: "#22c55e" },
  karriere:       { short: "JOB",   full: "Karriere",            color: "#f59e0b" },
  identitaet:     { short: "ID",    full: "Identitaet (Passt CS zu mir?)", color: "#8b5cf6" },
  manipulation:   { short: "MNPL",  full: "Manipulation / Aufmerksamkeit", color: "#f43f5e" },
  erwachsenwerden:{ short: "ERWX",  full: "Erwachsenwerden",     color: "#14b8a6" },
  alltag:         { short: "ALLT",  full: "Tech-Alltag (Kat B)", color: "#06b6d4" },
  uni:            { short: "UNI",   full: "Uni-Intern (Kat A)",  color: "#a78bfa" },
  "social-media": { short: "SOME",  full: "Social Media",        color: "#ec4899" },
  ertappt:        { short: "TRAP",  full: "Ertappt / Bias",      color: "#f97316" },
  "wiai-ad":      { short: "AD",    full: "WIAI-Werbung",        color: "#facc15" },
  meta:           { short: "META",  full: "Meta / Kanal",        color: "#888" },
  other:          { short: "?",     full: "Nicht gesetzt",       color: "#333" },
};

function topicOf(t) { return TOPICS[t] || TOPICS.other; }

const STATUS_COLORS = {
  idea: "#555", draft: "#f59e0b", ready: "#22c55e",
  scheduled: "#3b82f6", published: "#06b6d4",
};

const SLOTS_PER_WEEK = 7;

const DEFAULT_COLUMNS = ["contrarian", "merkste-selber", "nahkastchen", "_rest"];

// ── State ────────────────────────────────────────────────────────────────────

let plan = { posts: [] };
let draggedId = null;
let weekOffset = 0;
let searchQuery = "";
let columnTypes = loadColumnConfig();
let selectedPostId = null;
let viewMode = localStorage.getItem("herdom-viewMode") || "plan";

// ── API ──────────────────────────────────────────────────────────────────────

async function loadPlan() {
  const res = await fetch("/api/plan");
  plan = await res.json();
  render();
}

async function updatePost(id, field, value) {
  const res = await fetch("/api/post", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id, field, value }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    console.error("updatePost failed:", id, field, err.error || res.status);
    return false;
  }
  return true;
}

// ── Column Config (localStorage) ─────────────────────────────────────────────

function loadColumnConfig() {
  try {
    const saved = localStorage.getItem("herdom-columns");
    if (saved) return JSON.parse(saved);
  } catch {}
  return [...DEFAULT_COLUMNS];
}

function saveColumnConfig() {
  localStorage.setItem("herdom-columns", JSON.stringify(columnTypes));
}

// ── Week helpers ─────────────────────────────────────────────────────────────

function getWeekStr(date) {
  const d = new Date(date);
  const jan1 = new Date(d.getFullYear(), 0, 1);
  const days = Math.floor((d - jan1) / 86400000);
  const wk = Math.ceil((days + jan1.getDay() + 1) / 7);
  return d.getFullYear() + "-KW" + String(wk).padStart(2, "0");
}

function weekLabel(wk) { return wk.replace(/^\d{4}-/, ""); }

function generateWeeks(count, offset) {
  const weeks = [];
  const now = new Date();
  const dayOfWeek = now.getDay() || 7;
  const monday = new Date(now);
  monday.setDate(now.getDate() - dayOfWeek + 1 + offset * 7);
  for (let i = 0; i < count; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i * 7);
    weeks.push({ key: getWeekStr(d), monday: d });
  }
  return weeks;
}

function formatMonday(date) {
  return date.getDate() + "." + (date.getMonth() + 1) + ".";
}

// ── DOM Helpers ──────────────────────────────────────────────────────────────

function el(tag, attrs, children) {
  const node = document.createElement(tag);
  if (attrs) {
    for (const [k, v] of Object.entries(attrs)) {
      if (k === "className") node.className = v;
      else if (k.startsWith("on") && typeof v === "function") node.addEventListener(k.slice(2).toLowerCase(), v);
      else if (k === "style" && typeof v === "object") Object.assign(node.style, v);
      else node.setAttribute(k, v);
    }
  }
  if (children != null) {
    if (typeof children === "string") node.textContent = children;
    else if (Array.isArray(children)) children.forEach((c) => { if (c) node.appendChild(c); });
    else node.appendChild(children);
  }
  return node;
}

// ── Search ───────────────────────────────────────────────────────────────────

function matchesSearch(post) {
  if (!searchQuery) return true;
  const q = searchQuery.toLowerCase();
  const hay = [
    post.id, post.type, post.tag ? "#" + post.tag : null, post.design, post.status,
    post.slides?.bigText, post.slides?.smallText, post.slides?.s2, post.slides?.s3, post.slides?.button, post.slides?.uebrigens,
    post.text?.slide1, post.text?.slide2, post.text?.slide3, post.text?.button, post.text?.uebrigens,
    post.notes,
  ].filter(Boolean).join(" ").toLowerCase();
  return hay.includes(q);
}

// ══════════════════════════════════════════════════════════════════════════════
// RENDER
// ══════════════════════════════════════════════════════════════════════════════

function setViewMode(mode) {
  viewMode = mode;
  localStorage.setItem("herdom-viewMode", mode);
  document.getElementById("modePlan").classList.toggle("active", mode === "plan");
  document.getElementById("modeMix").classList.toggle("active", mode === "mix");
  document.body.classList.toggle("mix-active", mode === "mix");
  render();
}

function render() {
  // Clean up mode-specific elements
  document.querySelectorAll(".mix-popover").forEach(p => p.remove());

  if (viewMode === "mix") {
    renderMixGrid();
    document.getElementById("backlogArea").classList.add("mix-hidden");
  } else {
    renderCalendar();
    renderBacklog();
    document.getElementById("backlogArea").classList.remove("mix-hidden");
  }
  renderStats();
}

// ── Calendar ─────────────────────────────────────────────────────────────────

function getPostsByWeek() {
  const postsByWeek = new Map();
  for (const p of plan.posts) {
    if (p.targetWeek) {
      if (!postsByWeek.has(p.targetWeek)) postsByWeek.set(p.targetWeek, []);
      postsByWeek.get(p.targetWeek).push(p);
    }
  }
  for (const [, posts] of postsByWeek) {
    posts.sort((a, b) => (a.slotIndex ?? 99) - (b.slotIndex ?? 99));
  }
  return postsByWeek;
}

function renderCalendar() {
  const weeksPerRow = 4;
  const allWeeks = generateWeeks(weeksPerRow, weekOffset);
  const currentWeek = getWeekStr(new Date());
  const postsByWeek = getPostsByWeek();

  const cal = document.getElementById("calendar");
  cal.replaceChildren();
  cal.classList.add("plan-mode");
  cal.classList.remove("mix-mode");

  const rowEl = el("div", {
    className: "cal-row",
    style: { gridTemplateColumns: "repeat(" + weeksPerRow + ", minmax(0, 1fr))" },
  });

  for (const wkObj of allWeeks) {
    const wk = wkObj.key;
    const posts = postsByWeek.get(wk) || [];
    const cls = "week plan-week" + (wk === currentWeek ? " current" : "") + (wk < currentWeek ? " past" : "");
    const weekEl = el("div", { className: cls });

    // Header
    const kwNum = weekLabel(wk).replace("KW", "");
    weekEl.appendChild(el("div", { className: "week-header" }, [
      el("span", { className: "week-kw" }, [
        el("span", { className: "week-kw-prefix" }, "KW"),
        el("span", { className: "week-kw-num" }, kwNum),
      ]),
      el("span", { className: "week-date" }, formatMonday(wkObj.monday)),
    ]));

    // Production status bar
    const readyCount = posts.filter(p => p.status === "ready" || p.status === "scheduled" || p.status === "published").length;
    const draftCount = posts.filter(p => p.status === "draft").length;
    const ideaCount = posts.filter(p => p.status === "idea").length;
    const total = readyCount + draftCount + ideaCount;
    if (total > 0) {
      const bar = el("div", { className: "week-status-bar" });
      if (readyCount) bar.appendChild(el("div", { className: "wsb-seg", style: { flex: readyCount, background: "var(--green)" } }));
      if (draftCount) bar.appendChild(el("div", { className: "wsb-seg", style: { flex: draftCount, background: "var(--amber)" } }));
      if (ideaCount) bar.appendChild(el("div", { className: "wsb-seg", style: { flex: ideaCount, background: "var(--dim)" } }));
      weekEl.appendChild(bar);
    }

    // Slots
    const slotsEl = el("div", { className: "week-slots" });
    for (let i = 0; i < SLOTS_PER_WEEK; i++) {
      const post = posts[i];
      const slotEl = el("div", {
        className: "slot" + (!post ? " empty-slot" : ""),
        "data-week": wk,
        "data-slot": String(i),
        onDragover: (e) => { e.preventDefault(); e.currentTarget.classList.add("drag-over"); },
        onDragleave: (e) => { e.currentTarget.classList.remove("drag-over"); },
        onDrop: (e) => onDrop(e),
        onClick: (e) => {
          if (selectedPostId && !post) {
            e.stopPropagation();
            schedulePost(selectedPostId, wk, i);
          }
        },
      });
      if (post) slotEl.appendChild(createCalCard(post));
      slotsEl.appendChild(slotEl);
    }
    weekEl.appendChild(slotsEl);

    // Footer: count + draft info
    const draftInfo = draftCount ? " \u00b7 " + draftCount + " draft" : "";
    const ideaInfo = ideaCount ? " \u00b7 " + ideaCount + " idea" : "";
    weekEl.appendChild(el("div", { className: "week-footer" }, total + "/" + SLOTS_PER_WEEK + " Posts" + draftInfo + ideaInfo));

    rowEl.appendChild(weekEl);
  }
  cal.appendChild(rowEl);

  document.getElementById("navLabel").textContent =
    weekLabel(allWeeks[0].key) + " – " + weekLabel(allWeeks[allWeeks.length - 1].key) + "  (" + weeksPerRow + " KW)";

  const searchCountEl = document.getElementById("searchCount");
  searchCountEl.textContent = searchQuery
    ? plan.posts.filter(matchesSearch).length + " treffer"
    : "";
}

function createCalCard(post) {
  const t = typeOf(post.type);
  const s = post.slides || {};
  const fromJson = post.text || {};

  // Plan mode: always show full text
  const parts = [s.bigText || fromJson.slide1, s.s2 || fromJson.slide2, s.s3 || fromJson.slide3].filter(Boolean);
  const titleText = parts.join(" / ") || post.notes || post.id;

  const needsWork = post.status === "idea" || post.status === "draft";
  const isMatch = searchQuery && matchesSearch(post);
  const isDimmed = searchQuery && !isMatch;
  const statusColor = STATUS_COLORS[post.status] || STATUS_COLORS.idea;

  const cls = "cal-card cal-card-zoomed" + (needsWork ? " needs-work" : "") + (isMatch ? " search-match" : "") + (isDimmed ? " search-dim" : "");
  const children = [
    el("span", { className: "cal-card-type", style: { color: t.color } }, t.short),
    el("span", { className: "cal-card-status", style: { background: statusColor } }),
    el("span", { className: "cal-card-title" }, titleText),
  ];

  return el("div", {
    className: cls + (post.id === selectedPostId ? " selected" : ""),
    style: { borderLeftColor: t.color },
    "data-id": post.id,
    draggable: "true",
    onDragstart: (e) => onDragStart(e),
    onDragend: (e) => onDragEnd(e),
    onClick: (e) => { e.stopPropagation(); openPanel(post.id, e); },
  }, children);
}

// ── MIX Mode ────────────────────────────────────────────────────────────────
// Each week = one row. Posts shown as colored squares (color = type).
// No text, no titles — just the color mix at a glance.
// Editable note per week. Click week → timeline for that week.

// Tooltip for mix squares — instant, no native delay
let mixTip = null;
function showMixTip(e, text) {
  if (!mixTip) {
    mixTip = el("div", { className: "mix-tip" });
    document.body.appendChild(mixTip);
  }
  mixTip.textContent = text;
  mixTip.style.display = "block";
  const r = e.target.getBoundingClientRect();
  mixTip.style.left = r.left + "px";
  mixTip.style.top = (r.top - 26) + "px";
}
function hideMixTip() { if (mixTip) mixTip.style.display = "none"; }

function mixSq(color, tipText, statusChar) {
  const sq = el("div", {
    className: "mix-sq",
    style: { background: color },
    onMouseenter: (e) => showMixTip(e, tipText),
    onMouseleave: hideMixTip,
  });
  if (statusChar) sq.appendChild(el("span", { className: "mix-sq-status" }, statusChar));
  return sq;
}

function mixVisSq(design, tipText) {
  const d = designOf(design);
  return el("div", {
    className: "mix-vis",
    style: { background: d.bgColor, color: d.letterColor },
    onMouseenter: (e) => showMixTip(e, tipText),
    onMouseleave: hideMixTip,
  }, d.letter);
}

function renderMixGrid() {
  const totalWeeks = 26;
  const allWeeks = generateWeeks(totalWeeks, weekOffset);
  const currentWeek = getWeekStr(new Date());
  const postsByWeek = getPostsByWeek();
  const notes = plan.weekNotes || {};

  const cal = document.getElementById("calendar");
  cal.replaceChildren();
  cal.classList.remove("plan-mode");
  cal.classList.add("mix-mode");

  const list = el("div", { className: "mix-list" });

  for (const wkObj of allWeeks) {
    const wk = wkObj.key;
    const posts = postsByWeek.get(wk) || [];
    const n = posts.length;
    const isCurrent = wk === currentWeek;
    const isPast = wk < currentWeek;

    const row = el("div", {
      className: "mix-row" + (isCurrent ? " mix-row-current" : "") + (isPast ? " mix-row-past" : "") + (n === 0 ? " mix-row-empty" : ""),
    });

    // KW label — clickable to open week timeline
    const kwNum = weekLabel(wk).replace("KW", "");
    const label = el("div", {
      className: "mix-label",
      onClick: () => openWeekTimeline(wkObj, posts),
    }, [
      el("span", { className: "mix-kw" }, "KW"),
      el("span", { className: "mix-kw-num" }, kwNum),
      el("span", { className: "mix-date" }, formatMonday(wkObj.monday)),
    ]);
    row.appendChild(label);

    // Two rows of 7 squares: content type + visual design
    const grid = el("div", { className: "mix-grid" });

    // Row 1: Content type
    const typeRow = el("div", { className: "mix-sq-row" });
    typeRow.appendChild(el("span", { className: "mix-sq-label" }, "Typ"));
    for (let i = 0; i < SLOTS_PER_WEEK; i++) {
      const post = posts[i];
      if (post) {
        const t = typeOf(post.type);
        const s = post.slides || {};
        const fromJson = post.text || {};
        const title = s.bigText || fromJson.slide1 || s.smallText || post.notes || post.id;
        const statusChar = post.status === "idea" ? "I" : post.status === "draft" ? "D" : null;
        const tipText = t.short + " · " + title.replace(/\n/g, " ").substring(0, 60);
        typeRow.appendChild(mixSq(t.color, tipText, statusChar));
      } else {
        typeRow.appendChild(el("div", { className: "mix-sq mix-sq-empty" }));
      }
    }
    grid.appendChild(typeRow);

    // Row 2: Visual design — smaller rectangles with letter
    const designRow = el("div", { className: "mix-sq-row" });
    designRow.appendChild(el("span", { className: "mix-sq-label" }, "Vis"));
    for (let i = 0; i < SLOTS_PER_WEEK; i++) {
      const post = posts[i];
      if (post) {
        designRow.appendChild(mixVisSq(post.design, designOf(post.design).full));
      } else {
        designRow.appendChild(el("div", { className: "mix-vis mix-vis-empty" }));
      }
    }
    grid.appendChild(designRow);

    row.appendChild(grid);

    // Topic keywords — compact summary of what this week covers
    if (n > 0) {
      const topicCounts = {};
      posts.forEach(p => { if (p.topic) topicCounts[p.topic] = (topicCounts[p.topic] || 0) + 1; });
      const tags = el("div", { className: "mix-topics" });
      for (const [topic, count] of Object.entries(topicCounts).sort((a, b) => b[1] - a[1])) {
        const tp = topicOf(topic);
        tags.appendChild(el("span", {
          className: "mix-topic-tag",
          style: { color: tp.color },
          onMouseenter: (e) => showMixTip(e, tp.full + (count > 1 ? " (" + count + "x)" : "")),
          onMouseleave: hideMixTip,
        }, tp.short + (count > 1 ? "\u00d7" + count : "")));
      }
      row.appendChild(tags);
    }

    // Week note — inline editable
    const noteInput = el("input", {
      type: "text",
      className: "mix-note",
      value: notes[wk] || "",
      placeholder: n === 0 && !isPast ? "Thema / Plan..." : "",
      onInput: (e) => debouncedWeekNote(wk, e.target.value),
      onClick: (e) => e.stopPropagation(),
    });
    row.appendChild(noteInput);

    list.appendChild(row);
  }

  cal.appendChild(list);

  document.getElementById("navLabel").textContent =
    weekLabel(allWeeks[0].key) + " – " + weekLabel(allWeeks[allWeeks.length - 1].key) + "  (" + totalWeeks + " KW)";

  const searchCountEl = document.getElementById("searchCount");
  searchCountEl.textContent = searchQuery
    ? plan.posts.filter(matchesSearch).length + " treffer"
    : "";
}

// Debounced save for week notes
let weekNoteTimers = {};
function debouncedWeekNote(week, note) {
  if (!plan.weekNotes) plan.weekNotes = {};
  plan.weekNotes[week] = note;
  clearTimeout(weekNoteTimers[week]);
  weekNoteTimers[week] = setTimeout(async () => {
    await fetch("/api/week-note", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ week, note }),
    });
  }, 1500);
}

// Open timeline modal filtered to a single week
function openWeekTimeline(wkObj, posts) {
  const modal = document.getElementById("timelineModal");
  const body = document.getElementById("timelineBody");
  body.replaceChildren();

  const wk = wkObj.key;
  const kwNum = weekLabel(wk).replace("KW", "");
  document.getElementById("timelineRange").textContent = "KW" + kwNum + " — " + formatMonday(wkObj.monday);

  const weekDiv = el("div", { className: "tl-week" });

  if (posts.length === 0) {
    weekDiv.appendChild(el("div", { className: "tl-empty" }, "(keine Posts in dieser Woche)"));
  } else {
    for (const post of posts) {
      const t = typeOf(post.type);
      const s = post.slides || {};
      const fromJson = post.text || {};
      const parts = [
        s.bigText || fromJson.slide1,
        s.smallText,
        s.s2 || fromJson.slide2,
        s.s3 || fromJson.slide3,
        s.button || fromJson.button ? "Button: " + (s.button || fromJson.button) : null,
        s.uebrigens || fromJson.uebrigens ? "Uebrigens: " + (s.uebrigens || fromJson.uebrigens) : null,
      ].filter(Boolean).map(p => p.replace(/\n/g, " "));

      const lineChildren = [
        el("span", { className: "tl-type", style: { color: t.color } }, t.short),
      ];
      if (post.tag) {
        lineChildren.push(el("span", { className: "tl-type", style: { color: "#888" } }, "#" + post.tag + " "));
      }
      parts.forEach((part, i) => {
        if (i > 0) lineChildren.push(el("span", { className: "tl-sep" }, " / "));
        lineChildren.push(document.createTextNode(part));
      });

      weekDiv.appendChild(el("div", {
        className: "tl-post",
        style: { borderLeftColor: t.color, cursor: "pointer" },
        onClick: (e) => { e.stopPropagation(); openPanel(post.id, e); },
      }, lineChildren));
    }
  }

  body.appendChild(weekDiv);

  // Show note if exists
  const note = (plan.weekNotes || {})[wk];
  if (note) {
    body.appendChild(el("div", {
      className: "tl-week-note",
    }, [
      el("span", { style: { color: "var(--dim)", fontSize: "10px", fontFamily: "'JetBrains Mono', monospace" } }, "NOTIZ: "),
      document.createTextNode(note),
    ]));
  }

  timelineOpen = true;
  modal.classList.add("open");
}

// ── Backlog (4 columns) ──────────────────────────────────────────────────────

function renderBacklog() {
  const area = document.getElementById("backlogArea");
  area.replaceChildren();

  const allBacklog = plan.posts.filter((p) => !p.targetWeek && !p.hidden);
  const hiddenPosts = plan.posts.filter((p) => p.hidden && !p.targetWeek);
  const scheduledDimmed = plan.posts.filter((p) => p.targetWeek && p.status === "scheduled");
  const backlog = [...allBacklog, ...scheduledDimmed];
  const assignedTypes = new Set(columnTypes.filter((t) => t !== "_rest" && t !== "_all"));

  for (let colIdx = 0; colIdx < 4; colIdx++) {
    const colType = columnTypes[colIdx] || "_rest";
    const col = el("div", { className: "backlog-col" });

    // Filter posts for this column
    let colPosts;
    if (colType === "_hidden") {
      colPosts = hiddenPosts;
    } else if (colType === "_all") {
      colPosts = backlog;
    } else if (colType === "_rest") {
      colPosts = backlog.filter((p) => !assignedTypes.has(p.type));
    } else {
      colPosts = backlog.filter((p) => p.type === colType);
    }

    // Sort: pinned first, then by tag (stark > ok > ja > ad > geht > rewrite > none)
    const tagOrder = { stark: 0, ja: 1, ok: 2, ad: 3, rewrite: 4, geht: 5 };
    colPosts.sort((a, b) => {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      return (tagOrder[a.tag] ?? 6) - (tagOrder[b.tag] ?? 6);
    });

    // Header with type selector
    const headerBar = el("div", { className: "col-header-bar" });
    const select = el("select");
    const restCount = allBacklog.filter((p) => !assignedTypes.has(p.type)).length;
    const options = [
      { value: "_all", label: "Alle (" + allBacklog.length + ")" },
      { value: "_rest", label: "Uebrige (" + restCount + ")" },
      { value: "_hidden", label: "Ausgeblendet (" + hiddenPosts.length + ")" },
      ...Object.entries(TYPES).filter(([k]) => k !== "other").map(([k, v]) => ({
        value: k, label: v.full + " (" + allBacklog.filter((p) => p.type === k).length + ")",
      })),
    ];
    for (const opt of options) {
      const o = el("option", { value: opt.value }, opt.label);
      if (opt.value === colType) o.selected = true;
      select.appendChild(o);
    }
    select.addEventListener("change", () => {
      columnTypes[colIdx] = select.value;
      saveColumnConfig();
      renderBacklog();
    });
    headerBar.appendChild(select);
    headerBar.appendChild(el("span", { className: "col-count" }, String(colPosts.length)));
    col.appendChild(headerBar);

    // Scrollable list
    const scroll = el("div", {
      className: "col-scroll",
      "data-week": "",
      "data-slot": "0",
      onDragover: (e) => { e.preventDefault(); },
      onDrop: (e) => onDrop(e),
    });

    for (const post of colPosts) {
      scroll.appendChild(createBlItem(post));
    }
    col.appendChild(scroll);
    area.appendChild(col);
  }
}

function createBlItem(post) {
  const t = typeOf(post.type);
  const s = post.slides;
  const text = s?.bigText
    ? [s.bigText, s.s2, s.s3].filter(Boolean).join(" — ")
    : post.text?.slide1
      ? [post.text.slide1, post.text.slide2, post.text.slide3].filter(Boolean).join(" — ")
      : (post.notes || post.id);
  const needsWork = post.status === "idea" || post.status === "draft";
  const isScheduled = !!post.targetWeek;
  const isMatch = searchQuery && matchesSearch(post);
  const isDimmed = searchQuery && !isMatch;

  const cls = "bl-item"
    + (post.pinned ? " pinned" : "")
    + (needsWork ? " needs-work" : "")
    + (isScheduled ? " scheduled-dim" : "")
    + (post.hidden ? " hidden-post" : "")
    + (isMatch ? " search-match" : "")
    + (isDimmed ? " search-dim" : "");

  // Header row: pin + tag + type
  const headChildren = [];

  // Pin toggle
  const pin = el("span", {
    className: "bl-pin" + (post.pinned ? " active" : ""),
    onClick: (e) => { e.stopPropagation(); togglePin(post.id); },
  }, post.pinned ? "\u2605" : "\u2606");
  headChildren.push(pin);

  // Tag badge
  if (post.tag) {
    headChildren.push(el("span", {
      className: "bl-tag bl-tag-" + post.tag,
    }, "#" + post.tag));
  }

  // Status warning
  if (needsWork) {
    headChildren.push(el("span", { className: "bl-warn" }, "!" + post.status));
  }

  // Type (right-aligned)
  headChildren.push(el("span", { className: "bl-type", style: { color: t.color } }, t.short));

  const item = el("div", {
    className: cls + (post.id === selectedPostId ? " selected" : ""),
    style: { borderLeftColor: t.color },
    "data-id": post.id,
    draggable: "true",
    onDragstart: (e) => onDragStart(e),
    onDragend: (e) => onDragEnd(e),
    onClick: (e) => { e.stopPropagation(); openPanel(post.id, e); },
  }, [
    el("div", { className: "bl-item-head" }, headChildren),
    el("div", { className: "bl-item-text" }, text),
  ]);

  return item;
}

async function togglePin(id) {
  const post = plan.posts.find((p) => p.id === id);
  if (!post) return;
  post.pinned = !post.pinned;
  renderBacklog();
  await updatePost(id, "pinned", post.pinned);
}

// ── Stats ────────────────────────────────────────────────────────────────────

function renderStats() {
  const statsEl = document.getElementById("stats");
  statsEl.replaceChildren();

  const total = plan.posts.length;
  const published = plan.posts.filter((p) => p.status === "published").length;
  const scheduled = plan.posts.filter((p) => p.targetWeek && p.status !== "published").length;
  const backlog = total - scheduled - published;

  const schedTypes = {};
  plan.posts.filter((p) => p.targetWeek && p.status !== "published").forEach((p) => {
    schedTypes[p.type] = (schedTypes[p.type] || 0) + 1;
  });

  const parts = [];
  parts.push(el("span", { className: "num" }, String(total)));
  parts.push(document.createTextNode(" total  "));
  parts.push(el("span", { className: "num" }, String(scheduled)));
  parts.push(document.createTextNode(" eingeplant  "));
  parts.push(el("span", { className: "num" }, String(backlog)));
  parts.push(document.createTextNode(" backlog"));

  // Scheduled type breakdown
  if (scheduled > 0) {
    parts.push(document.createTextNode("  //  "));
    Object.entries(schedTypes).sort((a, b) => b[1] - a[1]).forEach(([t, c], i) => {
      if (i > 0) parts.push(document.createTextNode("  "));
      const pct = Math.round(c / scheduled * 100);
      parts.push(el("span", { style: { color: typeOf(t).color } }, typeOf(t).short + ":" + c + " (" + pct + "%)"));
    });
  }

  // #ad count
  const adCount = plan.posts.filter((p) => p.tag === "ad").length;
  const adScheduled = plan.posts.filter((p) => p.tag === "ad" && p.targetWeek).length;
  if (adCount > 0) {
    parts.push(document.createTextNode("  //  "));
    const adPct = scheduled > 0 ? Math.round(adScheduled / scheduled * 100) : 0;
    parts.push(el("span", { style: { color: "#06b6d4" } }, "#ad:" + adCount + " (geplant:" + adScheduled + "/" + adPct + "%)"));
  }

  for (const p of parts) statsEl.appendChild(p);
}

// ── Drag & Drop ──────────────────────────────────────────────────────────────

function onDragStart(e) {
  const card = e.target.closest("[data-id]");
  draggedId = card.dataset.id;
  card.classList.add("dragging");
  document.body.classList.add("dragging");
  e.dataTransfer.effectAllowed = "move";
}

function onDragEnd(e) {
  e.target.closest("[data-id]")?.classList.remove("dragging");
  document.body.classList.remove("dragging");
  document.querySelectorAll(".drag-over").forEach((x) => x.classList.remove("drag-over"));
}

// Shared: assign a post to a week/slot (or null to unschedule)
function applySlotAssignment(post, week, slotIndex) {
  const updates = [];
  if (week) {
    const weekPosts = plan.posts.filter((p) => p.targetWeek === week && p.id !== post.id);
    weekPosts.splice(slotIndex, 0, post);
    weekPosts.forEach((p, i) => {
      if (p.slotIndex !== i) {
        p.slotIndex = i;
        updates.push(updatePost(p.id, "slotIndex", i));
      }
    });
  }
  post.targetWeek = week;
  post.slotIndex = week ? slotIndex : null;
  updates.push(updatePost(post.id, "targetWeek", week));
  if (week) updates.push(updatePost(post.id, "slotIndex", slotIndex));
  if (week && post.status === "ready") {
    post.status = "scheduled";
    updates.push(updatePost(post.id, "status", "scheduled"));
  }
  if (!week && post.status === "scheduled") {
    post.status = "ready";
    updates.push(updatePost(post.id, "status", "ready"));
  }
  return updates;
}

async function onDrop(e) {
  e.preventDefault();
  e.currentTarget.classList.remove("drag-over");
  if (!draggedId) return;

  const slotEl = e.currentTarget.closest(".slot") || e.currentTarget;
  const week = slotEl.dataset.week || null;
  const slotIndex = parseInt(slotEl.dataset.slot || "0", 10);
  const post = plan.posts.find((p) => p.id === draggedId);
  if (!post) return;

  const updates = applySlotAssignment(post, week, slotIndex);
  draggedId = null;
  render();
  await Promise.all(updates);
}

// ── Detail Panel ─────────────────────────────────────────────────────────────

function openPanel(id, event) {
  const post = plan.posts.find((p) => p.id === id);
  if (!post) return;

  selectedPostId = id;
  document.body.classList.add("schedule-mode");

  const panel = detailPanelEl;
  const content = document.getElementById("panelContent");
  content.replaceChildren();

  // Position the panel near the clicked element
  if (event) {
    const clicked = event.currentTarget;
    const rect = clicked.getBoundingClientRect();
    const backlogCol = clicked.closest(".backlog-col");
    const backlogArea = document.getElementById("backlogArea");
    const backlogTop = backlogArea ? backlogArea.getBoundingClientRect().top : 0;

    if (backlogCol) {
      const colIdx = [...backlogCol.parentElement.children].indexOf(backlogCol);
      const colRect = backlogCol.getBoundingClientRect();
      if (colIdx < 3) {
        panel.style.left = colRect.right + "px";
      } else {
        panel.style.left = Math.max(0, colRect.left - 484) + "px";
      }
      panel.style.top = Math.max(40, Math.min(rect.top - 60, window.innerHeight * 0.15)) + "px";
    } else {
      // Calendar card — clamp so panel doesn't overflow bottom
      panel.style.left = Math.min(rect.right + 4, window.innerWidth - 490) + "px";
      panel.style.visibility = "hidden";
      panel.classList.add("open");
      const panelHeight = panel.offsetHeight;
      panel.classList.remove("open");
      panel.style.visibility = "";
      const maxTop = window.innerHeight - panelHeight - 20;
      panel.style.top = Math.max(40, Math.min(rect.top, maxTop)) + "px";
    }
  }

  // Title
  content.appendChild(el("h2", {}, post.id));

  // Action buttons row
  const actions = el("div", { style: { display: "flex", gap: "8px", marginBottom: "8px" } });

  // Hide/show toggle
  const hideBtn = el("span", {
    className: "unschedule-btn",
    onClick: (e) => { e.stopPropagation(); setField(post.id, "hidden", !post.hidden); openPanel(post.id); detailPanelEl.classList.add("open"); },
  }, post.hidden ? "Einblenden" : "Ausblenden");
  actions.appendChild(hideBtn);

  // Duplicate button
  const dupeBtn = el("span", {
    className: "unschedule-btn",
    onClick: (e) => { e.stopPropagation(); duplicatePost(post.id); },
  }, "Duplizieren");
  actions.appendChild(dupeBtn);

  // Show "duplicated from" info
  if (post.duplicatedFrom) {
    const srcPost = plan.posts.find((p) => p.id === post.duplicatedFrom);
    let srcInfo = "Kopie von " + post.duplicatedFrom;
    if (srcPost?.targetWeek) {
      srcInfo += " (eingeplant: " + srcPost.targetWeek + ")";
    } else {
      srcInfo += " (nicht eingeplant)";
    }
    actions.appendChild(el("span", { style: { fontSize: "9px", color: "var(--dim)", fontFamily: "'JetBrains Mono', monospace", marginLeft: "4px" } }, srcInfo));
  }

  content.appendChild(actions);

  // Schedule hint + unschedule button
  if (!post.targetWeek) {
    content.appendChild(el("div", { className: "schedule-hint" }, "\u2191 Klicke einen leeren Slot im Kalender um einzuplanen"));
  } else {
    const hintRow = el("div", { className: "schedule-hint" }, [
      el("span", {}, "Eingeplant: " + post.targetWeek + " "),
      el("span", {
        className: "unschedule-btn",
        onClick: (e) => { e.stopPropagation(); unschedulePost(post.id); },
      }, "Zurueck ins Backlog"),
    ]);
    content.appendChild(hintRow);
  }

  // Status dropdown
  content.appendChild(el("label", {}, "Status"));
  const statusSelect = el("select");
  for (const s of ["idea", "draft", "ready", "scheduled", "published"]) {
    const opt = el("option", { value: s }, s);
    if (post.status === s) opt.selected = true;
    statusSelect.appendChild(opt);
  }
  statusSelect.addEventListener("change", () => setField(post.id, "status", statusSelect.value));
  content.appendChild(statusSelect);

  // Type dropdown (exclude legacy billboard/terminal — those are now designs)
  content.appendChild(el("label", {}, "Typ"));
  const typeSelect = el("select");
  for (const [k, v] of Object.entries(TYPES)) {
    if (k === "other" || k === "billboard" || k === "terminal") continue;
    const opt = el("option", { value: k }, v.full);
    if (post.type === k) opt.selected = true;
    typeSelect.appendChild(opt);
  }
  typeSelect.addEventListener("change", () => setField(post.id, "type", typeSelect.value));
  content.appendChild(typeSelect);

  content.appendChild(el("label", {}, "Design"));
  const designSelect = el("select");
  for (const [k, v] of Object.entries(DESIGNS)) {
    if (k === "other") continue;
    const opt = el("option", { value: k }, v.full);
    if (post.design === k) opt.selected = true;
    designSelect.appendChild(opt);
  }
  const noDesignOpt = el("option", { value: "" }, "— nicht gesetzt —");
  if (!post.design) noDesignOpt.selected = true;
  designSelect.prepend(noDesignOpt);
  designSelect.addEventListener("change", () => setField(post.id, "design", designSelect.value || null));
  content.appendChild(designSelect);

  // Topic dropdown
  content.appendChild(el("label", {}, "Thema"));
  const topicSelect = el("select");
  const noTopicOpt = el("option", { value: "" }, "— kein Thema —");
  if (!post.topic) noTopicOpt.selected = true;
  topicSelect.appendChild(noTopicOpt);
  for (const [k, v] of Object.entries(TOPICS)) {
    if (k === "other") continue;
    const opt = el("option", { value: k }, v.full);
    if (post.topic === k) opt.selected = true;
    topicSelect.appendChild(opt);
  }
  topicSelect.addEventListener("change", () => setField(post.id, "topic", topicSelect.value || null));
  content.appendChild(topicSelect);

  // Tag dropdown
  content.appendChild(el("label", {}, "Tag"));
  const tagSelect = el("select");
  for (const t of [null, "stark", "ok", "ja", "ad", "rewrite", "geht"]) {
    const opt = el("option", { value: t || "" }, t ? "#" + t : "— kein Tag —");
    if ((post.tag || null) === t) opt.selected = true;
    tagSelect.appendChild(opt);
  }
  tagSelect.addEventListener("change", () => setField(post.id, "tag", tagSelect.value || null));
  content.appendChild(tagSelect);

  // Editable Slides — fields depend on visual design
  const slides = post.slides || {};
  const fromJson = post.text || {};
  const hasAnySlide = slides.bigText || slides.smallText || slides.s2 || slides.s3 || fromJson.slide1 || fromJson.slide2;
  const notesFallback = !hasAnySlide ? (post.notes || "") : "";

  const DESIGN_FIELDS = {
    "pixel-wall": {
      bigText: "S1 \u2014 Reaktionswort",
      smallText: "S1 \u2014 Zitat / Setup",
      s2: "S2 \u2014 Argument (Typewriter)",
      s3: "S3 \u2014 Punchline",
      button: true, uebrigens: true,
    },
    billboard: {
      bigText: "Hook-Text (gro\u00df, plakativ)",
      smallText: null,
      s2: "Argument",
      s3: "Punchline",
      button: true, uebrigens: true,
    },
    terminal: {
      bigText: "Prompt (z.B. '$ 23:47')",
      smallText: "Text Teil 1 (Typing)",
      s2: "Text Teil 2 (Typing, optional)",
      s3: "Schlusszeile",
      button: null, uebrigens: null,
    },
    newsjacking: {
      bigText: "Reaktionswort",
      smallText: "News-Kontext",
      s2: "Kommentar",
      s3: "Punchline",
      button: true, uebrigens: true,
    },
    "raw-photo": {
      bigText: "Text-Overlay auf Bild",
      smallText: null, s2: null, s3: null,
      button: null, uebrigens: null,
    },
  };

  const df = DESIGN_FIELDS[post.design] || DESIGN_FIELDS["pixel-wall"];

  function slideField(key, label, jsonKey, cssClass, fallback) {
    const val = slides[key] ?? fromJson[jsonKey] ?? fallback ?? "";
    const group = el("div", { className: "slide-group" });
    group.appendChild(el("label", {}, label));
    const area = el("textarea", { className: cssClass || "" }, val);
    area.addEventListener("input", () => {
      if (!post.slides) post.slides = {};
      post.slides[key] = area.value;
      debouncedSave(post.id, "slides", post.slides);
    });
    group.appendChild(area);
    return group;
  }

  // Terminal: color dropdown
  if (post.design === "terminal") {
    content.appendChild(el("label", {}, "Terminal-Farbe"));
    const colorSelect = el("select");
    for (const c of ["green", "amber", "white"]) {
      const opt = el("option", { value: c }, c);
      if ((slides.terminalColor || "green") === c) opt.selected = true;
      colorSelect.appendChild(opt);
    }
    colorSelect.addEventListener("change", () => {
      if (!post.slides) post.slides = {};
      post.slides.terminalColor = colorSelect.value;
      debouncedSave(post.id, "slides", post.slides);
    });
    content.appendChild(colorSelect);
  }

  // Slide fields — only render if design config says so
  if (df.bigText) content.appendChild(slideField("bigText", df.bigText, "slide1", "", notesFallback));
  if (df.smallText) content.appendChild(slideField("smallText", df.smallText, "", ""));
  if (df.s2) content.appendChild(slideField("s2", df.s2, "slide2", "slide-main", ""));
  if (df.s3) content.appendChild(slideField("s3", df.s3, "slide3", "", ""));

  // Button / Uebrigens — only for designs that support them
  const hasButton = df.button && ("button" in slides || fromJson.button);
  const hasUebrigens = df.uebrigens && ("uebrigens" in slides || fromJson.uebrigens);

  if (hasButton) {
    content.appendChild(slideField("button", "Button (gedimmt, optional)", "button", "", ""));
  }
  if (hasUebrigens) {
    content.appendChild(slideField("uebrigens", "Uebrigens (optional)", "uebrigens", "", ""));
  }

  function addFieldLink(label, key) {
    return el("span", {
      style: { fontSize: "10px", color: "var(--dim)", cursor: "pointer", fontFamily: "'JetBrains Mono', monospace", marginRight: "12px" },
      onClick: (e) => {
        e.stopPropagation();
        if (!post.slides) post.slides = {};
        post.slides[key] = "";
        setSlides(post.id, post.slides);
        openPanel(post.id);
        detailPanelEl.classList.add("open");
      },
    }, label);
  }

  if (df.button && df.uebrigens && (!hasButton || !hasUebrigens)) {
    const links = el("div", { style: { padding: "4px 0" } });
    if (!hasButton) links.appendChild(addFieldLink("+ Button", "button"));
    if (!hasUebrigens) links.appendChild(addFieldLink("+ Uebrigens", "uebrigens"));
    content.appendChild(links);
  }

  if (post.json) {
    content.appendChild(el("label", {}, "JSON"));
    content.appendChild(el("div", { className: "mono-value" }, post.json));
  }

  if (post.tagComment) {
    content.appendChild(el("label", {}, "Tag-Kommentar"));
    content.appendChild(el("div", { className: "mono-value" }, post.tagComment));
  }

  // Format (video / carousel / both)
  content.appendChild(el("label", {}, "Format"));
  const formatSelect = el("select");
  for (const f of ["both", "video", "carousel"]) {
    const opt = el("option", { value: f }, f === "both" ? "Video + Carousel" : f === "video" ? "Nur Video" : "Nur Carousel");
    if ((post.format || "both") === f) opt.selected = true;
    formatSelect.appendChild(opt);
  }
  formatSelect.addEventListener("change", () => setField(post.id, "format", formatSelect.value));
  content.appendChild(formatSelect);

  // Platform-specific captions & hashtags
  const social = post.social || {};
  function socialField(platform, field, label, isTextarea, placeholder) {
    const key = platform + "." + field;
    const val = social[platform]?.[field] || "";
    content.appendChild(el("label", {}, label));
    const input = isTextarea
      ? el("textarea", { style: { minHeight: "36px" }, placeholder: placeholder || "" }, val)
      : el("input", { type: "text", value: val, placeholder: placeholder || "" });
    input.addEventListener("input", () => {
      if (!post.social) post.social = {};
      if (!post.social[platform]) post.social[platform] = {};
      post.social[platform][field] = input.value;
      debouncedSave(post.id, "social", post.social);
    });
    content.appendChild(input);
  }

  // TikTok
  socialField("tiktok", "caption", "TikTok Caption", true, "Hook + Keywords...");
  socialField("tiktok", "hashtags", "TikTok Hashtags", false, "#informatik #unileben");
  // YouTube
  socialField("youtube", "title", "YouTube Titel", false, "Klarer Titel (max 70 Zeichen)");
  socialField("youtube", "description", "YouTube Description", true, "SEO-Beschreibung...");
  socialField("youtube", "hashtags", "YouTube Hashtags", false, "#Shorts #Informatik");
  // Instagram
  socialField("instagram", "caption", "Instagram Caption", true, "Hook + thematische Keywords...");
  socialField("instagram", "hashtags", "Instagram Hashtags", false, "#informatik #studium");

  // Notes (freeform comments, separate from slide content)
  content.appendChild(el("label", {}, "Notizen"));
  const notesArea = el("textarea", {}, post.notes || "");
  notesArea.addEventListener("input", () => debouncedSave(post.id, "notes", notesArea.value));
  content.appendChild(notesArea);

  if (post.source) {
    content.appendChild(el("label", {}, "Quelle"));
    content.appendChild(el("div", { className: "mono-value" }, post.source));
  }

  panel.classList.add("open");

  // Toggle selected class without full re-render
  document.querySelectorAll(".selected").forEach((x) => x.classList.remove("selected"));
  document.querySelectorAll("[data-id=\"" + id + "\"]").forEach((x) => x.classList.add("selected"));
}

function closePanel() {
  selectedPostId = null;
  document.body.classList.remove("schedule-mode");
  detailPanelEl.classList.remove("open");
  document.querySelectorAll(".selected").forEach((x) => x.classList.remove("selected"));
}

async function schedulePost(postId, week, slotIndex) {
  const post = plan.posts.find((p) => p.id === postId);
  if (!post) return;

  const updates = applySlotAssignment(post, week, slotIndex);

  // Patch schedule hint in-place instead of rebuilding the whole panel
  const hint = detailPanelEl.querySelector(".schedule-hint");
  if (hint) {
    hint.textContent = week
      ? "Eingeplant: " + week + " — klicke anderen Slot zum Verschieben"
      : "\u2191 Klicke einen leeren Slot im Kalender um einzuplanen";
  }

  renderCalendar();
  renderBacklog();
  renderStats();
  await Promise.all(updates);
}

async function duplicatePost(srcId) {
  const src = plan.posts.find((p) => p.id === srcId);
  if (!src) return;
  const newId = src.id + "-copy-" + Date.now().toString(36).slice(-4);
  const copy = JSON.parse(JSON.stringify(src));
  copy.id = newId;
  copy.targetWeek = null;
  copy.slotIndex = null;
  copy.status = src.status === "published" ? "draft" : src.status;
  copy.json = null;
  copy.publishedDate = null;
  copy.platforms = {};
  copy.duplicatedFrom = srcId;
  plan.posts.push(copy);
  showSaveStatus("saving");
  const res = await fetch("/api/plan", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(plan),
  });
  showSaveStatus(res.ok ? "saved" : "error");
  render();
  openPanel(newId);
  detailPanelEl.classList.add("open");
}

async function unschedulePost(postId) {
  const post = plan.posts.find((p) => p.id === postId);
  if (!post) return;
  const updates = applySlotAssignment(post, null, null);
  render();
  openPanel(postId);
  detailPanelEl.classList.add("open");
  await Promise.all(updates);
}

async function setField(id, field, value) {
  const post = plan.posts.find((p) => p.id === id);
  if (post) post[field] = value;
  showSaveStatus("saving");
  const ok = await updatePost(id, field, value);
  showSaveStatus(ok ? "saved" : "error");
  render();
}

async function setSlides(id, slides) {
  showSaveStatus("saving");
  const ok = await updatePost(id, "slides", slides);
  showSaveStatus(ok ? "saved" : "error");
}

function showSaveStatus(state) {
  let indicator = detailPanelEl.querySelector(".save-indicator");
  if (!indicator) {
    indicator = el("span", { className: "save-indicator" });
    const h2 = detailPanelEl.querySelector("h2");
    if (h2) h2.parentNode.insertBefore(indicator, h2.nextSibling);
    else detailPanelEl.prepend(indicator);
  }
  indicator.className = "save-indicator " + state;
  indicator.textContent = state === "saving" ? "Speichern..." : state === "saved" ? "Gespeichert \u2713" : "Fehler!";
  if (state === "saved") {
    setTimeout(() => { indicator.classList.add("fade"); }, 1500);
  }
}

// ── Timeline Modal ───────────────────────────────────────────────────────────

let timelineOpen = false;

function toggleTimeline() {
  timelineOpen = !timelineOpen;
  const modal = document.getElementById("timelineModal");
  if (timelineOpen) {
    renderTimeline();
    modal.classList.add("open");
  } else {
    modal.classList.remove("open");
  }
}

function renderTimeline() {
  const allWeeks = generateWeeks(26, weekOffset);
  const body = document.getElementById("timelineBody");
  body.replaceChildren();

  document.getElementById("timelineRange").textContent =
    weekLabel(allWeeks[0].key) + " – " + weekLabel(allWeeks[allWeeks.length - 1].key);

  const postsByWeek = new Map();
  for (const p of plan.posts) {
    if (p.targetWeek) {
      if (!postsByWeek.has(p.targetWeek)) postsByWeek.set(p.targetWeek, []);
      postsByWeek.get(p.targetWeek).push(p);
    }
  }
  for (const [, posts] of postsByWeek) {
    posts.sort((a, b) => (a.slotIndex ?? 99) - (b.slotIndex ?? 99));
  }

  for (const wkObj of allWeeks) {
    const wk = wkObj.key;
    const posts = postsByWeek.get(wk) || [];
    const weekDiv = el("div", { className: "tl-week" });

    const kwNum = weekLabel(wk).replace("KW", "");
    weekDiv.appendChild(el("div", { className: "tl-kw" }, [
      el("span", {}, "KW"),
      el("span", { className: "tl-kw-num" }, kwNum),
      el("span", { className: "tl-kw-date" }, formatMonday(wkObj.monday)),
    ]));

    if (posts.length === 0) {
      weekDiv.appendChild(el("div", { className: "tl-empty" }, "(leer)"));
    } else {
      for (const post of posts) {
        const t = typeOf(post.type);
        const s = post.slides || {};
        const fromJson = post.text || {};

        // Build text parts: all non-empty fields joined with /
        const parts = [
          s.bigText || fromJson.slide1,
          s.smallText,
          s.s2 || fromJson.slide2,
          s.s3 || fromJson.slide3,
          s.button || fromJson.button ? "Button: " + (s.button || fromJson.button) : null,
          s.uebrigens || fromJson.uebrigens ? "Uebrigens: " + (s.uebrigens || fromJson.uebrigens) : null,
        ].filter(Boolean).map((p) => p.replace(/\n/g, " "));

        const lineChildren = [
          el("span", { className: "tl-type", style: { color: t.color } }, t.short),
        ];
        if (post.tag) {
          lineChildren.push(el("span", { className: "tl-type", style: { color: "#888" } }, "#" + post.tag + " "));
        }

        parts.forEach((part, i) => {
          if (i > 0) lineChildren.push(el("span", { className: "tl-sep" }, " / "));
          lineChildren.push(document.createTextNode(part));
        });

        weekDiv.appendChild(el("div", {
          className: "tl-post",
          style: { borderLeftColor: t.color },
        }, lineChildren));
      }
    }

    body.appendChild(weekDiv);
  }
}

// ── Event Listeners ──────────────────────────────────────────────────────────

const detailPanelEl = document.getElementById("detailPanel");

document.getElementById("panelClose").addEventListener("click", closePanel);
document.getElementById("timelineBtn").addEventListener("click", toggleTimeline);
document.getElementById("timelineClose").addEventListener("click", toggleTimeline);
document.getElementById("modePlan").addEventListener("click", () => setViewMode("plan"));
document.getElementById("modeMix").addEventListener("click", () => setViewMode("mix"));

document.addEventListener("click", (e) => {
  if (!selectedPostId) return;
  if (detailPanelEl.contains(e.target)) return;
  if (e.target.closest("[data-id]")) return;
  if (e.target.closest(".slot")) return;
  closePanel();
});

document.getElementById("navPrev").addEventListener("click", () => { weekOffset -= (viewMode === "plan" ? 1 : 13); render(); });
document.getElementById("navNext").addEventListener("click", () => { weekOffset += (viewMode === "plan" ? 1 : 13); render(); });

const searchInput = document.getElementById("searchInput");
const searchBox = searchInput.closest(".search-box");

let searchTimer = null;
searchInput.addEventListener("input", (e) => {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => {
    searchQuery = e.target.value.trim();
    searchBox.classList.toggle("has-query", !!searchQuery);
    render();
  }, 150);
});

document.getElementById("searchClear").addEventListener("click", () => {
  searchQuery = "";
  searchInput.value = "";
  searchBox.classList.remove("has-query");
  render();
});

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    if (timelineOpen) { toggleTimeline(); return; }
    const hadPanel = !!selectedPostId;
    const hadSearch = !!searchQuery;
    if (hadPanel) closePanel();
    if (hadSearch) {
      searchQuery = "";
      searchInput.value = "";
      searchBox.classList.remove("has-query");
    }
    if (hadSearch) render();
  }
  if ((e.metaKey || e.ctrlKey) && e.key === "l") {
    e.preventDefault();
    toggleTimeline();
  }
  if (e.key === "t" && !e.metaKey && !e.ctrlKey && document.activeElement.tagName !== "INPUT" && document.activeElement.tagName !== "TEXTAREA" && document.activeElement.tagName !== "SELECT") {
    toggleTimeline();
  }
  if (e.key === "m" && !e.metaKey && !e.ctrlKey && document.activeElement.tagName !== "INPUT" && document.activeElement.tagName !== "TEXTAREA" && document.activeElement.tagName !== "SELECT") {
    setViewMode(viewMode === "plan" ? "mix" : "plan");
  }
  if ((e.metaKey || e.ctrlKey) && (e.key === "k" || e.key === "f")) {
    e.preventDefault();
    searchInput.focus();
    searchInput.select();
  }
});

// ── Auto-poll for external plan.json changes ─────────────────────────────────

let lastPlanHash = "";

async function pollPlan() {
  try {
    const res = await fetch("/api/plan");
    const data = await res.json();
    const hash = JSON.stringify(data.posts.map((p) => p.id + p.status + (p.targetWeek || "") + (p.hidden || ""))).substring(0, 2000);
    if (lastPlanHash && hash !== lastPlanHash) {
      plan = data;
      render();
    }
    lastPlanHash = hash;
  } catch {}
}

setInterval(pollPlan, 4000);

// ── Auto-save idle textareas ─────────────────────────────────────────────────

let pendingSaves = new Map(); // field → { id, field, value, timer }

function debouncedSave(id, field, value) {
  const key = id + ":" + field;
  const existing = pendingSaves.get(key);
  if (existing) clearTimeout(existing.timer);
  const timer = setTimeout(async () => {
    pendingSaves.delete(key);
    const post = plan.posts.find((p) => p.id === id);
    if (post) post[field] = value;
    showSaveStatus("saving");
    const ok = await updatePost(id, field, value);
    showSaveStatus(ok ? "saved" : "error");
  }, 2000);
  pendingSaves.set(key, { id, field, value, timer });
}

// ── Init ─────────────────────────────────────────────────────────────────────

// Set initial mode button state
document.getElementById("modePlan").classList.toggle("active", viewMode === "plan");
document.getElementById("modeMix").classList.toggle("active", viewMode === "mix");
document.body.classList.toggle("mix-active", viewMode === "mix");

loadPlan();
