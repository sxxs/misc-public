# Neue Techniken & Tools für die „Dein Muster"-Plotter-Installation (Runde 4)

Untersuchung von sechs Quellen auf vektorbasierte, in JavaScript/Browser reimplementierbare Plottertechniken. Fokus: emergente Komplexität, Multi-Scale-Struktur, kompositorische Entwicklung — und das, was über die bereits abgedeckten Verfahren hinausgeht. Detailtiefe als Build-Spezifikation für Claude Code.

## TL;DR
- Die wertvollsten *neuen* Techniken sind: (1) **Generative Noodles** (Self-Avoiding Walk auf Grid mit doppelten Offset-Kanten + Endkappen/Joiner-Glyphen), (2) PEmbroiders **Fill-Algorithmen** — besonders CONCENTRIC/SPIRAL-Inset-Fill, Boustrophedon-Satin und vektorfeldgesteuertes Fill, plus der **modifizierte TSP-Pfadoptimierer** — und (3) Turtletoys **wiederverwendbare Reinder-Nijhoff-Utilities** (Polygon-Clipping/Hidden-Line, Polygon-Hatching, Catmull-Rom, Poisson-Disc, Curl-Noise, Voxel-Raycaster), die fertige, meist MIT-lizenzierte JS-Bausteine sind.
- Mehrere echte neue Algorithmen lohnen sich: **Gilbert-Tessellation** (Random Crack Network), **Connected Fermat Spirals** als Single-Path-Flächenfüllung, **plottrbottrs** SVG-Outline→Delaunay/Voronoi-Lace, sowie die **unkonventionellen Labyrinth-Typen** (Theta/Delta/Sigma/Upsilon, Weave/2.5D, unicursal) mit der wichtigen Single-Path-Eigenschaft.
- drawingbots.com (kuratiert von Maks Surguy) liefert vor allem einen **Werkzeugkatalog** statt Algorithmen; die für Browser/JS relevanten Perlen sind mitxelas **plotterfun** (Webworker-Algorithmen-Framework), **UJI** (iterative Linientransformation), **Urpflanze** (JS Creative-Coding-Lib) und **paper.js**-basierte Generatoren.

## Key Findings

1. **Generative Noodles ist ein Self-Avoiding-Walk-Generator** mit ästhetisch wertvollem Twist: nicht der Pfad selbst, sondern zwei parallele Offset-Kanten (Schlauchbreite) plus eingesetzte Endkappen-/Joiner-SVGs erzeugen das „Verrohrungs"-Aussehen. Trivial in JS reimplementierbar. (114 Sterne; GitHub-Topic-Listing „generative-art", cadin/generative-noodles, „A generative art sketch for creating plotter art in Processing".)
2. **PEmbroider ist die reichhaltigste Fill-Algorithmen-Quelle.** Es implementiert PARALLEL, CROSS, CONCENTRIC (Inset), SPIRAL, PERLIN (Vektorfeld), VECFIELD (custom field), SATIN (ZIGZAG/SIGSAG/BOUSTROPHEDON) und DRUNK-Fills — alle als Polylinien-Ausgabe, plus einen TSP-Pfadoptimierer (2-opt) zur Minimierung der Stiftwege. Für Plotter explizit geeignet (Resampling aus, Connecting-Line aus, optimize an).
3. **Turtletoy = Bibliothek wiederverwendbarer JS-Utilities.** Reinder Nijhoffs Polygon-Clipping (Hidden-Line-Removal durch Polygon-Differenz), Polygon-Hatching, Catmull-Rom-Splines, Poisson-Disc-Grid, Simplex/Curl-Noise und Voxel-Raycaster sind MIT-lizenziert und direkt als Bausteine nutzbar. Neue *Algorithmen*: Gilbert-Tessellation, Hat-Monotile (aperiodisch), Poincaré-Disk (hyperbolische Kachelung), Chaos Game, Droste-Effekt.
4. **plottrbottr** verwandelt eine SVG-Outline in „Lace": Samplen der Kontur + zufällige Innenpunkte → Delaunay-Triangulation oder Voronoi-Diagramm → optional Subtraktion einer geschrumpften Kopie. Reines JS (Node + Browser-Version).
5. **mazemaking.com** deckt mehrere Algorithmen (Recursive Backtracking, Prim, Kruskal) und Geometrien (orthogonal, hexagonal) ab; das breitere Maze-Feld bietet unicursale Labyrinthe (Single-Path), Theta/Delta/Sigma-Geometrien und Weave-Mazes als plotter-attraktive neue Typen.
6. **drawingbots.com** ist ein Katalog; die für JS relevanten neuen Funde sind plotterfun, UJI, Urpflanze, Serpentine Plotter, TilePlayground, Kumiko-Generator und Bezier Morpher.

## Details

### 1. Generative Noodles (cadin/generative-noodles)

**Was es ist:** Eine Processing-4-Sketch (kein JS), die „bendy noodle segments" in ein vordefiniertes Raster „spritzt" und plotfertiges SVG ausgibt. Unlicense (gemeinfrei). 114 Sterne, benötigt Processing 4 + ControlP5-UI-Lib.

