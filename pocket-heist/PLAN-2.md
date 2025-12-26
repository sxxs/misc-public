# Pocket Heist - Mobile PWA Optimierung (PLAN-2)

## Zielsetzung

Das Spiel auf **iPhone SE (375×667)**, **iPhone 14 (390×844)** und **iPhone 17 (~393×852)** vollständig spielbar machen mit:
- PWA-Installation (Homescreen-Icon)
- Vollbild-Modus (standalone)
- Portrait- UND Landscape-Support
- Panning ohne Zoom
- Zuverlässiges Cache-Busting für Entwicklung

---

## Arbeitsprinzipien

| Prinzip | Bedeutung |
|---------|-----------|
| **KISS** | Einfachste Lösung bevorzugen |
| **Präzise Diffs** | Exakte Zeilennummern, klare Vorher/Nachher |
| **Keine Breaking Changes** | Bestehende Funktionalität erhalten |
| **YAGNI** | Nur implementieren was gebraucht wird |

---

## Aktueller Stand (Bestehender Code)

### index.html
- Zeile 6: Viewport mit `user-scalable=yes`, `maximum-scale=3.0`
- Zeile 10: `style.css?v=1.0.0`
- Zeile 145: `game.js?v=1.0.0`
- Zeile 14-18: Rotate-Hint mit Dismiss-Button

### style.css
- Zeile 33: `min-height: 100dvh` bereits vorhanden
- Zeile 218-224: `@media (max-width: 500px)` für Toolbar
- Zeile 244-251: `@media (max-width: 500px)` für .tool-btn (48px)
- Zeile 254-261: `@media (max-width: 360px)` für .tool-btn (42px) ← **Verletzt 44px Minimum**
- Zeile 325-330: `@media (max-width: 500px)` für #abilityBar
- Zeile 350-356: `@media (max-width: 500px)` für .ability-btn (50px)
- Zeile 529-537: Rotate-Hint Media Queries

### game.js
- Zeile 4: `VERSION = '1.0.0'`
- Zeile 6-17: Cache-Busting mit sessionStorage + Random
- Zeile 477-512: `resizeCanvas()` mit `ctx.setTransform()`
- Zeile 514-527: `clampViewport()`
- Zeile 536: `render()` Funktion (NICHT `draw()`)
- Zeile 1278-1301: `getGridPos()` holt `getBoundingClientRect()` bei jedem Aufruf
- Zeile 2185-2199: Resize + Orientation Handler bereits vorhanden
- Zeile 2202: `resizeCanvas()` wird beim Init aufgerufen

---

## Design-Entscheidungen

| Frage | Entscheidung | Begründung |
|-------|--------------|------------|
| Rotate-Hint? | **Komplett entfernen** (HTML, CSS, JS) | Portrait wird unterstützt |
| Min. Button-Größe? | **44px** | Apple HIG |
| Cache-Strategie? | **Fester Hash + Meta-Tags** | Kein Server nötig |
| Safe Areas? | **Nur CSS, nicht via JS** | `env()` kann nicht in JS gelesen werden |

---

## Implementierungsplan

### Phase 1: Viewport & Cache Meta-Tags

**Datei:** `index.html`

**Änderung 1 - Zeile 6 ersetzen:**
```html
<!-- ALT (Zeile 6) -->
<meta name="viewport" content="width=device-width, initial-scale=1.0, minimum-scale=1.0, maximum-scale=3.0, user-scalable=yes">

<!-- NEU -->
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover">
```

**Änderung 2 - Nach Zeile 4 einfügen (nach `<meta charset>`):**
```html
    <!-- Cache-Busting für Entwicklung -->
    <meta http-equiv="Cache-Control" content="no-cache, no-store, must-revalidate">
    <meta http-equiv="Pragma" content="no-cache">
    <meta http-equiv="Expires" content="0">
```

**Änderung 3 - Zeile 10 und 145 aktualisieren:**
```html
<!-- Zeile 10: ALT -->
<link rel="stylesheet" href="style.css?v=1.0.0">
<!-- Zeile 10: NEU -->
<link rel="stylesheet" href="style.css?v=2.0.0">

<!-- Zeile 145: ALT -->
<script src="game.js?v=1.0.0"></script>
<!-- Zeile 145: NEU -->
<script src="game.js?v=2.0.0"></script>
```

---

