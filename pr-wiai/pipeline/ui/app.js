// @herdom.bamberg — Swimlane Calendar UI
// All DOM manipulation uses safe methods (textContent, createElement) — no innerHTML.

// ── Constants ────────────────────────────────────────────────────────────────

const TYPE_ORDER = [
  "contrarian", "newsjacking", "wusstest-du",
  "billboard", "terminal", "nachtgedanke",
  "selbstironie", "witz", "parodie", "overselling", "other",
];

const TYPE_LABELS = {
  contrarian: "Contrarian / LED-Wall",
  newsjacking: "Newsjacking",
  "wusstest-du": "Wusstest du schon",
  billboard: "Billboard / Aphorismus",
  terminal: "Terminal",
  nachtgedanke: "Nachtgedanke",
  selbstironie: "Selbstironie / Meta",
  witz: "Witz",
  parodie: "Clickbait-Parodie",
  overselling: "Overselling",
  other: "Sonstige",
};

const TYPE_COLORS = {
  contrarian: "#facc15", newsjacking: "#ef4444", "wusstest-du": "#f59e0b",
  billboard: "#ffffff", terminal: "#33ff33", nachtgedanke: "#ffb000",
  selbstironie: "#888", witz: "#facc15", parodie: "#06b6d4",
  overselling: "#f59e0b", other: "#666",
};

const STATUS_COLORS = {
  idea: "#666", draft: "#f59e0b", ready: "#22c55e",
  scheduled: "#3b82f6", published: "#06b6d4",
};

// ── State ────────────────────────────────────────────────────────────────────

let plan = { posts: [] };
let draggedId = null;

// ── API ──────────────────────────────────────────────────────────────────────

async function loadPlan() {
  const res = await fetch("/api/plan");
  plan = await res.json();
  render();
}

async function updatePost(id, field, value) {
  await fetch("/api/post", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id, field, value }),
  });
}

// ── Week helpers ─────────────────────────────────────────────────────────────

function getWeekStr(date) {
  const d = new Date(date);
  const jan1 = new Date(d.getFullYear(), 0, 1);
  const days = Math.floor((d - jan1) / 86400000);
  const wk = Math.ceil((days + jan1.getDay() + 1) / 7);
  return d.getFullYear() + "-KW" + String(wk).padStart(2, "0");
}

function weekLabel(wk) {
  return wk.replace(/^\d{4}-/, "");
}

function generateWeeks(count) {
  const weeks = [];
  const now = new Date();
  const dayOfWeek = now.getDay() || 7;
  const monday = new Date(now);
  monday.setDate(now.getDate() - dayOfWeek + 1);
  for (let i = 0; i < count; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i * 7);
    weeks.push(getWeekStr(d));
  }
  return weeks;
}

// ── DOM Helpers ──────────────────────────────────────────────────────────────

function el(tag, attrs, children) {
  const node = document.createElement(tag);
  if (attrs) {
    for (const [k, v] of Object.entries(attrs)) {
      if (k === "className") node.className = v;
      else if (k.startsWith("on")) node.addEventListener(k.slice(2).toLowerCase(), v);
      else if (k === "style" && typeof v === "object") Object.assign(node.style, v);
      else node.setAttribute(k, v);
    }
  }
  if (children) {
    if (typeof children === "string") node.textContent = children;
    else if (Array.isArray(children)) children.forEach((c) => { if (c) node.appendChild(c); });
    else node.appendChild(children);
  }
  return node;
}

// ── Render ────────────────────────────────────────────────────────────────────

function render() {
  const weeks = generateWeeks(12);
  const currentWeek = getWeekStr(new Date());

  const activeTypes = [...new Set(plan.posts.map((p) =>
    TYPE_ORDER.includes(p.type) ? p.type : "other"
  ))].sort((a, b) => TYPE_ORDER.indexOf(a) - TYPE_ORDER.indexOf(b));

  const grid = document.getElementById("grid");
  grid.style.gridTemplateColumns = "130px repeat(" + weeks.length + ", 140px) 180px";
  grid.replaceChildren(); // clear safely

  // Corner cell
  grid.appendChild(el("div", { className: "col-header" }));

  // Week headers
  for (const wk of weeks) {
    const cls = "col-header" + (wk === currentWeek ? " current" : "");
    grid.appendChild(el("div", { className: cls }, weekLabel(wk)));
  }
  grid.appendChild(el("div", { className: "col-header backlog" }, "Backlog"));

  // Build lookup map: (type, week) → posts[] — avoids O(N*W) filter scans
  const postsByCell = new Map();
  for (const p of plan.posts) {
    const t = mapType(p.type);
    const w = p.targetWeek || "";
    const key = t + "|" + w;
    if (!postsByCell.has(key)) postsByCell.set(key, []);
    postsByCell.get(key).push(p);
  }

  // Rows
  for (const type of activeTypes) {
    const color = TYPE_COLORS[type] || "#666";
    const dot = el("div", { className: "dot", style: { background: color } });
    const rowHeader = el("div", { className: "row-header" }, [dot, el("span", {}, TYPE_LABELS[type] || type)]);
    grid.appendChild(rowHeader);

    for (const wk of weeks) {
      const cell = createCell(wk, type, postsByCell.get(type + "|" + wk) || []);
      grid.appendChild(cell);
    }

    const cell = createCell("", type, postsByCell.get(type + "|") || []);
    grid.appendChild(cell);
  }

  // Stats
  const statsEl = document.getElementById("stats");
  statsEl.replaceChildren();
  const total = plan.posts.length;
  const ready = plan.posts.filter((p) => p.status === "ready").length;
  const scheduled = plan.posts.filter((p) => p.targetWeek).length;
  const contrPct = Math.round(plan.posts.filter((p) => p.type === "contrarian").length / total * 100);

  statsEl.appendChild(document.createTextNode(total + " Posts | " + ready + " ready | " + scheduled + " eingeplant"));
  if (contrPct > 60) {
    const warn = el("span", { className: "warn" }, " | Contrarian-Skew " + contrPct + "%");
    statsEl.appendChild(warn);
  }
}

