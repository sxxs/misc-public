# SOP: Neuer Post erstellen

## Kurzversion

```bash
# 1. Pipeline-UI oder edit.mjs: Post anlegen, Content schreiben
node pipeline/server.mjs                    # → http://localhost:3847
node edit.mjs --new <id> type=T design=D topic=T content.act1Setup="..."

# 2. Exportieren (plan.json → Remotion JSON):
node export-post.mjs <post-id>
#    → schreibt wiai-social/posts/<id>.json
#    → setzt status=ready in plan.json

# 3. Vorschau (sync-root laeuft automatisch):
cd wiai-social && npm run preview

# 4. Rendern:
cd wiai-social && ./render.sh posts/<id>.json
#    → out/<id>.mp4 + Slide-PNGs + Carousel-PNGs

# 5. Posten: siehe sops/rendern-und-posten.md
```

## Voraussetzungen

- Node.js installiert, `npm install` in `wiai-social/` ausgefuehrt
- Idee in `pipeline/entwuerfe/` oder plan.json vorhanden

## Schritte

### 1. Idee waehlen

In `pipeline/entwuerfe/` oder der Pipeline-UI die passende Idee finden. Alternativ direkt ueber `edit.mjs --new` anlegen.

### 2. Exportieren

```bash
node export-post.mjs --list    # zeigt alle exportierbaren Posts
node export-post.mjs <post-id> # erzeugt JSON, setzt status=ready
```

Das Script erstellt `wiai-social/posts/<id>.json` aus den plan.json-Daten. Root.tsx wird automatisch beim Preview/Render aktualisiert (via `sync-root.mjs`).

### 3. Preview im Studio

```bash
cd wiai-social && npm run preview
```

- Composition im Dropdown links auswaehlen (`WiaiPost-<id>`)
- Alle Slides durchscrubben
- Textlaengen kontrollieren: kein Abschneiden, kein Ueberlauf

### 4. Rendern

```bash
cd wiai-social && ./render.sh posts/<id>.json
```

## Checkliste

- [ ] Content in plan.json vollstaendig (act1Setup, act2, act3, aside)
- [ ] `export-post.mjs` erfolgreich (JSON in posts/)
- [ ] Studio-Preview: alle Slides ok, Text lesbar
- [ ] `plan.json`: status=ready, json-Pfad gesetzt

## Haeufige Fehler

- **JSON-Syntaxfehler**: Studio zeigt nichts an. Fehlermeldung im Terminal lesen.
- **id-Mismatch**: `id` im JSON muss zum Dateinamen passen.
- **Textlaenge**: Zu langer Text in act2/act3 wird abgeschnitten. In der Preview pruefen.
