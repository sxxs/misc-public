// @herdom.bamberg — Pipeline Calendar UI v3
// Brutalist industrial dashboard. No rounded corners. Big type. Explicit slots.

// ── Constants ────────────────────────────────────────────────────────────────

const TYPE_LABELS = {
  contrarian: "CTR", newsjacking: "NEWS", "wusstest-du": "WDU",
  billboard: "BILL", terminal: "TERM", nachtgedanke: "NACHT",
  selbstironie: "META", witz: "WITZ", parodie: "PARO",
  overselling: "OVER", stitch: "STTCH", other: "MISC",
};

const TYPE_FULL = {
  contrarian: "Contrarian", newsjacking: "Newsjacking", "wusstest-du": "Wusstest du",
  billboard: "Billboard", terminal: "Terminal", nachtgedanke: "Nachtgedanke",
  selbstironie: "Selbstironie", witz: "Witz", parodie: "Parodie",
  overselling: "Overselling", stitch: "Stitch", other: "Sonstige",
};

const TYPE_COLORS = {
  contrarian: "#facc15", newsjacking: "#ef4444", "wusstest-du": "#f59e0b",
  billboard: "#e0e0e0", terminal: "#33ff33", nachtgedanke: "#ffb000",
  selbstironie: "#888", witz: "#d4a017", parodie: "#06b6d4",
  overselling: "#f97316", stitch: "#a78bfa", other: "#555",
};

const STATUS_COLORS = {
  idea: "#555", draft: "#f59e0b", ready: "#22c55e",
  scheduled: "#3b82f6", published: "#06b6d4",
};

const SLOTS_PER_WEEK = 3;

// ── State ────────────────────────────────────────────────────────────────────

let plan = { posts: [] };
let draggedId = null;
let weekOffset = 0; // 0 = starts at current week
let searchQuery = "";

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
    post.id, post.type, post.text?.slide1, post.text?.slide2, post.text?.slide3,
    post.text?.button, post.text?.uebrigens, post.notes,
  ].filter(Boolean).join(" ").toLowerCase();
  return hay.includes(q);
}

// ── Render ────────────────────────────────────────────────────────────────────

function render() {
  const allWeeks = generateWeeks(26, weekOffset);
  const row1 = allWeeks.slice(0, 13);
  const row2 = allWeeks.slice(13);
  const currentWeek = getWeekStr(new Date());

  // Build lookup: week → ordered posts (by slot index)
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

  // Sort within each week by slotIndex (if present)
  for (const [, posts] of postsByWeek) {
    posts.sort((a, b) => (a.slotIndex ?? 99) - (b.slotIndex ?? 99));
  }

  // Search match count
  const matchCount = searchQuery ? plan.posts.filter(matchesSearch).length : 0;
  const searchCountEl = document.getElementById("searchCount");
  searchCountEl.textContent = searchQuery ? matchCount + " treffer" : "";

  // ── Calendar ──
  const cal = document.getElementById("calendar");
  cal.replaceChildren();

  for (const row of [row1, row2]) {
    const rowEl = el("div", { className: "cal-row" });
    for (const wkObj of row) {
      const wk = wkObj.key;
      const isCurrent = wk === currentWeek;
      const isPast = wk < currentWeek;
      const posts = postsByWeek.get(wk) || [];

      const cls = "week" + (isCurrent ? " current" : "") + (isPast ? " past" : "");
      const weekEl = el("div", { className: cls });

      const kwText = weekLabel(wk);
      const kwNum = kwText.replace("KW", "");
      const header = el("div", { className: "week-header" }, [
        el("span", { className: "week-kw" }, [
          el("span", { className: "week-kw-prefix" }, "KW"),
          el("span", { className: "week-kw-num" }, kwNum),
        ]),
        el("span", { className: "week-date" }, formatMonday(wkObj.monday)),
      ]);
      weekEl.appendChild(header);

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
        });
        if (post) {
          slotEl.appendChild(createCard(post));
        }
        slotsEl.appendChild(slotEl);
      }

      weekEl.appendChild(slotsEl);
      rowEl.appendChild(weekEl);
    }
    cal.appendChild(rowEl);
  }

  // ── Navigation label ──
  document.getElementById("navLabel").textContent =
    weekLabel(row1[0].key) + " – " + weekLabel(row2[row2.length - 1].key);

  // ── Backlog ──
  const backlogEl = document.getElementById("backlog");
  backlogEl.replaceChildren();

  const backlogHeader = el("div", { className: "backlog-header" }, [
    el("span", { className: "label" }, "Backlog"),
    el("span", { className: "count" }, backlog.length + " posts"),
  ]);
  backlogEl.appendChild(backlogHeader);

  const backlogGrid = el("div", {
    className: "backlog-grid",
    "data-week": "",
    "data-slot": "0",
    onDragover: (e) => { e.preventDefault(); },
    onDrop: (e) => onDrop(e),
  });

  const byType = new Map();
  for (const p of backlog) {
    const t = p.type || "other";
    if (!byType.has(t)) byType.set(t, []);
    byType.get(t).push(p);
  }

  for (const [type, posts] of byType) {
    const group = el("div", { className: "backlog-group" });
    group.appendChild(el("div", { className: "backlog-type-label" }, [
      el("span", { className: "type-dot", style: { background: TYPE_COLORS[type] || "#555" } }),
      el("span", {}, TYPE_FULL[type] || type),
      el("span", { className: "type-count" }, "(" + posts.length + ")"),
    ]));

    const cardsEl = el("div", { className: "backlog-cards" });
    for (const p of posts) {
      cardsEl.appendChild(createCard(p));
    }
    group.appendChild(cardsEl);
    backlogGrid.appendChild(group);
  }
  backlogEl.appendChild(backlogGrid);

  // ── Stats ──
  renderStats();

  // ── Legend ──
  renderLegend();
}

