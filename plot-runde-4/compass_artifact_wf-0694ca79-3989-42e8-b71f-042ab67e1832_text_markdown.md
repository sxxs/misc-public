# Plotterfreundliche generative/algorithmische Techniken für „Dein Muster" Runde 4

## TL;DR
- **Es gibt weit mehr als ein Dutzend vektorbasierte, JS-taugliche Verfahren jenseits eurer bereits genutzten Techniken** — die stärksten Kandidaten für eure Kriterien (emergente Komplexität, Multi-Skalen-Struktur, kompositorische Entwicklung) sind **Differential (Line) Growth**, **Space Colonization / Venation**, **Reaction-Diffusion als Isolinien** und **Strange Attractors** als dichte Liniengewebe.
- **Alle hier empfohlenen Verfahren erzeugen native Vektorpfade** (Polylinien, Bézier, geschlossene Ringe) und sind in p5.js/Canvas/SVG live im Browser umsetzbar; für die meisten existieren fertige JS-Referenzimplementierungen.
- **Empfehlung:** Mischt ein „Wachstums"-Verfahren (Differential Growth oder Space Colonization) mit einem „Feld"-Verfahren (Reaction-Diffusion-Isolinien oder Strange Attractor) und einem „Struktur"-Verfahren (Truchet/WFC oder rekursive Subdivision), um Variation über Runden und Besucher hinweg zu garantieren.

## Key Findings

Aus der Ressourcenseite von Liz Melchor ergibt sich vor allem das **Tooling-Ökosystem**, nicht so sehr neue Algorithmen: drawingbots.net (Maks Surguy), der Drawingbots-Discord, Generative Hut (Tutorials, u. a. das AxiDraw-Processing-Tutorial von Julien Gachadoat/v3ga), die compArt-Datenbank (dada.compart-bremen.de) zur Computerkunst-Historie, Turtletoy (Reinder Nijhoff), sowie die Plot-Pipeline **vpype** (CLI-Optimierung/Linienreihenfolge) + **vpype-gcode** + **vsketch** und **Inkscape**. Für JS ist besonders Matt DesLauriers' `penplot`-Workflow relevant (Browser → Cmd+S/Cmd+P → SVG/PNG). Diese Tools sind eure Plot-Pipeline; die folgenden Techniken sind das, was ihr im Browser generiert.

