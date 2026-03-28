// @herdom.bamberg — Pipeline Calendar UI (v2)
// Two rows of 13 weeks + backlog below. Color = post type.

// ── Constants ────────────────────────────────────────────────────────────────

const TYPE_LABELS = {
  contrarian: "Contrarian", newsjacking: "Newsjacking", "wusstest-du": "Wusstest du",
  billboard: "Billboard", terminal: "Terminal", nachtgedanke: "Nachtgedanke",
  selbstironie: "Selbstironie", witz: "Witz", parodie: "Parodie",
  overselling: "Overselling", stitch: "Stitch", other: "Sonstige",
};

const TYPE_COLORS = {
  contrarian: "#facc15", newsjacking: "#ef4444", "wusstest-du": "#f59e0b",
  billboard: "#ffffff", terminal: "#33ff33", nachtgedanke: "#ffb000",
  selbstironie: "#888", witz: "#facc15", parodie: "#06b6d4",
  overselling: "#f59e0b", stitch: "#a78bfa", other: "#666",
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

function dropTarget(attrs) {
  return {
    ...attrs,
    onDragover: (e) => { e.preventDefault(); e.currentTarget.classList.add("drag-over"); },
    onDragleave: (e) => { e.currentTarget.classList.remove("drag-over"); },
    onDrop: (e) => onDrop(e),
  };
}

// ── Render ────────────────────────────────────────────────────────────────────

function render() {
  const weeks = generateWeeks(26);
  const row1 = weeks.slice(0, 13);
  const row2 = weeks.slice(13);
  const currentWeek = getWeekStr(new Date());

  // Build lookup: week → posts[]
  const postsByWeek = new Map();
  const backlog = [];
  for (const p of plan.posts) {
    if (p.targetWeek) {
      if (!postsByWeek.has(p.targetWeek)) postsByWeek.set(p.targetWeek, []);
      postsByWeek.get(p.targetWeek).push(p);
    } else {
      backlog.push(p);
    }
  }

  // ── Calendar section ──
  const cal = document.getElementById("calendar");
  cal.replaceChildren();

  for (const row of [row1, row2]) {
    const rowEl = el("div", { className: "cal-row" });
    for (const wk of row) {
      const isCurrent = wk === currentWeek;
      const posts = postsByWeek.get(wk) || [];
      const weekEl = el("div", dropTarget({
        className: "week" + (isCurrent ? " current" : ""),
        "data-week": wk,
      }));

      const header = el("div", { className: "week-header" }, weekLabel(wk));
      weekEl.appendChild(header);

      const slots = el("div", { className: "week-slots" });
      for (const p of posts) {
        slots.appendChild(createCard(p));
      }
      // Empty slot indicators (show capacity)
      const remaining = 3 - posts.length;
      for (let i = 0; i < remaining && i < 3; i++) {
        slots.appendChild(el("div", { className: "empty-slot" }));
      }
      weekEl.appendChild(slots);
      rowEl.appendChild(weekEl);
    }
    cal.appendChild(rowEl);
  }

  // ── Backlog section ──
  const backlogEl = document.getElementById("backlog");
  backlogEl.replaceChildren();

  const backlogHeader = el("div", { className: "backlog-header" }, [
    el("span", {}, "Backlog"),
    el("span", { className: "backlog-count" }, backlog.length + " Posts"),
  ]);
  backlogEl.appendChild(backlogHeader);

  const backlogGrid = el("div", dropTarget({
    className: "backlog-grid",
    "data-week": "",
  }));

  // Group by type for visual clarity
  const byType = new Map();
  for (const p of backlog) {
    const t = p.type || "other";
    if (!byType.has(t)) byType.set(t, []);
    byType.get(t).push(p);
  }

  for (const [type, posts] of byType) {
    const group = el("div", { className: "backlog-group" });
    const groupLabel = el("div", { className: "backlog-type-label" }, [
      el("span", { className: "type-dot", style: { background: TYPE_COLORS[type] || "#666" } }),
      el("span", {}, TYPE_LABELS[type] || type),
      el("span", { className: "type-count" }, "(" + posts.length + ")"),
    ]);
    group.appendChild(groupLabel);

    const groupCards = el("div", { className: "backlog-cards" });
    for (const p of posts) {
      groupCards.appendChild(createCard(p));
    }
    group.appendChild(groupCards);
    backlogGrid.appendChild(group);
  }

  backlogEl.appendChild(backlogGrid);

  // ── Stats ──
  const statsEl = document.getElementById("stats");
  statsEl.replaceChildren();
  const total = plan.posts.length;
  const readyCount = plan.posts.filter((p) => p.status === "ready").length;
  const scheduledCount = plan.posts.filter((p) => p.targetWeek).length;

  const typeDist = {};
  plan.posts.forEach((p) => { typeDist[p.type] = (typeDist[p.type] || 0) + 1; });
  const topType = Object.entries(typeDist).sort((a, b) => b[1] - a[1])[0];
  const skew = topType ? Math.round(topType[1] / total * 100) : 0;

  statsEl.appendChild(document.createTextNode(
    total + " Posts | " + readyCount + " ready | " + scheduledCount + " eingeplant"
  ));
  if (skew > 60) {
    statsEl.appendChild(el("span", { className: "warn" },
      " | " + (TYPE_LABELS[topType[0]] || topType[0]) + "-Skew " + skew + "%"
    ));
  }
}

// ── Cards ────────────────────────────────────────────────────────────────────

function createCard(post) {
  const typeColor = TYPE_COLORS[post.type] || "#666";
  const statusColor = STATUS_COLORS[post.status] || "#666";
  const displayTitle = (post.text?.slide1 || post.text?.slide2?.substring(0, 30) || post.id).substring(0, 22);

  const card = el("div", {
    className: "card",
    style: { borderLeftColor: typeColor },
    "data-status": post.status,
    "data-id": post.id,
    draggable: "true",
    onDragstart: (e) => onDragStart(e),
    onDragend: (e) => onDragEnd(e),
    onClick: () => openPanel(post.id),
  }, [
    el("div", { className: "card-title" }, displayTitle),
    el("div", { className: "card-meta" }, [
      el("span", { className: "card-type", style: { color: typeColor } }, TYPE_LABELS[post.type] || post.type),
      el("span", { className: "card-dot", style: { background: statusColor } }),
    ]),
  ]);
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

  const week = e.currentTarget.dataset.week || e.currentTarget.closest("[data-week]")?.dataset.week || null;
  const post = plan.posts.find((p) => p.id === draggedId);
  if (!post) return;

  const updates = [];
  post.targetWeek = week;
  updates.push(updatePost(post.id, "targetWeek", week));

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

  content.appendChild(el("h2", {}, post.id));

  const badgeColor = STATUS_COLORS[post.status] || "#666";
  content.appendChild(el("span", {
    className: "status-badge",
    style: { background: badgeColor + "20", color: badgeColor },
  }, post.status));

  const typeColor = TYPE_COLORS[post.type] || "#666";
  content.appendChild(el("label", {}, "Typ"));
  content.appendChild(el("div", { style: { fontSize: "13px", color: typeColor } }, TYPE_LABELS[post.type] || post.type));
  content.appendChild(el("label", {}, "Design"));
  content.appendChild(el("div", { style: { fontSize: "13px" } }, post.design || "—"));

  if (post.json) {
    content.appendChild(el("label", {}, "JSON"));
    content.appendChild(el("div", {
      style: { fontSize: "11px", color: "var(--dim)", fontFamily: "'Space Mono', monospace" },
    }, post.json));
  }

  if (post.text) {
    for (const [key, label] of [["slide1", "Slide 1"], ["slide2", "Slide 2"], ["slide3", "Slide 3"], ["button", "Button"], ["uebrigens", "Uebrigens"]]) {
      if (post.text[key]) {
        content.appendChild(el("label", {}, label));
        content.appendChild(el("div", { className: "slide-text" }, post.text[key]));
      }
    }
  }

  content.appendChild(el("label", {}, "Zielwoche"));
  const weekInput = el("input", { type: "text", value: post.targetWeek || "", placeholder: "z.B. 2026-KW15" });
  weekInput.addEventListener("change", () => setField(post.id, "targetWeek", weekInput.value || null));
  content.appendChild(weekInput);

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
