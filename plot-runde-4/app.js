"use strict";
/* Page harness: wires canvas, controls, regenerate/download buttons.
 * cfg.generate(api) receives:
 *   api.values     current control values
 *   api.seed       current seed
 *   api.rnd        seeded PRNG function
 *   api.cancelled()true when a newer generation has started
 *   api.draw(lines)    intermediate render (for animated generators)
 *   api.status(text)   progress text
 *   api.done(lines)    final result (enables clean SVG export)
 */
function PR4App(cfg) {
    const canvas = document.getElementById("canvas");
    const statusEl = document.getElementById("status");
    const controlsEl = document.getElementById("controls");

    let lines = [];
    let seed = PR4.randomSeed();
    let token = 0;

    function render() {
        const ctx = PR4.fitCanvas(canvas);
        PR4.drawPolylines(ctx, lines, cfg.drawOpts || {});
    }

    function start() {
        token++;
        const myToken = token;
        window.__done = false;
        statusEl.textContent = "Berechne…";
        cfg.generate({
            values,
            seed,
            rnd: PR4.mulberry32(seed),
            cancelled: () => myToken !== token,
            draw(l) { if (myToken !== token) return; lines = l; render(); },
            status(t) { if (myToken !== token) return; statusEl.textContent = t; },
            done(l) {
                if (myToken !== token) return;
                lines = l;
                render();
                statusEl.textContent = "Fertig — " + l.length + " Pfade. Seed " + seed;
                window.__done = true;
            }
        });
    }

    const restart = PR4.debounce(start, 200);
    const values = PR4.buildControls(controlsEl, cfg.params, () => restart());

    document.getElementById("regen").addEventListener("click", () => {
        seed = PR4.randomSeed();
        if (cfg.onRegen) cfg.onRegen(PR4.mulberry32(seed), cfg.params, values);
        start();
    });

    document.getElementById("download").addEventListener("click", () => {
        PR4.downloadSvg(cfg.svgName + "-" + seed + ".svg",
            PR4.linesToSvg(lines, cfg.svgOpts || {}));
    });

    window.addEventListener("resize", PR4.debounce(render, 150));

    /* hooks for automated testing */
    window.__getSvg = () => PR4.linesToSvg(lines, cfg.svgOpts || {});
    window.__regen = () => document.getElementById("regen").click();

    start();
    return { start };
}