Die wichtigste konzeptionelle Quelle für eure Ästhetik ist **Anders Hoff / inconvergent.net** („On Generative Algorithms", 2015/16), dessen Leitsatz exakt euren Kriterien entspricht. Im Wortlaut der Einleitung: *„I think what I enjoy the most is how complex and intricate results you can get from a set of simple rules. Recently I've been particularly interested in biological patterns, and differential growth."* Sein Katalog (Hyphae, Trees, Linetrace, Differential Line, Differential Mesh, Fractures, Sand Spline, Differential Lattice, Sand Glyphs) ist eine Goldgrube plotterfreundlicher Wachstumsverfahren. Ebenso zentral: **Jason Webbs** `morphogenesis-resources` und seine JS-Implementierungen (Differential Growth, Space Colonization, Reaction-Diffusion-Playground).

## Details — Techniken im Einzelnen

### 1. Differential Line Growth (differentielles Linienwachstum)
- **Algorithmus:** Eine geschlossene oder offene Polylinie aus verbundenen Knoten. Pro Iteration: (a) Abstoßungskräfte zwischen nahen Knoten, (b) Anziehung entlang der Kante zu Nachbarn, (c) optional Brownsche Störung, (d) **adaptives Resampling** — wo Segmente zu lang werden bzw. die Krümmung hoch ist, werden neue Knoten eingefügt. Die Kurve wächst, füllt den Raum und faltet sich, ohne sich selbst zu schneiden (Laplace-Glättung hält sie sauber).
- **Warum gut für Plotter:** Output ist genau **eine (oder wenige) lange Polylinie** — ideal, minimale Pen-Lifts. Reine Linien, keine Flächen.
- **JS-Schwierigkeit:** Mittel. Kräfte-Update ist einfach; der knifflige Teil ist eine räumliche Beschleunigungsstruktur (Grid/Quadtree) für die Nachbarschaftssuche, sonst O(n²). Jason Webbs Medium-Artikel „Exploring 2D differential growth with JavaScript" liefert eine vollständige modulare Referenz inkl. SVG-Export.
- **Ästhetik:** Hirnwindungen, Korallen, Fingerabdrücke, Gehirn-/Darmfalten — starke emergente Komplexität und Multi-Skalen-Struktur; entwickelt sich zeitlich (ideal für Live-Vorführung).
- **Referenzen:** Anders Hoff (inconvergent „Differential Line"), Jason Webb, Reza Ali.

### 2. Hyphae / Space Colonization / Venation (verzweigte Netze)
- **Algorithmus (Space Colonization):** Verteile hunderte/tausende „Attraktor"-Punkte (Auxin-Quellen). Knoten wachsen iterativ in Richtung der nächstgelegenen Attraktoren; ist ein Attraktor näher als die Kill-Distanz d_k, wird er entfernt. Dichte Attraktorfelder → feinere Verzweigung. Die Methode stammt aus Adam Runions, Martin Fuhrer, Brendan Lane, Pavol Federl, Anne-Gaëlle Rolland-Lagan, Przemyslaw Prusinkiewicz, *„Modeling and visualization of leaf venation patterns"*, ACM Transactions on Graphics 24(3), 2005, S. 702–711 (algorithmicbotany.org/papers/venation.sig2005.html); das Folgepapier *„Modeling Trees with a Space Colonization Algorithm"* (Runions/Lane/Prusinkiewicz, Eurographics Workshop on Natural Phenomena 2007) zeigt, dass Attraktorpunkt-Anzahl N und Kill-Distanz d_k die Verzweigungsdichte steuern. **Hyphae** (Anders Hoff) ist eine Variante: nicht-überlappende Kreise wachsen „nebeneinander" und bilden wurzelartige Netze.
- **Warum gut für Plotter:** Reine Linien-/Kurvenbäume; Astdicke kann durch Mehrfachlinien oder variable Strichbreite (mehrere Stiftdurchgänge) angedeutet werden.
- **JS-Schwierigkeit:** Mittel. Space Colonization ist mit p5.js gut dokumentiert (Daniel Shiffman / The Coding Train hat ein Kapitel; Jason Webbs „2d-space-colonization-experiments" auf GitHub).
- **Ästhetik:** Blattadern, Wurzeln, Gorgonien-Seefächer, Blitz, Flusssysteme. Sehr organisch, exzellente Multi-Skalen-Struktur.
- **Referenzen:** Runions/Prusinkiewicz (algorithmicbotany.org), Nervous System, Anders Hoff, Jason Webb.

### 3. Reaction-Diffusion als Isolinien-Konturen (Gray-Scott → Vektorkonturen)
- **Algorithmus:** Simuliere das **Gray-Scott**-Modell auf einem n×m-Gitter:
  ∂A/∂t = D_A·ΔA − AB² + f(1−A); ∂B/∂t = D_B·ΔB + AB² − (f+k)B.
  Typische Parameter (Karl Sims, *„Reaction-Diffusion Tutorial"*, karlsims.com/rd.html): D_A=1.0, D_B=0.5, f≈0.055, k≈0.062, Δt=1.0; Laplace per 3×3-Faltung (Zentrum −1, Kanten 0.2, Ecken 0.05); Start A=1, B=0, kleine Region mit B=1 seeden. Sims dokumentiert die interessanten Muster als „crescent shaped zone" in einer Parameterkarte (kill rate ca. .045–.07 auf der x-Achse, feed rate .01–.1 auf der y-Achse). Beachtet: das oft zitierte „mitosis"-Preset existiert in mehreren Varianten (f=0.0367/k=0.0649 bzw. f=0.034/k=0.064 nach Nils Olovsson/Sims) — kalibriert experimentell.
- **Vektorisierung (der entscheidende Schritt):** Das Konzentrationsfeld (z. B. B oder B−A) wird mit **Marching Squares** in Konturen überführt. In JS am einfachsten via **d3-contour** (Mike Bostock): `d3.contours().size([n,m]).thresholds([...])(values)` liefert GeoJSON-MultiPolygon-Objekte pro Schwellenwert; `d3.geoPath()` mit `d3.geoIdentity`/`null`-Projektion erzeugt daraus SVG-`<path>`-Strings in Pixelkoordinaten. Aus den d3-contour-Docs: *„For each threshold value, the contour generator constructs a GeoJSON MultiPolygon geometry object representing the area where the input values are greater than or equal to the threshold value."* Wichtig: d3-contour liefert **gefüllte Isoband-Ringe** (geschlossene Polygone ≥ Schwelle), keine offenen Polylinien — für Plotter ideal, da jeder Ring ein geschlossener Pfad ist. Jason Webbs `reaction-diffusion-playground` (ThreeJS/GLSL, Browser) ist die Standard-RD-Referenz; sein `morphogenesis-resources`-Repo verknüpft Marching Squares explizit mit Pen-Plottern (*„Useful for creating single-line drawings for use with pen plotters, laser cutters, CNC machines, and more"*).
- **JS-Schwierigkeit:** Mittel-hoch. RD-Simulation ist einfach, läuft aber für hohe Auflösung besser auf der GPU (WebGL/GLSL Ping-Pong). Reine CPU-JS reicht für moderate Gitter (z. B. 200×200) live.
- **Ästhetik:** Turing-Muster — Zebrastreifen, Leopardenflecken, Korallen, Fingerabdruck-Labyrinthe. Hervorragende organische Multi-Skalen-Strukturen; durch Schwellenwert-Staffelung entstehen topografische „Höhenlinien"-Looks.
- **Referenzen:** Karl Sims (Tutorial), Robert Munafo/mrob (xmorphia-Parameterkarte), Jason Webb, Jonathan McCabe (Multi-Scale Turing Patterns).

### 4. Strange Attractors (Clifford, de Jong, Lorenz, Thomas, Aizawa)
- **Algorithmus:** Iteriere eine einfache nichtlineare Abbildung Millionen Male und plotte die Bahn. **De Jong:** xₙ₊₁=sin(a·yₙ)−cos(b·xₙ), yₙ₊₁=sin(c·xₙ)−cos(d·yₙ). **Clifford:** xₙ₊₁=sin(a·yₙ)+c·cos(a·xₙ), yₙ₊₁=sin(b·xₙ)+d·cos(b·yₙ). 4 Parameter (a,b,c,d) bestimmen die Form.
- **Warum gut für Plotter — mit Einschränkung:** Klassisch werden Attraktoren als **Dichte-Punktwolken** gerendert (Millionen Punkte), was *nicht* plotterfreundlich ist. Für Plotter zwei Strategien: (a) **die Bahn als durchgehende Polylinie** zeichnen (verbinde aufeinanderfolgende Iterationspunkte mit Linien — ergibt seidige, sich überlagernde Liniengewebe), oder (b) das 3D-Attraktor (Lorenz/Thomas/Aizawa) als 3D-Kurve berechnen und projizieren. Variante (a) gibt schöne kontinuierliche Pfade.
- **JS-Schwierigkeit:** Niedrig. Wenige Zeilen Canvas/SVG (Ricky Reusser hat ein Observable-Notebook für Clifford/de Jong).
- **Ästhetik:** Gefaltete Seidenbänder, biolumineszente Netze, kosmische Wirbel. Sehr elegante, mathematisch „saubere" Multi-Skalen-Geometrie.
- **Referenzen:** Paul Bourke (Standard-Referenz für Attraktor-Formeln), Ricky Reusser (Observable), deconbatch.

### 5. L-Systeme & raumfüllende Kurven jenseits von Hilbert
- **Algorithmus:** String-Rewriting (Axiom + Produktionsregeln), interpretiert als Turtle-Befehle. **Gosper-Kurve / Flowsnake** (Bill Gosper): Axiom F, Regeln F→F−G−−G+F++FF+G−, G→+F−GG−−G−F++F+G, Winkel 60°. Außerdem **Peano** (9er-Teilung), **Sierpiński-Arrowhead**, **Moore** (geschlossene Hilbert-Variante), **Dragon Curve** (Papierfaltung: jede Iteration verdoppelt Segmente; 16 Iterationen = 65.536 Segmente).
- **Warum gut für Plotter:** Raumfüllende Kurven sind **eine einzige durchgehende Linie** — der Heilige Gral für Plotter. Null Pen-Lifts.
- **JS-Schwierigkeit:** Niedrig-mittel. Reine String-Expansion + Turtle. Achtung: exponentielles Wachstum der String-Länge bei hoher Iteration.
- **Ästhetik:** Gosper hat eine schneeflocken-/serpentinenartige hexagonale Anmutung, deutlich organischer als Hilbert. Dragon Curve ist fraktal-kantig.
- **Referenzen:** Larry Riddle (Agnes Scott, raumfüllende Kurven), Paul Bourke, „Crinkly Curves" (American Scientist).

### 6. Truchet- & Wang-Tiles
- **Algorithmus:** Quadratische Kacheln mit einem festen Motiv (z. B. zwei Viertelkreise in gegenüberliegenden Ecken), die zufällig rotiert/gespiegelt auf einem Gitter platziert werden. **Carlson Multi-Scale Truchet** (Christopher Carlson, *„Multi-Scale Truchet Patterns"*, Proceedings of Bridges 2018, archive.bridgesmathart.org/2018/bridges2018-39.pdf): Carlson nutzt die 14 Kacheln, deren interne Verbindungen sich nicht schneiden, plus eine „+"-Kachel (zusammen 15; unter Rotationsäquivalenz 7 distinkte), und erzeugt **echte Mehrskaligkeit** durch „infinite sets of tiles scaled by powers of 1/2" — exakt euer Multi-Skalen-Kriterium. **Wang-Tiles** nutzen Kantenfarb-Matching für aperiodische Muster.
- **Warum gut für Plotter:** Reine Bögen/Linien, die sich nahtlos zu durchgehenden Kurven verbinden; sehr effizient zu plotten.
- **JS-Schwierigkeit:** Niedrig. Vordefinierte SVG-Primitive parametrisch zeichnen (alexwlchan hat eine vollständige JS/SVG-Anleitung für Carlson-Tiles inkl. rekursiver Subdivision).
- **Ästhetik:** Von labyrinthisch (Smith/Truchet-Bögen) bis „Alien-Schrift". Subdivision erzeugt Komplexitätsgradienten.
- **Referenzen:** Christopher Carlson (Wolfram/Bridges 2018), Ned Batchelder, alexwlchan, ESikich (TruchetArt, interaktiv).

### 7. Wave Function Collapse (WFC) als Linienkacheln
- **Algorithmus:** Constraint-Solver (ähnlich Sudoku). Aus einem kleinen Beispielbild oder Kachelset mit Adjazenzregeln werden Kacheln so platziert, dass Nachbarschaften konsistent sind; iterativ wird die Zelle minimaler Entropie „kollabiert" und die Nachbarschaft propagiert. Bei Widerspruch: Neustart/Backtracking.
- **Warum gut für Plotter:** Wenn die Kacheln Liniensegmente sind (wie Truchet), entstehen verbundene, plotterfreundliche Pfade mit globaler Kohärenz.
- **JS-Schwierigkeit:** Mittel-hoch. WFC selbst ist gut dokumentiert (mxgmn-Originalalgorithmus), aber das Design eines konsistenten Linien-Kachelsets ist die eigentliche Arbeit.
- **Ästhetik:** Strukturierte, „lesbare" Muster mit lokaler Regelmäßigkeit und globaler Variation. Andy Makes hat ein WFC-Plotter-Toy (openFrameworks/AxiDraw) demonstriert.
- **Referenzen:** Maxim Gumin (mxgmn), Robert Heaton (Erklärung), Andy Makes (Plotter-Anwendung).

### 8. Rekursive Subdivision (Dreiecke/Rechtecke/Polygone)
- **Algorithmus:** Beginne mit einem Polygon, teile es rekursiv. Tyler Hobbs' „Aesthetically Pleasing Triangle Subdivision": wähle eine Ecke A, finde Mittelpunkt D der gegenüberliegenden Seite, teile A→D; **randomisiere D** für organische statt starre Ergebnisse. Analog Rechteck-Subdivision (Mondrian-artig).
- **Warum gut für Plotter:** Nur Kanten = Linien. Tiefe steuert Dichte/Detailgrad.
- **JS-Schwierigkeit:** Niedrig. Reine Rekursion.
- **Ästhetik:** Von Mondrian-streng bis kristallin-fragmentiert; eingebaute Multi-Skalen-Hierarchie. Über Farbvererbung (Hobbs) entstehen kompositorische Cluster.
- **Referenzen:** Tyler Hobbs (Essays auf tylerxhobbs.com).

### 9. Hatching / Cross-Hatching als Schattierung
- **Algorithmus:** Fülle eine Region mit parallelen Linien; Dichte ∝ gewünschter Tonwert. Für Schraffur: Polygon rotieren, parallele Linien generieren, mit der Polygon-Geometrie (Shapely/Clipper) verschneiden, zurückrotieren. Mehrere Winkel = Cross-Hatching.
- **Warum gut für Plotter:** Das *kanonische* Verfahren, um Tonwerte/Schattierung auf einem reinen Linien-Gerät zu erzeugen, ohne zu füllen.
- **JS-Schwierigkeit:** Niedrig-mittel. Linienclipping gegen Polygone braucht etwas Geometrie (Clipper.js / polygon-clipping).
- **Ästhetik:** Gravur-/Stich-Anmutung; kombinierbar mit jedem flächigen Verfahren als „Renderer".
- **Referenzen:** klassisch in nahezu allen Plotter-Portfolios; nummy.blog beschreibt die Rotate-Clip-Rotate-Pipeline.

### 10. TSP-Art & Stippling (ein durchgehender Pfad)
- **Algorithmus:** (1) Erzeuge aus einem Bild via **Weighted Voronoi Stippling** (Secord/Lloyd-Relaxation) eine Punktwolke, deren Dichte den Tonwert kodiert. (2) Löse ein **Travelling-Salesman-Problem** über diese Punkte → eine einzige Linie, die alle Punkte besucht. Originalarbeit: Robert A. Bosch & Adrianne Herman, *„Continuous line drawings via the traveling salesman problem"*, Operations Research Letters 32(4):302–303, Juli 2004, DOI 10.1016/j.orl.2003.10.001.
- **Warum gut für Plotter:** Ergebnis ist buchstäblich **eine einzige durchgehende Linie** — Bilddarstellung mit nahezu null Pen-Lifts. Genau wie vom Nutzer angemerkt.
- **JS-Schwierigkeit:** Mittel. Stippling (Voronoi-Relaxation) + eine TSP-Heuristik (Nearest-Neighbor + 2-opt/Or-opt reicht; exakt via Concorde nicht nötig).
- **Ästhetik:** Verschnörkelte Single-Line-Porträts; faszinierend beim Zeichnen zuzusehen. Für ein interaktives Exponat, bei dem Besucher z. B. ihr Gesicht/Foto einreichen, ideal.
- **Referenzen:** Robert Bosch, Evil Mad Scientist StippleGen (Processing, Voronoi+TSP), DrawingBotV3 (LBG-Stippling, TSP-PFM).

### 11. Harmonograph / Lissajous / Spirograph (Guilloché)
- **Algorithmus:** Summe gedämpfter Sinus-Schwingungen. **Harmonograph:** x(t)=ΣAᵢ·sin(fᵢ·t+φᵢ)·e^(−dᵢ·t), analog y(t) — mehrere Pendel mit leicht verstimmten Frequenzen und Dämpfung. **Lissajous:** ungedämpft. **Spirograph (Hypotrochoide):** abrollende Kreise.
- **Warum gut für Plotter:** Eine einzige, lange, glatte parametrische Kurve; minimaler Pen-Lift; die Dämpfung erzeugt das charakteristische Einwärtsspiralen.
- **JS-Schwierigkeit:** Sehr niedrig. Parametrische Schleife, Punkte als Polyline. NPM-Paket `@harmonograph/svg` existiert.
- **Ästhetik:** Guilloché (wie auf Banknoten), elegante Interferenz-Verschachtelung. Sehr „ruhig" und ornamental; gut für Besucher-Parameterspiel (Amplitude/Frequenz/Phase/Dämpfung).
- **Referenzen:** „Harmonograph: A Visual Guide" (Ashton/Wooden Books), alex-page (npm), zahlreiche AxiDraw-Plots.

### 12. Elementare Zelluläre Automaten als Linien (Rule 30/90/110)
- **Algorithmus:** 1D-CA: jede Zelle aktualisiert sich aus sich + 2 Nachbarn (Rule 30: p XOR (q OR r)). Zeit läuft nach unten → 2D-Muster. Für Vektorausgabe: jede „lebende" Zelle als kurzes Liniensegment, vertikale Linie oder als Kontur der zusammenhängenden Schwarzbereiche (Marching Squares über das CA-Gitter).
- **Warum gut für Plotter:** Deterministisch, regelbasiert, gut als Liniensegmente/Konturen darstellbar.
- **JS-Schwierigkeit:** Sehr niedrig (Bitoperationen).
- **Ästhetik:** Rule 30 = chaotisch (Conus-Textil-Muschel-Muster), Rule 90 = Sierpinski-Dreieck, Rule 110 = komplex/strukturiert. Starke emergente Komplexität aus trivialer Regel — didaktisch perfekt für ein CS-Publikum.
- **Referenzen:** Wolfram (A New Kind of Science), Rosetta Code (Implementierungen).

### 13. Islamische Geometrie / Girih-Tiles
- **Algorithmus:** **Girih:** 5 Kacheln (Dekagon, längliches Hexagon, Bowtie, Rhombus, Pentagon), alle Seiten gleich lang, Winkel Vielfache von 36°. Auf den Kacheln liegen „Strapwork"-Linien (Polygon-Mittelpunkte verbinden) → das eigentliche Linienmuster. Alternativ Kaplans Methode (reguläre Polygone + Sternpolygone). Translation/Rotation für Tessellation.
- **Warum gut für Plotter:** Reines Strapwork = Linien; perfekt für klare, präzise Stiftarbeit; symmetrisch und exakt.
- **JS-Schwierigkeit:** Mittel. Geometrie der Kacheln + Strapwork-Konstruktion. Craig Kaplans „Taprats" (Java, Open Source) ist die Referenz; TheBeachLab hat JS/Tooling-Ressourcen.
- **Ästhetik:** Sterne, Rosetten, unendliche nicht-periodische Tessellationen. Roman Verostko nennt diese Konstruktionen explizit „Vorläufer algorithmischer Kunst".
- **Referenzen:** Craig Kaplan (Taprats), Reyrove (Girih auf fxhash, JS).

### 14. Celtic Knots / Knotenmuster
- **Algorithmus:** Gitterbasiert (primäres + sekundäres Gitter). Setze Barrieren (vertikal/horizontal) an ausgewählten Gitterpunkten; an freien Innenpunkten werden gekreuzte Liniensegmente gezeichnet (Über-/Unterkreuzung wechselt nach Parität der Koordinate). Die Bänder folgen dann durch das Barriere-Layout. (Mercat/Glassner/Cromwell-Methode.)
- **Warum gut für Plotter:** Geflochtene Bänder = Linien; für Über-/Unterkreuzungen werden an Kreuzungen kleine Lücken gelassen (zwei Stiftdurchgänge oder Pfadunterbrechung).
- **JS-Schwierigkeit:** Mittel. dmackinnon1 hat einen JS/SVG-Generator (Grid → RibbonKnotDisplay → SVG).
- **Ästhetik:** Book-of-Kells-Verflechtungen; durch Barriere-Variation große Formenvielfalt. Über hyperbolische Varianten (Dunham) sogar mehrskalig.
- **Referenzen:** Andrew Glassner (IEEE CG&A), Peter Cromwell, Aidan Meehan (Buch), dmackinnon1 (GitHub).

### 15. Domain Warping / Gitterdeformation
- **Algorithmus:** Starte mit einem regelmäßigen Gitter (oder einer Linienschar) und verschiebe jeden Punkt p um ein Rausch-Feld: p' = p + w·noise(p), ggf. iteriert (warp eines bereits gewarpten Felds) mit Falloff. Mehrere Warps → marmorierte, fließende Strukturen.
- **Warum gut für Plotter:** Linien bleiben Linien, werden nur verzerrt — trivial als Polylinien plottbar. Anders als reine Flow Fields (ausgeschlossen) geht es hier um die *Deformation expliziter Geometrie/Gitter*, nicht um Partikel-Trajektorien.
- **JS-Schwierigkeit:** Niedrig. Perlin/Simplex-Noise (in p5.js eingebaut) auf Gitterpunkte anwenden. Mathias Isaksen (st4yho.me) hat eine interaktive JS-Einführung mit Code.
- **Ästhetik:** Topografisch, marmoriert, „schwerkraftverzerrt". Kombiniert hervorragend mit Verfahren 5/12/13 als Verzerrungsschicht.
- **Referenzen:** Inigo Quilez (iquilezles.org/articles/warp, kanonisch), Mathias Isaksen.

### 16. Weitere solide Kandidaten (kompakt)
- **Delaunay-Triangulation / Dreiecksnetze:** aus Punktwolke ein Dreiecksnetz; reine Kanten. JS: d3-delaunay (Bostock). Gut als Strukturgeber, kombinierbar mit Subdivision.
- **Superformel / Supershapes (Gielis):** r(φ)=[|cos(mφ/4)/a|^n₂+|sin(mφ/4)/b|^n₃]^(−1/n₁). Eine geschlossene parametrische Kurve; m steuert Symmetrie. Sehr wenige Parameter, riesige Formenvielfalt (Blüten, Sterne, Zellen). JS-Schwierigkeit niedrig.
- **Fractures / Sand Splines (Anders Hoff):** Risslinien und gedämpfte Spline-Bündel — sehr plotter-typisch, dünne sich überlagernde Kurvenscharen.
- **Recursive Division Mazes / Labyrinthe:** Kammer rekursiv mit Wänden teilen (Wände = Linien). Über das „dual"/Lösungspfad-Tracing lässt sich sogar ein einziger durchgehender Pfad (unicursal) extrahieren.
- **Sol-LeWitt-artige instruktionsbasierte Kunst:** explizite Zeichenanweisungen („Linien von jedem Punkt zu jedem anderen") — konzeptionell elegant, trivial als Linien, gut für ein CS-Publikum als Reflexion über „Algorithmus = Kunstwerk".

## Recommendations

**Stufe 1 — Sofort umsetzbar, höchster Ästhetik-Ertrag (Wachstum + Feld):**
1. **Differential Line Growth** als Kern-„Wachstums"-Erlebnis: live wachsende Kurve, ein einziger Pfad, spektakulär beim Zuschauen, exzellente Multi-Skalen-Faltung. Nutzt Jason Webbs JS-Referenz als Startpunkt.
2. **Reaction-Diffusion → d3-contour Isolinien** als „Feld"-Erlebnis: Besucher variieren f/k-Parameter (Slider), sehen Turing-Muster entstehen, Plot als topografische Konturen. Bei Performance-Bedarf GPU/WebGL.

**Stufe 2 — Struktur & Variation (für Wiederspielwert über Besucher):**
3. **Carlson-Truchet-Tiles mit rekursiver Subdivision** *oder* **WFC mit Linienkacheln** für regelbasierte, multiskalige Muster mit hoher Variation pro Seed.
4. **Strange Attractor (de Jong/Clifford) als Polylinien-Gewebe** — sehr geringer Implementierungsaufwand, mathematisch elegant, gut für ein CS-Publikum.

**Stufe 3 — Interaktions-Spezialitäten:**
5. **TSP-Art/Single-Line** falls Besucher eigene Fotos einreichen (ein durchgehender Pfad, faszinierend).
6. **Harmonograph** als „ruhiges", parametergesteuertes Spielzeug (Slider für Frequenz/Phase/Dämpfung) — niedrigste Hürde, sofort schöne Ergebnisse.

**Architektur-Empfehlung:** Baut eine gemeinsame **JS→SVG-Abstraktion** (Polylinien-Liste → SVG `<path>`), dann durch **vpype** (linesort/linemerge/Reorder) für effizientes Plotten und an den Plotter (AxiDraw via `axicli`/Inkscape, oder saxi). So sind alle Techniken austauschbare „Generatoren" hinter einer Pipeline.

**Schwellenwerte, die die Empfehlung ändern würden:**
- Wenn **Live-Performance auf schwacher Hardware** kritisch ist → Attraktoren/Harmonograph/L-Systeme (CPU-billig) vor RD (GPU-hungrig) priorisieren.
- Wenn **kurze Plotzeit** zentral ist → Single-Path-Verfahren (Differential Growth, raumfüllende Kurven, TSP, Harmonograph) vor flächigen Hatching/RD-Konturen.
- Wenn **maximaler „Wow beim Zuschauen"** das Ziel ist → wachsende Verfahren (Differential Growth, Space Colonization) vor statisch-berechneten.

## Caveats
- **Strange Attractors:** Die populärsten Renderings sind *Dichte-Punktwolken* (Millionen Punkte, additive Blending) — das ist **nicht** plotterfreundlich. Nur die Polylinien-Bahn-Variante (oder 3D-projizierte Kurven) eignet sich; das schränkt die Ästhetik gegenüber den bekannten GPU-Bildern ein.
- **Reaction-Diffusion:** d3-contour liefert **gefüllte Isoband-Ringe** (geschlossene Polygone), keine offenen Isolinien — für Plotten gut, aber bei sehr vielen Schwellenwerten wird es tintenintensiv; Linienreihenfolge unbedingt mit vpype optimieren. Hohe Gitterauflösung in reinem CPU-JS ist langsam → WebGL empfohlen. Die „mitosis"/„coral"-Parameter-Presets variieren je nach Quelle leicht — kalibriert mit Live-Slidern.
- **Es konnte kein einzelner namentlich dokumentierter Plotter-Künstler gefunden werden, der explizit „Gray-Scott-RD-Konturen auf einem AxiDraw" geplottet hat.** Die stärksten realen Verbindungen sind Jason Webb (RD + separate Marching-Squares↔Plotter-Doku) und Keijiro Takahashi (Kontur→SVG→AxiDraw via autotrace, aber nicht RD-spezifisch). Das RD→Isolinie→Einzelstrich-Konzept ist jedoch technisch belegt (u. a. US-Patent 11.009.853 zur Werkzeugbahn-Generierung, das das Tracen der Median-Isolinie eines Gray-Scott-Felds zu Einzelstrich-Pfaden beschreibt).
- **TSP-Art:** Exaktes TSP ist NP-schwer; für Live-Browser nur Heuristiken (Nearest-Neighbor + 2-opt). Außerdem bekanntes Helligkeits-/Kontrastproblem (Ahmed, Bridges 2015): Tonwerte müssen vorab quadriert werden, damit die Liniendarstellung tonwertgetreu wirkt.
- **L-Systeme/Dragon Curve:** String-Länge wächst exponentiell — Iterationstiefe begrenzen (Dragon: 16 Iterationen = 65.536 Segmente bereits am praktischen Limit für schnelle Live-Generierung).
- Die meisten genannten Referenz-Repos sind Python (vpype, vsketch, inconvergent's Lisp) oder Processing; die **Algorithmen** sind jedoch sprachunabhängig und alle in JS reimplementierbar — fertige JS-Implementierungen existieren v. a. für Differential Growth, Space Colonization, Attraktoren, Truchet, WFC, Domain Warping und Harmonograph.