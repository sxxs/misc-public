# Dialog — Integrations-Leitfaden (für die dein-muster-Einbindung)

Ziel: Ein anderer Claude soll den **Dialog-Editor** (`misc-public/plot-runde-4/dialog.html`)
als neuen Modus in den Produktions-Editor `~/r/wiai25` → `assets/dein-muster/engine/engine.js`
einbauen. Dieses Dokument sagt, **was portiert wird, was wiederverwendet wird, und wo die
Fallstricke liegen** (Koordinatenraum, Punkt-Format, Symbol-Vektorisierung).

**Quelle:** `misc-public/plot-runde-4/dialog.html` (self-contained Prototyp).
**Ziel-Engine:** `~/r/wiai25/assets/dein-muster/engine/engine.js` (Monolith, Vanilla JS).

> Schwesterdokument: `zuechter-INTEGRATION.md` (gleiche Engine, anderer Modus). Vieles dort
> Gesagte (Papierformate, Pens, SVG-Export, Plottbarkeit) gilt auch hier — hier nur die
> Dialog-Spezifika.

---

## 0. Was Dialog ist — und warum es anders ist als prog/zuechter

Dialog ist **Call-and-Response auf zwei Achsen**:

- **Werkzeug** (was *du* zeichnest): Freihand · Gerade · Kreis · Rechteck · Vieleck · Stern
  · **Symbol** (neu, aus dem Material-Symbols-Font).
- **Regel** (wie die *Maschine* deine Geste vervielfältigt): 11 Regeln (s. §2).

Pro Geste erzeugt die Maschine deine Kopien (**Tinte**) **plus** eine kontrastierende
Antwort (**Akzent**) — also genau **zwei Stift-Gruppen**. Das Muster wächst aus dem Hin und Her.

**Der entscheidende Unterschied zu Runde 3 (prog) und Runde 4 (zuechter):**
dein-muster ist bisher **parameter-getrieben** (Würfeln/Slider → `rerender()`, keine
Maus-Interaktion auf dem Canvas). **Dialog ist direkt-manipulativ:** man **zeichnet** mit
dem Zeiger, und die committeten Gesten sammeln sich an. Das heißt:

1. Es gibt eine neue persistente Zustandsliste `state.dialogTurns` (die gezeichneten Gesten).
2. `renderDialog(state)` ist ein **Replay** dieser Gesten durch die aktive Regel — deterministisch.
3. Neu zu bauen ist **Zeiger-Capture auf dem Canvas** (§4). Alles andere (Layer, Farben,
   SVG, Zoom) ist vorhandene Engine-Maschinerie.

**Weggelassen wird:** die Regel **Kreisspiegel** (Inversion). Damit fallen die Helfer
`densify` und `invertStroke` weg (die nur dafür da waren).

---

## 1. Die zwei reinen Kern-Funktionen (das, was zählt)

Aller Generativ-Kern steckt in zwei **reinen** Funktionen ohne DOM-Abhängigkeit:

```js
const stroke = shapeFrom(tool, a, b, corners);   // Geste → Polylinie(n)
const { ink, acc } = apply(stroke, rule, P);      // Regel → 2 Stift-Gruppen
```

- `shapeFrom(tool, a, b, corners)` (`dialog.html` ~Z. 150): wandelt eine Press-Drag-Geste
  (Start `a`, aktuell `b`) je Werkzeug in einen Strich. Frei/Gerade endpunktbasiert,
  Kreis/Vieleck/Stern aus der Mitte, Rechteck als Box.
- `apply(stroke, rule, P)` (`dialog.html` ~Z. 175): wendet die Regel an und liefert
  `{ ink: [line…], acc: [line…] }`. Eine `line` ist `{ pts, color, w }`, `pts` = `[[x,y]…]`.

Beide arbeiten im **Prototyp-Raum** (1000×1000, Mitte `(500,500)`, Punkte als `[x,y]`).
**Beim Port ändert sich nur der Rahmen** (§3) und das Punkt-Format an der Grenze (§3.1).

