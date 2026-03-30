# Handoff: `plan.json` semantisch klar machen

Ziel dieses Dokuments: Eine neue Session soll die Content-Pipeline so umbauen, dass `pipeline/plan.json` aus Autorensicht semantisch verständlich ist und Export/Remotion dieselbe Semantik konsistent verwenden.

## Problem

Aktuell benutzt `pipeline/plan.json` für sehr unterschiedliche Designs dieselben Felder:

- `slides.bigText`
- `slides.smallText`
- `slides.s2`
- `slides.s3`
- `slides.button`

Diese Felder bedeuten je nach Design aber etwas völlig anderes:

- `pixel-wall`
  - `smallText` erscheint zuerst in Act 1
  - `bigText` erscheint danach als große Reaktion
- `billboard`
  - war ursprünglich `bigText || smallText`
  - wurde lokal schon erweitert, damit `smallText` zuerst und `bigText` danach unterhalb eingeblendet werden kann
- `terminal`
  - `bigText` ist in Wahrheit der Prompt
  - `smallText` ist nicht S1, sondern wird mit `s2` in Act 2 zusammengeführt
  - `button` wird im aktuellen Export für `terminal` nicht mit exportiert

Ergebnis:

- dieselben Feldnamen haben je nach Design andere dramaturgische Rollen
- Content-Arbeit wird unnötig verwirrend
- man kann leicht Posts „falsch“ befüllen, obwohl die Texte an sich gut sind
- Export und Rendering erzeugen Überraschungen

## Zielbild

`plan.json` soll aus Autorensicht semantische, design-unabhängige Inhaltsfelder benutzen.

Beispielhaft:

```json
{
  "content": {
    "act1Setup": "…",
    "act1Reveal": "…",
    "act2": "…",
    "act3": "…",
    "aside": "…"
  }
}
```

Die Designs mappen diese semantischen Felder dann jeweils in ihre eigene Darstellung.

Wichtig:

- Autoren schreiben Inhalt, nicht technische Feldbelegung
- Export kennt pro Design eine klare Mapping-Regel
- Remotion-Compositions folgen derselben Regel
- keine stillen Unterschiede mehr wie „`smallText` ist hier S1, dort aber S2“

## Konkrete Anforderungen

### 1. Neues semantisches Schema definieren

Vorschlag:

```json
{
  "content": {
    "act1Setup": "Erster Gedanke / Setup / Ausgangssatz",
    "act1Reveal": "Optionaler zweiter Schlag / Reaktion / Verdichtung",
    "act2": "Mittelteil / Argument / Szene / Erklärung",
    "act3": "Punchline / Schluss",
    "aside": "Optionaler Nachsatz / Button / Übrigens / kleiner Kommentar"
  }
}
```

Optionale Erweiterungen nur wenn wirklich nötig:

- `act1Prompt` falls `terminal` zwingend ein anderes S1-Konzept braucht
- `media`/`image` für Newsjacking und Slideshow
- `accent`/`timing` weiter separat lassen

Ziel ist möglichst wenig Spezialfälle.

### 2. Export-Pipeline auf neue Semantik umbauen

Betroffene Datei:

- [export-post.mjs](/Users/dh/Desktop/misc-public/pr-wiai/export-post.mjs)

Der Export soll nicht mehr direkt auf `bigText`/`smallText`/`s2`/`s3` zugreifen, sondern auf die neuen semantischen Felder.

Pro Design gewünschtes Mapping:

#### `pixel-wall`

- Act 1:
  - `act1Setup` zuerst
  - `act1Reveal` danach als große Reaktion
- Act 2:
  - `act2`
- Act 3:
  - `act3`
  - `aside` als Button/Übrigens-Nachbau je nach gewünschter Darstellung

#### `billboard`

- Act 1:
  - wenn nur `act1Setup`: zeige nur diesen Text
  - wenn `act1Setup` + `act1Reveal`: erst Setup, dann Reveal darunter
- Act 2:
  - `act2`
- Act 3:
  - `act3`
  - `aside` als optionaler Button

#### `terminal`

- Act 1:
  - semantisch klar definieren
  - empfohlen: `act1Setup` ist der Prompt-/Auftakttext
  - optional `act1Reveal` als zweite Zeile in Act 1 oder als Beginn von Act 2, aber die Regel muss explizit sein
- Act 2:
  - `act2`
- Act 3:
  - `act3`
  - `aside` muss im Export unterstützt werden

Wichtig:

- aktueller Bug/Gap: `terminal` rendert in Remotion zwar `slide3.button`, aber `export-post.mjs` exportiert diesen Button bisher nicht für `terminal`
- das muss behoben werden

### 3. Remotion-Komponenten an dieselbe Semantik angleichen

Betroffene Dateien mindestens:

