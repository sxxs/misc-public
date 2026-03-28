// @herdom.bamberg — Pipeline UI v4
// Split-pane: fixed calendar top, 4-column filterable backlog bottom.

// ── Types ────────────────────────────────────────────────────────────────────

const TYPES = {
  contrarian:   { short: "CTR",   full: "Contrarian",    color: "#facc15" },
  newsjacking:  { short: "NEWS",  full: "Newsjacking",   color: "#ef4444" },
  "wusstest-du":{ short: "WDU",   full: "Wusstest du",   color: "#f59e0b" },
  billboard:    { short: "BILL",  full: "Billboard",     color: "#e0e0e0" },
  terminal:     { short: "TERM",  full: "Terminal",      color: "#33ff33" },
  nachtgedanke: { short: "NACHT", full: "Nachtgedanke",  color: "#ffb000" },
  selbstironie: { short: "META",  full: "Selbstironie",  color: "#888" },
  witz:         { short: "WITZ",  full: "Witz",          color: "#d4a017" },
  parodie:      { short: "PARO",  full: "Parodie",       color: "#06b6d4" },
  overselling:  { short: "OVER",  full: "Overselling",   color: "#f97316" },
  stitch:       { short: "STTCH", full: "Stitch",        color: "#a78bfa" },
  other:        { short: "MISC",  full: "Sonstige",      color: "#555" },
};

function typeOf(t) { return TYPES[t] || TYPES.other; }

const STATUS_COLORS = {
  idea: "#555", draft: "#f59e0b", ready: "#22c55e",
  scheduled: "#3b82f6", published: "#06b6d4",
};

const SLOTS_PER_WEEK = 7;

const DEFAULT_COLUMNS = ["contrarian", "billboard", "terminal", "_rest"];

// ── State ────────────────────────────────────────────────────────────────────

let plan = { posts: [] };
let draggedId = null;
let weekOffset = 0;
let searchQuery = "";
let columnTypes = loadColumnConfig();
let selectedPostId = null;
let weeksPerRow = 13;

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

function render() {
  renderCalendar();
  renderBacklog();
  renderStats();
}

// ── Calendar ─────────────────────────────────────────────────────────────────

