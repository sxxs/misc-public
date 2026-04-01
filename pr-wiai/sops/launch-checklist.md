# SOP: Launch-Checkliste

## Wann

Einmalig, bevor der erste Post auf TikTok/YouTube/Instagram veroeffentlicht wird. Abarbeitung in der Woche vor Go-Live.

**Go-Live: 1. April 2026 (Mittwoch, KW14).** Verbleibende Vorbereitungszeit: 30.–31. Maerz.

## Posting-Strategie: Taeglich im ersten Monat

Um die Kanaele schnell aufzuwaermen, im ersten Monat (KW14–KW17) **taeglich posten** (mind. 5x/Woche, idealerweise 7x). Nach dem ersten Monat auf den Regelrhythmus von 2x/Woche reduzieren.

KW14 ab 1.4. = 5 Posts (Mi–So), dann KW15–KW17 je 7. Gesamt: ~26 Posts fuer den ersten Monat. Aktuell 21 eingeplant (KW14–KW16), plus 27 ready Posts im Backlog.

## Phase 1: Konten einrichten

- [x] **TikTok**: https://www.tiktok.com/@echt.bamberg
  - Creator-Account, Standort: Bamberg
  - Baseline: 3 Gefolgt, 0 Follower, 0 Likes
  - Bio: "Prof für IT-Sicherheit aus Bamberg. Ich habe Fragen. Zum Studium. Zum Internet. Und manchmal an mich selbst."
  - Link: studium.wiai.uni-bamberg.de/3/
- [x] **YouTube**: https://www.youtube.com/@echt.bamberg
  - Baseline: 0 Abonnenten
  - Bio: "Professor für IT-Sicherheit an der Uni Bamberg. Kommentiert Datenschutz, KI und Absurditäten im Internet. Persönlicher Account."
  - Link: studium.wiai.uni-bamberg.de/1
- [x] **Instagram**: https://www.instagram.com/echt.bamberg/
  - Creator-Account, Profilbild konsistent mit TikTok
  - Baseline: 76 Follower (Altbestand), 69 Following (Altbestand)
  - Bio: "Prof für IT-Sicherheit an der Uni Bamberg. Datenschutz. Internet. Absurditäten. Ich habe Fragen. Manchmal an mich selbst."
  - Link: studium.wiai.uni-bamberg.de/2

## Phase 2: Infrastruktur pruefen

- [x] **Short-URLs live**: Caddy-Routen `/1/` (YouTube), `/2/` (Instagram), `/3/` (TikTok) funktionieren und loggen
- [x] **JSON Access Log aktiv**: Caddy schreibt Zugriffe als JSON, Pfad-Kodierung erlaubt Plattform-Zuordnung
- [ ] **Remotion-Pipeline aufräumen**: Tracking was wo gepostet wurde (Video und/oder Carousel), mit Datum pro Plattform+Format in plan.json — damit Reposts in ausreichendem Abstand moeglich sind
- [x] **Backup plan.json**: Im Git versioniert — bei kritischen Schritten (Export, Bulk-Edits) vor der Aenderung committen

## Phase 3: Content fuer die ersten 4 Wochen festlegen

### Aktueller Stand (KW14–KW17)

| Woche | n | Types | Designs | Topics |
|-------|---|-------|---------|--------|
| KW14 (1.–6.4.) | 5 | contrarian, stimmt-eigentlich, merkste-selber, aphorismus, parodie | pixel-wall×2, billboard×3 | tech, datenschutz, social-media, alltag, manipulation |
| KW15 (7.–13.4.) | 7 | nachtgedanke, selbstironie, overselling, stimmt-eigentlich, contrarian, aphorismus, parodie | terminal×2, billboard×2, pixel-wall×2, raw-photo×1 | karriere, ertappt, manipulation, datenschutz, studium |
| KW16 (14.–20.4.) | 7 | nahkastchen, contrarian, aphorismus, selbstironie×2, parodie, merkste-selber | terminal×2, pixel-wall×3, billboard×1, raw-photo×1 | datenschutz, identitaet, studium, meta, manipulation, ertappt |
| KW17 (21.–27.4.) | 2/7 | selbstironie×2 | billboard, pixel-wall | tech, meta |

### Bekannte Mix-Probleme

- **KW14**: Billboard×3 bei 5 Slots — ein billboard→billboard-Paar ist strukturell unvermeidbar.
- **KW17 fast leer**: 5 weitere Posts aus dem Backlog einplanen (21 ready-Posts verfuegbar).

### Pruefpunkte

- [ ] **Kein wiai-ad-Topic in den ersten 5 Posts** (Cold-Start-Regel + 90/10)
- [ ] **Typ-Variation**: Nie zwei Posts desselben contentType direkt hintereinander (Variable Reward Schedule)
- [ ] **Design-Variation**: Nicht nur pixel-wall oder nur billboard an aufeinanderfolgenden Tagen
- [ ] **Drafts exportieren**: Viele eingeplante Posts sind noch `draft` — muessen erst exportiert (`export-post.mjs`), gerendert und captioned werden
- [ ] **Alle Posts gerendert**: MP4 + PNGs + Carousel-Crops fuer mindestens die erste Woche vorhanden
- [ ] **Captions geschrieben**: Fuer alle KW14-Posts (siehe `sops/captions-hashtags.md`)

### Posting-Rhythmus (Aufwaermphase)

