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
        ctx.lineWidth = opts.width || 1.6;
        ctx.lineJoin = "round";
        ctx.lineCap = "round";
        for (const line of lines) {
            const pts = line.pts || line;
            if (pts.length < 2) continue;
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
        const parts = [];
        for (const line of lines) {
            const pts = line.pts || line;
            if (pts.length < 2) continue;
            let d = "M" + rnum(pts[0][0]) + " " + rnum(pts[0][1]);
            for (let i = 1; i < pts.length; i++) {
                d += "L" + rnum(pts[i][0]) + " " + rnum(pts[i][1]);
            }
            if (line.closed) d += "Z";
            parts.push('<path d="' + d + '"/>');
        }
        return '<?xml version="1.0" encoding="UTF-8"?>\n' +
            '<svg xmlns="http://www.w3.org/2000/svg" width="' + mm + 'mm" height="' + mm +
            'mm" viewBox="0 0 ' + SIZE + " " + SIZE + '">\n' +
            '<g fill="none" stroke="#000" stroke-width="' + sw +
            '" stroke-linecap="round" stroke-linejoin="round">\n' +
            parts.join("\n") + "\n</g>\n</svg>\n";
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

    return { SIZE, mulberry32, randomSeed, fitCanvas, drawPolylines, linesToSvg, downloadSvg, buildControls, debounce, makeNoise2D, contourLines };
})();