- [wiai-social/src/compositions/LedWall.tsx](/Users/dh/Desktop/misc-public/pr-wiai/wiai-social/src/compositions/LedWall.tsx)
- [wiai-social/src/compositions/Billboard.tsx](/Users/dh/Desktop/misc-public/pr-wiai/wiai-social/src/compositions/Billboard.tsx)
- [wiai-social/src/compositions/Terminal.tsx](/Users/dh/Desktop/misc-public/pr-wiai/wiai-social/src/compositions/Terminal.tsx)
- [wiai-social/src/types.ts](/Users/dh/Desktop/misc-public/pr-wiai/wiai-social/src/types.ts)

Anforderung:

- Typsystem und Compositions sollen dieselben inhaltlichen Begriffe verwenden wie `plan.json`
- keine stillen Sonderbedeutungen der Feldnamen mehr

### 4. Bestehende `plan.json`-Einträge migrieren

Betroffene Datei:

- [pipeline/plan.json](/Users/dh/Desktop/misc-public/pr-wiai/pipeline/plan.json)

Es braucht ein Migrationsvorgehen für bestehende Posts.

Pragmatische Regel:

- alte `slides.*`-Felder noch eine Übergangszeit lesen können oder
- einmalige Migration schreiben und alles konsequent umziehen

Empfehlung:

- einmalige Migration mit Script
- danach auf das neue Schema normalisieren

### 5. UI / Editing

Falls die Pipeline-UI auf die alten Felder vertraut, muss sie angepasst werden.

Betroffene Dateien wahrscheinlich:

- [pipeline/ui/app.js](/Users/dh/Desktop/misc-public/pr-wiai/pipeline/ui/app.js)
- evtl. API-Teil in [pipeline/server.mjs](/Users/dh/Desktop/misc-public/pr-wiai/pipeline/server.mjs)

Anforderung:

- UI soll semantische Felder editieren können
- Design-spezifische Hilfetexte im Editor wären sinnvoll
- Autoren sollen sehen, wie `act1Setup`/`act1Reveal` je Design verwendet werden

## Konkrete Beispiele, die das Problem sichtbar gemacht haben

### `idea-neue-passwort-zu-lang`

Problem:

- `terminal`
- `bigText` leer
- `smallText` enthält inhaltlich den eigentlichen Auftakt
- Export würde mit reinem `$` als Prompt starten

### `idea-neue-handy-vs-freund`

Problem:

- `billboard`
- `bigText` und `smallText` waren beide wichtig
- alte Billboard-Logik hat bei gesetztem `bigText` das `smallText` effektiv ignoriert

### `idea-neue-das-pdfformular`

Gleiches Problem wie oben:

- Hook bestand aus zwei Ebenen
- alte Billboard-Logik hat nur eine angezeigt

### `idea-neue-survivorship-bias`

Problem:

- `pixel-wall`
- inhaltliches Setup stand im falschen S1-Feld
- da `pixel-wall` `smallText` vor `bigText` zeigt, war die Dramaturgie schief

## Gewünschtes Ergebnis

Nach der Refactor-Arbeit soll gelten:

1. Ein Autor kann einen Post schreiben, ohne pro Design die Feld-Semantik auswendig zu kennen.
2. Export und Rendering erzeugen keine Überraschungen.
3. `terminal` unterstützt `aside/button` konsistent.
4. `billboard`, `pixel-wall` und `terminal` haben jeweils dokumentierte Mapping-Regeln von derselben semantischen Inhaltsstruktur auf die visuelle Darstellung.
5. `plan.json` ist lesbarer als heute.

## Akzeptanzkriterien

- `pipeline/plan.json` benutzt ein neues semantisches Inhaltsschema
- `export-post.mjs` unterstützt dieses Schema vollständig
- `wiai-social/src/types.ts` bildet dieses Schema ab
- `LedWall`, `Billboard`, `Terminal` rendern dasselbe Schema konsistent
- mindestens einige bestehende Beispielposts wurden migriert und geprüft
- `terminal` exportiert `aside/button` korrekt
- die aktuelle 21-Post-Planung kann ohne Feld-Tricks sauber aus dem neuen Schema abgebildet werden

## Nicht Ziel dieser Session

- komplette Content-Neubewertung aller Posts
- großflächige Design-Neuerfindung
- Newsjacking/Slideshow neu konzipieren, sofern nicht nötig

Es geht primär um:

- semantische Klarheit
- konsistente Datenstruktur
- robuste Export-/Render-Logik

## Empfehlung für die neue Session

Reihenfolge:

1. Schema definieren
2. `types.ts` + Export-Mapping umbauen
3. `Billboard` / `LedWall` / `Terminal` angleichen
4. Migration für `plan.json`
5. 3-5 echte Posts als Smoke-Test prüfen