### Zu portierende Helfer (`dialog.html`)
Punkt-Transformationen (alle um Mitte `CX,CY`):
`rot, reflV, reflH, r180, tdiag, tanti, scaleC, trans, mp, L, sub, hyp, sample`.
Regel-spezifisch: `offsetLines` (Parallelen), `hatchFill` (Schraffur, braucht
`contourLines`), `buildTree` (Baum).
**Nicht** portieren: `densify`, `invertStroke` (nur Kreisspiegel).

### Externe Abhängigkeit: `contourLines` (Marching Squares)
`hatchFill` (Schraffur) **und** die Symbol-Vektorisierung (§5) brauchen
`PR4.contourLines(sample, nx, ny, t, mapX, mapY)` aus `plot-runde-4/shared.js`. Diese
Funktion existiert in `engine.js` **noch nicht** (dort gibt es nur `mulberry32`, `hashSeed`,
`hilbertPoints`). → **~40 Zeilen aus `shared.js` mitnehmen** (in `dialog-core.js` oder eine
kleine `engine/field-utils.js`).

---

## 2. Die 11 Regeln (`apply`) und ihre Parameter

| Regel | Was die Maschine tut | Parameter (`P`) |
|------|----------------------|-----------------|
| **mandala** | N-fache Drehung um die Mitte; Akzent = halbversetzter, eingezogener Ring | `a` = Arme (N) |
| **kaleido** | Diedergruppe (Drehung + Spiegelung); Akzent = die gespiegelte Hälfte | `a` = Achsen (N) |
| **kreuz** | Volle Quadrat-Symmetrie D4 (4 Achsen), bleibt **quadratisch, nicht rund** | – |
| **fries** | Wiederholung + Translation (Bandornament); Akzent = Gleitspiegel-Reihe | `a` = Takte (R) |
| **echo** | Skalierung um den **eigenen Schwerpunkt** (an Ort und Stelle, rein/raus) | `a` = Schichten, `factor` 0.4–2.5 |
| **gitter** | 2D-Kachelung (Tapete); Akzent = halbversetzte Zwischenkopien | `a` = Felder (R, ≤8) |
| **flucht** | Perspektivische Staffelung zum Fluchtpunkt (= Mitte); Akzent = die Schienen | `a` = Tiefe (K) |
| **drechseln** | POVRay-Lathe: Profil um die vertikale Achse rotiert → Meridiane (Tinte) + Breitenkreis-Ringe (Akzent) | `a` = Meridiane, `b` = Ringe |
| **parallelen** | Offset-Konturen **entlang** der Geste (deine Seite Tinte, Maschinen-Seite Akzent) | `a` = Linien, `b` = Abstand |
| **schraffur** | **Füllt** die geschlossene Form mit form-folgenden Iso-Konturen (Distanzfeld) | `a` = Dichte |
| **baum** | Selbstähnliches L-System: an jeder Spitze 2 skalierte+gedrehte Kopien des Motivs | `a` = Tiefe (≤7), `b` = Streuung |

**`P` baut man aus den Slidern** (im Prototyp `paramsNow()`): `{ a, b, corners, factor }`.

**Hinweise zu einzelnen Regeln:**
- `schraffur` ist die **einzige Regel mit anderer Modalität** (füllt statt vervielfältigt).
  Sie nutzt ein signiertes Distanzfeld + Marching Squares → die Linien schmiegen sich der
  Silhouette an. Spacing `= max(4, 60/Dichte)` Seiten-Einheiten.
- `baum`, `drechseln`, `parallelen` setzen einen **einzelnen offenen Strich** voraus
  (Basis = erster Punkt, Spitze = letzter). Mit geschlossenen Formen/Symbolen degenerieren
  sie → für die Symbol-Werkzeuge nur die multiplikativen/füllenden Regeln anbieten (§5).
- Mengenkappung gegen Tinten-Klumpen ist schon drin: `gitter` ≤8 Felder, `baum` Tiefe ≤7
  (`2^8−1 = 255` Kopien), `flucht`/`echo` über Schichten begrenzt.

---

