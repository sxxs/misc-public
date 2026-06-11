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

    return { SIZE, mulberry32, randomSeed, fitCanvas, drawPolylines, linesToSvg, downloadSvg, buildControls, debounce };
})();