- 1 Post pro Tag (7x/Woche) fuer die ersten 4 Wochen
- Uhrzeiten: 18–20 Uhr (Schueler-Zielgruppe nach Schulschluss)
- Am Wochenende ggf. auch mittags
- Nach Monat 1: Reduktion auf 2x/Woche als Grundrhythmus

### Status-Modell

Posts haben **Status** (Produktionsreife) und **targetWeek** (Terminierung) als zwei unabhaengige Felder. Es gibt keinen eigenen Status `scheduled` — ein Post ist eingeplant wenn `targetWeek` gesetzt ist, unabhaengig vom Status. Ein `draft` mit `targetWeek` bedeutet: eingeplant, aber noch nicht produktionsreif.

## Phase 4: Cold-Start-Sequenz

Die Strategie definiert drei Phasen:

### 4a. Organisch (Post 1–5)

- [ ] Posts 1–5 ohne jede externe Promotion veroeffentlichen
- [ ] Alle mit Bamberg-Location taggen (TikTok Nearby Feed)
- [ ] Keine Cross-Posts auf LinkedIn/Mastodon
- [ ] Zweck: Algorithmus lernt Thema und Ton, bevor externe Audience reinkommt

### 4b. Seed-Audience (ab Post 5)

- [ ] LinkedIn-Ankuendigung vorbereiten (Text vorab schreiben)
  - Ton: sachlich, nicht "Schaut mal mein cooles Projekt"
  - Inhalt: Was der Kanal ist, warum, fuer wen
  - Link zum Kanal, nicht zu einem einzelnen Post
- [ ] Mastodon-Post vorbereiten
- [ ] Timing: LinkedIn-Post am Tag nach Post 5 oder 6

### 4c. Bezahlte Promotion (ab Post 10–15)

- [ ] Fruehestens nach 10 Posts, idealerweise nach 15
- [ ] Nur fuer die 2–3 bestperformenden Posts (nach Retention/Shares)
- [ ] Budget und Targeting vorher festlegen (Region Oberfranken, Alter 16–19)

## Phase 5: Go/No-Go Entscheidung

Vor Veroeffentlichung von Post #1:

- [ ] Alle Phase-1-Konten eingerichtet und geprueft
- [ ] Infrastruktur (Phase 2) funktioniert
- [ ] Mindestens 7 Posts gerendert und bereit (1 Woche Puffer bei Daily Posting)
- [ ] Captions fuer die erste Woche geschrieben
- [ ] Posting-Uhrzeit festgelegt

Optional (empfohlen):

- [ ] 3–5 Posts informell mit Testgruppe geteilt (Schueler/Erstsemester)
- [ ] Feedback eingeholt: Ton verstaendlich? Shareable?
- [ ] Praeventives Gespraech mit Pressestelle / Social-Media-Team

## Phase 6: Erste Woche — Beobachten

Nach Post #1:

- [ ] Caddy-Logs pruefen: Kommen Klicks ueber Short-URLs?
- [ ] TikTok-Analytics: Retention-Kurve ansehen (wo springen Leute ab?)
- [ ] Kommentare lesen (aber nicht zwanghaft antworten)
- [ ] **Nicht** den Ton aendern nach einem Post. Mindestens 5–7 Posts abwarten bevor Anpassungen

### Review-Punkt nach KW15 (14 Posts)

- Welche Posts haben die beste Retention?
- Funktioniert billboard oder pixel-wall besser?
- Stimmt die Zielgruppe? (TikTok Analytics zeigt Altersverteilung)
- Entscheidung: Weiter wie geplant / Ton nachjustieren / Posting-Frequenz anpassen

## Checkliste (Kurzversion)

- [ ] 3 Konten eingerichtet (TikTok, YouTube, Instagram)
- [ ] Short-URLs + Logging funktioniert
- [ ] Erste 7+ Posts gerendert (1 Woche Daily Posting)
- [ ] Captions fuer KW14 geschrieben
- [ ] Posting-Uhrzeit festgelegt
- [ ] Mix geprueft: Contrarian zum Start, Design-Variation, kein wiai-ad in Post 1–5
- [ ] Cold-Start-Regeln klar (kein LinkedIn vor Post 5)
- [ ] LinkedIn-Ankuendigung vorgeschrieben
- [ ] Go/No-Go: alles oben abgehakt → Post #1 veroeffentlichen

## Haeufige Fehler

- **Business-Account statt Creator**: TikTok Business-Accounts haben eingeschraenkte Sound-Bibliothek. Creator-Account waehlen.
- **LinkedIn zu frueh**: Wenn die Peer-Community den Kanal sieht bevor der Algorithmus den Ton gelernt hat, verzerrt das die Audience-Signale. Erst ab Post 5.
- **Keine Geduld**: TikTok braucht 10–15 Posts bis der Algorithmus den Kanal einordnet. Vor Post 10 keine Panik wegen niedriger Views.
- **Perfektionismus**: Lieber posten und lernen als endlos optimieren. Die ersten Posts werden nicht viral — das ist normal und gewollt.
- **Posting-Zeiten ignorieren**: 18–20 Uhr ist deutlich besser als morgens fuer die Schueler-Zielgruppe. Am Wochenende ggf. auch mittags.
- **Mix vergessen**: Auch bei Daily Posting nie zwei Posts desselben Typs direkt hintereinander. Variable Reward Schedule gilt immer.
