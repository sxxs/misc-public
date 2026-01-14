# WIAI25 Progressive Enhancement Animation – Technische Spezifikation

## Konzept

Eine generative "25"-Grafik, die über 25 Wochen durch Besucher-Interaktion schrittweise schärfer wird. Jeder Besuch (genauer: jede Minute mit mindestens einem Besucher) fügt einen Pixel hinzu. Ältere Pixel-Schichten verblassen, neuere überschreiben sie – das erzeugt einen "Enhance"-Effekt von grob zu fein.

## Visuelle Layer

```
┌─────────────────────────────────────────┐
│  Layer 3: Outline (XOR-Blend)           │  ← Immer sichtbar, garantiert Lesbarkeit
├─────────────────────────────────────────┤
│  Layer 2: Aktuelle Pixel (Opacity 60%)  │  ← Frische Beiträge
├─────────────────────────────────────────┤
│  Layer 1: Verblasste Historie (PNG)     │  ← Akkumulierte frühere Level
└─────────────────────────────────────────┘
```

### Layer 1: Historien-Hintergrund
- Geflattetes PNG aller bisherigen Level
- Bei jedem Level-Wechsel: Helligkeit +10% (= Ausbleichen)
- Akkumuliert sich über Zeit, älteste Schichten am hellsten

