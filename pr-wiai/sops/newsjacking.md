# SOP: Newsjacking

## Wann

Ein Nachrichtenereignis zu IT-Sicherheit, Datenschutz oder KI ist aktuell und eignet sich fuer einen lakonischen Kommentar. Gleicher Tag oder naechster Tag.

## Voraussetzungen

- [ ] Nachricht ist aktuell (max. 24-48h alt)
- [ ] Thema hat Bezug zu IT-Sicherheit, Datenschutz, KI oder Digitalpolitik
- [ ] Du hast eine Reaktion die in 1-3 Woerter passt ("Ach.", "Tja.", "Schon wieder.")

## Schritte

1. **Screenshot erstellen** — Headline der Nachricht screenshotten (Spiegel, Heise, Tagesschau, etc.)
   - Sauber ausschneiden, nur Headline + Quelle
   - Format: ~1080x600px

2. **Screenshot speichern** —
   ```
   pipeline/media/<id>.png
   wiai-social/assets/screenshots/<id>.png
   ```
   (Beide Orte: einmal fuer Archiv, einmal fuer Remotion)

3. **JSON erstellen** — `wiai-social/posts/2026-MM-DD-<stichwort>.json`:
   ```json
   {
     "id": "2026-03-28-datenskandal",
     "type": "newsjacking",
     "category": "SECURITY",
     "accentColor": "#EF4444",
     "slide1": {
       "image": "./assets/screenshots/<id>.png",
       "bigText": "Ach.",
       "smallText": "Kurzer Kontext-Satz."
     },
     "slide2": {
       "text": "Punchline Zeile 1.\nZeile 2.\nZeile 3."
     },
     "slide3": {
       "text": "Kurzer Closer.",
       "button": "Optional: trockener Kommentar."
     }
   }
   ```

   Kategorie-Optionen: `SECURITY`, `KI`, `DATENSCHUTZ`, `POLITIK`

4. **In Root.tsx registrieren** — Import + `cp()`-Aufruf (wie in `sops/neuer-post.md`)

5. **Rendern + Posten** — Fast-Track:
   ```bash
   cd wiai-social && ./render.sh posts/2026-03-28-datenskandal.json
   ```
   Dann direkt `sops/rendern-und-posten.md` ab Schritt 3.

6. **plan.json aktualisieren** — Post eintragen mit Status `published`

## Checkliste

- [ ] Screenshot sauber (keine Werbebanner, kein Browser-Chrome)
- [ ] Reaktion ist lakonisch, nicht erklaerend
- [ ] Gerendert und visuell geprueft
- [ ] Auf allen 3 Plattformen gepostet
- [ ] plan.json aktualisiert

## Haeufige Fehler

- Zu viel Erklaerung auf Slide 2 — Newsjacking lebt vom lakonischen Kommentar, nicht von der Analyse
- Screenshot mit Copyright-Problemen — nur die Headline, nicht den ganzen Artikel
- Zu spaet — nach 48h ist die News kalt, dann lieber lassen
- Thema zu weit vom Kanal-Kern — nicht jede Nachricht braucht einen Kommentar
