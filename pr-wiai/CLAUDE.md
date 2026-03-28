# @herdom.bamberg — Content Pipeline

Social-Media-Kanal (TikTok, YouTube Shorts, Instagram Reels) der Fakultaet WIAI, Uni Bamberg. Persoenlicher Account von Dominik Herrmann (@herdom). Faceless, text-driven, schwarz-dominant mit WIAI-Gelb als Akzent.

## Schnelleinstieg

```bash
node digest.mjs              # Pipeline-Status auf einen Blick
node pipeline/server.mjs     # Swimlane-Kalender → http://localhost:3847
cd wiai-social && npm run preview  # Remotion Studio
```

## Verzeichnisstruktur

```
pr-wiai/
├── pipeline/              Redaktionspipeline
│   ├── plan.json          ZENTRAL: Status aller Posts (ready/scheduled/published)
│   ├── server.mjs         Swimlane-Kalender Webserver
│   ├── ui/                Web-UI Frontend (app.js, index.html)
│   ├── ideen/             Stufe 1: Stoffsammlungen mit #stark/#geht/#nein Tags
│   ├── entwuerfe/         Stufe 2: Post-Pool (216 Varianten, Bulk-Editing in MD)
│   └── media/             Bilder pro Post
├── referenz/              Konsolidierte Kanal-Definition
│   ├── kanal-prinzipien.md   Identitaet, 90/10-Regel, Variable Reward
│   ├── ton-und-stil.md       Loriot+IT-Security, herdom-Filter, Share-Impulse
│   ├── design-system.md      Farben, Fonts, Pixel Wall/Terminal/Billboard
│   ├── format-katalog.md     Alle Post-Typen mit Beispielen
│   └── zielgruppen.md        Audiences, saisonale Planung
├── sops/                  Standard Operating Procedures
├── strategie/             Aktive Strategie-Dokumente
│   ├── strategie-v2.md    Die massgebliche Strategie
│   └── diskussion.md      Diskussionsnotizen (Launch-Mix, Creator-Reaktionen)
├── archiv/                Historisch (Tournaments, alte PRDs) — nicht loeschen
├── wiai-social/           Remotion Video-Pipeline
│   ├── posts/*.json       1 JSON pro Post (Produktionswahrheit)
│   ├── src/Root.tsx        Alle Posts hier registriert (import + cp())
│   ├── render.sh          Video + PNG rendern
│   ├── GUIDE.md           JSON-Felder, Timing, Zeichenlaengen
│   └── CONTENT.md         Post-Typen, Farb-Palette, Durations
├── digest.mjs             CLI: Pipeline-Zusammenfassung
├── export-post.mjs        Post exportieren: plan.json → Remotion JSON + Root.tsx
├── import-ideas.mjs       Ideen/Drafts aus Markdown → plan.json importieren
└── README.md              Projektuebersicht
```

## Wichtige Konventionen

### Pipeline-Stufen
Status wird in `plan.json` getrackt, NICHT durch Verschieben von Dateien:
- `ready` — JSON existiert, noch kein Datum
- `scheduled` — JSON + Zieldatum (targetWeek) gesetzt
- `published` — gepostet, Datum + Plattform-Links eingetragen

### Duale Datenhaltung
- **Planung**: Markdown in `pipeline/entwuerfe/` (viele Varianten pro Datei, Bulk-Editing)
- **Produktion**: JSON in `wiai-social/posts/` (eine gewaehlte Variante, Remotion-Input)
- Beide koexistieren. JSON ist die Produktionswahrheit. Im Markdown wird die gewaehlte Variante mit `[JSON: dateiname.json]` annotiert.

### Neuen Post erstellen
1. Text in `pipeline/entwuerfe/<format>.md` schreiben
2. JSON in `wiai-social/posts/2026-<id>.json` anlegen
3. In `wiai-social/src/Root.tsx` registrieren: `import` + `cp("WiaiPost-<id>", post)`
4. `plan.json` aktualisieren
5. Details: `sops/neuer-post.md`

### Post rendern
```bash
cd wiai-social && ./render.sh posts/2026-<id>.json
# → out/<id>.mp4 + 3 Slide-PNGs + 3 Carousel-PNGs
```

## Content-Prinzipien (Kurzfassung)

- **Ton**: "Loriot trifft IT-Sicherheit, produziert von Kafka." Trocken, lakonisch, selbstironisch.
- **herdom-Filter**: "Kann nur jemand in dieser Position das sagen?" Wenn nein → raus.
- **90/10-Regel**: Max 10% der Posts mit explizitem WIAI/Bamberg-Bezug. Die Sichtbarkeit entsteht durchs Wasserzeichen (@herdom.bamberg), nicht durch die Botschaft.
- **Variable Reward Schedule**: Nie zwei Posts gleichen Typs hintereinander.
- **Naehkaestchen**: Kat. A (uni-intern) sparsam, Kat. B (universelle Tech-Absurditaet) oefter.
- **KI-Posts**: Vorsicht, altern schnell. Nur wenn zeitlos formulierbar.
- **Konkurrenten**: Nie namentlich kritisieren. System beschreiben, nicht Institutionen.

## Tag-Kalibrierung (Stoffsammlungen)

In den Ideen-Dateien (`pipeline/ideen/`) bedeuten die Tags:
- **#stark** — scharf, einzigartig, shareable, nur-herdom
- **#geht** — brauchbar, braucht Schliff oder Komprimierung
- **#nein** — zu generisch, zu inside, altert schnell, kein herdom-Winkel
- **#zugenerisch** — koennte jeder Comedy-Account posten
- **#doppelt** — existiert schon im Post-Pool oder als JSON

Dominiks Kalibrierung ist STRENGER als erwartet. Viele Beobachtungen die "interessant" klingen werden #nein weil: zu inside-baseball fuer Schueler, zu erklaerend, oder fehlender Digital/Tech-Bezug.

## Sprache

- Code und Dateinamen: Englisch (bzw. ASCII-safe Deutsch ohne Umlaute)
- User-facing Text in Posts: Deutsch
- Commit Messages: Englisch
- SOPs und Referenz-Docs: Deutsch
- Wir sind per du