function renderStats() {
  const statsEl = document.getElementById("stats");
  statsEl.replaceChildren();

  const total = plan.posts.length;
  const scheduled = plan.posts.filter((p) => p.targetWeek).length;
  const published = plan.posts.filter((p) => p.status === "published").length;
  const backlog = total - scheduled - published;

  // Type distribution of SCHEDULED posts only
  const schedTypes = {};
  plan.posts.filter((p) => p.targetWeek).forEach((p) => {
    schedTypes[p.type] = (schedTypes[p.type] || 0) + 1;
  });

  const parts = [];
  parts.push(el("span", { className: "num" }, String(total)));
  parts.push(document.createTextNode(" total  "));
  parts.push(el("span", { className: "num" }, String(scheduled)));
  parts.push(document.createTextNode(" eingeplant  "));
  parts.push(el("span", { className: "num" }, String(backlog)));
  parts.push(document.createTextNode(" backlog"));

  if (scheduled > 0) {
    parts.push(document.createTextNode("  //  "));
    const typeStrs = Object.entries(schedTypes)
      .sort((a, b) => b[1] - a[1])
      .map(([t, c]) => {
        const span = el("span", { style: { color: TYPE_COLORS[t] || "#555" } },
          (TYPE_LABELS[t] || t) + ":" + c);
        return span;
      });
    for (let i = 0; i < typeStrs.length; i++) {
      if (i > 0) parts.push(document.createTextNode("  "));
      parts.push(typeStrs[i]);
    }
  }

  for (const p of parts) statsEl.appendChild(p);
}

function renderLegend() {
  const legendEl = document.getElementById("legend");
  legendEl.replaceChildren();

  // Type legend
  const typeSec = el("div", { className: "legend-section" });
  typeSec.appendChild(el("span", { className: "legend-title" }, "Typ"));
  for (const [type, color] of Object.entries(TYPE_COLORS)) {
    if (!plan.posts.some((p) => p.type === type)) continue;
    typeSec.appendChild(el("div", { className: "item" }, [
      el("div", { className: "swatch-border", style: { color } }),
      el("span", {}, TYPE_FULL[type] || type),
    ]));
  }
  legendEl.appendChild(typeSec);

  // Status legend
  const statusSec = el("div", { className: "legend-section" });
  statusSec.appendChild(el("span", { className: "legend-title" }, "Status"));
  for (const [status, color] of Object.entries(STATUS_COLORS)) {
    statusSec.appendChild(el("div", { className: "item" }, [
      el("span", { className: "swatch-status", style: { color } }, status),
    ]));
  }
  legendEl.appendChild(statusSec);
}

