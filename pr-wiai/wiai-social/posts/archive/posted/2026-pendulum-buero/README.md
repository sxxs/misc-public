# 2026-pendulum-buero

One-off Pendulum-Wave-Animation, gepostet Sonntag 2026-04-19 (KW16 Slot 6)
auf TikTok, Instagram und YouTube Shorts.

**Framing:** POV: Ich räume mein Büro auf. / Ordnung. Zumindest kurz.
15s perfect loop. 16 Pendel, alle 15s kurzer Sync — Zahlentheorie als Choreografie.

## Dateien in dieser Kapsel

| Datei | Zweck |
|---|---|
| `Pendulum.tsx` | Remotion-Composition (Canvas + Captions + Wordmark + Audio-Wiring) |
| `render-pendulum-audio.mjs` | Offline-Audio-Renderer: Drone + Ticks → WAV |
| `pendulum-ticks.wav` | Pre-rendered 15s-Audio-Loop |
| `2026-pendulum-buero.mp4` | Final-Render, 1080×1920, 15s |
| `pendulum-source.jsx` | Ursprünglicher React/Canvas-Prototyp (Web Audio live) |
| `pendulum-design-notes.md` | Design-Diskussion: Skript-Varianten, Audio-Entscheidungen |

## Zum Regenerieren / Neurendern

```bash
cd wiai-social

# 1. Composition zurück ins Live-Verzeichnis
cp posts/archive/posted/2026-pendulum-buero/Pendulum.tsx src/compositions/Pendulum.tsx

# 2. Audio-Script + WAV zurück
cp posts/archive/posted/2026-pendulum-buero/render-pendulum-audio.mjs scripts/
cp posts/archive/posted/2026-pendulum-buero/pendulum-ticks.wav assets/music/

# 3. Composition in Root.tsx registrieren (manuell, NICHT via sync-root):
#
#    import { Pendulum } from "./compositions/Pendulum";
#    ...
#    <Composition
#      id="2026-pendulum-buero"
#      component={Pendulum}
#      durationInFrames={450}
#      {...S}
#    />

# 4. Rendern
npx remotion render src/index.ts "2026-pendulum-buero" \
  --output=./out/2026-pendulum-buero.mp4 \
  --codec=h264 --crf=18 --pixel-format=yuv420p

# 5. Audio neu generieren (falls Parameter geändert)
node scripts/render-pendulum-audio.mjs
```

## Besonderheiten

- **Kein JSON-Post:** Composition ist direkt in Root.tsx registriert, nicht über
  `sync-root.mjs` oder `export-post.mjs`. Deshalb nicht auf das Standard-
  Archivierungs-Skript `archive-post.sh` verlassen.
- **Audio deterministisch, loop-sicher:** Script rendert 30s, nimmt zweite Hälfte —
  damit Tick-Decays vom Pre-Loop-Tail nahtlos in den Loop-Start blenden.
- **Drone peakt am Sync-Moment:** 15s-Cosinus-Swell phasengleich mit den visuellen
  Sync-Momenten (t=0, t=15). Füllt die akustische Stille dort, wo alle Pendel
  an den Extremen sind und keine Ticks feuern.
- **Ghost-Trail ohne State:** Remotion rendert jeden Frame isoliert — Trails
  werden deterministisch durch Rückwärtssampling von `computeBobs(t - k·Δt)`
  rekonstruiert, kein persistenter Canvas-Puffer.
