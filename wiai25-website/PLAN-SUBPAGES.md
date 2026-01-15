# PLAN: Unterseiten & Content-Struktur

**Status:** Planung
**Basis:** wiai25-final.html (Bold Black/Yellow Design)

---

## Entscheidungen

### 1. Separate Unterseiten (statt Single Page)

Um Komplexitätsexplosion zu vermeiden, werden folgende Bereiche auf eigene Seiten ausgelagert:

| Seite | URL | Inhalt |
|-------|-----|--------|
| **Event** (Hauptseite) | `/` | Programm, Stories, Exponate, Anmeldung |
| Studium | `/studium/` | Studiengänge mit Details, Berufsperspektiven, Verlaufspläne |
| Forschung | `/forschung/` | Themencluster, Projekte, Schlaglichter |
| Praxis | `/praxis/` | Praxispartner, Kooperationen |
| Gesellschaft | `/gesellschaft/` | Transfer, regionale Wirkung |

### 2. Keine klassische Top-Navigation

Statt abstrakter Menü-Links werden die Unterseiten **organisch im Content verlinkt**:

```
Im Programm:
"Bei den Vorträgen sprechen Forschende über aktuelle Projekte."
[→ Was wird bei uns geforscht?]

In einer Story über einen Absolventen:
"Heute arbeitet er bei Siemens als Data Scientist."
[→ Welche Berufe sind nach dem Studium möglich?]

Zwischen Sections (Teaser-Block):
"Du überlegst selbst zu studieren?"
"8 Studiengänge · Start im Sommer oder Winter · Auch Teilzeit"
[→ Alle Studiengänge entdecken]

Bei Exponaten:
"Diese Projekte entstehen im Rahmen studentischer Arbeiten."
[→ Was lernt man im Studium?]
```

**Footer:** Enthält klassische Links zu allen Unterseiten für die, die gezielt suchen.

### 3. Stories: Inline aufklappbar

Die 25 Geschichten sind auf der Event-Seite integriert:

**Collapsed State:**
```
┌─ 25 WOCHEN · 25 GESCHICHTEN ────────────────── Woche 08/25 ─┐
│                                                             │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  #08 · DER ERSTE HACKATHON                           │  │
│  │  [Thumbnail]  Als 2007 zum ersten Mal...             │  │
│  │               [Weiterlesen →]                         │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                             │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐     │
│  │ #07  │ │ #06  │ │ #05  │ │ #04  │ │ #03  │ │ ...  │     │
│  └──────┘ └──────┘ └──────┘ └──────┘ └──────┘ └──────┘     │
└─────────────────────────────────────────────────────────────┘
```

**Expanded State (Klick auf Story):**
- Aktuelle Story-Thumbnails bleiben sichtbar (mit Markierung)
- Volle Story öffnet sich darunter
- Enthält: Bild, Text, Navigation (← Vorherige / Nächste →)
- URL wird zu `/#story-05`

**Verhalten:**
- Content wird via htmx lazy loaded beim Aufklappen
- Back-Button schließt Story wieder
- Direktlinks (`wiai25.de/#story-05`) öffnen Story automatisch

### 4. Exponate: Inline aufklappbar

Ähnlich wie Stories, aber mit Gallery-Layout:

**Collapsed State:**
```
┌─ EXPONATE ──────────────────────────────────────────────────┐
│  Interaktive Installationen am 27. Juni                     │
│                                                             │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌──────────┐  │
│  │  [thumb]   │ │  [thumb]   │ │  [thumb]   │ │ [thumb]  │  │
│  │  Pattern   │ │ Generative │ │ Vorlieben- │ │ Sammel-  │  │
│  │  Match     │ │ Kunst      │ │ Quiz       │ │ karten   │  │
│  │  ●●●●●●○○  │ │  ●●●●○○○○  │ │  ●●○○○○○○  │ │ ●○○○○○○○ │  │
│  └────────────┘ └────────────┘ └────────────┘ └──────────┘  │
└─────────────────────────────────────────────────────────────┘
```

**Expanded State:**
- Enthält: GIF/Video, Beschreibung, Team, Status, Dev-Log
- URL wird zu `/#exponat-generative-kunst`

### 5. Lazy Loading via htmx

Beide Bereiche (Stories + Exponate) laden Content erst bei Klick:

```html
<!-- Story-Thumbnail -->
<article class="story-card" data-story="05">
  <button
    hx-get="/partials/stories/05.html"
    hx-target="#story-detail"
    hx-swap="innerHTML"
    hx-trigger="click"
    hx-push-url="#story-05"
  >
    <span class="story-number">#05</span>
    <h3>FlexNow und die Nacht vor der Prüfung</h3>
  </button>
</article>

<!-- Detail-Container -->
<div id="story-detail" class="story-expanded">
  <!-- htmx lädt hier den vollen Story-Content -->
</div>
```

**URL-Handling bei Direktlinks:**
```javascript
document.addEventListener('DOMContentLoaded', () => {
  const hash = window.location.hash;

  if (hash.startsWith('#story-')) {
    const id = hash.replace('#story-', '');
    htmx.ajax('GET', `/partials/stories/${id}.html`, '#story-detail');
    scrollToSection('geschichten');
  }

  if (hash.startsWith('#exponat-')) {
    const slug = hash.replace('#exponat-', '');
    htmx.ajax('GET', `/partials/exponate/${slug}.html`, '#exponat-detail');
    scrollToSection('exponate');
  }
});
```

