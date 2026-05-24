# Trollchen

Kaizo-artiges Troll-Jump-'n'-Run. Du läufst zur gelben Tür — und das Level
betrügt dich auf überraschende, aber faire Weise (Spikes poppen auf, Türen
hüpfen weg, Schwerkraft kippt, Steuerung dreht sich um). 24 handgebaute Level
in 4 Stages, plus Level-Editor.

## Architektur

**Single-File.** Alles liegt in `index.html` (~2050 Zeilen): HTML, CSS, ein
einziges `<script>`. Keine Build-Tools, kein Service Worker, keine
Abhängigkeiten. Direkt im Browser öffnen oder über GitHub Pages ausliefern.

Grobe Struktur des Scripts:
- **Audio/Musik** — Web Audio API, generative Synth-SFX + Stage-Musik.
  **Wichtig:** `audio.init()` und `music.start()` rufen `ctx.resume()` auf, weil
  Safari/Chrome den AudioContext per Autoplay-Policy `suspended` starten — das
  muss in einem User-Gesture-Handler passieren (Klick auf „Spielen"/Level).
- **Stimme (`audio.speak(category)`)** — spielt vertonte Troll-Clips aus
  `speech/` statt SpeechSynthesis. Siehe Abschnitt „Vertonte Sprüche". `say()`
  (TTS) bleibt nur als Fallback, wenn eine Kategorie keine Clips hat.
- **`phrases` / `troll()`** — Troll-Vokabular pro Kategorie, mit Deck-Shuffle
  (keine Wiederholung bis Deck leer). `phrases` dient jetzt nur noch als
  TTS-Fallback-Text.
- **Map-Helfer** — `blankMap`, `fillFloor`, `placeFloor`, `placeRow`,
  `placeChar`, `rngRange`.
- **`levels[]`** — die 24 Level-Definitionen (s.u.).
- **Game-Loop** — `loadLevel` → pro Frame: `L.trick()`, Physik, Entities,
  Kollision, Render.
- **Screens** — Menü, Level-Auswahl, Pause, Win, Final, Editor.

## Koordinaten & Tiles

Die Welt ist ein festes Grid: `COLS=18`, `ROWS=32`, `TS=20` px (Canvas 360×640).
Die Map ist ein Array aus `ROWS` Strings à `COLS` Zeichen. Pixel = `col*TS`.

Tile-Zeichen:
- `.` leer
- `1` solider Block
- `2` Spike (tödlich)
- `3` Tür (Ziel)
- `4` zerfallende Plattform (verschwindet 0.8 s nach Berührung)
- `7` Geisterstein (solide, verschwindet beim Berühren — Geisterboden/-treppe)
- `9` solide Variante

`isSolid(ch)` = `1 | 4 | 7 | 9`. Spike `2` und Tür `3` sind **nicht** solide.

## Ein Level definieren

Jeder Eintrag in `levels[]` ist ein Objekt:

```js
{
  name:"...", hint:"...", stage:0,
  build:(rng)=>({ map, spawn:{x,y}, meta:{}, config:{}, entities:[] }),
  trick:(s, rng)=>{ /* läuft JEDEN Frame */ },
  onEnter:(s)=>{}, onExit:(s)=>{},
}
```

- **`build(rng)`** baut die Map. `rng` ist seeded (`mulberry32`), neu pro
  Versuch — `rngRange(rng,lo,hi)` für variierte, aber faire Platzierung.
- **`trick(s, rng)`** ist der Troll-Hook, läuft jeden Frame. Hier Spikes setzen,
  Türen versetzen, Boden bröckeln lassen. Einmalige Trolls über ein Flag in
  `meta` absichern (`if (s.meta.hopped) return;`).
- **`onEnter`/`onExit`** für globale Schalter wie `inputFlip` (Steuerung
  umdrehen) oder `gravityFlip`. **Wichtig:** in `onExit` immer zurücksetzen.
- **`config`** steuert Frame-Mechaniken:
  - `gravityTimer: <s>` — Schwerkraft kippt periodisch
  - `flipOnJump: true` — jeder Sprung kippt die Schwerkraft
  - `driftingDoor: true` — Tür ist ein bewegtes Entity statt Tile
  - `cycleDoors: true` — bei mehreren `3`-Türen teleportiert die aktive beim
    Annähern zur nächsten (Teleport-Troll). **Opt-in!** Ohne dieses Flag sind
    mehrere Türen statisch — nötig z.B. für Schwerkraft-Level mit Boden- UND
    Deckentür.
- **`entities`** — bewegte Objekte: `movingSpike` (pendelt zwischen
  `xMin`/`xMax`), `trackingSpike` (verfolgt den Spieler, `maxSpeed`/`accel`),
  `door` (driftende Tür).

## Troll-Design-Prinzipien

- **Überraschend, aber fair.** Der Spieler soll lachen, nicht den Controller
  werfen. Trolls dürfen überraschen, aber müssen überwindbar sein, sobald man
  sie kennt.
- **Frühe Level (Stage 0): nicht tödlich.** Auf den ersten Leveln sind billige
  Tode unfair. Dort gehören rein kosmetische Schreck-Trolls hin (Tür hüpft
  einmal weg, harmlose Fake-outs), keine sofort tötenden Fallen.
- **Schwierigkeit steigt pro Stage.** Stage 1 Grundlagen → 2 Vertikal →
  3 Bewegung → 4 Wirr (Schwerkraft/Steuerung).

Troll-Sprüche werden über `troll('kategorie', () => audio.sfx())` ausgelöst.
Neue Sprüche in `phrases` ergänzen; Kategorien aktuell: `teleport`, `spike`,
`flip`, `fade`, `move`, `bridge`, plus `death_1..4`, `levelStart`, `win`.

## Vertonte Sprüche

Die Troll-Stimme kommt aus echten Audio-Clips (ElevenLabs) in `speech/`, nicht
mehr aus der Browser-TTS. Dateien sind nach Spiel-Event benannt:
`speech/<kategorie>-NN.mp3` (z.B. `death_3-04.mp3`, `win-01.mp3`).

- Das Manifest `VOICE` (oben bei `audio`) listet pro Kategorie alle Clip-Pfade.
- `audio.speak(category)` wählt per Deck-Shuffle einen Clip, cached das
  `Audio`-Element und spielt es; bei Fehler/leerer Kategorie Fallback auf TTS.
- Kategorien = die Trigger im Spiel: `teleport`, `spike`, `move`, `flip`,
  `fade`, `bridge`, `death_1..4` (eskalierend mit Todeszahl), `win`,
  `levelStart` (gelegentlich beim frischen Betreten eines Levels).
- Ausgelöst über `troll(category, sfx)`, `die()` (via `deathCategory`),
  `winLevel()` und `loadLevel()`.

**Neue Clips hinzufügen:** mp3 in `speech/` legen, mit Whisper transkribieren,
um Inhalt/Kategorie zu bestimmen, dann passend umbenennen und im `VOICE`-Manifest
ergänzen. Whisper-Aufruf (deutsch):

```bash
KMP_DUPLICATE_LIB_OK=TRUE whisper speech/*.mp3 \
  --language German --model base --output_format txt --output_dir /tmp/wspeech
```

Beim Zuordnen den Spielkontext mitdenken — Whisper verhört kurze Interjektionen
gern (z.B. „Peaks!" = *Spikes!*, „Schnella" = *Schneller!*).

## Persistenz & Fortschritt

- `localStorage['trollchen_hs_v3']` — Highscores/Completion pro Level-Index
  (`{completed, bestDeaths, bestTime}`).
- `localStorage['trollchen_custom_v1']` — selbst gebautes Level aus dem Editor.
- **Freischaltung:** Level `i` ist frei, wenn `i===0` oder Level `i-1`
  `completed`. Beim Versionieren der Speicherstruktur den Key-Suffix erhöhen
  (`_v3` → `_v4`).

## Debug

`?debug=1` schaltet **alle** Level frei, unabhängig vom Fortschritt. Der
`DEBUG`-Schalter (oben bei den Konstanten) verzweigt nur die
`unlocked`-Berechnung in `showLevelSelect()` — der `localStorage`-Fortschritt
bleibt unberührt. In der Level-Auswahl erscheint dann „DEBUG: alle frei".

## Konventionen

- Code-Kommentare: Englisch oder Deutsch (gemischt, wie im Bestand).
- Sichtbare Texte/Sprüche: Deutsch.
- Nach Änderungen am `<script>` die Datei kurz im Browser laden und die
  Konsole auf Syntaxfehler prüfen (kein Build-Schritt, der das abfängt).
