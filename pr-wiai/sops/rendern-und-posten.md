# SOP: Rendern und Posten

## Wann

Wenn ein Post im Studio fertig aussieht und auf TikTok, YouTube Shorts und Instagram Reels veroeffentlicht werden soll.

## Voraussetzungen

- [ ] Post-JSON existiert in `wiai-social/posts/`
- [ ] Studio-Preview sieht gut aus (SOP: Neuer Post)
- [ ] Status in `plan.json` ist `"ready"`

## Schritte

### 1. Rendern

```bash
cd wiai-social
./render.sh posts/2026-03-27-survivorship-bias.json
```

Das Script erzeugt automatisch:
- `out/<id>.mp4` -- Video (1080x1920, h264, stumm)
- `out/<id>-slide1.png` / `-slide2.png` / `-slide3.png` -- Story-Stills
- `out/<id>-carousel1.png` / `-carousel2.png` / `-carousel3.png` -- Carousel-Crops (1080x1350)

### 2. Output pruefen

- [ ] MP4 abspielen: Timing stimmt, kein Artefakt, Uebergaenge sauber
- [ ] PNGs oeffnen: Text vollstaendig, keine Abschnitte abgeschnitten
- [ ] Carousel-Crops: Wichtiger Text nicht am Rand abgeschnitten

### 3. TikTok (Photo Mode)

1. TikTok-App oeffnen > **+** > **Foto-Modus**
2. Die 3 Carousel-PNGs hochladen (Reihenfolge: slide1, slide2, slide3)
3. Musik in der App waehlen (trending Sound oder passend zum Thema)
4. Text/Caption schreiben: Hook + relevante Hashtags
5. **Standort**: Bamberg taggen
6. Veroeffentlichen

### 4. YouTube Shorts

1. YouTube Studio > **Erstellen** > **Shorts hochladen**
2. `out/<id>.mp4` hochladen
3. Titel: kurz, SEO-optimiert (Suchbegriffe einbauen)
4. Beschreibung: 2-3 Saetze + relevante Keywords + Link zu wiai25.de
5. Veroeffentlichen

### 5. Instagram Reels

1. Instagram > **+** > **Reel**
2. `out/<id>.mp4` hochladen
3. Caption: Hook-Satz + Hashtags
4. Cover-Bild: slide3-PNG waehlen (Punchline als Thumbnail)
5. Veroeffentlichen

### 6. plan.json aktualisieren

Status und Posting-Daten eintragen (Format + Datum pro Plattform):

```bash
node edit.mjs <id> status=published \
  posted.tiktok.carousel=2026-04-01 \
  posted.youtube.video=2026-04-01 \
  posted.instagram.reel=2026-04-01
```

### 7. Post archivieren

JSON und Renders aus dem aktiven Workspace entfernen:

```bash
cd wiai-social && ./archive-post.sh <post-id>
# → posts/archive/posted/ + out/archive/
# Restaurieren: cp posts/archive/posted/<id>.json posts/ && node ../sync-root.mjs
```

## Checkliste

- [ ] `./render.sh` erfolgreich durchgelaufen
- [ ] MP4 + 3 PNGs + 3 Carousel-Crops vorhanden
- [ ] Video und Bilder visuell geprueft
- [ ] TikTok: hochgeladen, Musik gewaehlt, Bamberg getaggt
- [ ] YouTube Shorts: hochgeladen, SEO-Beschreibung geschrieben
- [ ] Instagram Reels: hochgeladen, Caption + Cover gesetzt
- [ ] `plan.json`: status `"published"`, posted-Daten eingetragen (Format + Datum pro Plattform)
- [ ] `archive-post.sh` ausgefuehrt (JSON + Renders archiviert)

## Haeufige Fehler

- **Render bricht ab**: Meistens hat die JSON-Datei einen Syntaxfehler. Root.tsx wird automatisch synchronisiert (sync-root.mjs). Fehlermeldung im Terminal lesen.
- **Video ohne Ton**: Das ist korrekt -- `render.sh` rendert mit `--muted`. Musik kommt bei TikTok aus der App, bei YouTube/Instagram ist das Video stumm (gewollt: Carousel-Stil).
- **Falscher Dateiname**: `render.sh` erwartet den Pfad relativ zu `wiai-social/`, also `posts/datei.json`, nicht den absoluten Pfad.
- **Carousel-Reihenfolge**: Immer slide1, slide2, slide3 -- sonst stimmt der Erzaehlbogen nicht.
- **posted-Daten vergessen**: Ohne `posted`-Feld in plan.json laesst sich spaeter nicht nachvollziehen, was wann wo gepostet wurde. Wichtig fuer Repost-Abstaende.
- **TikTok ohne Standort**: Bamberg-Tag erhoet die lokale Sichtbarkeit deutlich. Nicht vergessen.
