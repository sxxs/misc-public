# @herdom.bamberg — Content Pipeline

Social-Media-Kanal (TikTok, YouTube Shorts, Instagram Reels) der Fakultaet WIAI, Uni Bamberg. Persoenlicher Account von Dominik Herrmann (@herdom). Faceless, text-driven, schwarz-dominant mit WIAI-Gelb als Akzent.

## Schnelleinstieg

```bash
bash digest.sh               # Pipeline-Status auf einen Blick
node edit.mjs --week 2026-KW14  # Posts einer Woche anzeigen
node edit.mjs netflix            # Post anzeigen (fuzzy ID match)
node edit.mjs netflix content.act2="Neuer Text"  # Felder setzen
node edit.mjs --new <id> type=T design=D topic=T  # Neuen Post anlegen
node pipeline/server.mjs     # Swimlane-Kalender → http://localhost:3847
cd wiai-social && npm run preview  # Remotion Studio
```

## Verzeichnisstruktur

```
pr-wiai/
├── pipeline/              Redaktionspipeline
│   ├── plan.json          ZENTRAL: Status aller Posts (ready/published) + Planung (targetWeek)
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
├── edit.mjs               CLI: Posts anzeigen, suchen, editieren (Dot-Notation)
├── digest.mjs             CLI: Pipeline-Zusammenfassung
├── export-post.mjs        Post exportieren: plan.json → Remotion JSON + Root.tsx
├── import-ideas.mjs       Ideen/Drafts aus Markdown → plan.json importieren
└── README.md              Projektuebersicht
```

## Datenmodell (plan.json)

Jeder Post hat drei unabhaengige Dimensionen. NIEMALS plan.json from scratch generieren — enthält handkurierte Labels fuer 400+ Posts.

### Content-Type (rhetorischer Ansatz — WIE es gesagt wird)
`contrarian` Gegenposition, "Es wird ja immer gesagt..." | `merkste-selber` Denkanstoß → explizites "Oder?" am Schluss | `stimmt-eigentlich` Du-Ansprache, beobachtbare Wahrheit, keine explizite Moral — Leser zieht Schluss selbst | `aphorismus` Kurze Beobachtung, keine Moral | `wusstest-du` Erklaerung, Fakten | `parodie` Clickbait/Marketing entlarven | `overselling` Absurde Marketing-Parallelen | `nachtgedanke` 23-Uhr-Gedanke, verletzlich | `nahkastchen` Persoenliche Anekdote, kafkaesk | `selbstironie` Kanal/Dekan macht sich laecherlich | `newsjacking` Aktuelle News + Kommentar | `stitch` Reaction-Video | `witz` Witz

### Visual Design (WIE es aussieht)
`pixel-wall` LED-Raster, 3 Slides, Glitch-Effekte, Musik | `billboard` Schwarz-weiß, große Typo, plakativ | `terminal` Monospace, CRT-Scanlines, Typing-Animation | `newsjacking` Screenshot + Halftone | `raw-photo` Foto-basiert, Pixelation/Saturierung-Effekte

Design bestimmt den Remotion-Kompositionstyp beim Export:
- pixel-wall → Remotion `led-wall` (ehemals `contrarian`)
- billboard → Remotion `billboard`
- terminal → Remotion `terminal`

### Thema / Topic (WORUM es inhaltlich geht)
`tech` Informatik-Konzepte, KI | `datenschutz` Privacy, Tracking | `studium` Studienalltag | `karriere` Jobmarkt, Gehalt | `identitaet` "Passt CS zu mir?", Schwellenangst | `manipulation` Aufmerksamkeits-Engineering, Gaming-Psychologie | `erwachsenwerden` Adulting, Generationenwechsel | `alltag` Tech-Absurditaet Kat. B | `uni` Uni-Buerokratie Kat. A | `social-media` Algorithmen, Plattformen | `ertappt` Denkfehler, Bias | `wiai-ad` Explizite WIAI-Werbung | `meta` Kanal reflektiert sich

### Dashboard (Pipeline-UI)
Zwei Modi: **PLAN** (4 Wochen operativ, Drag-Drop) und **MIX** (26 Wochen, Typ- + Design-Quadrate, Topic-Keywords, Wochen-Notizen). Detail-Panel zeigt design-abhaengige Felder.

### Slide-Felder je Design
- **Pixel-Wall**: bigText (Reaktionswort) + smallText (Zitat) + s2 (Argument) + s3 (Punchline) + button/uebrigens
- **Billboard**: bigText (Hook) + s2 (Argument) + s3 (Punchline) + button/uebrigens
- **Terminal**: bigText (Prompt, z.B. "$ 23:47") + smallText (Text Teil 1) + s2 (Text Teil 2) + s3 (Schlusszeile), terminalColor (green/amber/white)
- **Raw-Photo**: bigText (Text-Overlay), Rest in notes (Foto-Beschreibung, Effekt)

## Wichtige Konventionen

### Pipeline-Stufen
Status (Produktionsreife) und Planung (Terminierung) sind zwei unabhaengige Dimensionen in `plan.json`:

**Status** (`status`-Feld) — Produktionsreife, NICHT durch Verschieben von Dateien:
- `idea` — Text-Entwurf, noch nicht produktionsreif
- `draft` — Ausformuliert, braucht Review
- `ready` — Produktionsreif (JSON exportiert, renderbar)
- `published` — gepostet, Datum + Plattform-Links eingetragen

**Planung** (`targetWeek`-Feld) — Terminierung, orthogonal zum Status:
- `null` — noch nicht eingeplant (Backlog)
- `"2026-KW15"` — fuer diese Woche eingeplant
- Ein Post kann `draft` sein und trotzdem eine targetWeek haben (= eingeplant, aber noch nicht produktionsreif)

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

### Posts editieren (edit.mjs)

CLI-Tool zum Anzeigen, Suchen, Editieren und Erstellen von plan.json-Posts. Bevorzugtes Werkzeug fuer alle plan.json-Aenderungen — ersetzt manuelle JSON-Edits.

```bash
# Anzeigen
node edit.mjs <id>                      # Post anzeigen (fuzzy ID match)
node edit.mjs --week 2026-KW14          # Alle Posts einer Woche
node edit.mjs --find datenschutz         # Suche in id, type, design, topic, content
node edit.mjs --status ready             # Alle Posts mit Status

# Editieren (beliebig viele Felder pro Aufruf)
node edit.mjs <id> field=value           # Top-Level-Feld setzen
node edit.mjs <id> content.act2="Text"   # Verschachtelt via Dot-Notation
node edit.mjs <id> social.tiktok.caption="..." social.tiktok.hashtags="..."
node edit.mjs <id> targetWeek=2026-KW15 slotIndex=3   # Post verschieben
node edit.mjs <id> field=null            # Feld entfernen

# Neuen Post erstellen (type, design, topic sind Pflicht)
node edit.mjs --new <id> type=<type> design=<design> topic=<topic> [field=value ...]
node edit.mjs --new foto-test type=aphorismus design=raw-photo topic=studium notes="Foto: ..."
node edit.mjs --new my-post type=contrarian design=pixel-wall topic=tech content.act1Setup="Hook"
```

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
