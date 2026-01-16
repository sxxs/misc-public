# WIAI25 Jubiläumswebsite – Vollständige Projektdokumentation

## Projektkontext

Die Fakultät **Wirtschaftsinformatik und Angewandte Informatik (WIAI)** an der Otto-Friedrich-Universität Bamberg feiert am **27. Juni 2026** ihr 25-jähriges Bestehen. Dominik (Dekan der Fakultät seit Oktober 2025) plant eine Jubiläumswebsite, die:

1. Als eigenständige Seite außerhalb der veralteten Uni-Infrastruktur läuft ("Guerilla-Taktik")
2. Verschiedene Zielgruppen anspricht (Schüler, Eltern, Alumni, Unternehmen, Politik)
3. Die Breite der Fakultät repräsentiert (nicht nur "nerdig", sondern auch WI/IS-Community mit psychologischen/sozialwissenschaftlichen Aspekten)
4. Dem Recruiting dient
5. Modern und eigenständig aussieht, ohne in Tech-Startup-Klischees zu verfallen

**Veranstaltungsort:** ERBA-Campus, An der Weberei 5, Bamberg

**Technischer Stack:** Hugo (Static Site Generator), Tailwind CSS. Dominik ist Tech Lead, Content kommt vom Dekanat und HiWis.

---

## Zentrale Design-Entscheidungen

