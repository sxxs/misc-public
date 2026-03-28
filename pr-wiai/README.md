# @herdom.bamberg — Content Pipeline

Social-Media-Kanal der Fakultaet WIAI, Uni Bamberg. Persoenlicher Account von Dominik Herrmann.
Faceless, text-driven, schwarz-dominant. TikTok (primaer), YouTube Shorts, Instagram Reels.

## Quickstart

```bash
# Digest: aktueller Stand der Pipeline
node digest.mjs

# Swimlane-Kalender starten
node pipeline/server.mjs
# → http://localhost:3847

# Remotion-Preview
cd wiai-social && npm run preview

# Post rendern
cd wiai-social && ./render.sh posts/2026-post-id.json
```

## Verzeichnisstruktur

```
pr-wiai/
├── pipeline/              Redaktionspipeline
│   ├── plan.json          Zentrale Planungsdatei (Status, Zielwochen)
│   ├── server.mjs         Swimlane-Kalender Webserver
│   ├── ui/                Web-UI Frontend
│   ├── ideen/             Stufe 1: Rohideen, Stoffsammlungen (#stark/#geht/#nein)
│   ├── entwuerfe/         Stufe 2: Post-Pool (216 Varianten, Bulk-Editing)
│   └── media/             Bilder und Anhaenge
│
├── referenz/              Kanal-Definition (konsolidiert)
│   ├── kanal-prinzipien.md
│   ├── ton-und-stil.md
│   ├── design-system.md
│   ├── format-katalog.md
│   └── zielgruppen.md
│
├── sops/                  Standard Operating Procedures
│   ├── neuer-post.md      Idee → JSON
│   ├── rendern-und-posten.md
│   ├── wochenreview.md
│   ├── creator-reaktion.md
│   └── newsjacking.md
│
├── strategie/             Aktive Strategie-Dokumente
│   ├── strategie-v2.md    Die massgebliche Strategie
│   ├── diskussion.md      Diskussionsnotizen
│   └── ueberlegungen-formate.md
│
├── archiv/                Historische Dateien (Tournaments, alte PRDs)
│
├── wiai-social/           Remotion Video-Pipeline
│   ├── posts/             JSON-Dateien (1 pro Post)
│   ├── src/               Compositions, Components
│   ├── render.sh          Render-Script
│   ├── GUIDE.md           Post-Erstellungsanleitung
│   └── CONTENT.md         Content-Referenz
│
├── digest.mjs             Pipeline-Status auf einen Blick
└── README.md              (diese Datei)
```

## Pipeline-Stufen

| Stufe | Verzeichnis | Beschreibung |
|-------|-------------|--------------|
| 1. Ideen | `pipeline/ideen/` | Rohmaterial mit #stark/#geht/#nein Tags |
| 2. Entwuerfe | `pipeline/entwuerfe/` | Ausformulierte Posts mit Varianten |
| 3. Ready | `wiai-social/posts/` | JSON existiert, Remotion-Preview gemacht |
| 4. Eingeplant | plan.json `targetWeek` | Zieldatum gesetzt |
| 5. Veroeffentlicht | plan.json `published` | Gepostet mit Datum und Links |

Status wird in `pipeline/plan.json` getrackt, nicht durch Verschieben von Dateien.

## Workflow

Siehe `sops/` fuer detaillierte Anleitungen:
- **Neuer Post**: `sops/neuer-post.md`
- **Rendern + Posten**: `sops/rendern-und-posten.md`
- **Wochenreview**: `sops/wochenreview.md`
- **Creator-Reaktion**: `sops/creator-reaktion.md`
- **Newsjacking**: `sops/newsjacking.md`
