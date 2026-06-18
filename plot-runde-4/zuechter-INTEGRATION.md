# Züchter — Integrations-Leitfaden (für die dein-muster-Einbindung)

Ziel dieses Dokuments: Ein anderer Claude soll den **generativen Kern** des Züchters
(`zuechter.html`) sauber aus der Prototyp-UI herauslösen und in den Produktions-Editor
`~/r/wiai25` → `assets/dein-muster/engine/` integrieren können.

Der Züchter ist **interaktive Evolution** (Picbreeder-Prinzip): kein Regler, sondern
9 Vorschau-Kacheln, aus denen man auswählt und „brütet". Jede Kachel = ein **Genom**.

---

## 1. Die EINE Funktion, die zählt: `pheno(genome) → marks[]`

Alles Generative steckt in `pheno(g)`. Sie ist **rein** (keine DOM-Abhängigkeit) und liefert
eine Liste von „Marks". Das ist das einzige, was man wirklich portieren muss.

```js
const marks = pheno(genome);   // genome = Float-Array, Länge 16, Werte in [0,1]
```

### Mark-Format (zwei Typen)
```js
// (a) Polylinie (Strich/Kurve/Form):
{ pts: [[x,y], [x,y], …], color: "#1d1b17", w: 1.3, closed: false }
// (b) Glyph (Material-Symbols-Outline):
{ glyph: "★", gx: 12, gy: -40, gsize: 22, color: "#b1482b" }
```

### Koordinatensystem
Zentriert um (0,0), Bereich **[-R, R]²** mit **`R = 440`** (≈ ein 880-Einheiten-Quadrat,
Zentrum 0). Zum Einbau in dein-muster: linear auf die Seitenkoordinaten mappen, z.B.
`pageX = cx + x/R * halfSize`. Die SVG-/Canvas-Helfer unten machen das schon.

---

## 2. Abhängigkeiten

1. **`PR4`** aus `shared.js` (existiert im Prototyp; im Produktions-Repo ggf. nachziehen):
   - `PR4.mulberry32(seed)` — deterministischer PRNG
   - `PR4.makeNoise2D(rnd)` → `{ fbm(x,y,oct) }` — Perlin/fBm (für Wolke/Marmor/Plasma/Strömung)
   - `PR4.contourLines(sample, nx, ny, t, mapX, mapY)` — Marching Squares (für alle Feld-Makros)
   - `PR4.delaunay(points)` — Delaunay-Triangulation (für das Delaunay-Makro)
   Diese vier sind pure Funktionen; man kann `shared.js` mitnehmen oder die vier extrahieren.

2. **Material Symbols Outlined, FILL=0** (Outline-Instanz!) als Webfont — nur für das
   Glyph-Mikro und das Glyph-Ornament. **Wichtig fürs Plotten:** FILL=0 = reine Umrisse;
   FILL=1 (gefüllt) kann ein Stift nicht zeichnen. dein-muster lädt diesen Font bereits für
   den Symbol-Picker — wiederverwenden, aber sicherstellen, dass die FILL=0-Achse genutzt wird.

Keine weiteren externen Libs.

---

## 3. Das Genom (16 Gene, alle in [0,1])

Die Gene werden je nach Makro **mehrfach genutzt** (g4–g10 sind „geteilte Parameter-Gene",
die jeder Generator anders interpretiert — Frequenz, Iterationen, Winkel, Phasen, …).

| Gen | Rolle |
|----|-------|
| g0  | **Makro A** (Struktur) → `floor(g0*NMACRO)` |
| g1  | **Mikro** (Zeichenstil) → `floor(g1*NMICRO)` |
| g2  | Palette → `PALS[floor(g2*len)]` (2 Farben: Tinte + Akzent) |
| g3  | Zellgröße (Stempel-Abstand) / Linienstärke |
| g4  | Frequenz / Iterationen / Detailgrad (generator-spezifisch) |
| g5  | Feld-Drehwinkel; bei Generatoren auch Param (Rose-Maurer, Tunnel-Fluchtpunkt-X, Chladni-Wellenzahl, …) |
| g6  | Mikro-/Schraffur-Winkel; auch Tunnel-Fluchtpunkt-Y, Harmonograph |
| g7  | Kontrast (Feld); auch **Tunnel-Verdrehung**, Harmonograph |
| g8  | Feld invertieren; auch Harmonograph-Dämpfung |
| g9  | Noise-Offset X; auch Delaunay-Seed |
| g10 | Noise-Offset Y |
| g11 | Glyph-Satz → `floor(g11*GLYPHSETS.length)` |
| g12 | Ornament-Objekt (Glyph/Kreis/Quadrat/Zacke) |
| g13 | **Blend-Modus** (morph / interferenz / vereinigung) für Feld×Feld |
| g14 | **Makro B** (für Kombination) |
| g15 | **β** — Mischstärke: Feld×Feld blendet, sonst subtiles Warping |