## 3. Datenmodell-Anpassung (das Wichtigste am Port)

### 3.1 Punkt-Format: `[x,y]` ↔ `{x,y}`
- Prototyp: Punkt = `[x, y]` (Array), Linie = `{ pts:[[x,y]…], color, w }`.
- dein-muster: Punkt = `{ x, y }` (Objekt), Pfad = `[{x,y}…]`, Layer = `{ role, paths }`.

**Empfehlung: Regel-Engine intern bei `[x,y]` lassen** (Null-Risiko-Port der Geometrie) und
**nur an der Grenze konvertieren**, wenn die Linien in den dein-muster-Pfad gehen:

```js
const toDM   = pts => pts.map(([x, y]) => ({ x, y }));      // [x,y] → {x,y}
const fromDM = pts => pts.map(p => [p.x, p.y]);             // {x,y} → [x,y]
```

### 3.2 Koordinatenraum: fix 1000×1000 → variabel W×H (oft **nicht quadratisch**)
Der Prototyp hat `const SIZE=1000,CX=500,CY=500`. dein-muster liefert `{W,H}` aus
`dimensionsFor(format, orientation)` (Basis 900; z.B. A4-Hoch ≈ 900×1273). **De-hardcoden:**

```js
function frameOf(state){
  const { W, H } = dimensionsFor(state.format, state.orientation);
  return { W, H, cx: W/2, cy: H/2, S: Math.min(W, H) };   // S = kurze Kante
}
```

Dann in den portierten Helfern:
- `CX → frame.cx`, `CY → frame.cy` (alle Dreh-/Spiegel-/Skalier-Helfer, flucht, drechseln-Achse).
- `SIZE` kommt nur an zwei Stellen vor — **bewusst ersetzen:**
  - **fries**: `period = SIZE/R` → `period = W/R` (Bandbreite = Blattbreite), Abdeckung
    `n = ceil(R)+1`.
  - **gitter**: quadratische Zellen über `S`: `period = S/min(R,8)`; Abdeckung getrennt
    `nX = ceil(W/period)+1`, `nY = ceil(H/period)+1` (statt symmetrischem `n`).
- **mandala/kaleido/kreuz** funktionieren auf nicht-quadratischem Blatt geometrisch korrekt
  (Reflexionen/Drehungen um `cx,cy`); `kreuz`/`kaleido` können bei extremem Seitenverhältnis
  über die kurze Kante laufen → wird vom Crop/Zoom der Engine ohnehin beschnitten. OK.
- **echo, parallelen, schraffur, baum** sind rein lokal (Schwerpunkt/Normale/Bbox/Basis) →
  **keine** `SIZE`/Mitte-Abhängigkeit, laufen unverändert.

### 3.3 Gesten format-robust speichern (Empfehlung)
Damit ein Wechsel von Papierformat/Orientierung das Muster **nicht** zerschießt: jede Geste
**normalisiert** (zentriert, auf `S` skaliert) ablegen, nicht in rohen Pixeln:

```js
// state.dialogTurns[i] = { tool, rule, params, pts:[[nx,ny]…] }  // nx=(x-cx)/S, ny=(y-cy)/S
const norm  = (p, f) => [(p[0]-f.cx)/f.S, (p[1]-f.cy)/f.S];
const denorm= (p, f) => [f.cx + p[0]*f.S, f.cy + p[1]*f.S];
```

**Wichtige Designentscheidung (besser als der Prototyp):** Im Prototyp werden die *erzeugten
Linien* eingefroren. Für dein-muster lieber **die rohe Geste + Werkzeug + Regel + Params pro
Turn speichern und `apply()` zur Render-Zeit neu ausführen** — dann fließen Format-, Pen- und
Parameter-Änderungen automatisch nach (Re-Layout statt Standbild).

---

## 4. Interaktion: Zeichnen auf dem Canvas (die einzige wirklich neue Maschinerie)

dein-muster hat bisher kein Zeichnen. Im **Dialog-Modus** drei Zeiger-Handler auf `#pw-canvas`
(nur aktiv, wenn `state.mode === 'dialog'`), adaptiert aus `dialog.html` (`pointerdown/move/up`):