### Phase 2: Rotate-Hint komplett entfernen

**Datei:** `index.html`

**Änderung - Zeilen 13-18 löschen:**
```html
<!-- LÖSCHEN: Zeilen 13-18 -->
    <!-- Rotate Hint - now dismissible -->
    <div id="rotateHint">
        <div class="icon">📱↻</div>
        <p>Querformat empfohlen</p>
        <button class="dismiss-btn" onclick="dismissRotateHint()">Trotzdem spielen</button>
    </div>
```

**Datei:** `style.css`

**Änderung - Zeilen 491-542 löschen (kompletter Rotate-Hint Block):**
```css
/* LÖSCHEN: Zeilen 491-542 */
/* ==================== ROTATE HINT ==================== */
#rotateHint { ... }
/* ... alles bis ... */
#rotateHint.dismissed { ... }
```

**Datei:** `game.js`

**Änderung - Zeilen 101-107 löschen:**
```javascript
// LÖSCHEN: Zeilen 101-107
// ==================== ROTATE HINT DISMISS ====================
function dismissRotateHint() {
    const hint = document.getElementById('rotateHint');
    if (hint) {
        hint.classList.add('dismissed');
    }
}
```

---

### Phase 3: Cache-Busting vereinfachen

**Datei:** `game.js`

**Änderung - Zeilen 4-17 ersetzen:**
```javascript
// ALT (Zeilen 4-17)
const VERSION = '1.0.0';

// ==================== CACHE BUSTING ====================
(function() {
    const currentUrl = new URL(window.location.href);
    const hasVersionParam = currentUrl.searchParams.has('v');
    const sessionKey = 'pocket-heist-loaded';

    if (!hasVersionParam && !sessionStorage.getItem(sessionKey)) {
        sessionStorage.setItem(sessionKey, 'true');
        currentUrl.searchParams.set('v', VERSION + '-' + Math.random().toString(36).substr(2, 9));
        window.location.replace(currentUrl.toString());
    }
})();

// NEU
const VERSION = '2.0.0';

// Version-Logging für Debugging
console.log(`Pocket Heist v${VERSION}`);
```

**Begründung:** Das aggressive Cache-Busting mit Redirect ist nicht nötig wenn wir:
1. HTTP Meta-Tags haben
2. Versionierte Asset-URLs haben (`?v=2.0.0`)
3. Service Worker mit Network-First nutzen

---

### Phase 4: Button-Größen korrigieren (44px Minimum)

**Datei:** `style.css`

**Änderung 1 - Zeilen 254-261 ersetzen:**
```css
/* ALT (Zeilen 254-261) */
/* Very small screens */
@media (max-width: 360px) {
    .tool-btn {
        width: 42px;
        height: 42px;
        font-size: 0.4rem;
    }
    .tool-btn .icon { font-size: 1rem; }
}

/* NEU */
/* Very small screens - maintain 44px minimum */
@media (max-width: 360px) {
    .tool-btn {
        width: 44px;
        height: 44px;
        font-size: 0.4rem;
    }
    .tool-btn .icon { font-size: 1rem; }
}
```

**Änderung 2 - Nach Zeile 356 einfügen (nach bestehendem .ability-btn media query):**
```css
/* Very small screens - maintain 44px minimum for abilities */
@media (max-width: 360px) {
    .ability-btn {
        width: 44px;
        height: 44px;
        font-size: 1rem;
    }
    .ability-btn small {
        font-size: 0.35rem;
    }
}
```

---

### Phase 5: Portrait-Layout

**Datei:** `style.css`