**Algorithmus (rekonstruiert aus README + config.json + Path-Edit-Verhalten; der Kern-Wachstums-Loop-Quelltext war über GitHub-Raw nicht direkt abrufbar):**
- **Datenstruktur:** 2D-Integer-Grid (`gridWidth`×`gridHeight`). Zellzustände als Integer kodiert: `0` = offen, `12` = blackout (gesperrt). Jeder Noodle hält eine geordnete Liste seiner belegten Zellen (Ende-Zellen identifizierbar — bestätigt durch den Path-Edit-Modus, der Enden grün markiert und Verlängerung in Nachbarzellen erlaubt).
- **Wachstum:** Pro Noodle wird eine **Ziel-Länge** zufällig aus `[minLength, maxLength]` gewählt. Der Noodle wächst Zelle für Zelle (Self-Avoiding Walk auf orthogonalem 4-Nachbar-Grid), belegt Zellen und stoppt, wenn (a) die Ziel-Länge erreicht ist oder (b) er „gefangen" ist (keine freie Nachbarzelle). Das ist wörtlich im README belegt: *„A noodle will grow, filling space until it either runs out of space, or reaches its target length. minLength just defines the lower bounds for the target length, not an actual threshold … noodles will often be drawn shorter than the minLength setting."* `numNoodles` Noodles werden sequentiell platziert, bis das Grid voll ist; `allowOverlaps` lockert die Belegungsprüfung.
- **Rendering:** Der Mittellinien-Pfad wird **nicht** direkt gezeichnet; stattdessen werden **zwei parallele Kanten** im Abstand `noodleThicknessPct × Zellbreite` (Offset je Seite) erzeugt — das ergibt die Schlauch-/Röhrenoptik. `useCurves` schaltet zwischen abgerundeten (Bezier) und eckigen Ecken um. An Zellgrenzen werden vorgefertigte SVG-Glyphen eingesetzt: `head`/`tail` (Endkappen), `joiners` (zufällig in geraden Abschnitten), `twists`. Diese SVGs sind so dimensioniert, dass sie Noodle-Kanten im Abstand von **100px** schneiden (interne Normierung).
- **SVG-Ausgabe:** plotfertig; Konfig wird als JSON mitgespeichert (reproduzierbare Serien). Maskenbild-Import (schwarz/weiß) sperrt Zellen → Noodle-Muster in beliebiger Silhouette/Logo.
- **Beispiel-config.json (verbatim):** `printWidthInches 16, gridWidth 8, gridHeight 5, noodleThicknessPct 0.9, numNoodles 90, penSizeMM 0.35, useCurves false, randomizeEnds true`.

**JS-Reimplementierung:** Einfach. Grid als 2D-Array; SAW-Wachstum mit Nachbarschaftsprüfung; Offset-Kanten via Polylinien-Offset (links/rechts der Mittellinie senkrecht zur Laufrichtung); Ecken mit quadratischen Bezierkurven runden. Endkappen als inline-SVG-Pfad-Snippets an Pfadenden einsetzen. **Ästhetik:** verspielte, organische „Verrohrung"/Spaghetti, Multi-Scale durch variable Längen, sehr gut für interaktive Maskierung (Blackout-Zellen, Maskenbild → Buchstabe/Logo aus Noodles). Sehr passend für „Dein Muster".

### 2. PEmbroider (CreativeInquiry) — Fill-Algorithmen-Goldgrube

**Was es ist:** Java/Processing-Embroidery-Lib (GPLv3 + Anti-Capitalist License) von Golan Levin, Lingdong Huang, Tatyana Mustakos (CMU STUDIO for Creative Inquiry, 2020). Embroidery-Output ist fundamental linien-/stichbasiert (Vektor). Exportiert u.a. SVG, GCODE, PDF. Auf drawingbots.com ausdrücklich als plottertauglich gelistet: „turn off the connecting line, turn off resampling, turn on optimizing" → reine linienbasierte Zeichnung. Stich-Settings-Defaults: `E.strokeSpacing(2.0)`, `E.hatchSpacing(3.0)`, `E.setStitch(5, 30, 0.0)`.