```js
function toPage(e){                                  // Client- → Canvas-Koordinaten (W,H-Raum)
  const r = canvas.getBoundingClientRect();
  return [ (e.clientX-r.left)/r.width  * W,
           (e.clientY-r.top )/r.height * H ];
}
// down: start = cur = toPage(e); raw=[start]; live-Preview via shapeFrom(tool,start,cur)
// move: cur = toPage(e); bei 'frei' Punkte sammeln; Preview neu zeichnen (eigener Overlay-Canvas
//       oder rerender mit Preview-Layer)
// up  : commit() → stroke bauen, normalisieren, als Turn pushen, rerender()
```

`commit()` (vgl. Prototyp): Werkzeug-abhängig den Strich bauen (`shapeFrom` bzw. Freihand-`raw`),
verwerfen wenn zu kurz, sonst `state.dialogTurns.push({tool, rule:nextRule(), params, pts:normiert})`
und `rerender()`. Mindest-Maschinerie: **Undo** (`pop`), **Leeren** (`[]`), `nextRule()` für den
🎲-Modus (zyklisch, vgl. `CYCLE`).

> Hinweis Live-Preview: am einfachsten ein dünner transparenter Overlay-Canvas über `#pw-canvas`,
> damit die laufende Geste nicht jeden `renderMonogramm()`-Durchlauf triggert.

---

## 5. Mehr Formen — inkl. Symbol-Font (User-Wunsch)

Die **Werkzeug-Achse** wird erweitert. Triviale Zusätze (mehr reguläre Vielecke, Herz, …) sind
nur weitere Zweige in `shapeFrom`. Der interessante Fall ist das **Symbol-Werkzeug**:

### 5.1 Picker wiederverwenden
Der Symbol-Picker existiert schon: `MS_FONT_NAME = 'Material Symbols Outlined'`, `MS_CURATED`
(kuratierte Codepoints), `openSymbolPicker()` / `renderSymbolGrid()`. → **unverändert
wiederverwenden**, nur das Ergebnis (ein Codepoint/Glyph) statt in `state.letters` in den
Dialog-Stroke leiten.

### 5.2 Die Lücke: Glyph → Polylinien (Vektor-Outline)
**Achtung:** dein-muster rendert Symbole bisher nur als **gerastertes Maskenbild**
(`buildTextMask()` → `ctx.fillText` → ImageData), **nicht** als Vektoren. opentype.js ist
**nicht** vorhanden. Für Dialog brauchen wir aber Outline-**Polylinien**, damit die Regeln das
Symbol wie jede Form transformieren können. Lösung **ohne neue Lib** (reuse der vorhandenen
Masken-Infrastruktur):

```js
// Glyph → Outline-Polylinien
function glyphContours(codepoint, sizePx){
  const c = document.createElement('canvas'); c.width = c.height = 256;
  const g = c.getContext('2d');
  g.font = `224px '${MS_FONT_NAME}'`;            // FILL=0-Instanz! (nur Umrisse, plotbar)
  g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillText(String.fromCodePoint(codepoint), 128, 128);
  const im = g.getImageData(0,0,256,256).data;
  const nx=256, ny=256, sample=(x,y)=> im[(y*nx+x)*4+3] > 128 ? 1 : 0;   // Alpha-Schwelle
  // Marching Squares auf 0.5 → geschlossene Outline-Polylinien:
  const raw = contourLines(sample, nx, ny, 0.5, gx=>gx, gy=>gy);
  // auf gewünschte Größe + Mitte skalieren, leicht glätten (gegen Treppchen):
  return raw.map(poly => smooth(poly).map(([x,y]) =>
        [ (x-128)/224*sizePx, (y-128)/224*sizePx ]));
}
```

