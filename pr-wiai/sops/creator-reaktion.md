# SOP: Creator-Reaktion (Stitch/Duett)

## Wann

Ein TikTok-Creator mit Reichweite hat ueber ein WIAI-relevantes Thema gesprochen. Reaktion muss innerhalb von 24-48 Stunden kommen.

## Voraussetzungen

- [ ] Original-Video ist maximal 48h alt
- [ ] Thema passt zum Kanal (IT-Sicherheit, Datenschutz, KI, Studium, Karriere)
- [ ] Du hast einen echten Kommentar, nicht nur "stimmt"

## Monitoring-Kategorien

| Kategorie | Beispiele | Trigger-Themen |
|-----------|-----------|----------------|
| Tech-Erklaer | Breaking Lab, Simplicissimus, MrWissen2go | KI, Datenschutz, Tech-Fails |
| Karriere/Bildung | StudySmarter, Finanzfluss | Gehalt, Studium vs. Ausbildung |
| News-nativ | tagesschau (TikTok), ZDF heute, funk | Datenskandale, KI-Regulierung |
| Gaming | Grosse Gaming-Creator | Anti-Cheat, Lootboxen, Algorithmus |
| Meta/Social Media | Creator ueber TikTok-Algorithmus | Tracking, Suchtmechanismen |

## Schritte

1. **Relevanz pruefen** — Passt das zum herdom-Ton? Kann ich etwas sagen das nur jemand in meiner Position sagen kann?

2. **Reaktion planen** — Max. 15 Sekunden, ein Punkt:
   - Fachliche Einordnung ("Das ist uebrigens...")
   - Gegenposition ("Stimmt, aber...")
   - Selbstzerstoerung ("Ich bin Prof dafuer und...")
   - NICHT: Vorlesung halten, belehren, korrigieren

3. **In TikTok-App aufnehmen** — Stitch oder Duett, nicht ueber Remotion:
   - Stitch: Original-Clip + deine Reaktion
   - Duett: Side-by-side (selten, nur wenn visuell sinnvoll)

4. **Posten** — Bamberg-Location taggen, relevante Hashtags

5. **In plan.json loggen** — Als neuen Post-Eintrag:
   ```json
   {
     "id": "stitch-2026-03-28-thema",
     "type": "stitch",
     "design": "app-native",
     "status": "published",
     "json": null,
     "source": null,
     "targetWeek": null,
     "publishedDate": "2026-03-28",
     "platforms": { "tiktok": "https://..." },
     "notes": "Stitch auf @creator - Thema XY"
   }
   ```

## Haeufige Fehler

- Zu spaet reagiert (>48h) — Relevanzfenster verpasst
- Zu lang (>15s) — Zuschauer scrollen weiter
- Belehrend statt kommentierend — "Ich als Prof erklaere euch mal..." ist der falsche Ton
- Ohne echten Punkt — Nur reagieren um zu reagieren bringt nichts