---

## Seitenstruktur: Event (Hauptseite)

```
EVENT-SEITE (/)
│
├── HERO
│   └── Animation, Datum, CTAs
│
├── STATS BAND
│   └── 33 Professuren · ~200 Mitarbeitende · 8 Studiengänge
│
├── EIN TAG, VIELE PERSPEKTIVEN
│   └── 4 Zielgruppen-Cards (Studieninteressierte, Familien, Netzwerken, Unternehmen)
│
├── PROGRAMM / ABLAUF
│   └── Timeline + Highlights
│   └── [Kontextlink → Forschung?]
│
├── GESCHICHTEN (htmx lazy loaded)
│   ├── Aktuelle Story groß
│   ├── Ältere als Thumbnails
│   └── Inline-Expand für volle Story
│       └── [Kontextlinks je nach Story-Inhalt]
│
├── TEASER: STUDIUM (optional, zwischen Sections)
│   └── [→ /studium/]
│
├── ÜBER DIE WIAI
│   └── Kurzer Text zur Fakultät
│
├── EXPONATE / HINTER DEN KULISSEN (htmx lazy loaded)
│   ├── Gallery-Grid
│   └── Inline-Expand für Details + Dev-Log
│
├── ANMELDUNG
│   └── Formular
│
└── FOOTER
    └── Links zu allen Unterseiten (Studium, Forschung, etc.)
```

---

## MVP-Scope (Phase 1)

### Enthalten:
- [x] Vollständiges Layout wie in wiai25-final.html
- [x] Hero mit Animation (statischer Counter erstmal)
- [x] Stats Band
- [x] Perspektiven-Cards
- [x] Programm/Ablauf
- [x] **Story #01** (erste echte Story, aufklappbar)
- [x] Über die WIAI Text
- [x] Exponate-Section als **Platzhalter** (Cards ohne echten Content)
- [x] Anmeldung (Formular, noch ohne Backend)
- [x] Footer

### Noch nicht enthalten:
- [ ] htmx Lazy Loading (erstmal alles inline)
- [ ] Weitere Stories (#02-#25)
- [ ] Echte Exponat-Details
- [ ] Unterseiten (Studium, Forschung, etc.)
- [ ] Visitor-Counter-Backend
- [ ] Hugo-Integration

### Technisch:
- Statisches HTML/CSS/JS
- Tailwind via lokaler tailwind.min.js
- Keine Build-Pipeline
- Deployment direkt als statische Dateien

---

## Dateistruktur (Ziel mit Hugo)

```
wiai25-website/
├── content/
│   ├── _index.md                    # Event-Seite
│   ├── stories/
│   │   ├── 01.md                    # Story #01
│   │   ├── 02.md
│   │   └── ...
│   ├── exponate/
│   │   ├── pattern-match.md
│   │   ├── generative-kunst.md
│   │   └── ...
│   ├── studium/
│   │   ├── _index.md
│   │   ├── informatik.md
│   │   └── ...
│   ├── forschung/
│   │   └── _index.md
│   ├── praxis/
│   │   └── _index.md
│   └── gesellschaft/
│       └── _index.md
│
├── layouts/
│   ├── index.html                   # Event-Seite Template
│   ├── _default/baseof.html         # Gemeinsamer Rahmen
│   └── partials/
│       ├── nav.html
│       ├── footer.html
│       ├── story-card.html
│       ├── story-full.html          # Für htmx
│       ├── exponat-card.html
│       └── exponat-full.html        # Für htmx
│
├── static/
│   ├── partials/                    # Von Hugo generiert für htmx
│   │   ├── stories/
│   │   │   ├── 01.html
│   │   │   └── ...
│   │   └── exponate/
│   │       └── ...
│   └── images/
│       └── stories/
│           └── 01/
│               └── hero.jpg
│
└── assets/
    └── css/
        └── main.css
```

---

## Story #01: "28. September 2001"

**Bereits im Mockup vorhanden:**
- Datum: 28. September 2001
- Thema: WIAI geht online
- Bild: Screenshot der alten Website (wiai-2021.png)
- Teaser: "Die WIAI geht online. Drei Professoren, eine Handvoll Lehrstühle, und eine Website, die heute wie ein Artefakt aus einer anderen Zeit wirkt. FlexNow! war schon dabei."

**Für MVP erweitern:**
- Voller Text für Expanded State
- Mögliche Kontextlinks (z.B. zu FlexNow-Geschichte, zu Studium)

---

## Offene Fragen

1. **Visitor-Counter:** Wie/wann wird das Backend aufgesetzt? Erstmal statischen Dummy-Wert?
2. **Anmeldung:** Wohin geht das Formular? Mailchimp? Eigenes Backend?
3. **Stories-Content:** Wer schreibt die Texte? Gibt es schon Material?
4. **Exponate:** Wann sind die studentischen Projekte soweit, dass wir sie featuren können?
5. **Domain:** wiai25.de? wiai25.uni-bamberg.de? Subdomain?

---

## Nächste Schritte

1. [ ] MVP der Event-Seite fertigstellen (basierend auf wiai25-final.html)
2. [ ] Story #01 als aufklappbaren Content einbauen
3. [ ] Exponate-Section als "Coming Soon" gestalten
4. [ ] Footer-Links zu Unterseiten als Platzhalter
5. [ ] Deployment-Setup klären