function mapType(type) {
  return TYPE_ORDER.includes(type) ? type : "other";
}

function createCell(week, type, posts) {
  const cell = el("div", {
    className: "cell",
    "data-week": week,
    "data-type": type,
    onDragover: (e) => { e.preventDefault(); e.currentTarget.classList.add("drag-over"); },
    onDragleave: (e) => { e.currentTarget.classList.remove("drag-over"); },
    onDrop: (e) => onDrop(e),
  });
  for (const p of posts) {
    cell.appendChild(createCard(p));
  }
  return cell;
}

function createCard(post) {
  const displayTitle = (post.text?.slide1 || post.text?.slide2?.substring(0, 30) || post.id).substring(0, 25);
  const titleEl = el("div", { className: "title" }, displayTitle);
  const metaEl = el("div", { className: "meta" }, post.id);
  const card = el("div", {
    className: "card",
    "data-status": post.status,
    "data-id": post.id,
    draggable: "true",
    onDragstart: (e) => onDragStart(e),
    onDragend: (e) => onDragEnd(e),
    onClick: () => openPanel(post.id),
  }, [titleEl, metaEl]);
  return card;
}

// ── Drag & Drop ──────────────────────────────────────────────────────────────

function onDragStart(e) {
  draggedId = e.target.closest(".card").dataset.id;
  e.target.closest(".card").classList.add("dragging");
  e.dataTransfer.effectAllowed = "move";
}

function onDragEnd(e) {
  e.target.closest(".card")?.classList.remove("dragging");
  document.querySelectorAll(".drag-over").forEach((el) => el.classList.remove("drag-over"));
}

async function onDrop(e) {
  e.preventDefault();
  e.currentTarget.classList.remove("drag-over");
  if (!draggedId) return;

  const week = e.currentTarget.dataset.week || null;
  const type = e.currentTarget.dataset.type;
  const post = plan.posts.find((p) => p.id === draggedId);
  if (!post) return;

  // Collect all changes, then batch-update
  const updates = [];
  post.targetWeek = week;
  updates.push(updatePost(post.id, "targetWeek", week));

  if (type !== post.type && TYPE_ORDER.includes(type)) {
    post.type = type;
    updates.push(updatePost(post.id, "type", type));
  }
  if (week && post.status === "ready") {
    post.status = "scheduled";
    updates.push(updatePost(post.id, "status", "scheduled"));
  }
  if (!week && post.status === "scheduled") {
    post.status = "ready";
    updates.push(updatePost(post.id, "status", "ready"));
  }

  draggedId = null;
  render();
  await Promise.all(updates);
}

// ── Detail Panel ─────────────────────────────────────────────────────────────

function openPanel(id) {
  const post = plan.posts.find((p) => p.id === id);
  if (!post) return;

  const content = document.getElementById("panelContent");
  content.replaceChildren();

  // Title
  content.appendChild(el("h2", {}, post.id));

  // Status badge
  const badgeColor = STATUS_COLORS[post.status] || "#666";
  content.appendChild(el("span", {
    className: "status-badge",
    style: { background: badgeColor + "20", color: badgeColor },
  }, post.status));

  // Type + Design
  content.appendChild(el("label", {}, "Typ"));
  content.appendChild(el("div", { style: { fontSize: "13px" } }, TYPE_LABELS[post.type] || post.type));
  content.appendChild(el("label", {}, "Design"));
  content.appendChild(el("div", { style: { fontSize: "13px" } }, post.design));

  // JSON path
  if (post.json) {
    content.appendChild(el("label", {}, "JSON"));
    content.appendChild(el("div", {
      style: { fontSize: "11px", color: "var(--dim)", fontFamily: "'Space Mono', monospace" },
    }, post.json));
  }

  // Slide texts
  if (post.text) {
    for (const [key, label] of [["slide1", "Slide 1"], ["slide2", "Slide 2"], ["slide3", "Slide 3"], ["button", "Button"], ["uebrigens", "Uebrigens"]]) {
      if (post.text[key]) {
        content.appendChild(el("label", {}, label));
        content.appendChild(el("div", { className: "slide-text" }, post.text[key]));
      }
    }
  }

  // Target week input
  content.appendChild(el("label", {}, "Zielwoche"));
  const weekInput = el("input", {
    type: "text",
    value: post.targetWeek || "",
    placeholder: "z.B. 2026-KW15",
  });
  weekInput.addEventListener("change", () => setField(post.id, "targetWeek", weekInput.value || null));
  content.appendChild(weekInput);

  // Notes textarea
  content.appendChild(el("label", {}, "Notizen"));
  const notesArea = el("textarea", {}, post.notes || "");
  notesArea.addEventListener("change", () => setField(post.id, "notes", notesArea.value));
  content.appendChild(notesArea);

  document.getElementById("panelOverlay").classList.add("open");
}

function closePanel() {
  document.getElementById("panelOverlay").classList.remove("open");
}

async function setField(id, field, value) {
  const post = plan.posts.find((p) => p.id === id);
  if (post) post[field] = value;
  await updatePost(id, field, value);
  render();
}

// ── Event listeners ──────────────────────────────────────────────────────────

document.getElementById("closeBtn").addEventListener("click", closePanel);
document.getElementById("panelOverlay").addEventListener("click", (e) => {
  if (e.target === e.currentTarget) closePanel();
});

// ── Init ─────────────────────────────────────────────────────────────────────

loadPlan();
