# PLAN-3: Auto-Skalierung & Copy-Buttons

## Übersicht

Drei zusammenhängende Änderungen für bessere Mobile-UX:

1. **Panning entfernen** - Viewport-Scrolling komplett raus
2. **Auto-Skalierung** - Canvas passt sich automatisch an Bildschirmgröße an
3. **Copy-Buttons** - Große Kopier-Buttons bei allen Code-Feldern

---

## Phase 1: Panning entfernen

### Zu löschender Code (game.js)

```
Zeilen/Bereiche die entfernt werden:
- viewport Objekt (let viewport = { x: 0, y: 0 })
- clampViewport() Funktion komplett
- shouldAllowPan() Funktion komplett
- isPanning Variable und alle Referenzen
- panStartX, panStartY Variablen
- Pan-Logik in touchstart, touchmove, touchend
- Pan-Logik in mousedown, mousemove, mouseup
- viewport.x/viewport.y Verwendung in render()
- ctx.translate(-viewport.x, -viewport.y) in render()
- Pan-Hint Funktion (showPanHint)
```

### Vereinfachte Touch-Handler

Nach Entfernung bleibt nur:
- **Architect Mode (wall/erase)**: Drag = Paint, Tap = Paint
- **Architect Mode (andere Tools)**: Tap = Place
- **Infiltrator Mode**: Tap = Move

---

## Phase 2: Auto-Skalierung

### Konzept

```
TILE_SIZE = dynamisch berechnet, nicht mehr konstant 40px

Berechnung:
1. availableWidth = window.innerWidth
2. availableHeight = window.innerHeight - TOOLBAR_HEIGHT - TOP_BAR_HEIGHT - SAFE_AREAS
3. tileWidth = availableWidth / GRID_WIDTH
4. tileHeight = availableHeight / GRID_HEIGHT
5. TILE_SIZE = Math.floor(Math.min(tileWidth, tileHeight))
```

### Konstanten

```javascript
const GRID_WIDTH = 12;
const GRID_HEIGHT = 18;
const TOOLBAR_HEIGHT = 80;  // inkl. Safe Area
const TOP_BAR_HEIGHT = 60;  // inkl. Safe Area
```

### Änderungen in game.js

#### 1. TILE_SIZE dynamisch machen

```javascript
// ALT:
const BASE_TILE_SIZE = 40;
let TILE_SIZE = BASE_TILE_SIZE;

// NEU:
let TILE_SIZE = 40; // wird in resizeCanvas() berechnet
```

#### 2. resizeCanvas() überarbeiten

```javascript
function resizeCanvas() {
    const screenW = window.innerWidth;
    const screenH = window.innerHeight;

    // Verfügbarer Platz (abzüglich UI-Elemente)
    const topOffset = 60;  // Top Bar + Safe Area
    const bottomOffset = gameMode === 'architect' ? 80 : 20; // Toolbar oder nur Safe Area

    const availableW = screenW;
    const availableH = screenH - topOffset - bottomOffset;

    // Tile-Größe berechnen (kleinerer Wert gewinnt)
    const tileByWidth = Math.floor(availableW / GRID_WIDTH);
    const tileByHeight = Math.floor(availableH / GRID_HEIGHT);
    TILE_SIZE = Math.min(tileByWidth, tileByHeight);

    // Canvas-Größe = Grid-Größe
    const canvasW = GRID_WIDTH * TILE_SIZE;
    const canvasH = GRID_HEIGHT * TILE_SIZE;

    canvas.width = canvasW;
    canvas.height = canvasH;

    // Canvas zentrieren
    canvas.style.position = 'fixed';
    canvas.style.left = `${(screenW - canvasW) / 2}px`;
    canvas.style.top = `${topOffset + (availableH - canvasH) / 2}px`;
}
```

#### 3. Render-Funktion vereinfachen

```javascript
function render() {
    // Kein viewport-Offset mehr nötig
    ctx.fillStyle = '#0a0a0f';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Grid, Entities etc. direkt zeichnen (ohne translate)
    drawGrid();
    drawWalls();
    // ...
}
```