### Farbschema
**Finale Entscheidung: Schwarz / Weiß / Gelb (#FACC15) / Grau**

- Hoher Kontrast, energetisch, editorial/Magazin-Ästhetik
- Schräge schwarze Boxen mit gelbem oder weißem Text für Section-Headings
- Kein Teal/Petrol (obwohl ursprünglich im Logo) – zu nah am generischen Uni-Blau
- Gelb als Akzent, nicht als Textfarbe auf hellem Grund (Lesbarkeit!)

### Typografie
- **Inter** als Hauptschrift (neutral, modern, gut lesbar)
- **JetBrains Mono** für Monospace-Elemente (Uhrzeiten, Zähler, Labels)
- Große, mutige Headlines im Hero ("FÜNFUND-ZWANZIG JAHRE")

### Ansprache
**Problem:** Zielgruppen von Schülern bis Politiker – "Du" holt nicht alle ab, "Sie" wirkt steif.

**Lösung:** 
- Hauptseite in formeller Sprache ("Sie", "Wir laden ein")
- Keine expliziten Zielgruppen-Buttons auf der Startseite
- Stattdessen: Verschiedene "Hooks" als Programmpunkte, die unterschiedliche Gruppen ansprechen
- Zielgruppe wird erst bei der Anmeldung abgefragt (Dropdown: "Ich komme als...")

### Was vermieden wird
- Emojis (unter dem Niveau der Fakultät)
- Stock-Fotos von Serverräumen, Drohnen, generische "Innovation"-Bilder
- Neon-Farben, leuchtende Icons
- Gesichter ohne professionelle Fotos (Einwilligung, oft nicht fotogen)
- Karierte/symmetrische Hintergrundmuster
- Tech-Startup-Slop ("SHAPE THE FUTURE", "Driving Innovation")

---

## Inhaltliche Struktur der Website

### 1. Hero-Bereich
- Große Typografie: "FÜNFUND-ZWANZIG JAHRE" (mit "ZWANZIG" in Gelb)
- Subline: "Menschzentrierte Informatik an der Uni Bamberg"
- Datum/Ort: 27. Juni 2026, ERBA-Campus
- WIAI25-Animation (zentrales Element, siehe unten)
- Zwei CTAs: "Was passiert" / "Dabei sein"

### 2. Stats-Balken (Gelb)
- ~30 Professuren
- ~200 Mitarbeitende  
- 8 Studiengänge (oder 5+7 Bachelor+Master)
- ~2.000 Studierende

### 3. "Ein Tag, viele Perspektiven" – Zielgruppen-Hooks
Vier Kacheln mit unterschiedlichen Angeboten:

| Zielgruppe | Titel | Beschreibung |
|------------|-------|--------------|
| Studieninteressierte | Studiengänge live | Infos zu Bachelor/Master, Gespräche mit Studierenden |
| Familien | Kinderuni | "Wie denkt ein Computer?" – Vorlesung für Kinder ab 8 |
| Netzwerken | Begegnungen | Ehemalige treffen Aktive, Forschende treffen Praxis |
| Unternehmen | Talente treffen | Gespräche mit Studierenden/Promovierenden |

**Wichtig:** "Alumni-Treffen nach Jahrgängen" wurde gestrichen – gibt es nicht.

### 4. Programm / Ablauf
| Uhrzeit | Programmpunkt |
|---------|---------------|
| 14:00 | Ankommen – Empfang, Ausstellung |
| 15:00 | Vorträge & Demos – Keynote, Kurzvorträge |
| 15:00 | Kinderuni (parallel) |
| 16:30 | Mitmachen – Installationen, Stationen |
| 18:00 | Feiern – Musik, Essen, Gespräche |

**Highlights-Liste:**
1. Keynote von [Name noch offen]
2. Interaktive Installationen von Studierenden
3. Mitmach-Stationen: KI, Security, HCI
4. Studienberatung für alle Studiengänge
5. 25 Jahre in Bildern: Kuriositäten-Ausstellung

### 5. "25 Wochen · 25 Geschichten"
Jede Woche bis zur Feier erscheint eine Geschichte aus 25 Jahren WIAI.

**Story #01: "28. September 2001"**
- Die alte WIAI-Website von 2001 als "Bild" (Screenshot)
- Text: "Die WIAI geht online. Drei Professoren, eine Handvoll Lehrstühle, und eine Website, die heute wie ein Artefakt aus einer anderen Zeit wirkt. FlexNow! war schon dabei."

**Warum die alte Website als erstes Bild:**
- Authentisches Material ohne Foto-Probleme
- Zeigt den Kontrast zu heute
- "FlexNow!" war tatsächlich schon 2001 dabei – running gag

### 6. Über die WIAI (Erklärender Absatz)
> Die Fakultät **Wirtschaftsinformatik und Angewandte Informatik (WIAI)** wurde 2001 gegründet. Heute forschen und lehren hier rund 30 Professuren an der Schnittstelle von Technik, Mensch und Gesellschaft – von KI bis Psychologie, von Security bis Sozioinformatik.

### 7. "Hinter den Kulissen" – Studentische Projekte
Vier Kacheln mit Status-Badges:

| Projekt | Beschreibung | Status |
|---------|--------------|--------|
| Pattern Match | Zwei-Spieler: Muster erkennen, schneller sein | In Arbeit |
| Generative Kunst | Per Tastendruck Muster erzeugen, ausdrucken | Prototyp läuft |
| Vorlieben-Quiz | Tabs oder Spaces? Live-Visualisierung | Konzept |
| Diese Website | Das wachsende Logo. Sie sind hier. | Live |

### 8. Anmeldung
- Formular mit E-Mail-Feld
- Dropdown "Ich komme als...":
  - Studieninteressiert / Schüler:in
  - Mit Familie / Kindern
  - Alumni
  - Unternehmen / Industrie
  - Forschungspartner
  - Presse
  - Interessierte:r
- Hinweis: "Die Anmeldung öffnet im Frühjahr 2026. Tragen Sie sich ein – wir erinnern rechtzeitig."

---

## Die WIAI25-Logo-Animation

### Konzept: Progressive Enhancement
Jeder Besuch trägt zum Logo bei. Das Logo "wächst" mit der Community.

### Mechanismus
- Pro Minute mit mindestens 1 Visitor → +1 Pixel/Update
- Scanline-Progression: links → rechts
- 14 Level von groben (100px) zu feinen (5px) Pixeln
- ~20.000 erwartete Updates über 25 Wochen

### Visuelle Layer
1. **Layer 1:** Verblasste Historie (PNG, bei Level-Wechsel +10% Helligkeit)
2. **Layer 2:** Aktuelle Pixel (Opacity 60%)
3. **Layer 3:** Outline "WIAI25" (XOR-Blend, garantiert Lesbarkeit)

### Technische Umsetzung
- Alle Frames vorberechnet als SVG (~2-5KB pro Frame)
- Stateless Frontend
- Backend: Cloudflare Worker oder CountAPI für Visitor-Counter

**Vollständige Spezifikation existiert in:** `/home/claude/wiai25-animation-spec.md` (aus früherem Chat)

---

## Generierte Design-Varianten

### 1. `wiai25-final.html` – BOLD (Empfohlen)
**Pfad:** `/mnt/user-data/outputs/wiai25-final.html`

**Charakteristik:**
- Schwarzer Hero mit riesiger weißer Typografie
- "FÜNFUND-ZWANZIG JAHRE" mit Gelb-Highlight
- Gelber Stats-Balken direkt unter dem Hero
- Weiße/hellgraue Sections im Mittelteil (weniger erdrückend)
- Gelbe Akzente für Badges, Buttons, Highlights
- Schwarze Section-Headings mit Skew-Transformation
- Simulierter Screenshot der 2001er-Website als Story #01
- Gelber CTA-Bereich mit weißem Formular
- Schwarzer Footer

**Visueller Rhythmus:** Schwarz (Hero) → Gelb (Stats) → Hell (Content) → Gelb (CTA) → Schwarz (Footer)

**Feedback aus dem Chat:** "Mutig und toll anzusehen" im oberen Bereich. Das Schwarz wurde im Mittelteil zurückgedreht, um nicht "Angst oder depressiv" zu wirken.

---

### 2. `wiai25-uni-style.html` – Petrol/Beige (Alternative)
**Pfad:** `/mnt/user-data/outputs/wiai25-uni-style.html`

**Charakteristik:**
- Farbschema: Petrol (#1a2f2f bis #3a5c5c), Sand/Beige (#faf9f7), Kupfer (#c17f59)
- Eleganter, institutioneller Look
- Section-Labels mit Strich davor ("— JUBILÄUM 2026")
- Icons in farbigen Quadraten
- Border-top auf Cards statt Border-left
- Pfeile (→) statt nummerierte Badges
- Sanfter, weniger kontrastreich

**Hinweis:** Dieses Design basierte auf der Annahme, dass die aktuelle WIAI-Website so aussieht. Tatsächlich sieht die echte Seite ganz anders aus (klassisches Uni-Bamberg-Blau).

---

### 3. `wiai25-retro.html` – Klassisch Uni-Bamberg (Satire)
**Pfad:** `/mnt/user-data/outputs/wiai25-retro.html`

**Charakteristik:**
- Exakte Nachbildung des aktuellen Uni-Bamberg-Webdesigns
- Blauer Gradient-Header mit Uni-Siegel
- Sidebar-Layout mit Navigation
- Gelbe "Für spezielle Zielgruppen"-Box
- Link-Listen mit `› ` Pfeilen
- Gepunktete Trennlinien
- Programm als HTML-Tabelle mit alternierenden Zeilen
- RSS-Icon (orange!)
- Massiver Footer mit allen Links
- "Seite 63" unten rechts

**Zweck:** Als Warnung und zum Vergleich, wie es NICHT aussehen soll. Wurde "nur weil es geht" erstellt.

---

### 4. Frühere Iterationen (nicht final)

| Datei | Beschreibung |
|-------|--------------|
| `wiai25-clean.html` | Erste "brave" Version, zu langweilig |
| `wiai25-v2.html` | Einladender Hero, aber kariertes Papier im Hintergrund |
| `wiai25-v3.html` | Ohne Emojis, formelle Ansprache |
| `wiai25-v4.html` | Mit Zielgruppen-Hooks und Anmelde-Dropdown |
| `wiai25-bold.html` | Erste mutige Version, zu viel Schwarz |
| `wiai25-balanced.html` | Schwarz zurückgedreht, Basis für Final |

---

## Verworfene Ideen

### Design
- Kariertes Papier / Grid-Pattern im Hintergrund
- Heroicons (zu generisch)
- Schwarze Badges mit weißen Zahlen (schlecht lesbar)
- Zielgruppen-Buttons auf der Startseite ("Für Schüler", "Für Alumni")

### Inhalt
- Alumni-Treffen nach Jahrgängen (gibt es nicht)
- Keynote als eigene prominente Section (nur ein Programmpunkt unter vielen)
- "Du"-Ansprache durchgehend (schließt formellere Zielgruppen aus)

---

## Aktuelle WIAI-Website (Realität)

Die echte WIAI-Website sieht aus wie klassisches Uni-Bamberg-CI von ca. 2008:
- Dunkelblaue Header mit Uni-Siegel
- Gelbe Akzentboxen
- Mega-Dropdown-Menüs
- Sidebar-Layout
- "Für spezielle Zielgruppen"-Block
- News-Liste mit kleinen Thumbnails
- Funktional, aber veraltet

**Screenshots hochgeladen:** Die Bilder zeigen die echte Seite mit Mega-Menü, News-Bereich, und dem klassischen Layout.

---

## Offene Punkte / TODOs

### Content
- [ ] Keynote-Speaker:in festlegen (Name ist noch Platzhalter)
- [ ] 25 Geschichten recherchieren und schreiben
- [ ] Archivbilder sammeln (nicht für alle Stories wird es gute Bilder geben)
- [ ] Zahlen verifizieren (~30 vs. 33 Professuren, etc.)

### Technik
- [ ] Counter-Backend aufsetzen (Cloudflare Worker empfohlen)
- [ ] SVG-Generator für Animation finalisieren
- [ ] Hugo-Setup und Deployment
- [ ] Mobile-Optimierung testen

### Design
- [ ] Echte WIAI25-Animation einbauen (aktuell Platzhalter)
- [ ] Echten Screenshot der 2001er-Website einbinden
- [ ] Finale Schriftgrößen und Abstände feintunen

---

## Dateien im Arbeitsverzeichnis

```
/mnt/user-data/outputs/
├── wiai25-final.html      ← EMPFOHLENE VERSION (Bold, Schwarz/Gelb)
├── wiai25-uni-style.html  ← Alternative (Petrol/Beige, eleganter)
├── wiai25-retro.html      ← Satire-Version (klassisch Uni-Bamberg)
├── wiai25-balanced.html   ← Vorstufe zu Final
├── wiai25-bold.html       ← Erste mutige Version
├── wiai25-v4.html         ← Mit Zielgruppen-Hooks
├── wiai25-v3.html         ← Ohne Emojis
├── wiai25-v2.html         ← Mit Grid-Pattern
└── wiai25-clean.html      ← Erste brave Version
```

---

## Empfehlung für die Weiterarbeit

**Verwende `wiai25-final.html` als Basis.** Diese Version:
- Ist mutig und eigenständig
- Hebt sich maximal vom Uni-Einheitsbrei ab
- Hat den richtigen Content-Mix für alle Zielgruppen
- Ist im Mittelteil leichter (nicht erdrückend schwarz)
- Hat alle inhaltlichen Elemente bereits eingebaut

**Nächste Schritte in Claude Code:**
1. HTML nach Hugo-Templates konvertieren
2. Animation-Placeholder durch echte Implementation ersetzen
3. Responsive Breakpoints verfeinern
4. Formular-Backend anbinden
5. Content-Bereiche für einfache Pflege strukturieren