`randGenome()` = 16× `Math.random()`. Das ist die ganze „DNA".

---

## 4. Mikro × Makro — das Konzept

- **Makro** = die große Struktur (ein Skalarfeld ODER ein Pfad/Linienzug).
- **Mikro** = womit gezeichnet wird (Stempel ODER durchgehende Linie).
- **Kombination A×B** (g14, g15): **zwei Skalarfelder werden algebraisch geblendet**
  (sauber, ergibt Interferenz-Muster) — **NICHT** Geometrie verbogen. Nur wenn ein Pfad
  beteiligt ist, gibt es ein *subtiles* Warping (`AMP=24`, β gekappt). Das war der Schlüssel
  gegen „dreckige" Ergebnisse: **Felder mischen, Geometrie in Ruhe lassen.**

### Makros (g0/g14 → 0..39), `MACRO_NAMES`
Felder (→ Konturlinien via `contourLines`, oder Stempel-Raster):
`0 Verlauf, 1 Streifen, 2 Schachbrett, 3 Radial, 4 Wolke, 5 Wellen, 6 Ringe, 7 Diagonale,
8 Karo, 9 Spirale, 10 Kreis, 11 Herz, 12 Stern, 13 Quadrat, 14 Raute, 19 Ziegel, 20 Moiré,
21 Plasma, 22 Strahlen, 23 Marmor, 31 Moiré-Ringe, 32 Sinus, 33 Chladni`.
Pfade/Linien (in `PATHM`, → eigene Polylinien):
`15 Perspektive (vollflächig), 16 Truchet, 17 Hilbert, 18 Strömung, 24 Peano, 25 Gosper,
26 Sierpinski, 27 Drache, 28 Moore, 29 Kreispackung, 30 Linienschar, 34 Phyllotaxis,
35 Harmonograph, 36 Rose, 37 Torusknoten, 38 Delaunay, 39 Tunnel (zentr. Fluchtpunkt, optional verdreht)`.

### Mikros (g1 → 0..11), `MICRO_NAMES`
Stempel (0–4): `Stipple, Schraffur, Kreuz, Kästchen, Glyphen`.
Linie (5–11): `Linie, Welle, Zickzack, Ornament, Doppel, Strich(elung), Leiter`.

`PATHM` = Set der Makro-Indizes, die Pfade sind (nicht Skalarfelder). Wichtig für die
Fallunterscheidung in `pheno` (Blend vs. Warp) und im Stempel-Pfad.

---

## 5. Code-Struktur in `zuechter.html` (was portieren, was UI ist)

**Generativer Kern (portieren):**
- Konstanten: `R, PALS, NOISE, NMACRO, NMICRO, MACRO_NAMES, MICRO_NAMES, ORN_NAMES,
  PATHM, GLYPHSETS, GLYPHRAMPS`
- Mark-Helfer: `cs, flowAngle, hilbertCurve, resampleN`
- Mikro-Renderer: `stampMark` (Stempel), `placeOrn` + `styleLine` (Linien-Stile)
- Makro-Generatoren: `fieldContours, flowLines, truchetLines, perspLines, tunnelLines,
  hilbertLine, LSYS + lsysCurve, circlePack, stringArt, fit, phylloLine, harmoLine,
  roseLine, torusLine, delaunayMesh, macroLines, macroLines2, clipHero`
- **`pheno(g)`** — der Kern (enthält `fieldOf`, `field`-Blend, `warp`, Stempel-/Linien-Zweig,
  Hero-Overlay)