### Layer 2: Aktuelle Pixel
- Gezeichnet mit Opacity 60%
- Farbe: TBD (Vorschlag: dunkles Petrol/Teal #1a5f5f oder Uni-nah)
- Position wird gespeichert, um beim nächsten Besuch fortzusetzen

### Layer 3: Outline
- Vektorgrafik "WIAI25" als Pfad
- Blend-Mode: XOR oder Difference
- Auf dunklem Untergrund → weiß
- Auf hellem Untergrund → dunkel
- Garantiert Lesbarkeit in jedem Zustand

---

## Algorithmus

### Initialisierung
```
canvas_width = 1200  # px
canvas_height = 480  # px, Aspect Ratio ~2.5:1
outline = load_vector("WIAI25.svg")  # Pfad/Shape der Buchstaben

pixel_size_start = 100  # px, Level 1
pixel_size_end = 5      # px, finales Level
current_level = 1
current_position = 0    # linearer Index im Scanline-Array
history_png = blank_canvas()
```

### Pro Besucher-Minute (Trigger)
```python
def on_visitor_minute():
    global current_position, current_level, history_png
    
    pixel_size = get_pixel_size(current_level)
    grid = generate_grid(canvas_width, canvas_height, pixel_size)
    valid_cells = filter_by_overlap(grid, outline, threshold=0.5)
    
    # Finde nächste gültige Zelle ab current_position
    while current_position < len(valid_cells):
        cell = valid_cells[current_position]
        if not cell.already_filled:
            draw_pixel(cell, opacity=0.6)
            cell.already_filled = True
            current_position += 1
            save_state()
            return
        current_position += 1
    
    # Level komplett → Enhance!
    advance_level()

def advance_level():
    global current_level, current_position, history_png
    
    # Aktuelle Pixel in Historie einbacken
    current_layer_png = render_current_pixels()
    history_png = flatten(history_png, current_layer_png)
    history_png = increase_brightness(history_png, factor=1.10)
    
    # Nächstes Level
    current_level += 1
    current_position = 0
    clear_current_pixels()
```

### Overlap-Berechnung
```python
def filter_by_overlap(grid, outline, threshold):
    valid = []
    for cell in grid:
        # Fläche der Schnittmenge (Pixel-Rechteck ∩ Outline-Pfad)
        intersection = cell.bounds.intersection(outline)
        coverage = intersection.area / cell.area
        if coverage >= threshold:
            valid.append(cell)
    return valid  # In Scanline-Reihenfolge (links→rechts, oben→unten)
```

---

## Parameter-Berechnung

### Geschätzte Updates über 25 Wochen

```
Wochen:              25
Tage pro Woche:      7
Aktive Stunden/Tag:  14 (08:00–22:00)
Minuten mit Visitor: 30 pro Stunde (konservativ)

Total Updates = 25 × 7 × 14 × 30 = 73.500
```

Das ist ein Upper Bound. Realistischer für eine Fakultätsseite:

```
Szenario A (konservativ): 
  ~10 Minuten/Stunde mit Visitor
  → 25 × 7 × 14 × 10 = 24.500 Updates

Szenario B (optimistisch):
  ~20 Minuten/Stunde mit Visitor  
  → 25 × 7 × 14 × 20 = 49.000 Updates

Szenario C (pessimistisch):
  ~5 Minuten/Stunde mit Visitor
  → 25 × 7 × 14 × 5 = 12.250 Updates
```

**Arbeitshypothese: ~20.000 Updates**

### Pixel-Mengen pro Level

Bei Canvas 1200×480 und "WIAI25" mit ~35% Flächendeckung der Bounding Box:

| Level | Pixel-Größe | Grid-Zellen | Gültige Zellen (~35%) | Kumulativ |
|-------|-------------|-------------|----------------------|-----------|
| 1     | 100px       | 12 × 5 = 60 | ~21                  | 21        |
| 2     | 80px        | 15 × 6 = 90 | ~32                  | 53        |
| 3     | 60px        | 20 × 8 = 160| ~56                  | 109       |
| 4     | 50px        | 24 × 10 = 240| ~84                 | 193       |
| 5     | 40px        | 30 × 12 = 360| ~126                | 319       |
| 6     | 30px        | 40 × 16 = 640| ~224                | 543       |
| 7     | 25px        | 48 × 19 = 912| ~319                | 862       |
| 8     | 20px        | 60 × 24 = 1440| ~504               | 1.366     |
| 9     | 15px        | 80 × 32 = 2560| ~896               | 2.262     |
| 10    | 12px        | 100 × 40 = 4000| ~1400              | 3.662     |
| 11    | 10px        | 120 × 48 = 5760| ~2016              | 5.678     |
| 12    | 8px         | 150 × 60 = 9000| ~3150              | 8.828     |
| 13    | 6px         | 200 × 80 = 16000| ~5600             | 14.428    |
| 14    | 5px         | 240 × 96 = 23040| ~8064             | 22.492    |

**→ Mit 14 Levels und ~20.000 Updates erreichen wir nahezu volle Auflösung.**

### Level-Progression anpassen

Die Pixel-Größen sollten nicht linear abnehmen, sondern so gewählt werden, dass:
1. Frühe Level schnell durchlaufen werden (Erfolgserlebnis)
2. Spätere Level länger dauern (mehr Pixel, feineres Detail)
3. Das Tempo zur Besucherzahl passt

**Vorschlag: Geometrische Progression**
```
pixel_sizes = [100, 80, 64, 50, 40, 32, 25, 20, 16, 12, 10, 8, 6, 5]
```

Das ergibt ~14 Level mit natürlicher Verlangsamung zum Ende.

---

## Zeitliche Verteilung

### Ziel: Level-Abschlüsse als Meilensteine

| Woche | Erwartetes Level | Visuelle Qualität |
|-------|------------------|-------------------|
| 1-2   | Level 1-4        | Grob, aber erkennbar |
| 3-6   | Level 5-7        | Deutlich lesbar |
| 7-12  | Level 8-10       | Gut definiert |
| 13-20 | Level 11-12      | Scharf |
| 21-25 | Level 13-14      | Sehr scharf, fast vollständig |

### Puffer einbauen

Falls Besucher-Zahlen niedriger als erwartet:
- Parameter können dynamisch angepasst werden
- Overlap-Threshold von 50% auf 40% senken → mehr gültige Zellen
- Oder: Mehrere Pixel pro Trigger in späten Levels

Falls Besucher-Zahlen höher als erwartet:
- Zusätzliche "Bonus-Level" mit noch feinerer Auflösung
- Oder: Animation ist "fertig" vor Woche 25 → Celebration State

---

## Datenmodell

### Persistenter State (JSON + PNG)
```json
{
  "version": 1,
  "current_level": 7,
  "current_position": 142,
  "total_contributions": 4832,
  "level_history": [
    {"level": 1, "completed_at": "2025-01-20T14:32:00Z", "contributions": 21},
    {"level": 2, "completed_at": "2025-01-23T09:15:00Z", "contributions": 32},
    ...
  ],
  "last_update": "2025-02-15T11:47:00Z"
}
```

### Statische Assets (vorberechnet)
```
/assets/wiai25/
  outline.svg              # Vektor-Outline
  history-level-0.png      # Leeres Bild
  history-level-1.png      # Nach Level 1
  history-level-2.png      # Nach Level 2
  ...
  current-pixels.json      # Positionen der aktuellen Level-Pixel
```

### Alternative: Vollständig vorberechnet

Da die Progression deterministisch ist (immer Scanline links→rechts), können alle ~20.000 Frames vorberechnet werden:

```
/assets/wiai25/frames/
  frame-00001.svg
  frame-00002.svg
  ...
  frame-20000.svg
```

**Vorteil**: Kein Server-seitiger State, nur ein Counter
**Nachteil**: ~20.000 Dateien (aber: SVG komprimiert gut, ~2-5KB pro Frame)

**Kompromiss**: Nur Level-Übergänge + N Frames pro Level vorberechnen
```
/assets/wiai25/
  level-01/frame-001.svg ... frame-021.svg
  level-02/frame-001.svg ... frame-032.svg
  ...
```

---

## Frontend-Implementierung

### Stateless Ansatz (empfohlen für Hugo)

```javascript
// Visitor-Counter von simplem Backend oder Service (z.B. CountAPI, Supabase)
async function getContributionCount() {
  const res = await fetch('/api/count'); // oder externer Service
  return res.json(); // { count: 4832 }
}

async function renderWIAI25() {
  const { count } = await getContributionCount();
  const frameIndex = Math.min(count, MAX_FRAMES);
  
  // Lade passendes vorberechnetes SVG
  const svg = await fetch(`/assets/wiai25/frame-${frameIndex.toString().padStart(5, '0')}.svg`);
  document.getElementById('wiai25-container').innerHTML = await svg.text();
  
  // Highlight "eigenen" Pixel (der zuletzt hinzugefügte)
  highlightPixel(frameIndex);
  
  // Stats anzeigen
  document.getElementById('contribution-count').textContent = count.toLocaleString('de-DE');
}

function highlightPixel(frameIndex) {
  // Der Pixel mit data-index={frameIndex} bekommt eine Pulse-Animation
  const pixel = document.querySelector(`[data-index="${frameIndex}"]`);
  if (pixel) {
    pixel.classList.add('pulse-highlight');
  }
}
```

### SVG-Struktur (pro Frame)
```svg
<svg viewBox="0 0 1200 480" xmlns="http://www.w3.org/2000/svg">
  <!-- Layer 1: Historie (eingebettetes PNG oder Pfade) -->
  <image href="history-level-6.png" opacity="0.3" />
  
  <!-- Layer 2: Aktuelle Pixel -->
  <g class="current-pixels">
    <rect data-index="4830" x="120" y="80" width="25" height="25" fill="#1a5f5f" opacity="0.6"/>
    <rect data-index="4831" x="145" y="80" width="25" height="25" fill="#1a5f5f" opacity="0.6"/>
    <rect data-index="4832" x="170" y="80" width="25" height="25" fill="#1a5f5f" opacity="0.6"/>
    <!-- ... -->
  </g>
  
  <!-- Layer 3: Outline (XOR via mix-blend-mode) -->
  <g class="outline" style="mix-blend-mode: difference;">
    <path d="M..." fill="white" />
  </g>
</svg>
```

---

## Backend-Optionen

### Option A: Externer Counter-Service
- CountAPI.xyz (kostenlos, simpel)
- Oder: Supabase/Firebase mit einer Zeile
- Hugo fetcht nur die Zahl, kein eigener Server

### Option B: Cloudflare Worker
- Edge-basiert, schnell
- Speichert Count in KV Store
- ~5 Zeilen Code

### Option C: Statische Aktualisierung
- Cron-Job updated den Count alle X Minuten
- Hugo rebuilds mit neuem Count
- Weniger "live", aber null Infrastruktur

**Empfehlung: Option A oder B** – der Counter muss live sein, damit Besucher ihren Beitrag sehen.

---

## Offene Fragen

1. **Outline-Font**: Welche Schrift für "WIAI25"? Bold, geometrisch? Oder custom lettering?

2. **Farbschema**: 
   - Pixel-Farbe: Teal? Uni-Blau? Gradient?
   - Hintergrund: Weiß? Leicht getönt?
   - Outline: Immer weiß (auf dunkel) / schwarz (auf hell)?

3. **Canvas-Dimensionen**: 1200×480 ist Annahme. Responsive? Oder feste Größe?

4. **"Eigener Pixel" Feedback**: 
   - Pulse-Animation?
   - Tooltip "Du bist Beitrag #4.832"?
   - Kleines Konfetti?

5. **Edge Cases**:
   - Was passiert nach Frame 20.000? Loop? Freeze? Celebration?
   - Was wenn 2 Besucher in derselben Minute? (Lösung: Minutenbasis, nicht Besucherbasis)

6. **Vorberechnung**: Wer generiert die ~20.000 SVGs? Script nötig.

---

## Nächste Schritte

1. [ ] Outline-Design finalisieren (Font/Lettering für "WIAI25")
2. [ ] Farbschema festlegen
3. [ ] Generator-Script schreiben (Python + svgwrite oder Node + D3)
4. [ ] Counter-Backend aufsetzen (Cloudflare Worker empfohlen)
5. [ ] Ersten Prototyp mit 100 Frames testen
6. [ ] Parameter anpassen basierend auf tatsächlichen Besucherzahlen (Woche 1-2)

---

## Anhang: Generator-Script Pseudocode

```python
import svgwrite
from shapely.geometry import box
from shapely.ops import unary_union

def generate_all_frames():
    outline = load_outline("WIAI25.svg")
    pixel_sizes = [100, 80, 64, 50, 40, 32, 25, 20, 16, 12, 10, 8, 6, 5]
    
    history_layers = []
    frame_index = 0
    
    for level, pixel_size in enumerate(pixel_sizes):
        grid = generate_grid(1200, 480, pixel_size)
        valid_cells = [c for c in grid if overlap(c, outline) >= 0.5]
        
        current_pixels = []
        for cell in valid_cells:
            current_pixels.append(cell)
            frame_index += 1
            
            svg = render_frame(
                history_layers,
                current_pixels,
                outline,
                pixel_size,
                frame_index
            )
            svg.saveas(f"frames/frame-{frame_index:05d}.svg")
        
        # Level complete → flatten to history
        history_layers.append({
            'pixels': current_pixels.copy(),
            'pixel_size': pixel_size,
            'opacity': 0.6  # wird pro neuem Level um 10% heller
        })
        
        # Fade previous layers
        for layer in history_layers[:-1]:
            layer['opacity'] *= 0.9

    print(f"Generated {frame_index} frames")

if __name__ == "__main__":
    generate_all_frames()
```