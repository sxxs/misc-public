# SOP: Newsjacking

## Wann

Wenn eine aktuelle Nachricht perfekt zur herdom-Perspektive passt und innerhalb von 24 Stunden ein Post raus muss.

## Voraussetzungen

- [ ] Nachricht ist aktuell (max 24h alt, besser unter 12h)
- [ ] Thema hat klaren herdom-Winkel (nicht nur "ist interessant")
- [ ] Remotion-Setup laeuft (`npm install` in `wiai-social/` erledigt)

## Schritte

### 1. Nachricht bewerten

Schnell-Check:

- [ ] Ist die Nachricht relevant fuer Informatik/KI/Bildung/Tech?
- [ ] Kann herdom dazu etwas sagen, das andere nicht sagen?
- [ ] Ist das Thema in 24h noch relevant oder schon vorbei?
- [ ] Wird das Thema auf TikTok diskutiert (Suchfeld pruefen)?

Wenn 3 von 4 Ja: weitermachen. Sonst: ueberspringen.

### 2. Screenshot erstellen

- Artikelueberschrift + Quelle im Browser screenshotten
- Nur die Headline, nicht den ganzen Artikel
- Sauber ausschneiden: keine Werbebanner, kein Browser-Chrome
- Datei speichern als: `pipeline/media/2026-03-27-thema.png`

### 3. Screenshot in Assets kopieren

```bash
cp pipeline/media/2026-03-27-thema.png wiai-social/assets/screenshots/
```

(Beide Orte: `pipeline/media/` ist Archiv, `wiai-social/assets/screenshots/` braucht Remotion zum Rendern)

### 4. JSON erstellen

Datei: `wiai-social/posts/2026-03-27-thema.json`

```json
{
  "id": "2026-03-27-thema",
  "type": "newsjacking",
  "accentColor": "#EF4444",
  "slide1": {
    "image": "./assets/screenshots/2026-03-27-thema.png",
    "bigText": "Reaktion."
  },
  "slide2": {
    "text": "Einordnung.\nWas heisst das wirklich?"
  },
  "slide3": {
    "text": "Punchline.",
    "button": "Optionaler Nachsatz."
  }
}
```

**Typische Farben fuer Newsjacking:**
- `#EF4444` (rot) -- Alarm, kritische Nachricht
- `#3B82F6` (blau) -- Sachliche Einordnung
- `#FACC15` (gelb) -- Wenn der Post eher amuesant ist

**Text-Laengen beachten (aus GUIDE.md):**
- slide2 (fontSize 78): ~18 Zeichen/Zeile
- slide3.text (fontSize 84): ~15 Zeichen/Zeile
- Zeilenumbrueche mit `\n`, Absaetze mit `\n\n`

### 5. In Root.tsx registrieren

Datei: `wiai-social/src/Root.tsx`

```tsx
import themaPost from "../posts/2026-03-27-thema.json";
// ...
{cp("WiaiPost-2026-03-27-thema", themaPost as unknown as Post)}
```

### 6. Schnell-Preview

```bash
./studio.sh
```

Im Studio pruefen:
- Screenshot-Bild in S1: lesbar? Nicht zu klein?
- Chromatic Aberration + Scanlines sehen gut aus?
- S2/S3 Text: passt in die Safe Zones?

### 7. Fast-Track Rendern

```bash
./render.sh posts/2026-03-27-thema.json
```

Output: `out/2026-03-27-thema.mp4` + 3 PNGs + 3 Carousel-Crops

### 8. Sofort posten

Reihenfolge nach Dringlichkeit:
1. **TikTok** (Photo Mode mit Carousel-PNGs, groesste Reichweite, Musik in-App waehlen, Bamberg taggen)
2. **YouTube Shorts** (MP4, SEO-Beschreibung mit News-Keywords)
3. **Instagram Reels** (MP4, Caption + Cover)

Details: siehe SOP Rendern und Posten.

### 9. plan.json aktualisieren

Neuen Eintrag in `pipeline/plan.json`:

```json
{
  "id": "2026-03-27-thema",
  "type": "newsjacking",
  "design": "pixel-wall",
  "status": "published",
  "json": "wiai-social/posts/2026-03-27-thema.json",
  "source": "https://heise.de/artikel/...",
  "targetWeek": null,
  "publishedDate": "2026-03-27",
  "platforms": {
    "tiktok": "https://www.tiktok.com/@herdom.bamberg/video/...",
    "youtube": "https://youtube.com/shorts/...",
    "instagram": "https://www.instagram.com/reel/..."
  },
  "notes": "Newsjacking: [Thema]"
}
```

## Checkliste

- [ ] Nachricht ist aktuell und relevant (3/4 Schnell-Check bestanden)
- [ ] Screenshot erstellt und in `pipeline/media/` + `wiai-social/assets/screenshots/` gespeichert
- [ ] JSON mit `type: "newsjacking"` angelegt
- [ ] Root.tsx: Import + `cp()` eingetragen
- [ ] Studio-Preview: Screenshot lesbar, Text passt, Safe Zones frei
- [ ] Gerendert mit `./render.sh`
- [ ] Auf allen Plattformen gepostet
- [ ] plan.json aktualisiert mit Quell-Link zur Nachricht

## Haeufige Fehler

- **Zu langsam**: Newsjacking lebt von Geschwindigkeit. Wenn der Post erst nach 48h rausgeht, ist die Welle vorbei. Lieber 80% perfekt und schnell als 100% perfekt und zu spaet.
- **Screenshot zu gross**: Nur die Headline screenshotten, nicht den ganzen Artikel. Das Bild muss auf einem Handy-Screen lesbar sein.
- **Keinen eigenen Winkel**: "Spannend, oder?" ist kein Newsjacking. Es braucht eine Einordnung, die nur herdom geben kann.
- **Screenshot nicht in beide Ordner kopiert**: Remotion findet das Bild nur in `wiai-social/assets/screenshots/`. Das Original in `pipeline/media/` ist das Archiv.
- **Quell-Link vergessen**: In `plan.json` immer den `source`-Link zum Original-Artikel speichern. Spaeter weiss man sonst nicht mehr, worauf sich der Post bezieht.
- **Immer Rot**: Nicht jede Nachricht ist ein Alarm. Sachliche Einordnung darf auch blau sein.