**Änderung - Am Ende der Datei (vor `.hidden`) einfügen:**
```css
/* ==================== PORTRAIT MODE ==================== */
@media (orientation: portrait) {
    /* Toolbar: horizontal am unteren Rand */
    #toolbar {
        height: 70px;
        padding-bottom: env(safe-area-inset-bottom, 0);
    }

    /* Abilities: horizontal zentriert am unteren Rand */
    #abilityBar {
        top: auto;
        right: auto; /* Bestehende right: 10px überschreiben */
        left: 50%;
        transform: translateX(-50%); /* Horizontal zentrieren */
        bottom: 80px; /* Über der Toolbar */
        flex-direction: row;
        gap: 15px;
    }

    /* Wenn Infiltrator-Mode (keine Toolbar), Abilities ganz unten */
    body.infiltrator #abilityBar {
        bottom: 10px;
        padding-bottom: env(safe-area-inset-bottom, 0);
    }

    /* TopBar: mehr Platz für Wrap */
    #topBar {
        max-width: calc(100vw - 20px);
        right: 10px;
        left: 10px;
    }
}

/* ==================== SAFE AREAS ==================== */
/* Top Bar: Abstand zur Status-Bar / Dynamic Island */
#topBar {
    top: max(10px, env(safe-area-inset-top, 10px));
}

/* Budget Display: Abstand nach rechts für Safe Area */
#budgetDisplay {
    right: max(10px, env(safe-area-inset-right, 10px));
    top: max(10px, env(safe-area-inset-top, 10px));
}

/* Toolbar: Safe Area unten */
#toolbar {
    padding-bottom: env(safe-area-inset-bottom, 0);
}

/* Landscape: Safe Areas links/rechts */
@media (orientation: landscape) {
    #abilityBar {
        right: max(10px, env(safe-area-inset-right, 10px));
    }

    #toolbar {
        padding-left: env(safe-area-inset-left, 0);
        padding-right: env(safe-area-inset-right, 0);
    }
}
```

---

### Phase 6: Orientation-Change Handler verbessern

**Datei:** `game.js`

**Änderung - Zeilen 2192-2199 ersetzen:**
```javascript
// ALT (Zeilen 2192-2199)
window.addEventListener('orientationchange', () => {
    setTimeout(() => {
        if (gameMode) {
            resizeCanvas();
            clampViewport();
        }
    }, 100);
});

// NEU
window.addEventListener('orientationchange', () => {
    // Mehrere Timeouts für zuverlässigere Anpassung
    // (verschiedene Browser/Geräte brauchen unterschiedlich lang)
    [100, 300, 500].forEach(delay => {
        setTimeout(() => {
            if (gameMode) {
                resizeCanvas();
                clampViewport();
            }
        }, delay);
    });
});
```

**Begründung:** Manche Geräte (besonders ältere iPhones) brauchen länger bis der Viewport stabil ist.

---

### Phase 7: PWA Setup

**Neue Datei:** `manifest.json`
```json
{
  "name": "Pocket Heist",
  "short_name": "Pocket Heist",
  "description": "2-Spieler Stealth-Strategiespiel",
  "start_url": "./index.html",
  "scope": "./",
  "display": "standalone",
  "orientation": "any",
  "background_color": "#0a0a0f",
  "theme_color": "#d4af37",
  "icons": [
    {
      "src": "icons/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "icons/icon-512.png",
      "sizes": "512x512",
      "type": "image/png"
    },
    {
      "src": "icons/icon-maskable-512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "maskable"
    }
  ]
}
```

**Neue Datei:** `sw.js`
```javascript
const SW_VERSION = '2.0.0';

self.addEventListener('install', (event) => {
    console.log(`[SW ${SW_VERSION}] Installing`);
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    console.log(`[SW ${SW_VERSION}] Activated`);
    event.waitUntil(self.clients.claim());
});

// Network-First: Immer vom Netzwerk laden, kein Caching
self.addEventListener('fetch', (event) => {
    event.respondWith(
        fetch(event.request).catch(() => {
            // Fallback nur bei Netzwerkfehler
            console.warn(`[SW] Network request failed: ${event.request.url}`);
            return new Response('Offline', { status: 503 });
        })
    );
});
```

**Datei:** `index.html`

**Änderung - Nach Zeile 9 (nach Tone.js Script) einfügen:**
```html
    <!-- PWA -->
    <link rel="manifest" href="manifest.json">
    <meta name="theme-color" content="#d4af37">
    <meta name="apple-mobile-web-app-capable" content="yes">
    <meta name="apple-mobile-web-app-status-bar-style" content="default">
    <link rel="apple-touch-icon" href="icons/icon-192.png">
```

**Datei:** `game.js`

**Änderung - Nach Zeile 2202 (nach `resizeCanvas()` Init) einfügen:**
```javascript
// ==================== SERVICE WORKER ====================
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js?v=' + VERSION)
            .then(reg => {
                console.log(`[App] SW registered, scope: ${reg.scope}`);
            })
            .catch(err => {
                console.warn('[App] SW registration failed:', err);
            });
    });
}
```