**Die Fill-/Hatch-Modi (`hatchMode`) — alle als Polylinien-Output, das ist der eigentliche Schatz:**
- **PARALLEL** (`hatchParallel(poly, ang, d)`): Standard-Schraffur. Wichtig: `hatchParallelComplex(polys, ang, d)` füllt Polygone **mit Löchern** (even-odd-Regel). Implementierung: Linienschar im Winkel `ang`, Abstand `d`; jede Linie mit Polygon schneiden (`segmentIntersectPolygons`), Schnittpunkte sortieren, abwechselnd innenliegende Segmente behalten.
- **CROSS** (Kreuzschraffur via zwei Winkeln `hatchAngles(ang1, ang2)`). `EXPERIMENTAL_CROSS_RESAMPLE` versucht Stich-Misalignment gegen Moiré.
- **CONCENTRIC / Inset** (`hatchInset(poly, d, maxIter)`): füllt durch wiederholtes **Insetten (Offset nach innen)** des Polygons — konzentrische Ringe, die der Form folgen. Parameter `CONCENTRIC_ANTIALIGN = 0.6` reduziert visuelle Grate. Ästhetisch: konturfolgende „Höhenlinien"-Füllung, sehr organisch.
- **SPIRAL** (`hatchSpiral(poly, d, maxIter, reverse)`): wie Inset, aber die Ringe werden zu *einer durchgehenden Spirale* verbunden → **Single-Path-Füllung** (ein Federzug pro Fläche!). Sehr plotter-effizient. `setSpiralDirection(CW/CCW)`.
- **PERLIN** (`hatchPerlin(poly, d, len, scale, maxIter)`): füllt durch **Laufen entlang eines Perlin-Vektorfelds** (Flow-Field-Fill innerhalb der Form). `len` = Schrittlänge, `scale` = Noise-Skala, `maxIter` = Anzahl Seeds.
- **VECFIELD / customField** (`hatchCustomField(poly, vf, d, len, maxIter)`): beliebiges benutzerdefiniertes Vektorfeld als Füllrichtung. Erlaubt z.B. radiale, wirbelnde, divergierende Füllungen.
- **SATIN** (`satinMode(ZIGZAG / SIGSAG / BOUSTROPHEDON)`): Zickzack-Füllung eines „sweepable" Bandes; BOUSTROPHEDON = mäanderndes Hin-und-Her als ein Pfad. `SATIN_RESAMPLING_OFFSET_FACTOR = 0.5` gegen Grate.
- **DRUNK** (`hatchDrunkWalk(poly, rad, maxIter)`): Random-Walk-Füllung (Demo, wie leicht neue Modi addierbar sind).

**Stroke-Generierung (Outline-Stiche):** `strokeMode(PERPENDICULAR | TANGENT)`. TANGENT = mehrere parallele Linien entlang der Konturrichtung (`strokePolygonTangent`), PERPENDICULAR = Querstriche (`strokePolyNormal`). `strokeLocation(INSIDE/CENTER/OUTSIDE)`. → Damit lassen sich „dicke" Konturen aus mehreren dünnen Plotterlinien aufbauen.

**Geometrie-Utilities (direkt portierbar):** `offsetPolygon`/`insetPolygon` (Polygon-Offset, kann in mehrere Polygone zerfallen), `selfIntersectPolygon` (Selbstüberschneidungen auflösen), `segmentIntersectPolygon`, `pointInPolygon`, `clip(polys, mask)` (Polylinien an Maske clippen), `isolines(im, d)` (Isolinien eines Graustufenbilds über mehrere Schwellen — Reaction-Diffusion-/Höhenlinien-artig), `perfectDistanceTransform`.

**Pfadoptimierung (sehr wertvoll für Plotter):** `optimize(trials, maxIter)` löst ein **modifiziertes Travelling-Salesperson-Problem mit 2-opt**, um die Reihenfolge der Polylinien (= Stiftbewegung zwischen Linien) zu minimieren. `beginOptimize(reorderColor, …)` kann zusätzlich Farbwechsel (Stiftwechsel) reduzieren. **Das ist genau der Pen-Travel-Optimierer, den jede Plotter-Pipeline braucht.**

**Resampling:** `resample`, `resampleN`, `resampleNKeepVertices`, `smoothen` (rationale quadratische Bezier-Glättung). Für Plotter Resampling abschalten.

**JS-Reimplementierung:** Mittel. Die Fill-Algorithmen sind reine 2D-Geometrie und gut portierbar; Inset/Spiral brauchen einen robusten Polygon-Offset (in JS z.B. via **ClipperLib/clipper-lib** oder **polygon-offset**). TSP-2-opt ist Standard. **Ästhetik:** professionelle, dichte Füllungen mit Richtungssteuerung — hebt einfache Schraffur deutlich an (Spiral-Single-Path, konturfolgende Inset-Füllung, Flow-Field-Fill).

### 3. plottrbottr / „Lace Maker 2" (blackmad)

**Was es ist:** JS-Tool (Node + interaktive Browser-Version unter blackmad.github.io/plottrbottr), das eine **SVG-Outline in geometrische „Spitze"/Lace** verwandelt. Inspiriert von Julien Leonards Papierschmetterlingen und „trammel's lace maker". ~11 Sterne, JavaScript.

**Algorithmus (aus CLI-Optionen rekonstruiert):**
1. Input-SVG-Outline laden, auf `maxWidth`/`maxHeight` (in Zoll) skalieren.
2. **`numPoints`** Punkte entlang der Kontur samplen + **`numExtraPoints`** zufällige Innenpunkte.
3. Triangulieren: **Delaunay** (Default) oder **Voronoi** (`--voronoi`) über alle Punkte.
4. Auf die Outline clippen; optional `--subtract`: eine geschrumpfte Kopie der Outline vom inneren Gitter abziehen → „Rahmen + Füllgitter".
5. Optional `--rounded` (gerundete Zellen), `--addHole` (Loch für Aufhängung, `--holeSize`, `--butt`), `--outlineSize`, `--safeBorder`. Ausgabe via `--outputTemplate` als SVG.