#### 4. getGridPos() vereinfachen

```javascript
function getGridPos(e) {
    const rect = canvas.getBoundingClientRect();
    const touch = e.touches ? e.touches[0] || e.changedTouches[0] : e;
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;
    return {
        x: Math.floor(x / TILE_SIZE),
        y: Math.floor(y / TILE_SIZE)
    };
}
```

---

## Phase 3: Copy-to-Clipboard Buttons

### Betroffene Stellen

1. **Share Modal** (Level-Code nach Architect)
2. **Status Overlay** (Replay-Code nach Spielende)
3. **Code Modal** (falls Code angezeigt wird)

### HTML-Änderungen (index.html)

#### Share Modal erweitern

```html
<!-- Im shareModal -->
<div class="code-display">
    <code id="levelCode"></code>
    <button class="copy-btn" onclick="copyLevelCode()">
        <svg><!-- Heroicon clipboard-copy --></svg>
        Code kopieren
    </button>
</div>
```

### CSS-Änderungen (style.css)

```css
.copy-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    width: 100%;
    padding: 12px 20px;
    margin-top: 10px;
    font-family: 'Bebas Neue', sans-serif;
    font-size: 1.1rem;
    background: var(--gold);
    color: #000;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    touch-action: manipulation;
}

.copy-btn:active {
    background: #b8962e;
}

.copy-btn svg {
    width: 20px;
    height: 20px;
}

.copy-btn.copied {
    background: var(--green);
}
```

### JavaScript-Änderungen (game.js)

```javascript
function copyLevelCode() {
    const code = document.getElementById('levelCode').textContent;
    copyToClipboard(code, 'levelCopyBtn');
}

function copyReplayCode() {
    const input = document.querySelector('#statusOverlay input');
    if (input) {
        copyToClipboard(input.value, 'replayCopyBtn');
    }
}

function copyToClipboard(text, buttonId) {
    navigator.clipboard?.writeText(text).then(() => {
        const btn = document.getElementById(buttonId);
        if (btn) {
            btn.classList.add('copied');
            btn.textContent = 'Kopiert!';
            setTimeout(() => {
                btn.classList.remove('copied');
                btn.innerHTML = '<svg>...</svg> Code kopieren';
            }, 2000);
        }
    });
}
```

### Heroicon SVG (clipboard-copy)

```html
<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
  <path stroke-linecap="round" stroke-linejoin="round" d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9.75a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184" />
</svg>
```

---

## Zusammenfassung der Änderungen

### game.js

| Bereich | Änderung |
|---------|----------|
| Viewport | Komplett entfernen (viewport, clampViewport, shouldAllowPan) |
| TILE_SIZE | Dynamisch in resizeCanvas() berechnen |
| resizeCanvas() | Canvas zentrieren, Tile-Größe berechnen |
| render() | viewport-translate entfernen |
| getGridPos() | Vereinfachen (kein viewport-Offset) |
| Touch-Handler | Pan-Logik entfernen, nur Tap/Paint |
| Copy-Funktionen | copyLevelCode(), copyReplayCode(), copyToClipboard() |

### index.html

| Bereich | Änderung |
|---------|----------|
| Share Modal | Copy-Button mit Heroicon hinzufügen |

### style.css

| Bereich | Änderung |
|---------|----------|
| .copy-btn | Neuer Button-Style für Kopieren |

---

## Reihenfolge der Implementierung

1. **Panning entfernen** (räumt Code auf)
2. **Auto-Skalierung** (Kern-Feature)
3. **Copy-Buttons** (UI-Verbesserung)
4. **Testen** auf iPhone SE und iPhone 14

---

## Risiken & Fallbacks

- **Sehr kleine Screens**: Minimum TILE_SIZE von 20px festlegen
- **Landscape Mode**: Weiterhin unterstützen (Grid passt sich an)
- **Desktop**: Funktioniert weiterhin (größere Tiles)
