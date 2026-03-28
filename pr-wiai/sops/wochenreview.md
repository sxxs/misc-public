# SOP: Wochenreview

## Wann

Einmal pro Woche, idealerweise Montag oder Freitag -- fester Termin im Kalender.

## Voraussetzungen

- [ ] Zugang zu TikTok, YouTube, Instagram (Kommentare lesen)
- [ ] `pipeline/plan.json` aktuell

## Schritte

### 1. plan.json pruefen

- `pipeline/plan.json` oeffnen
- Alle Posts mit `status: "ready"` durchgehen: Ist ein Veroeffentlichungstermin (`targetWeek`) eingetragen?
- Alle Posts mit `status: "published"` pruefen: Sind Links und Datum vollstaendig?
- Gibt es Posts mit `status: "draft"` die seit mehr als 2 Wochen rumliegen? Entweder fertigmachen oder streichen.

### 2. Pipeline-Fuellstand pruefen

- Wie viele Posts mit `status: "ready"` sind vorhanden?
- **Ziel**: Mindestens 4 fertige Posts im Puffer (2 Wochen bei 2 Posts/Woche)
- Falls unter 4: Neue Posts aus dem Entwuerfe-Pool nachziehen (SOP: Neuer Post)

### 3. Geplante Posts kontrollieren

- Haben alle Posts fuer die naechsten 2 Wochen eine JSON-Datei in `wiai-social/posts/`?
- Sind sie in `src/Root.tsx` registriert (Import + `cp()`)?
- Wurde die Studio-Preview gemacht (`./studio.sh`)?

### 4. FYP scannen (Stitch-Chancen)

10 Minuten auf TikTok FYP scrollen. Dabei achten auf:
- Videos die nach einem Stitch/Duett schreien (siehe SOP: Creator-Reaktion)
- Trends die sich fuer ein Newsjacking eignen (siehe SOP: Newsjacking)
- Formate die gut funktionieren und adaptierbar sind

### 5. News scannen (Newsjacking)

Kurzer Check der ueblichen Quellen:
- Heise, Golem, t3n (Tech)
- Spiegel, Zeit (Bildung/Hochschule)
- TikTok-Trends / Twitter-Trends
- Gibt es eine aktuelle Nachricht, auf die herdom reagieren sollte? Falls ja: SOP Newsjacking starten.

### 6. Kommentare beantworten

- TikTok: Alle neuen Kommentare durchgehen, antworten
- YouTube: Kommentare pruefen
- Instagram: Kommentare + DMs
- Besonders gute Kommentare notieren (koennten Basis fuer neue Posts sein)

### 7. Ideen vorwaerts bewegen

- `pipeline/ideen/` und `pipeline/entwuerfe/` durchgehen
- Ideen mit **#stark** oder **#ok** die noch kein JSON haben: als naechste umsetzen
- Neue Ideen aus der Woche ergaenzen (Kommentar-Inspiration, FYP-Trends, Gespraeche)

### 8. Kalender aktualisieren

- `targetWeek` fuer die naechsten 2 Wochen in `plan.json` setzen
- Mischung aus Post-Typen planen (nicht 3x contrarian hintereinander)
- Saisonale Anlaesse beruecksichtigen (Semesterstart, Bewerbungsfristen, Feiertage)

## Checkliste

- [ ] plan.json geprueft (status, links, targetWeek)
- [ ] Mindestens 4 Posts im "ready"-Puffer
- [ ] Naechste 2 Wochen geplant und mit JSON hinterlegt
- [ ] FYP gescannt (10 min)
- [ ] News gecheckt
- [ ] Kommentare beantwortet
- [ ] Neue Ideen notiert
- [ ] Kalender fuer naechste 2 Wochen steht

## Haeufige Fehler

- **Review ausfallen lassen**: Eine Woche ohne Review und der Puffer ist leer. Den Termin ernst nehmen.
- **Nur produzieren, nicht reagieren**: Kommentare beantworten ist genauso wichtig wie neue Posts. Engagement fuettert den Algorithmus.
- **Immer der gleiche Post-Typ**: Abwechslung planen. Contrarian, Newsjacking, Nachtgedanke, Witz mischen.
- **Newsjacking zu spaet**: Wenn eine Nachricht aelter als 48h ist, lohnt sich Newsjacking meistens nicht mehr.
- **Ideen nicht festhalten**: Gute Ideen kommen beim Scrollen. Sofort in `pipeline/ideen/` notieren, nicht "merken".