function renderCalendar() {
  const totalWeeks = weeksPerRow * 2;
  const allWeeks = generateWeeks(totalWeeks, weekOffset);
  const row1 = allWeeks.slice(0, weeksPerRow);
  const row2 = allWeeks.slice(weeksPerRow);
  const currentWeek = getWeekStr(new Date());

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

  const cal = document.getElementById("calendar");
  cal.replaceChildren();

  for (const row of [row1, row2]) {
    const rowEl = el("div", {
      className: "cal-row",
      style: { gridTemplateColumns: "repeat(" + weeksPerRow + ", minmax(0, 1fr))" },
    });
    for (const wkObj of row) {
      const wk = wkObj.key;
      const posts = postsByWeek.get(wk) || [];
      const cls = "week" + (wk === currentWeek ? " current" : "") + (wk < currentWeek ? " past" : "");
      const weekEl = el("div", { className: cls });

      const kwNum = weekLabel(wk).replace("KW", "");
      weekEl.appendChild(el("div", { className: "week-header" }, [
        el("span", { className: "week-kw" }, [
          el("span", { className: "week-kw-prefix" }, "KW"),
          el("span", { className: "week-kw-num" }, kwNum),
        ]),
        el("span", { className: "week-date" }, formatMonday(wkObj.monday)),
      ]));

      const slotsEl = el("div", { className: "week-slots" });
      for (let i = 0; i < SLOTS_PER_WEEK; i++) {
        const post = posts[i];
        const slotEl = el("div", {
          className: "slot" + (!post ? " empty-hint" : ""),
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
      rowEl.appendChild(weekEl);
    }
    cal.appendChild(rowEl);
  }

  document.getElementById("navLabel").textContent =
    weekLabel(row1[0].key) + " – " + weekLabel(row2[row2.length - 1].key) + "  (" + totalWeeks + " KW)";

  const searchCountEl = document.getElementById("searchCount");
  searchCountEl.textContent = searchQuery
    ? plan.posts.filter(matchesSearch).length + " treffer"
    : "";
}

function createCalCard(post) {
  const t = typeOf(post.type);
  const s = post.slides || {};
  const fromJson = post.text || {};

  // Adapt content to zoom level
  let titleText;
  if (weeksPerRow <= 4) {
    // Zoomed in: show all slides joined
    const parts = [s.bigText || fromJson.slide1, s.s2 || fromJson.slide2, s.s3 || fromJson.slide3].filter(Boolean);
    titleText = parts.join(" / ") || post.notes || post.id;
  } else if (weeksPerRow <= 7) {
    // Medium: show S1 + start of S2
    const s1 = s.bigText || fromJson.slide1 || "";
    const s2 = s.s2 || fromJson.slide2 || "";
    titleText = s1 + (s2 ? " / " + s2 : "") || post.notes || post.id;
  } else {
    // Zoomed out: short title
    titleText = (s.bigText || fromJson.slide1 || s.s2 || fromJson.slide2?.substring(0, 30) || post.notes || post.id);
  }

  const needsWork = post.status === "idea" || post.status === "draft";
  const isMatch = searchQuery && matchesSearch(post);
  const isDimmed = searchQuery && !isMatch;
  const isZoomed = weeksPerRow <= 7;

  const cls = "cal-card" + (needsWork ? " needs-work" : "") + (isMatch ? " search-match" : "") + (isDimmed ? " search-dim" : "") + (isZoomed ? " cal-card-zoomed" : "");
  const children = [
    el("span", { className: "cal-card-title" }, titleText),
    el("span", { className: "cal-card-type", style: { color: t.color } }, t.short),
  ];
  if (needsWork) children.push(el("span", { className: "cal-card-warn" }, "!" + post.status));

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
  e.dataTransfer.effectAllowed = "move";
}

function onDragEnd(e) {
  e.target.closest("[data-id]")?.classList.remove("dragging");
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
      // Calendar card
      panel.style.left = Math.min(rect.right + 4, window.innerWidth - 490) + "px";
      panel.style.top = Math.max(40, rect.top) + "px";
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

  // Type dropdown
  content.appendChild(el("label", {}, "Typ"));
  const typeSelect = el("select");
  for (const [k, v] of Object.entries(TYPES)) {
    if (k === "other") continue;
    const opt = el("option", { value: k }, v.full);
    if (post.type === k) opt.selected = true;
    typeSelect.appendChild(opt);
  }
  typeSelect.addEventListener("change", () => setField(post.id, "type", typeSelect.value));
  content.appendChild(typeSelect);

  content.appendChild(el("label", {}, "Design"));
  const designSelect = el("select");
  for (const d of [null, "pixel-wall", "terminal", "billboard", "newsjacking"]) {
    const opt = el("option", { value: d || "" }, d || "— nicht gesetzt —");
    if ((post.design || null) === d) opt.selected = true;
    designSelect.appendChild(opt);
  }
  designSelect.addEventListener("change", () => setField(post.id, "design", designSelect.value || null));
  content.appendChild(designSelect);

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

  // Editable Slides — matches Remotion JSON structure:
  // slide1: { bigText, smallText }  slide2: { text }  slide3: { text, button?, übrigensText? }
  const slides = post.slides || {};
  const fromJson = post.text || {};
  const hasAnySlide = slides.bigText || slides.s2 || slides.s3 || fromJson.slide1 || fromJson.slide2;
  const notesFallback = !hasAnySlide ? (post.notes || "") : "";

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

  // S1: bigText (hook/reaction) + smallText (context line)
  content.appendChild(slideField("bigText", "S1 — bigText (Hook / Reaktion)", "slide1", "", notesFallback));
  content.appendChild(slideField("smallText", "S1 — smallText (Kontext, optional)", "", ""));

  // S2: main text
  content.appendChild(slideField("s2", "S2 — Text (Argument / Punchline)", "slide2", "slide-main", ""));

  // S3: punchline + optional button + optional uebrigens
  content.appendChild(slideField("s3", "S3 — Text (Punch / Closer)", "slide3", "", ""));

  const hasButton = "button" in slides || fromJson.button;
  const hasUebrigens = "uebrigens" in slides || fromJson.uebrigens;

  if (hasButton) {
    content.appendChild(slideField("button", "S3 — Button (gedimmt, optional)", "button", "", ""));
  }
  if (hasUebrigens) {
    content.appendChild(slideField("uebrigens", "S3 — Uebrigens (optional)", "uebrigens", "", ""));
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

  if (!hasButton || !hasUebrigens) {
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

  // Description (for TikTok/YouTube/Instagram caption)
  content.appendChild(el("label", {}, "Description / Caption"));
  const descArea = el("textarea", { style: { minHeight: "50px" } }, post.description || "");
  descArea.addEventListener("input", () => debouncedSave(post.id, "description", descArea.value));
  content.appendChild(descArea);

  // Hashtags
  content.appendChild(el("label", {}, "Hashtags"));
  const hashInput = el("input", { type: "text", value: post.hashtags || "", placeholder: "#informatik #bamberg #wiai" });
  hashInput.addEventListener("input", () => debouncedSave(post.id, "hashtags", hashInput.value));
  content.appendChild(hashInput);

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
document.getElementById("zoomIn").addEventListener("click", () => {
  if (weeksPerRow > 2) { weeksPerRow = Math.max(2, weeksPerRow - 2); render(); }
});
document.getElementById("zoomOut").addEventListener("click", () => {
  if (weeksPerRow < 13) { weeksPerRow += 2; render(); }
});

document.addEventListener("click", (e) => {
  if (!selectedPostId) return;
  if (detailPanelEl.contains(e.target)) return;
  if (e.target.closest("[data-id]")) return;
  if (e.target.closest(".slot")) return;
  closePanel();
});

document.getElementById("navPrev").addEventListener("click", () => { weekOffset -= 13; render(); });
document.getElementById("navNext").addEventListener("click", () => { weekOffset += 13; render(); });

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

loadPlan();