**JS-Reimplementierung:** Einfach (ist bereits JS). Nutzt Delaunay/Voronoi (z.B. **d3-delaunay** oder Mapbox **delaunator**). **Ästhetik:** filigrane, schmuckartige Triangulations-/Voronoi-Füllung beliebiger Silhouetten — ideal, um Nutzer-Eingaben (Buchstabe, gezeichnete Form) in Lace zu verwandeln. Delaunay/Voronoi sind bereits abgedeckt, aber die **Outline→Lace-Pipeline (Kontur-Sampling + Subtract-Rahmen)** ist ein neues, kompositorisch wertvolles Muster.

### 4. Turtletoy (turtletoy.net, Reinder Nijhoff)

Codepen-artige JS-Plattform; jede „Turtle" ist offener JS-Quelltext mit SVG/GCODE-Export. Turtle-Graphics selbst ist abgedeckt — wertvoll sind die **spezifischen Algorithmen** und v.a. **Nijhoffs wiederverwendbare Utility-Klassen** (meist MIT).

**Wiederverwendbare Utility-Bibliotheken (die eigentlichen Juwelen — direkt als JS-Bausteine):**
- **Polygon Clipping / Hidden-Line-Removal** (`a5befa1f8d` „Stars", `348e597fd8`, `92ebe08d89`): Eine `Polygons()`-Klasse, bei der jedes Polygon einen Clip-Path (`cp`) und Draw-Lines (`dp`) hält. Neue Polygone werden **gegen alle vorher gezeichneten differenziert** (`boolean`/`diff`-Methode mit Segment-Polygon-Schnitt + Inside-Test + AABB-Broad-Phase), sodass verdeckte Linienteile entfernt werden → korrekte Verdeckung für Plotter. **Das ist die Schlüssel-Utility** für jede 3D-/Schichten-Komposition (Städte, Voxel, gestapelte Formen). Port von Paul Bourkes Segment-Schnitt.
- **Polygon Hatching** (`92ebe08d89`): erweitert die Clipping-Klasse um `addHatching(angle, distance)` → schraffiert Polygone *und* respektiert Verdeckung. `addOutline()` für Konturen.
- **Polygon Utility** (`108305d431`, MIT): `pDraw, pSplitEdges, pTransform, pSmooth, pDistance, pPointInPolygon` — komplettes Polygon-Toolkit (Kanten splitten, transformieren, glätten, Punkt-Distanz, Inside-Test).
- **Centripetal Catmull-Rom Splines** (`01e218e32f`, MIT): glatte interpolierende Splines durch Punkte — für organische Kurven.
- **Poisson-Disc-Grid** (`b5510898dc`): schnelles Poisson-Disc-Sampling via Gitter-Hashing (`cellSize = 1/√2/radius`), `insert(p)` prüft 3×3-Nachbarzellen. Basis für gleichmäßige, nicht-gitterartige Punktverteilung.
- **Simplex Noise** (`6e4e06d42e`, MIT): kompakte 2D/3D-Simplex-Noise-Implementierung (nach Gustavson).
- **Curl Noise** (`740f09b88c`): divergenzfreies Flow-Field via numerischer Rotation des fBm-Gradienten (`curlNoise` = senkrechter Gradient von fbm, `eps=0.01`) — Turtle läuft entlang, mit Poisson-Disc-Abstandskontrolle (`maxPathLength`, `radius`). Erzeugt wirbelnde, nicht-überlappende Strömungslinien. (Flow-Fields sind abgedeckt, aber Curl-Noise als *divergenzfreie* Variante + Poisson-Abstand ist eine konkrete Verbesserung.)
- **Voxel Ray Caster** (`d9ae1fb0bd`, MIT): castet Strahlen in eine Voxel-Welt (definiert durch `map(p)→bool`), sammelt sichtbare Faces, zeichnet sie mit Hidden-Line-Removal (DDA-Voxel-Traversal). Für 3D-Linienkunst (Menger-Schwamm, Voxel-Landschaften).
- **ln / 3D Line Art Engine** (Port von Fogleman): vollständige 3D→SVG-Linienengine mit Verdeckung (`4b8ea1c123` etc.).

**Neue/spezifische Algorithmen auf Turtletoy:**
- **Gilbert-Tessellation** (`4823100ba2`): Random Crack Network (siehe Empfehlungen unten).
- **Aperiodic Hat Monotiles** (`61a52c764a`): das „Hat"-Monotil von David Smith, Joseph Samuel Myers, Craig S. Kaplan & Chaim Goodman-Strauss, „An aperiodic monotile", arXiv:2303.10798 (20. März 2023). Verbatim aus dem Paper: *„a representative example, the 'hat' polykite, can form clusters called 'metatiles', for which substitution rules can be defined."* — aperiodische Einzelkachel-Parkettierung, echtes neues Tiling jenseits Wang/Truchet (Code adaptiert von isohedral/hatviz).
- **Poincaré-Disk-Modell** (`d176924430`, `2341de990a`): hyperbolische Kachelung {n,k} mit alternierender Füllung — Multi-Scale „ins Unendliche schrumpfende" Muster am Kreisrand (Code nach David E. Joyce).
- **Chaos Game** (`f4ef806547`): Fraktale durch iteriertes Springen zu zufälligen Eckpunkten.
- **Droste-Effekt / Cubic Space Division #3** (`e7a276c605`): konforme Droste-Spirale (Escher „Print Gallery") via `exp`-Projektion.
- **Verlet-Physik**: Cloth (`cfe9091ad8`), Ragdoll (`736ec867cc`), Mini-2D-Physics-Engine (`7f067f9322`) — physiksimulationsgetriebene Linien.
- **Euler-Spirale/Klothoide** (`ebc67be6c6`), **Touching Circles** (Ford-Kreise, `59d0a20f0c`), **Voronoi-Spirale** (golden-angle + Delaunay via Mapbox delaunator, `70b4fd8c25`), **Fingerprints** (`70e2e00c6f`, prozedurale Fingerabdruck-Flowlines), **Gumowski-Mira-Attraktoren** (Tag), **Barnsley-Farn** (`7e604ce874`), **Smooth Julia/Mandelbrot** (`fcdf3cf8aa`, `a1b031fb9e`).
- **Metaball Contour Lines** (`104c4775c5`, MIT) + **2D SDF Contour Lines** (`1ddbf02c17`): Isolinien aus Skalarfeldern/Signed-Distance-Fields.
- **Dyson Hatching** (`0422c2a17f`): Poisson-Disc-basierte Schraffur im Dungeon-Stil.

**JS-Reimplementierung:** Trivial — alles ist bereits JS und meist MIT. Die Clipping/Hatching-Utilities sollten direkt übernommen werden.

### 5. Maze-Generierung (mazemaking.com + breiteres Feld)

**mazemaking.com konkret:** bietet **Recursive Backtracking, Prim's, Kruskal's** als Algorithmen; Geometrien **Square (orthogonal) und Hexagonal (sigma)**; Export PNG/JPG/**SVG**. Primär ein kommerzieller KDP-Puzzle-Bulk-Generator (Branding, Watermarks, Social-Media-Formate). Die Maze-Generator-Schwester mazegenerator.net deckt zusätzlich circular (theta), triangular (delta), hexagonal (sigma/delta), Symmetrie und zentrale Kammern ab.

**Algorithmen-Katalog (das breitere, größtenteils abgedeckte Feld — als Referenz):** Recursive Backtracker (DFS, lange gewundene Gänge, niedriger Verzweigungsgrad), Prim's (kurze lokale Verbindungen, buschig), Kruskal's, Wilson's (loop-erased random walk, unverzerrt/uniform), Aldous-Broder (uniform, langsam), Eller's (zeilenweise, speichereffizient), Hunt-and-Kill, Growing Tree (Dead-End-Rate 10–49% je nach Cell-Auswahl), Binary Tree, Sidewinder, Recursive Division (Wall-Adder — bereits abgedeckt).

**Plotter-attraktive *neue* Maze-Typen (über Recursive Division hinaus):**
- **Theta (kreisförmig):** konzentrische Ring-Gänge; Zellen werden bei wachsendem Umfang subdividiert (Parameter `subdivision` ~1.5, `centerRadius`). Radial-symmetrische, mandala-artige Labyrinthe.
- **Delta (Dreieck):** dreieckige Zellen, bis zu 3 Durchgänge/Zelle.
- **Sigma (Hexagon):** hexagonale Zellen, bis zu 6 Durchgänge.
- **Upsilon (Oktogon+Quadrat):** bis zu 8 Durchgänge.
- **Zeta:** orthogonal mit zusätzlichen 45°-Diagonalen.
- **Weave / 2.5D:** Gänge überqueren/unterqueren einander (Brücken) — `maxWeave` steuert max. Überführungslänge. Erzeugt verwobene, geflochtene Optik.
- **Unicursal / Labyrinth (Single-Path!):** **keine Verzweigungen — ein einziger schlangenartiger Pfad**, der die gesamte Fläche füllt. Klassisches Labyrinth. Erzeugbar durch Umwandlung eines orthogonalen Mazes in sein unicursales Äquivalent (jeder Gang wird „halbiert"/umrandet). **Hochrelevant für Plotter: ein einziger durchgehender Federzug ohne Absetzen** — perfekt für „Dein Muster". Maximale Dead-End-Rate eines unicursalen Pfads = 66%.
- **Masked / arbitrary shape:** Maze in beliebige Silhouette/Maske einpassen (vgl. generative-noodles Maske).
- **Braid:** Sackgassen durch Schleifen ersetzt → mehrere Lösungswege, organischere Topologie.

**Datenstruktur/Algo (Recursive Backtracker, Standard):** Grid als Zellen mit Wand-Flags je Richtung; Stack-basiert: Start wählen → zufällige unbesuchte Nachbarzelle → Wand öffnen, Zelle auf Stack pushen → bei Sackgasse poppen → fertig wenn Stack leer. SVG-Output: Wände als Linien (Wall-based) oder unicursal als ein durchgehender Pfad (passage-based centerline).

**JS-Reimplementierung:** Einfach bis mittel. Orthogonale Algorithmen sind Standard (Rosetta/StackOverflow-Referenzen, auch als Turtletoy `5738755849` von ge1doot und markknols `3a9ed41666`). Theta/Delta/Sigma erfordern angepasste Nachbarschafts-/Koordinatensysteme. Unicursal-Umwandlung ist der Schlüsseltrick. JS/Lib-Referenz: **maltaisn/mazegen** (Kotlin, aber klare Spezifikation aller Typen inkl. theta/weave/unicursal mit Parametern wie `centerRadius`, `subdivision`, `maxWeave`) und **jamis/theseus** (Ruby-Referenz für alle Geometrien: OrthogonalMaze, DeltaMaze, SigmaMaze, UpsilonMaze, `to_unicursal`). **Ästhetik:** Single-Path-Labyrinthe und Weave-Mazes sind visuell am stärksten und plotter-ideal.

### 6. drawingbots.com Tools-Katalog (Browser/JS-relevant)

Kuratierter Katalog von Maks Surguy. Die für eine browserbasierte JS-Plotter-Pipeline relevanten, *neuen* Einträge:

**Frameworks/Libraries (JS):**
- **Urpflanze** (genbs/urpflanze) — JS-Creative-Coding-Lib mit SVG-Export; mathematisch/generativ.
- **paper.js** — Vektor-Scripting auf HTML5-Canvas (Basis vieler Generatoren, z.B. Spiral Raster).
- **plotterfun** (mitxela) — **Webworker-basiertes Algorithmen-Framework**: jeder Bild→Vektor-Algorithmus ist eine eigene `.js`-Datei als Webworker, `postLines`/`postCircles` senden Pfade; `noRestart`-Flag für lange Berechnungen. Enthält Squiggle (links/rechts/spiral/PolygonSpiral, basierend auf SquiggleCam), gewichtetes Voronoi-Stippling mit 2-opt-TSP (Port von StippleGen, nutzt rhills Voronoi-Lib + StackBlur), Liniennachzeichnung (Sobel+Threshold+Vektorisierung adjazenter Pixel, Reimplementierung von LingDong-s Linedraw). **Vorbildliche Architektur für eine erweiterbare JS-Plotter-App** (UI bleibt responsiv durch Webworker).

**Browser-SVG-Generatoren mit neuen Techniken:**
- **UJI** (doersino) — iterative parametrische Linientransformation: Startform (Kreis/Quadrat/Dreieck/Linie, mit einstellbarer Segmentzahl — niedrige Werte erzeugen interessante Artefakte) wird wiederholt durch parametrisierte Transformationen verzerrt, nach jeder Iteration gezeichnet. SVG-Export. Emergente Komplexität aus wenigen Slidern; Parameter via Share-URL kodiert.
- **Serpentine Plotter** (jawharkodadi) — noise-getriebene Serpentinen-Linien (Amplitude, Noise-Frequenz, Größe).
- **Bezier Morpher** (p5.js, knectar) — interpoliert zwischen zwei „End-Member"-Bezierkurven → morphende Kurvenschar; GCODE/SVG-Export.
- **TilePlayground** (shefalinayak) — SVG tessellierender Formen.
- **Kumiko-Generator** — japanische Kumiko-Holzgittermuster aus Bildern.
- **Moroccan Zellige / Beyond96** (isohedral.ca) — islamische/Zellige-Geometrie (abgedeckt, aber fertige JS-Generatoren).
- **Wallpaper editor** (eskimoblood, Elm) — Pattern-Editor basierend auf den 17 Wallpaper-Gruppen (Symmetriegruppen) — direkt relevant für „Muster"-Generierung.
- **Vertigo, PINTR, StringyPlotter, SquiggleCam** — Bild→Single-Line/Spiral/Dot-Konverter (bildbasiert, weniger relevant für rein generatives „Dein Muster").
- **TinkerSynth** (joshwcomeau, „Slopes"-Machine) — Perlin-noise-getriebene „Slopes"-Linienlandschaften (verschobene horizontale Linien, die ein 3D-Heightfield andeuten); Logik in `Slopes.generator.js`. Quelloffen (educational, ohne Lizenz).
- **paragraphic / Patternodes / Vectoraster** (lostminds) — knotenbasierte parametrische Pattern-Tools (Truchet, Halftone, Gradienten) mit SVG; jedoch Desktop/kommerziell.
- **plotter.vision** — STL→SVG mit Hidden-Wireframe-Removal (3D-Linienkunst-Pipeline-Referenz).

**Plottrbottr, PEmbroider, Generative Noodles, Turtletoy** sind ebenfalls hier gelistet (siehe oben).

## Empfohlene neue Algorithmen mit voller Implementierungstiefe

### A. Gilbert-Tessellation (Random Crack Network) — STARK EMPFOHLEN
**Algorithmus:** Poisson-verteilte Seed-Punkte; jedem Seed wird eine zufällige Orientierung `α ∈ [0,π)` zugewiesen. Zum Zeitpunkt t=0 wachsen aus jedem Seed **zwei Risse** in Richtung `+α` und `−α` mit konstanter Geschwindigkeit. Trifft ein wachsender Riss auf einen bereits existierenden, **stoppt er in dieser Richtung** (T-Kreuzung). Ergebnis: Parkettierung der Ebene in unregelmäßige konvexe Polygone (fast alle Vertices Grad 3, E ≈ 1.5·V). Variante: nur achsenparallele Risse → Rechteck-Parkettierung.
**Parameter:** Seed-Dichte (Poisson-Rate; mehr Seeds = feinere Zellen), Geschwindigkeit/Reihenfolge der Risse, isotrop vs. achsenparallel.
**Vektor-Output:** direkt — jede Linie ist ein Segment. Ideal für Plotter.
**JS-Implementierung:** Mittel. Seeds via Poisson-Disc (Nijhoff-Utility). Simultanes Wachstum simulieren (Zeitschritte oder Event-Queue der Schnittpunkte). Segment-Schnitt-Test (Bourke/PEmbroider). Referenz: Turtletoy `4823100ba2`; Quellpaper Edgar N. Gilbert (1962), „Random subdivisions of space into crystals", *Annals of Mathematical Statistics*, Bd. 33, S. 958–972, ergänzt durch Gilbert (1967), „Random plane networks and needle-shaped crystals".
**Ästhetik:** Schlammrisse/Kristall-/Zellstruktur, natürlich-organisch, emergente Multi-Scale-Komplexität. Klar von Voronoi unterscheidbar (T-Kreuzungen statt Vertices-Grad-3-Sterne, gerade Risssegmente).

### B. Connected Fermat Spirals — Single-Path-Flächenfüllung
**Algorithmus (Zhao, Gu, Huang, Garcia, Chen, Tu, Benes, Zhang, Cohen-Or & Chen, „Connected Fermat Spirals for Layered Fabrication", *ACM Transactions on Graphics* / SIGGRAPH 2016, Bd. 35, Nr. 4, Artikel 100, DOI 10.1145/2897824.2925958):** Zerlege eine 2D-Region in Subregionen, fülle jede mit *einer* Fermat-Spirale (Iso-Konturen werden so verbunden, dass Start- und Endpunkt am äußeren Rand ~zusammenfallen); verbinde die Subregionen entlang eines Graph-Traversals zu **einer global durchgehenden Kurve**. Verbatim aus dem Paper: *„Unlike classical space-filling curves such as the Peano or Hilbert curves, which constantly wind and bind to preserve locality, connected Fermat spirals are formed mostly by long, low-curvature paths."*
**Vektor-Output:** ein einziger durchgehender Pfad pro Region → minimaler Pen-Lift, ideal für Plotter.
**JS-Implementierung:** Schwer (Iso-Kontur-Generierung via Polygon-Inset + Spiralverbindung). Vereinfachte Variante: PEmbroiders `hatchSpiral` (Single-Path-Spirale pro konvexer Region) als pragmatischer Einstieg.
**Ästhetik:** fließende, konturfolgende Single-Stroke-Füllung. Multi-Scale durch Subregion-Dekomposition.

### C. Polygon-Clipping / Hidden-Line als Komposition-Engine — STARK EMPFOHLEN als Implementierungs-Baustein
Übernimm Nijhoffs `Polygons()`-Klasse (MIT, Turtletoy `a5befa1f8d`/`92ebe08d89`) direkt. Sie ermöglicht **schichtweise Komposition mit korrekter Verdeckung + integrierter Schraffur** — die Grundlage für gestapelte/3D-artige Kompositionen mit Tiefenwirkung. Kombinierbar mit jeder der obigen Techniken (z.B. überlappende Gilbert-Zellen, gestapelte Noodles).

## Recommendations

**Sofort umsetzen (hoher Wert, geringer Aufwand):**
1. **Nijhoffs Polygon-Clipping/Hatching-Utility** (MIT) als Kern-Kompositions- und Verdeckungs-Engine übernehmen. Sie ist die wichtigste einzelne Code-Akquise — sie hebt jede andere Technik auf „mit korrekter Verdeckung + Schraffur" und ist sofort JS.
2. **Generative Noodles** in JS nachbauen: SAW auf Grid + Offset-Doppelkanten + Endkappen-Glyphen + Maskenbild-Eingabe. Direkt interaktiv (Nutzer malt Maske → Noodle-Muster). Geringer Aufwand, hoher „Dein Muster"-Faktor.
3. **PEmbroiders Fill-Suite portieren**, priorisiert: SPIRAL (Single-Path), CONCENTRIC/Inset, PERLIN/Curl-Flow-Fill, BOUSTROPHEDON-Satin. Plus den **TSP-2-opt-Pen-Travel-Optimierer** als Pipeline-Endstufe (universell nützlich). Polygon-Offset via ClipperLib.

**Als nächstes (neue Algorithmen mit starker Ästhetik):**
4. **Gilbert-Tessellation** implementieren (Poisson-Seeds + simultanes Riss-Wachstum). Bestes Preis-Leistungs-Verhältnis unter den echten Neu-Algorithmen.
5. **Unicursale Labyrinthe** als Single-Path-Modus (orthogonal → unicursal-Umwandlung), plus Theta/Sigma-Geometrien für Mandala-artige Mazes. Single-Stroke = plotter-ideal.
6. **plottrbottr-Lace-Pipeline** (Outline-Sampling → Delaunay/Voronoi → Subtract-Rahmen) für nutzergezeichnete Silhouetten.

**Optional / fortgeschritten:**
7. **Connected Fermat Spirals** (falls Single-Path-Füllung beliebiger Regionen gewünscht — sonst `hatchSpiral` als Ersatz).
8. **Hat-Monotile**, **Poincaré-Disk** (aperiodische/hyperbolische Multi-Scale-Tilings) als „Wow"-Muster; **Wallpaper-Gruppen-Editor** für systematische Symmetrie-Muster.
9. **plotterfun-Webworker-Architektur** als Vorbild für die App-Struktur (responsive UI bei schweren Berechnungen).

**Schwellen, die Empfehlungen ändern würden:**
- Wenn die Installation **rein generativ** (ohne Bild-Input) sein soll: Bild-Konverter (PINTR, Vertigo, plotterfun-Stippling) überspringen; auf Gilbert/Noodles/Maze/Fermat fokussieren.
- Wenn **Single-Stroke/minimaler Pen-Lift** Priorität hat: unicursale Mazes, SPIRAL-Fill und Connected Fermat Spirals priorisieren; TSP-Optimierer zwingend.
- Wenn **emergente Multi-Scale-Komplexität** das Leitkriterium ist: Gilbert-Tessellation, Poincaré-Disk, Hat-Monotile und das Polygon-Clipping-Schichten-Compositing kombinieren.

## Caveats
- **generative-noodles Kern-Quelltext nicht verifiziert:** Der genaue Wachstums-Loop (Richtungswahl, Turn-Bias, Bezier-Eckenrundung) konnte nicht im Originalquelltext eingesehen werden (GitHub-Raw-Zugriff blockiert); die Algorithmusbeschreibung ist aus README + config.json (verbatim) + Path-Edit-Verhalten rekonstruiert und als „plausibler SAW" gekennzeichnet, wobei das Stopp-/Trapping-Verhalten wörtlich im README belegt ist. Vor Implementierung ggf. `sketch/*.pde` direkt prüfen (z.B. via raw.githubusercontent.com mit authentifiziertem Zugriff).
- **Lizenzen beachten:** PEmbroider ist GPLv3 **und** Anti-Capitalist License (ACSL v1.4) — Letztere schließt bestimmte kommerzielle/Behörden-/Militär-Nutzungen aus; für eine Hochschul-Installation i.d.R. unkritisch, aber eine *Portierung* nach JS ist ein abgeleitetes Werk (Copyleft → muss offengelegt werden). Generative Noodles ist Unlicense (frei). Turtletoy-Utilities meist MIT, einige Turtles CC BY-NC-SA (nicht-kommerziell) — pro Turtle prüfen.
- **plottrbottr/mazemaking nur teilweise quelloffen dokumentiert:** plottrbottr-Algorithmus aus CLI-Optionen rekonstruiert; mazemaking.com nennt selbst nur 3 Algorithmen (Recursive Backtracking, Prim, Kruskal) + 2 Geometrien (square, hexagonal) — die reichere Maze-Typologie (Theta/Delta/Sigma/Upsilon/Weave/unicursal) stammt aus dem breiteren Feld (mazegenerator.net, maltaisn/mazegen, jamis/theseus, astrolog.org), nicht alle direkt von mazemaking.com.
- **TinkerSynth** ist ohne explizite Lizenz veröffentlicht („read the source… rather than forking") — als Inspiration, nicht zum Forken gedacht.
- Mehrere drawingbots-Tools sind **Desktop/kommerziell** (Vectoraster, Patternodes, Paragraphic, Makelangelo, DrawingBotV3) — nicht browser-JS; hier nur als Konzept-Referenz relevant.
- Die Connected-Fermat-Spirals-Beschreibung stammt aus dem SIGGRAPH-2016-Paper; eine vollständige robuste Implementierung ist anspruchsvoll — für eine Installation ggf. die vereinfachte Spiral-Fill-Variante (PEmbroider `hatchSpiral`) wählen.