// ── Cards ────────────────────────────────────────────────────────────────────

function createCard(post) {
  const typeColor = TYPE_COLORS[post.type] || "#555";
  const title = post.text?.slide1 || post.text?.slide2?.substring(0, 35) || post.id;
  const displayTitle = title.substring(0, 28);
  const isMatch = searchQuery && matchesSearch(post);
  const isDimmed = searchQuery && !isMatch;
  const needsWork = post.status === "idea" || post.status === "draft";

  const classes = ["card"];
  if (isMatch) classes.push("search-match");
  if (isDimmed) classes.push("search-dim");
  if (needsWork) classes.push("needs-work");

  const metaChildren = [
    el("span", { className: "card-type", style: { color: typeColor } }, TYPE_LABELS[post.type] || "?"),
  ];
  if (needsWork) {
    metaChildren.push(el("span", { className: "card-warn" }, post.status));
  }

  const card = el("div", {
    className: classes.join(" "),
    style: { borderLeftColor: typeColor },
    "data-id": post.id,
    draggable: "true",
    onDragstart: (e) => onDragStart(e),
    onDragend: (e) => onDragEnd(e),
    onClick: () => openPanel(post.id),
  }, [
    el("div", { className: "card-title" }, displayTitle),
    el("div", { className: "card-meta" }, metaChildren),
  ]);
  return card;
}

// ── Drag & Drop ──────────────────────────────────────────────────────────────

function onDragStart(e) {
  const card = e.target.closest(".card");
  draggedId = card.dataset.id;
  card.classList.add("dragging");
  e.dataTransfer.effectAllowed = "move";
}

function onDragEnd(e) {
  e.target.closest(".card")?.classList.remove("dragging");
  document.querySelectorAll(".drag-over").forEach((x) => x.classList.remove("drag-over"));
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

  const updates = [];

  // If dropping into a specific slot, reorder posts in that week
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
  post.slotIndex = slotIndex;
  updates.push(updatePost(post.id, "targetWeek", week));
  updates.push(updatePost(post.id, "slotIndex", slotIndex));

  // Only auto-transition ready↔scheduled. Draft/idea cards keep their status
  // (they need work even if placed in the calendar).
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

  const statusColor = STATUS_COLORS[post.status] || "#555";
  content.appendChild(el("span", { className: "status-badge", style: { color: statusColor } }, post.status));

  const typeColor = TYPE_COLORS[post.type] || "#555";
  content.appendChild(el("label", {}, "Typ"));
  content.appendChild(el("div", { className: "info-value", style: { color: typeColor } }, TYPE_FULL[post.type] || post.type));

  content.appendChild(el("label", {}, "Design"));
  content.appendChild(el("div", { className: "info-value" }, post.design || "—"));

  if (post.json) {
    content.appendChild(el("label", {}, "JSON"));
    content.appendChild(el("div", { className: "mono-value" }, post.json));
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

// ── Event Listeners ──────────────────────────────────────────────────────────

document.getElementById("closeBtn").addEventListener("click", closePanel);
document.getElementById("panelOverlay").addEventListener("click", (e) => {
  if (e.target === e.currentTarget) closePanel();
});

document.getElementById("navPrev").addEventListener("click", () => {
  weekOffset -= 13;
  render();
});
document.getElementById("navNext").addEventListener("click", () => {
  weekOffset += 13;
  render();
});

document.getElementById("searchInput").addEventListener("input", (e) => {
  searchQuery = e.target.value.trim();
  render();
});

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    closePanel();
    if (searchQuery) {
      searchQuery = "";
      document.getElementById("searchInput").value = "";
      render();
    }
  }
  if ((e.metaKey || e.ctrlKey) && e.key === "f") {
    e.preventDefault();
    document.getElementById("searchInput").focus();
  }
});

// ── Init ─────────────────────────────────────────────────────────────────────

loadPlan();