**Neue Dateien (manuell erstellen):**
- `icons/icon-192.png` - 192×192px, Hintergrund #0a0a0f, "PH" in #d4af37
- `icons/icon-512.png` - 512×512px, wie oben
- `icons/icon-maskable-512.png` - 512×512px, mit 40% Padding (safe zone)

---

## Vollständige Datei-Änderungen Zusammenfassung

| Datei | Zeilen | Aktion | Beschreibung |
|-------|--------|--------|--------------|
| `index.html` | 4 | Einfügen | Cache-Control Meta-Tags |
| `index.html` | 6 | Ersetzen | Viewport mit viewport-fit=cover |
| `index.html` | 9 | Einfügen | PWA Meta-Tags |
| `index.html` | 10, 145 | Ändern | Version auf 2.0.0 |
| `index.html` | 13-18 | Löschen | Rotate-Hint HTML |
| `style.css` | 254-261 | Ersetzen | 42px → 44px Minimum |
| `style.css` | nach 356 | Einfügen | 44px Minimum für Abilities |
| `style.css` | 491-542 | Löschen | Rotate-Hint CSS |
| `style.css` | vor .hidden | Einfügen | Portrait + Safe Area CSS |
| `game.js` | 4-17 | Ersetzen | Vereinfachtes Versioning |
| `game.js` | 101-107 | Löschen | dismissRotateHint() |
| `game.js` | 2192-2199 | Ersetzen | Verbesserter Orientation Handler |
| `game.js` | nach 2202 | Einfügen | SW Registration |
| `manifest.json` | - | Neu | PWA Manifest |
| `sw.js` | - | Neu | Service Worker |
| `icons/*` | - | Neu | PWA Icons |

---

## Was NICHT geändert wird

- `resizeCanvas()` (Zeilen 477-512) - funktioniert korrekt
- `clampViewport()` (Zeilen 514-527) - funktioniert korrekt
- `getGridPos()` (Zeilen 1278-1301) - holt `getBoundingClientRect()` bereits bei jedem Aufruf
- `render()` - unverändert
- Touch-Handler - unverändert
- Resize-Handler (Zeile 2185-2190) - unverändert

---

## Reihenfolge der Implementierung

1. **Phase 1:** Viewport & Cache Meta-Tags (index.html)
2. **Phase 2:** Rotate-Hint entfernen (index.html, style.css, game.js)
3. **Phase 3:** Cache-Busting vereinfachen (game.js)
4. **Phase 4:** Button-Größen korrigieren (style.css)
5. **Phase 5:** Portrait-Layout (style.css)
6. **Phase 6:** Orientation Handler (game.js)
7. **Phase 7:** PWA Setup (manifest.json, sw.js, icons, index.html, game.js)

---

## Test-Checkliste

### Nach jeder Phase testen:
- [ ] Spiel startet ohne Console-Errors
- [ ] Bestehende Funktionalität unverändert

### Basis-Tests
- [ ] Kein Zoom möglich (Pinch-to-Zoom deaktiviert)
- [ ] Panning funktioniert (1-Finger und 2-Finger)
- [ ] Buttons sind alle mindestens 44×44px

### Portrait-Tests (iPhone SE 375×667)
- [ ] Toolbar horizontal scrollbar am unteren Rand
- [ ] Abilities horizontal zentriert über Toolbar
- [ ] Kein UI-Element abgeschnitten

### Safe Area Tests (iPhone 14+)
- [ ] TopBar nicht unter Dynamic Island
- [ ] Toolbar nicht unter Home Indicator
- [ ] Abilities nicht unter Notch (Landscape)

### PWA-Tests
- [ ] "Add to Home Screen" Option erscheint
- [ ] Icon erscheint korrekt auf Homescreen
- [ ] App startet ohne Browser-UI (standalone)
- [ ] Console zeigt: `[SW 2.0.0] Activated`

### Cache-Busting Test
1. Ändere VERSION in game.js auf '2.0.1'
2. Ändere `?v=` in index.html auf 2.0.1
3. Reload
4. Console sollte zeigen: `Pocket Heist v2.0.1`

---

## Nicht im Scope

- ❌ Offline-Modus / Asset-Caching
- ❌ Push-Notifications
- ❌ Pinch-to-Zoom für Canvas
- ❌ Änderungen an resizeCanvas() oder Koordinaten-Berechnung
- ❌ Änderungen an Touch-Handling
