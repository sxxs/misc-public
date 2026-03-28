# SOP: Creator-Reaktion (Stitch/Duett)

## Wann

Wenn ein relevantes Creator-Video auf TikTok auftaucht, auf das herdom mit einem Stitch oder Duett reagieren kann.

## Voraussetzungen

- [ ] TikTok-App mit @herdom.bamberg eingeloggt
- [ ] Originalvideo erlaubt Stitch/Duett (Einstellung des Creators)
- [ ] Video ist nicht aelter als 48 Stunden (Timing-Fenster)

## Schritte

### 1. Video identifizieren

Beim FYP-Scan oder gezielter Suche nach relevanten Videos schauen. Kategorien:

| Kategorie | Beispiel | Reaktions-Ansatz |
|-----------|----------|-----------------|
| Tech-Erklaer | Breaking Lab, Simplicissimus, MrWissen2go | Ergaenzen, korrigieren, Praxis-Beispiel |
| Karriere/Bildung | StudySmarter, Finanzfluss | Gegenperspektive, eigene Erfahrung |
| News-nativ | tagesschau (TikTok), ZDF heute, funk | Einordnung aus Forschungssicht |
| Gaming | Grosse Gaming-Creator | Informatik-Bruecke schlagen (Anti-Cheat, Lootboxen, Algorithmus) |
| Meta/Social Media | Creator ueber TikTok-Algorithmus | Bestaetigen mit Fachwissen (Tracking, Suchtmechanismen) |

### 2. Timing pruefen

- **Ideal**: Innerhalb von 24 Stunden nach Upload des Originals
- **Noch ok**: Bis 48 Stunden
- **Zu spaet**: Ueber 48 Stunden -- dann lieber eigenen Post machen

### 3. Reaktion planen

**Wichtig**: Stitch/Duett ist Gespraech, keine Vorlesung.

- Was ist der herdom-Winkel? (Dekan, Forscher, Mensch -- nicht Professor-erklaert-die-Welt)
- Maximal 1 Punkt machen, nicht 3
- Eigene Meinung > Fakten-Aufzaehlung
- Moegliche Ansaetze:
  - Fachliche Einordnung ("Das ist uebrigens...")
  - Gegenposition ("Stimmt, aber...")
  - Selbstzerstoerung ("Ich bin Prof dafuer und...")
- Ton: locker, direkt, ggf. selbstironisch
- Laenge: 15-30 Sekunden eigener Teil (insgesamt mit Stitch unter 60s)

### 4. In TikTok aufnehmen

**Stitch/Duett wird direkt in der TikTok-App aufgenommen, NICHT ueber Remotion.**

1. Video oeffnen > **Teilen** > **Stitch** (oder **Duett**)
2. Relevanten Ausschnitt waehlen (bei Stitch: max 5 Sekunden)
3. Eigenen Teil aufnehmen
4. Kein Skript ablesen -- frei sprechen
5. Caption + Hashtags ergaenzen
6. Standort: Bamberg
7. Veroeffentlichen

### 5. In plan.json loggen

Neuen Eintrag in `pipeline/plan.json` erstellen:

```json
{
  "id": "2026-03-27-stitch-creator-xy",
  "type": "stitch",
  "design": null,
  "status": "published",
  "json": null,
  "source": "https://www.tiktok.com/@creator/video/...",
  "targetWeek": null,
  "publishedDate": "2026-03-27",
  "platforms": {
    "tiktok": "https://www.tiktok.com/@herdom.bamberg/video/..."
  },
  "notes": "Stitch auf @creator zum Thema XY"
}
```

## Checkliste

- [ ] Video ist relevant fuer herdom-Perspektive
- [ ] Stitch/Duett ist erlaubt
- [ ] Timing-Fenster passt (unter 48h)
- [ ] Reaktion geplant: 1 Punkt, eigener Winkel, kein Dozenten-Ton
- [ ] In TikTok-App aufgenommen und veroeffentlicht
- [ ] Bamberg als Standort getaggt
- [ ] In `plan.json` geloggt mit Quell-Link

## Haeufige Fehler

- **Dozenten-Modus**: "Also, das ist fachlich so..." -- Stitch ist kein Hoersaal. Sprich wie ein Mensch, nicht wie ein Lehrbuch.
- **Zu viel wollen**: Ein Stitch, ein Punkt. Nicht drei Argumente in 20 Sekunden quetschen.
- **Zu lang**: Ueber 30 Sekunden eigener Teil und die Zuschauer scrollen weiter.
- **Timing verpasst**: Ein Stitch auf ein 5 Tage altes Video bringt nichts. Dann lieber eigenen Post.
- **Nur reagieren, nie initiieren**: Stitches sind Ergaenzung zum regulaeren Content, kein Ersatz. Verhaeltnis: max 1 Stitch auf 3 eigene Posts.
- **Original nicht verlinken**: In plan.json immer den `source`-Link zum Originalvideo speichern.
