"use strict";
/* Shared helpers for Plot Runde 4 — all generators produce polylines in a
 * 1000x1000 coordinate space and export them as plotter-ready SVG. */
const PR4 = (() => {
    const SIZE = 1000;

    function mulberry32(a) {
        return function () {
            a |= 0; a = (a + 0x6D2B79F5) | 0;
            let t = Math.imul(a ^ (a >>> 15), 1 | a);
            t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
            return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
        };
    }

    function randomSeed() {
        return (Math.random() * 0xFFFFFFFF) >>> 0;
    }

    function fitCanvas(canvas) {
        const dpr = window.devicePixelRatio || 1;
        const cssW = canvas.clientWidth || 600;
        const px = Math.round(cssW * dpr);
        if (canvas.width !== px) { canvas.width = px; canvas.height = px; }
        const ctx = canvas.getContext("2d");
        ctx.setTransform(px / SIZE, 0, 0, px / SIZE, 0, 0);
        return ctx;
    }

    function drawPolylines(ctx, lines, opts = {}) {
        ctx.save();
        ctx.fillStyle = opts.bg || "#fff";
        ctx.fillRect(0, 0, SIZE, SIZE);
        ctx.strokeStyle = opts.stroke || "#16213e";
        ctx.lineJoin = "round";
        ctx.lineCap = "round";
        const baseW = opts.width || 1.6;
        for (const line of lines) {
            const pts = line.pts || line;
            if (pts.length < 2) continue;
            ctx.lineWidth = line.w ? line.w * baseW / 1.2 : baseW;
            ctx.beginPath();
            ctx.moveTo(pts[0][0], pts[0][1]);
            for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
            if (line.closed) ctx.closePath();
            ctx.stroke();
        }
        ctx.restore();
    }

    function rnum(v) {
        return Math.round(v * 100) / 100;
    }

    function linesToSvg(lines, opts = {}) {
        const mm = opts.mm || 200;
        const sw = opts.width || 1.2;
        // group paths by stroke width (line.w overrides the default)
        const groups = new Map();
        for (const line of lines) {
            const pts = line.pts || line;
            if (pts.length < 2) continue;
            let d = "M" + rnum(pts[0][0]) + " " + rnum(pts[0][1]);
            for (let i = 1; i < pts.length; i++) {
                d += "L" + rnum(pts[i][0]) + " " + rnum(pts[i][1]);
            }
            if (line.closed) d += "Z";
            const w = line.w || sw;
            if (!groups.has(w)) groups.set(w, []);
            groups.get(w).push('<path d="' + d + '"/>');
        }
        let body = "";
        for (const [w, parts] of groups) {
            body += '<g fill="none" stroke="#000" stroke-width="' + w +
                '" stroke-linecap="round" stroke-linejoin="round">\n' +
                parts.join("\n") + "\n</g>\n";
        }
        return '<?xml version="1.0" encoding="UTF-8"?>\n' +
            '<svg xmlns="http://www.w3.org/2000/svg" width="' + mm + 'mm" height="' + mm +
            'mm" viewBox="0 0 ' + SIZE + " " + SIZE + '">\n' + body + "</svg>\n";
    }

    function downloadSvg(filename, svgString) {
        const blob = new Blob([svgString], { type: "image/svg+xml" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 2000);
    }

    /* defs: [{key,label,min,max,step,value}] for sliders
     *       [{key,label,options:[{value,label}],value}] for selects */
    function buildControls(container, defs, onChange) {
        const values = {};
        for (const def of defs) {
            values[def.key] = def.value;
            const wrap = document.createElement("div");
            wrap.className = "control";
            const label = document.createElement("label");
            const name = document.createElement("span");
            name.textContent = def.label;
            label.appendChild(name);
            if (def.options) {
                const sel = document.createElement("select");
                for (const o of def.options) {
                    const opt = document.createElement("option");
                    opt.value = o.value;
                    opt.textContent = o.label;
                    sel.appendChild(opt);
                }
                sel.value = def.value;
                sel.addEventListener("change", () => {
                    values[def.key] = sel.value;
                    onChange(def.key);
                });
                def._set = (v) => { sel.value = v; values[def.key] = v; };
                wrap.appendChild(label);
                wrap.appendChild(sel);
            } else {
                const val = document.createElement("span");
                val.className = "val";
                val.textContent = def.value;
                label.appendChild(val);
                const input = document.createElement("input");
                input.type = "range";
                input.min = def.min;
                input.max = def.max;
                input.step = def.step;
                input.value = def.value;
                input.addEventListener("input", () => {
                    values[def.key] = parseFloat(input.value);
                    val.textContent = input.value;
                    onChange(def.key);
                });
                def._set = (v) => {
                    input.value = v;
                    val.textContent = String(v);
                    values[def.key] = parseFloat(input.value);
                };
                wrap.appendChild(label);
                wrap.appendChild(input);
            }
            container.appendChild(wrap);
        }
        return values;
    }

    function debounce(fn, ms) {
        let t = null;
        return function (...args) {
            clearTimeout(t);
            t = setTimeout(() => fn.apply(this, args), ms);
        };
    }

    /* seeded 2D value noise with fbm, in [0,1] */
    function makeNoise2D(rnd) {
        const N = 256;
        const g = new Float32Array(N * N);
        for (let i = 0; i < N * N; i++) g[i] = rnd();
        const sm = (t) => t * t * (3 - 2 * t);
        function noise(x, y) {
            const xi = Math.floor(x), yi = Math.floor(y);
            const xf = x - xi, yf = y - yi;
            const x0 = xi & (N - 1), y0 = yi & (N - 1);
            const x1 = (x0 + 1) & (N - 1), y1 = (y0 + 1) & (N - 1);
            const u = sm(xf), v = sm(yf);
            const a = g[y0 * N + x0], b = g[y0 * N + x1];
            const c = g[y1 * N + x0], d = g[y1 * N + x1];
            return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
        }
        function fbm(x, y, oct = 4) {
            let sum = 0, amp = 1, f = 1, norm = 0;
            for (let o = 0; o < oct; o++) {
                sum += noise(x * f, y * f) * amp;
                norm += amp;
                f *= 2; amp *= 0.5;
            }
            return sum / norm;
        }
        return { noise, fbm };
    }

    /* marching squares over a sampled scalar field; returns chained polylines.
     * sample(ix,iy) gives field value, grid is nx*ny samples,
     * mapX/mapY convert grid coords to page coords. */
    function contourLines(sample, nx, ny, t, mapX, mapY) {
        const segs = [];
        const TABLE = {
            1: [[3, 0]], 2: [[0, 1]], 3: [[3, 1]], 4: [[1, 2]],
            5: [[3, 0], [1, 2]], 6: [[0, 2]], 7: [[3, 2]], 8: [[2, 3]],
            9: [[0, 2]], 10: [[0, 1], [2, 3]], 11: [[1, 2]],
            12: [[1, 3]], 13: [[0, 1]], 14: [[0, 3]]
        };
        for (let y = 0; y < ny - 1; y++) {
            for (let x = 0; x < nx - 1; x++) {
                const v0 = sample(x, y), v1 = sample(x + 1, y);
                const v2 = sample(x + 1, y + 1), v3 = sample(x, y + 1);
                let c = 0;
                if (v0 >= t) c |= 1;
                if (v1 >= t) c |= 2;
                if (v2 >= t) c |= 4;
                if (v3 >= t) c |= 8;
                if (c === 0 || c === 15) continue;
                const ep = (e) => {
                    if (e === 0) return [mapX(x + (t - v0) / (v1 - v0)), mapY(y)];
                    if (e === 1) return [mapX(x + 1), mapY(y + (t - v1) / (v2 - v1))];
                    if (e === 2) return [mapX(x + (t - v3) / (v2 - v3)), mapY(y + 1)];
                    return [mapX(x), mapY(y + (t - v0) / (v3 - v0))];
                };
                for (const [e1, e2] of TABLE[c]) segs.push([ep(e1), ep(e2)]);
            }
        }
        // chain segments into polylines
        const keyOf = (p) => p[0].toFixed(3) + "," + p[1].toFixed(3);
        const map = new Map();
        segs.forEach((s, i) => {
            for (const p of [s[0], s[1]]) {
                const key = keyOf(p);
                let arr = map.get(key);
                if (!arr) { arr = []; map.set(key, arr); }
                arr.push(i);
            }
        });
        const used = new Array(segs.length).fill(false);
        const lines = [];
        for (let i = 0; i < segs.length; i++) {
            if (used[i]) continue;
            used[i] = true;
            const path = [segs[i][0], segs[i][1]];
            for (const dir of [1, 0]) {
                for (;;) {
                    const end = dir ? path[path.length - 1] : path[0];
                    const cand = (map.get(keyOf(end)) || []).find(j => !used[j]);
                    if (cand === undefined) break;
                    used[cand] = true;
                    const s = segs[cand];
                    const nextPt = keyOf(s[0]) === keyOf(end) ? s[1] : s[0];
                    if (dir) path.push(nextPt); else path.unshift(nextPt);
                }
            }
            if (path.length >= 3) lines.push(path);
        }
        return lines;
    }

    /* Bowyer-Watson Delaunay triangulation; returns triangles as index triples */
    function delaunay(pts) {
        function circumcircle(a, b, c) {
            const d = 2 * (a[0] * (b[1] - c[1]) + b[0] * (c[1] - a[1]) + c[0] * (a[1] - b[1]));
            if (Math.abs(d) < 1e-9) return null;
            const a2 = a[0] * a[0] + a[1] * a[1];
            const b2 = b[0] * b[0] + b[1] * b[1];
            const c2 = c[0] * c[0] + c[1] * c[1];
            const ux = (a2 * (b[1] - c[1]) + b2 * (c[1] - a[1]) + c2 * (a[1] - b[1])) / d;
            const uy = (a2 * (c[0] - b[0]) + b2 * (a[0] - c[0]) + c2 * (b[0] - a[0])) / d;
            return { x: ux, y: uy, r2: (ux - a[0]) ** 2 + (uy - a[1]) ** 2 };
        }
        const all = pts.concat([[-4000, -4000], [5000, -4000], [500, 7000]]);
        const SUPER = pts.length;
        let tris = [{ a: SUPER, b: SUPER + 1, c: SUPER + 2,
            cc: circumcircle(all[SUPER], all[SUPER + 1], all[SUPER + 2]) }];
        for (let i = 0; i < pts.length; i++) {
            const p = all[i];
            const bad = [];
            for (let t = 0; t < tris.length; t++) {
                const cc = tris[t].cc;
                if (cc && (p[0] - cc.x) ** 2 + (p[1] - cc.y) ** 2 < cc.r2) bad.push(t);
            }
            const edgeCount = new Map();
            for (const t of bad) {
                const tr = tris[t];
                for (const [u, v] of [[tr.a, tr.b], [tr.b, tr.c], [tr.c, tr.a]]) {
                    const k = Math.min(u, v) + ":" + Math.max(u, v);
                    edgeCount.set(k, (edgeCount.get(k) || 0) + 1);
                }
            }
            const badSet = new Set(bad);
            tris = tris.filter((_, t) => !badSet.has(t));
            for (const [k, count] of edgeCount) {
                if (count !== 1) continue;
                const [u, v] = k.split(":").map(Number);
                tris.push({ a: u, b: v, c: i, cc: circumcircle(all[u], all[v], p) });
            }
        }
        return tris.filter(t => t.a < SUPER && t.b < SUPER && t.c < SUPER)
                   .map(t => [t.a, t.b, t.c]);
    }

    return { SIZE, mulberry32, randomSeed, fitCanvas, drawPolylines, linesToSvg, downloadSvg, buildControls, debounce, makeNoise2D, contourLines, delaunay };
})();

/* ──────────────────────────────────────────────────────────────────────
 * PR4Audio — physically-grounded plotter motor synthesis.
 *
 * A pen plotter (e.g. NextDraw 2234) is driven by two independent stepper
 * motors: one for X, one for Y. Each motor emits a tone whose PITCH is
 * proportional to its STEP RATE — i.e. to the speed of the pen ALONG THAT
 * AXIS (mm/s), not the total speed. Consequences this engine reproduces:
 *
 *   • Straight horizontal line  → only X-motor sings (steady pitch), Y silent.
 *   • Straight vertical line     → only Y-motor sings, X silent.
 *   • Diagonal line              → both motors, pitch ∝ |cosα| and |sinα|
 *                                  → a two-note chord whose interval = angle.
 *   • Circle at constant feed    → fX ∝ |sinφ|, fY ∝ |cosφ|, 90° out of phase
 *                                  → the motors "sing", gliding in pitch.
 *   • Bigger circle, same feed   → longer arc → the note lasts LONGER.
 *
 * The X motor is panned left, the Y motor right, so on a circle you literally
 * hear the sound rotate between the speakers.
 *
 * A "tour" is an ordered list of moves: { pts:[[x,y]…], pen:'down'|'up', feed }
 * where pts are in the 1000×1000 page space and feed is in mm/s.
 * ────────────────────────────────────────────────────────────────────── */
const PR4Audio = (() => {
    const PX_PER_MM = 5;          // 1000 px = 200 mm
    const MAX_STEP  = 0.018;      // s — automation granularity (also = motor ramp)
    let _ctx = null;
    let _live = null;             // current playback controller

    function ctx() {
        if (!_ctx) _ctx = new (window.AudioContext || window.webkitAudioContext)();
        if (_ctx.state === "suspended") _ctx.resume();
        return _ctx;
    }

    /* audibility of a motor running at f Hz: a slowly-stepping motor is a quiet
     * low rumble that fades to nothing as it stops. */
    function audible(f) {
        const t = Math.max(0, Math.min(1, (f - 8) / 34));
        return t * t * (3 - 2 * t);
    }

    function makeNoiseBurst(c, t, dur, vol, cutoff) {
        const len = Math.max(1, Math.ceil(c.sampleRate * dur));
        const buf = c.createBuffer(1, len, c.sampleRate);
        const d = buf.getChannelData(0);
        for (let i = 0; i < len; i++)
            d[i] = (Math.random() * 2 - 1) * Math.exp(-i / (len * 0.18));
        const src = c.createBufferSource(); src.buffer = buf;
        const lp = c.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = cutoff;
        const g = c.createGain(); g.gain.value = vol;
        src.connect(lp); lp.connect(g);
        return { src, g, start: () => src.start(t), stop: () => { try { src.stop(0); } catch (_) {} } };
    }

    function stop() {
        if (!_live) return;
        const l = _live; _live = null;
        l.cancelled = true;
        if (l.animFrame) cancelAnimationFrame(l.animFrame);
        clearTimeout(l.endTimer);
        l.nodes.forEach(n => { try { n.stop(0); } catch (_) {} });
        if (l.onEnd) l.onEnd();
    }

    /* Schedule a tour and start playing. opts:
     *   freqPerMmS  Hz per (mm/s)            default 5
     *   baseGain    peak per-motor gain      default 0.14
     *   onPos(x,y,pen)  per-frame pen callback (canvas coords)
     *   onEnd()     called when playback finishes or is stopped
     * Returns { duration, stop }. */
    function play(tour, opts = {}) {
        stop();
        const c = ctx();
        const K        = opts.freqPerMmS != null ? opts.freqPerMmS : 5;
        const baseGain = opts.baseGain   != null ? opts.baseGain   : 0.14;

        /* one persistent oscillator per axis, panned L / R, through a shared
         * gentle lowpass + master gain. */
        const master = c.createGain(); master.gain.value = 0.9;
        const lp = c.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 3200;
        lp.connect(master); master.connect(c.destination);

        function axis(pan) {
            const osc = c.createOscillator(); osc.type = "sawtooth";
            const g = c.createGain(); g.gain.value = 0;
            const p = c.createStereoPanner ? c.createStereoPanner() : null;
            if (p) { p.pan.value = pan; osc.connect(g); g.connect(p); p.connect(lp); }
            else { osc.connect(g); g.connect(lp); }
            return { osc, g };
        }
        const ax = axis(-0.6), ay = axis(0.6);

        const live = { nodes: [ax.osc, ay.osc], cancelled: false,
                       onEnd: opts.onEnd, animFrame: null, endTimer: null,
                       timeline: [] };
        _live = live;

        const t0 = c.currentTime + 0.06;
        let T = t0;
        ax.osc.frequency.setValueAtTime(1, t0);
        ay.osc.frequency.setValueAtTime(1, t0);
        ax.g.gain.setValueAtTime(0, t0);
        ay.g.gain.setValueAtTime(0, t0);

        const penDownGain = 1.0, penUpGain = 0.62;
        let prevPen = null;

        function schedClick(t, pen) {
            const burst = pen === "down"
                ? makeNoiseBurst(c, t, 0.022, 0.5,  1400)   // pen drop: lower thud
                : makeNoiseBurst(c, t, 0.012, 0.28, 4200);  // pen lift: brighter tick
            burst.g.connect(master); burst.start();
            live.nodes.push(burst.src);
        }

        const tl = live.timeline;
        for (const move of tour) {
            const pts = move.pts; if (!pts || pts.length < 2) continue;
            const feed = move.feed || 40;
            const penG = move.pen === "up" ? penUpGain : penDownGain;
            if (move.pen !== prevPen) { schedClick(T, move.pen); prevPen = move.pen; }

            for (let i = 1; i < pts.length; i++) {
                const x0 = pts[i - 1][0], y0 = pts[i - 1][1];
                const x1 = pts[i][0],     y1 = pts[i][1];
                const dxmm = (x1 - x0) / PX_PER_MM, dymm = (y1 - y0) / PX_PER_MM;
                const lenmm = Math.hypot(dxmm, dymm);
                if (lenmm < 1e-6) continue;
                const segDt = lenmm / feed;
                const nSub = Math.max(1, Math.ceil(segDt / MAX_STEP));
                const vx = Math.abs(dxmm) / segDt, vy = Math.abs(dymm) / segDt; // mm/s per axis
                const fX = Math.max(1, K * vx), fY = Math.max(1, K * vy);
                const gX = baseGain * audible(fX) * penG;
                const gY = baseGain * audible(fY) * penG;
                for (let s = 1; s <= nSub; s++) {
                    const tt = T + segDt * s / nSub;
                    ax.osc.frequency.linearRampToValueAtTime(fX, tt);
                    ay.osc.frequency.linearRampToValueAtTime(fY, tt);
                    ax.g.gain.linearRampToValueAtTime(gX, tt);
                    ay.g.gain.linearRampToValueAtTime(gY, tt);
                    const f = s / nSub;
                    tl.push({ t: (T - t0) + segDt * f,
                              x: x0 + (x1 - x0) * f, y: y0 + (y1 - y0) * f,
                              pen: move.pen });
                }
                T += segDt;
            }
        }
        const duration = T - t0;
        /* fade out */
        ax.g.gain.linearRampToValueAtTime(0, T + 0.04);
        ay.g.gain.linearRampToValueAtTime(0, T + 0.04);
        ax.osc.start(t0); ay.osc.start(t0);
        ax.osc.stop(T + 0.1); ay.osc.stop(T + 0.1);

        /* pen-position animation */
        if (opts.onPos && tl.length) {
            const animate = () => {
                if (live.cancelled) return;
                const el = c.currentTime - t0;
                if (el >= duration) { opts.onPos(null); return; }
                let lo = 0, hi = tl.length - 1;
                while (lo < hi - 1) {
                    const mid = (lo + hi) >> 1;
                    if (tl[mid].t <= el) lo = mid; else hi = mid;
                }
                opts.onPos(tl[lo].x, tl[lo].y, tl[lo].pen);
                live.animFrame = requestAnimationFrame(animate);
            };
            live.animFrame = requestAnimationFrame(animate);
        }

        live.endTimer = setTimeout(stop, (duration + 0.4) * 1000);
        return { duration, stop };
    }

    /* Build a plotter tour from a list of draw-polylines, inserting fast
     * pen-up travel moves between them (and from an optional home point).
     * lines: [[ [x,y],… ], …] or [{pts:[…]}].  Returns a tour for play(). */
    function tourFromPolylines(lines, feedDraw, feedTravel, home) {
        const tour = [];
        let cur = home || null;
        for (const ln of lines) {
            const pts = ln.pts || ln;
            if (!pts || pts.length < 2) continue;
            if (cur) tour.push({ pts: [cur, pts[0]], pen: "up", feed: feedTravel });
            tour.push({ pts, pen: "down", feed: feedDraw });
            cur = pts[pts.length - 1];
        }
        return tour;
    }

    return { ctx, play, stop, tourFromPolylines, PX_PER_MM };
})();
