# Pocket Heist - Mobile Verbesserungen Plan

## Kritische Analyse des Codes

### Gefundene Probleme

#### 1. Mobile Viewport (kritisch)
- `user-scalable=no, maximum-scale=1.0` → Zoomen komplett blockiert
- `overflow: hidden` auf body → Scrollen unmöglich
- Rotate-Hint erzwingt Querformat → Auf kleinen Phones problematisch
- Minimum TILE_SIZE von 35px × 20×12 Grid = 700×420px → passt nicht auf alle Smartphones
- Panning nur per 2-Finger oder Shift+Click → unintuitive für Mobile

#### 2. Cache-Busting fehlt komplett
- Keine Versionsnummer
- Kein Reload-Mechanismus für Updates

#### 3. UI-Probleme auf Mobile
- Toolbar: 7 Buttons × 50-60px = 350-420px → überläuft auf schmalen Displays
- Touch-Targets teilweise zu klein
- Ability-Buttons können mit Content überlappen

#### 4. Code-Struktur
- 1500+ Zeilen in einer Datei
- Viele globale Variablen

---

## Implementierungsplan

### ✅ Phase 1: Projekt-Setup (erledigt)
- [x] Neuen Ordner `pocket-heist/` erstellen
- [x] Code in separate Dateien aufteilen (index.html, style.css, game.js)

### ✅ Phase 2: Viewport-Verbesserungen (teilweise erledigt)
- [x] `user-scalable=yes` und `maximum-scale=3.0` erlauben
- [x] Rotate-Hint dismissible machen (Button "Trotzdem spielen")
- [x] Rotate-Hint nur auf sehr kleinen Portrait-Screens zeigen (<500px Höhe)
- [x] Touch-Targets vergrößern und responsive machen

### ✅ Phase 3: Cache-Busting (erledigt)
- [x] VERSION-Konstante am Anfang von game.js
- [x] sessionStorage-basiertes Redirect-System
- [x] Random `v=` Parameter beim Laden der Startseite
- [x] Versionsnummern in HTML-Links (style.css?v=, game.js?v=)

### ✅ Phase 4: Verbessertes Touch-Panning (erledigt)
- [x] 1-Finger-Panning auf Canvas ermöglichen
- [x] Unterscheidung: kurzer Tap = Aktion, Wischen = Pan
- [x] Pan-Hint beim ersten Start anzeigen ("Wischen zum Verschieben")
- [ ] Pinch-to-Zoom für Canvas implementieren (optional)

### ✅ Phase 5: Tile-Size Optimierung (erledigt)
- [x] Dynamischere TILE_SIZE Berechnung
- [x] Minimum Tile-Size auf 28px reduzieren für kleine Screens
- [x] Auto-Zentrierung wenn Grid auf Screen passt
- [x] Sanftes Clamping der Viewport-Grenzen

### 🔄 Phase 6: Weitere Mobile-Optimierungen (optional)
- [ ] Toolbar horizontal scrollbar mit Scroll-Indicator
- [ ] Ability-Buttons Position anpassen bei Überlappung
- [ ] Landscape-Lock Option (optional)

---

## Technische Details

### Cache-Busting Implementierung (wie multiplication-troll-game)
```javascript
const VERSION = '1.0.0';

// Session-based cache busting
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
```

### 1-Finger-Pan Logik
```javascript
// Unterscheidung Tap vs Pan:
// - touchstart: Position merken, Timer starten
// - touchmove: Wenn Bewegung > 10px → Pan-Modus aktivieren
// - touchend: Wenn < 200ms und < 15px Bewegung → als Tap behandeln
```

### Tile-Size Berechnung
```javascript
// Berechne optimale Tile-Size:
// 1. Berechne was auf Screen passt
// 2. Minimum 28px für Touch-Targets
// 3. Wenn Grid passt → zentrieren
// 4. Wenn nicht → Panning erlauben
```

---

## Status

| Phase | Status | Dateien |
|-------|--------|---------|
| Setup | ✅ Erledigt | index.html, style.css |
| Viewport | ✅ Erledigt | index.html, style.css |
| Cache-Busting | ✅ Erledigt | game.js |
| Touch-Panning | ✅ Erledigt | game.js |
| Tile-Size | ✅ Erledigt | game.js |
| Mobile-UI | 🔄 Optional | style.css, game.js |