Ergebnis: ein **mehr-konturiges** Motiv (z.B. „8" = zwei Konturen). Optional die Treppchen aus
dem Marching-Squares mit Chaikin/Douglas-Peucker glätten oder die Maske 2× supersamplen.

### 5.3 Motiv = Liste von Konturen
Ein Symbol ist mehrkonturig, die anderen Werkzeuge einkonturig. Sauberste Verallgemeinerung:
**jedes Motiv ist `contours: [[x,y]…][]`** (Frei/Gerade/Kreis/… = 1 Element). `apply` so
anpassen, dass die **punkt-transformierenden** Regeln (mandala, kaleido, kreuz, fries, gitter,
echo, flucht) je Kontur abgebildet werden; `schraffur` füllt je Kontur (Even-Odd).
`baum/drechseln/parallelen` brauchen einen einzelnen offenen Strich → **für Symbole nur die
Symmetrie-/Füll-Regeln freischalten** (UI: die drei stroke-Regeln ausgrauen, wenn Werkzeug =
Symbol).

---

## 6. 1- oder 2-farbig — direkte Abbildung auf mono/duo (User-Wunsch)

Dialogs `{ ink, acc }` passt **1:1** auf die vorhandene Layer-/Pen-Maschinerie. Kein neues
Farbsystem nötig — `PEN_COLORS`, `DUO_PENS`, `SINGLE_PENS`, `colorsFor(state)`, die Swatch-UI
(`#pw-swatches-A/B`) und der Inkscape-Layer-Export bleiben **wie sie sind**.

`renderDialog(state)` liefert dasselbe Format wie `renderProgram(state)`
(`{ paths, layers, width, height }`). Der Layer-Bau:

```js
function dialogLayers(inkPaths, accPaths, state){          // paths bereits {x,y}, page-coords
  const twoColor = (state.mode === 'duo');                  // 2-farbig = duo-Modus
  if (!twoColor) return [{ role:'A', paths: inkPaths.concat(accPaths) }];  // 1-farbig = mono
  const { inks } = colorsFor(state);
  return [
    { role:'A', paths: inkPaths, color: inks.A, label: '1 — '+penLabel(state.inkA) },  // du
    { role:'B', paths: accPaths, color: inks.B, label: '2 — '+penLabel(state.inkB) },  // Maschine
  ];
}
```

Damit ist der **1-/2-farbig-Schalter = die bestehenden Modus-Tabs mono/duo** (oder ein kleiner
eigener Toggle, der `state.mode` setzt). „Tinte" landet auf Stift A, „Akzent" auf Stift B — genau
wie der Prototyp zwei Farben nutzt. Papierfarbe (weiß/schwarz) und die zulässigen Pen-Paare
kommen frei aus der Engine (`DUO_PENS[paper_bg]`).

---

## 7. Glatte Kreise (der gemeldete „Ecken"-Bug)

Im Prototyp hatte der Kreis zu wenige Segmente (`max(28, R/5)`) → sichtbare Ecken. **Behoben**
(chord-basiert): `seg = clamp(round(2πR / chord), 64, 400)` mit Chord ≈ 4–5 Seiten-Einheiten.
Dieselbe Regel gilt für **jeden** gebogenen Pfad — beim Port die Drechsel-Breitenkreis-Ringe
ebenso chord-basiert sampeln (im Prototyp ebenfalls schon gefixt). Faustregel fürs Plotten:
**Bogen-Sehnen ≤ ~0.5 mm** auf dem Zielblatt, dann sieht man keine Facetten.

---

## 8. Plottbarkeit (Pen-Plotter) — gilt wie bei zuechter

- **Nur Umrisse:** Symbole aus der **FILL=0**-Instanz (gefüllte Glyphen kann kein Stift malen).
  `schraffur` ist Linien-Füllung (kein Flächen-Fill) → plotbar.
- **Punkt-/Linien-Budget:** Kappungen aus §2 beibehalten (`gitter` ≤8, `baum` Tiefe ≤7); zur
  Sicherheit nach dem Replay eine Gesamt-Punktzahl-Schwelle je Render setzen (vgl. zuechter
  ~9000 Pkt/Kachel).
- **Zwei Pens = zwei Inkscape-Layer:** schon vorhanden über `renderToSVG` (duo → Layer A/B).
- **mm/Stiftbreite:** `penMmFor(state)` / `penWidthPx(state)` unverändert.

---

## 9. Empfohlener Integrationsweg in dein-muster

1. **`engine/dialog-core.js`** anlegen: `shapeFrom`, `apply` (11 Regeln, **ohne** kreisspiegel),
   alle Helfer aus §1, plus `contourLines` (aus `shared.js`). Rein, `[x,y]`-intern, keine DOM-Abh.
   Export: `shapeFrom`, `apply`, `RULES`, `CYCLE`, `glyphContours`.
2. **State erweitern** (in `DEFAULTS` + `EDITOR_FIELDS`, damit es persistiert/serialisiert):
   `mode:'dialog'` (neuer Tab), `dialogTurns:[]`, `dialogTool:'frei'`, `dialogRule:'mandala'`,
   `dialogAuto:false`, `dialogA/dialogB/dialogFactor/dialogCorners`.
3. **`renderDialog(state)`**: `frame = frameOf(state)`; je Turn `pts` denormalisieren, `apply()`
   ausführen, `ink/acc` sammeln, `[x,y]→{x,y}` (`toDM`), via `dialogLayers` (§6) zu Layern.
   Rückgabe `{ paths, layers, width:W, height:H }`. In der Dispatch-Stelle von
   `renderMonogramm()` (neben dem `prog`-Zweig, ~Z. 2754) einhängen.
4. **Zeiger-Handler** auf `#pw-canvas`, nur im Dialog-Modus aktiv (§4) → committen Turns.
5. **UI** im Editor-Partial (`layouts/partials/dein-muster/editor.html`): Werkzeug-Pills,
   Regel-Pills, 🎲, adaptive Slider (a/b/factor/corners je Regel ein-/ausblenden), Symbol-Picker-
   Button (reuse), Undo/Leeren. „1-/2-farbig" auf die bestehenden mono/duo-Tabs legen.
6. **Glatte Kreise** (§7) und **Symbol-Vektorisierung** (§5) mitnehmen.
7. **Save/Fingerprint:** `dialogTurns` zu `FINGERPRINT_FIELDS` und in die persistierten
   `EDITOR_FIELDS` aufnehmen (sonst geht das gezeichnete Muster beim Reload verloren).

**Wiederverwendbar wie sie sind** (nicht anfassen): `dimensionsFor`, `PAPER_WIDTH_MM`, `FORMATS`,
`PEN_COLORS`, `DUO/SINGLE_PENS`, `colorsFor`, `buildLayers`-Idee, `drawCanvas`, `renderToSVG`,
Zoom/Crop, der Symbol-Picker.

---

## 10. Was **nicht** portieren

- Prototyp-`<body>`/CSS, die `window.__*`-Test-Hooks.
- `PR4.linesToSvg` / `PR4.downloadSvg` (dein-muster hat eigenen Export `renderToSVG`).
- `densify`, `invertStroke` (gehörten zu Kreisspiegel — entfällt).
- Das immer-sichtbare Hilfsraster ist optional: falls gewünscht, als **Overlay-Canvas** über
  `#pw-canvas` legen (rein visuell, nie in `paths`/SVG) — Dominik mag es zum Ausrichten.

---

### Anhang: Regel↔Slider-Mapping (für die adaptive UI)

| Regel | Slider A (Label) | Slider B | Extra |
|------|------------------|----------|-------|
| mandala | Arme | – | – |
| kaleido | Achsen | – | – |
| kreuz | – | – | – |
| fries | Takte | – | – |
| echo | Schichten | – | Faktor (0.4–2.5) |
| gitter | Felder | – | – |
| flucht | Tiefe | – | – |
| drechseln | Meridiane | Ringe | – |
| parallelen | Linien | Abstand | – |
| schraffur | Dichte | – | – |
| baum | Tiefe | Streuung | – |

Vieleck/Stern blenden zusätzlich „Ecken/Zacken" ein. Bei Werkzeug = Symbol nur Symmetrie-/Füll-
Regeln aktiv (baum/drechseln/parallelen ausgrauen).
