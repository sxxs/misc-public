"use strict";
/* Single-stroke letter font (Hershey style) for plotter typography.
 * Glyphs live on a grid: x 0..W, y 0 = baseline, 10 = cap height.
 * Each glyph: { w: advance width, s: [stroke, ...] }, stroke = [[x,y],...] */
const PR4Font = (() => {
    const G = {
        "A": { w: 6, s: [[[0, 0], [3, 10], [6, 0]], [[1.3, 4.2], [4.7, 4.2]]] },
        "B": { w: 5.6, s: [[[0, 0], [0, 10]],
            [[0, 10], [3.6, 10], [4.9, 9], [4.9, 6.7], [3.6, 5.6], [0, 5.6]],
            [[3.6, 5.6], [5.4, 4.5], [5.4, 1.3], [3.9, 0], [0, 0]]] },
        "C": { w: 6, s: [[[6, 8], [4.7, 9.7], [2.2, 10], [0.6, 8.5], [0, 6], [0, 4],
            [0.6, 1.5], [2.2, 0], [4.7, 0.3], [6, 2]]] },
        "D": { w: 5.9, s: [[[0, 0], [0, 10]],
            [[0, 10], [3, 10], [5, 8.6], [5.9, 6], [5.9, 4], [5, 1.4], [3, 0], [0, 0]]] },
        "E": { w: 5, s: [[[5, 0], [0, 0], [0, 10], [5, 10]], [[0, 5.3], [4, 5.3]]] },
        "F": { w: 5, s: [[[0, 0], [0, 10], [5, 10]], [[0, 5.3], [4, 5.3]]] },
        "G": { w: 6.3, s: [[[6.1, 8], [4.7, 9.7], [2.2, 10], [0.6, 8.5], [0, 6], [0, 4],
            [0.6, 1.5], [2.2, 0], [4.8, 0.2], [6.3, 1.7], [6.3, 4.2], [3.7, 4.2]]] },
        "H": { w: 5.9, s: [[[0, 0], [0, 10]], [[5.9, 0], [5.9, 10]], [[0, 5.2], [5.9, 5.2]]] },
        "I": { w: 1.6, s: [[[0.8, 0], [0.8, 10]]] },
        "J": { w: 4.5, s: [[[4.5, 10], [4.5, 2.4], [3.7, 0.6], [2, 0], [0.7, 0.6], [0, 2.2]]] },
        "K": { w: 5.7, s: [[[0, 0], [0, 10]], [[5.5, 10], [0, 4.4]], [[2.1, 6.3], [5.7, 0]]] },
        "L": { w: 4.8, s: [[[0, 10], [0, 0], [4.8, 0]]] },
        "M": { w: 7, s: [[[0, 0], [0, 10], [3.5, 3.2], [7, 10], [7, 0]]] },
        "N": { w: 5.9, s: [[[0, 0], [0, 10], [5.9, 0], [5.9, 10]]] },
        "O": { w: 6.4, s: [[[3.2, 10], [5.5, 9], [6.4, 6.4], [6.4, 3.6], [5.5, 1],
            [3.2, 0], [0.9, 1], [0, 3.6], [0, 6.4], [0.9, 9], [3.2, 10]]] },
        "P": { w: 5.5, s: [[[0, 0], [0, 10]],
            [[0, 10], [3.7, 10], [5.3, 8.8], [5.3, 6.4], [3.7, 5.1], [0, 5.1]]] },
        "Q": { w: 6.4, s: [[[3.2, 10], [5.5, 9], [6.4, 6.4], [6.4, 3.6], [5.5, 1],
            [3.2, 0], [0.9, 1], [0, 3.6], [0, 6.4], [0.9, 9], [3.2, 10]],
            [[4.1, 2.3], [6.7, -0.7]]] },
        "R": { w: 5.7, s: [[[0, 0], [0, 10]],
            [[0, 10], [3.7, 10], [5.3, 8.8], [5.3, 6.4], [3.7, 5.1], [0, 5.1]],
            [[2.7, 5.1], [5.7, 0]]] },
        "S": { w: 5.5, s: [[[5.5, 8.3], [4.1, 9.8], [1.7, 10], [0.3, 8.7], [0.5, 7],
            [1.9, 5.9], [3.9, 5.2], [5.3, 4], [5.5, 2], [4.2, 0.4], [1.6, 0], [0, 1.5]]] },
        "T": { w: 5.6, s: [[[0, 10], [5.6, 10]], [[2.8, 10], [2.8, 0]]] },
        "U": { w: 5.9, s: [[[0, 10], [0, 2.4], [0.9, 0.6], [2.7, 0], [3.3, 0],
            [5, 0.6], [5.9, 2.4], [5.9, 10]]] },
        "V": { w: 6, s: [[[0, 10], [3, 0], [6, 10]]] },
        "W": { w: 8, s: [[[0, 10], [1.8, 0], [4, 7], [6.2, 0], [8, 10]]] },
        "X": { w: 5.7, s: [[[0, 0], [5.7, 10]], [[0, 10], [5.7, 0]]] },
        "Y": { w: 5.7, s: [[[0, 10], [2.85, 4.6], [5.7, 10]], [[2.85, 4.6], [2.85, 0]]] },
        "Z": { w: 5.5, s: [[[0, 10], [5.5, 10], [0, 0], [5.5, 0]]] },
        "0": { w: 5.6, s: [[[2.8, 10], [4.8, 9], [5.6, 6.4], [5.6, 3.6], [4.8, 1],
            [2.8, 0], [0.8, 1], [0, 3.6], [0, 6.4], [0.8, 9], [2.8, 10]], [[0.6, 1.6], [5, 8.4]]] },
        "1": { w: 3, s: [[[0, 7.6], [1.8, 10], [1.8, 0]], [[0.4, 0], [3, 0]]] },
        "2": { w: 5.4, s: [[[0.2, 8.2], [1.4, 9.8], [3.8, 10], [5.2, 8.6], [5.2, 6.8],
            [3.8, 4.8], [0, 0], [5.4, 0]]] },
        "3": { w: 5.4, s: [[[0.3, 9.2], [2, 10], [4, 10], [5.2, 8.6], [5.2, 6.8],
            [3.8, 5.5], [2, 5.5]], [[2, 5.5], [4, 5.4], [5.4, 3.8], [5.4, 1.8],
            [4, 0.2], [1.8, 0], [0.2, 1]]] },
        "4": { w: 5.6, s: [[[4.2, 0], [4.2, 10], [0, 3.2], [5.6, 3.2]]] },
        "5": { w: 5.4, s: [[[5, 10], [0.6, 10], [0.3, 5.6], [2.2, 6.4], [3.9, 6.2],
            [5.3, 4.8], [5.4, 2.4], [4, 0.3], [1.7, 0], [0.1, 1.1]]] },
        "6": { w: 5.5, s: [[[5.2, 8.6], [3.8, 10], [1.8, 10], [0.4, 8.4], [0, 5],
            [0, 2.4], [1.2, 0.3], [3.2, 0], [4.8, 0.8], [5.5, 2.6], [4.8, 4.6],
            [3, 5.4], [1.2, 4.8], [0.1, 3.4]]] },
        "7": { w: 5.4, s: [[[0, 10], [5.4, 10], [1.8, 0]]] },
        "8": { w: 5.5, s: [[[2.75, 5.5], [1, 6.2], [0.4, 7.8], [1.2, 9.5], [2.75, 10],
            [4.3, 9.5], [5.1, 7.8], [4.5, 6.2], [2.75, 5.5], [0.9, 4.6], [0.1, 2.8],
            [0.9, 0.8], [2.75, 0], [4.6, 0.8], [5.4, 2.8], [4.6, 4.6], [2.75, 5.5]]] },
        "9": { w: 5.5, s: [[[5.4, 6.6], [4.3, 5.2], [2.5, 4.6], [0.7, 5.4], [0, 7.4],
            [0.7, 9.2], [2.3, 10], [3.7, 10], [5.1, 8.4], [5.5, 5], [5.5, 2.4],
            [4.3, 0.3], [1.7, 0], [0.3, 1.4]]] },
        "-": { w: 3.6, s: [[[0.4, 4.6], [3.2, 4.6]]] },
        ".": { w: 1.6, s: [[[0.6, 0], [1, 0], [1, 0.5], [0.6, 0.5], [0.6, 0]]] },
        "!": { w: 1.8, s: [[[0.9, 10], [0.9, 3]], [[0.9, 0.6], [0.9, 0]]] },
        "+": { w: 4.6, s: [[[2.3, 7], [2.3, 2.6]], [[0.2, 4.8], [4.4, 4.8]]] },
        "*": { w: 4.4, s: [[[2.2, 7.6], [2.2, 2.4]], [[0.3, 6.4], [4.1, 3.6]],
            [[0.3, 3.6], [4.1, 6.4]]] },
        " ": { w: 4, s: [] }
    };
    const MAP = { "Ä": "A", "Ö": "O", "Ü": "U", "ß": "S" };

    function normalize(text) {
        return String(text || "").toUpperCase().split("")
            .map(c => MAP[c] || c).filter(c => G[c]).join("") || "A";
    }
    function textWidth(text, size) {
        const t = normalize(text);
        let w = 0;
        for (const c of t) w += (G[c].w + 2) * (size / 10);
        return w - 2 * (size / 10);
    }
    /* returns array of polylines for the text; baseline starts at (x,y),
     * rotated by opts.angle around (x,y). */
    function textStrokes(text, x, y, size, opts = {}) {
        const t = normalize(text);
        const k = size / 10;
        const ang = opts.angle || 0;
        const ca = Math.cos(ang), sa = Math.sin(ang);
        const out = [];
        let cx = 0;
        for (const c of t) {
            const g = G[c];
            for (const stroke of g.s) {
                const pts = stroke.map(([gx, gy]) => {
                    const lx = (cx + gx) * k;
                    const ly = -gy * k;             // y up in glyph space, down on page
                    return [x + lx * ca - ly * sa, y + lx * sa + ly * ca];
                });
                out.push(pts);
            }
            cx += g.w + 2;
        }
        return out;
    }
    /* place text centered on (cx, cy) */
    function textCentered(text, cx, cy, size, opts = {}) {
        const w = textWidth(text, size);
        const ang = opts.angle || 0;
        // shift by (-w/2, +0.45*size) within the rotated local frame
        const lx = -w / 2, ly = size * 0.45;
        const x = cx + lx * Math.cos(ang) - ly * Math.sin(ang);
        const y = cy + lx * Math.sin(ang) + ly * Math.cos(ang);
        return textStrokes(text, x, y, size, opts);
    }
    /* rasterize fat-stroked text into an offscreen mask; returns inside(x,y) */
    function makeTextMask(text, cx, cy, capHeight, strokePx) {
        const RES = 250;
        const cv = document.createElement("canvas");
        cv.width = RES; cv.height = RES;
        const ctx = cv.getContext("2d", { willReadFrequently: true });
        ctx.fillStyle = "#fff";
        ctx.fillRect(0, 0, RES, RES);
        ctx.strokeStyle = "#000";
        const scale = RES / 1000;
        ctx.lineWidth = strokePx * scale;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        for (const s of textCentered(text, cx, cy, capHeight)) {
            ctx.beginPath();
            ctx.moveTo(s[0][0] * scale, s[0][1] * scale);
            for (let i = 1; i < s.length; i++) ctx.lineTo(s[i][0] * scale, s[i][1] * scale);
            ctx.stroke();
        }
        const data = ctx.getImageData(0, 0, RES, RES).data;
        return (x, y) => {
            const ix = Math.round(x * scale), iy = Math.round(y * scale);
            if (ix < 0 || iy < 0 || ix >= RES || iy >= RES) return false;
            return data[(iy * RES + ix) * 4] < 128;
        };
    }
    return { glyphs: G, normalize, textWidth, textStrokes, textCentered, makeTextMask };
})();