- `recipe(g)` — liefert den Klartext „Makro · Mikro" (für Anzeige; optional)
- Ausgabe: `drawTo(ctx, W, marks)` (Canvas) und `tileSvg(marks)` (Plot-SVG)
- `buildHero(text)` — Monogramm-Maske + Outline (siehe §6)

**Nur Prototyp-UI (NICHT portieren / ersetzen):**
- `buildGrid, renderGrid, updateBreedBtn, randomize, breed, measureRamps`-Aufruf-Stelle,
  alle `addEventListener`, `window.__*` Test-Hooks, der HTML-Body/CSS.
- `breed(mode)` ist die Zucht-Logik (Crossover/Mutation/Diversitäts-Cap) — als Referenz
  nützlich, aber UI-nah; in dein-muster ggf. neu aufhängen.

**Einmalig vor dem ersten `pheno`:** `measureRamps()` aufrufen (nach Font-Load). Sie misst
die Tinten-Deckung jedes Glyphs und **wirft gefüllte Glyphen raus** (nur Outlines bleiben →
plotbar). Bis dahin enthält `GLYPHRAMPS` Platzhalter.

---

## 6. Hero-Monogramm (optional, dein-muster-Kernfeature)

`buildHero(text)` baut aus einem Wort/Buchstaben:
- `HERO.inside(x,y)` — Maske (für „Aussparung": Stempel/Linien innerhalb werden weggelassen,
  `clipHero` schneidet Linien an der Kante).
- `HERO.outline` — Konturlinien der Maske (via `contourLines`) → werden als **fette,
  unabhängige Umriss-Form** über das Muster gelegt (Farbe `HEROCOL`).

Das Monogramm ist also **unabhängig** vom Hintergrundmuster (ausgeschnitten + umrissen),
nicht „dichterer Hintergrund". In dein-muster kann man stattdessen die vorhandene
Monogramm-Maske (`buildTextMask`/`isInsideMask`) anschließen — Schnittstelle ist nur
`inside(x,y)` + ein Satz Outline-Polylinien.

---

## 7. Plottbarkeit (Pen-Plotter)

- **Nur Outlines**: Glyphen FILL=0; gefüllte Glyphen werden in `measureRamps` per
  Deckungs-Schwelle (`cov ≤ 0.28`) aussortiert.
- **Punkt-Budget**: im Linien-Zweig bricht `pheno` bei ~9000 Punkten/Kachel ab → kein
  undruckbarer Tinten-Klumpen durch Überlappung.
- **Konturen**: `K=9` Levels (ungerade → ein Level liegt auf 0.5, z.B. Chladni-Knoten).
- `tileSvg` exportiert Linien als `<path stroke fill=none>` und Glyphen als `<text>`
  (mit `@import` der Outline-Font). **Fürs echte Plotten Text→Pfade wandeln**
  (Inkscape: Pfad → Objekt in Pfad umwandeln), oder Glyph-Outlines direkt vektorisieren.

---

## 8. Empfohlener Integrationsweg in dein-muster

1. `pheno`, die Generatoren/Helfer und `PR4`-Teile in ein Modul `engine/zuechter-core.js`
   kopieren. Export: `pheno`, `tileSvg`, `randomGenome`, `MACRO_NAMES`, `MICRO_NAMES`.
2. Den Renderer-Aufruf der Engine so erweitern, dass ein „Züchter"-Modus die Marks aus
   `pheno(genome)` ins Seitenkoordinatensystem mappt (Skalierung `R`→Seite) und in den
   bestehenden SVG-/Canvas-Pfad einspeist (Mehrstift via `color`-Gruppierung wie gehabt).
3. Monogramm: `HERO` an die vorhandene Text-Maske der Engine hängen (nur `inside` + Outline).
4. UI: den 9-Kachel-Brüter (auswählen → `breed`) als neues Editor-Panel; oder, falls man
   bei Reglern bleiben will, ein paar Gene als Slider exponieren (g0 Makro, g14 Makro B,
   g15 β, g1 Mikro) und den Rest würfeln.
5. Font: Material Symbols Outlined FILL=0 sicherstellen; `measureRamps()` einmal nach
   `document.fonts.ready` aufrufen.

Das war's — der Rest (CSS, Grid, Event-Handler) ist Wegwerf-UI des Prototyps.
