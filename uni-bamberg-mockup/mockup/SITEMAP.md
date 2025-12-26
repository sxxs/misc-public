# Uni Bamberg Website - Sitemap & Strukturvorschlag

## Erstellte Mockup-Seiten

```
mockup/
├── index.html                         Startseite der Universitat
├── studium.html                       Studium-Bereich
├── wiai/index.html                Fakultat WIAI Startseite
├── artikel.html                       Artikel-Template (News/Meldungen)
├── styles.css                         Design-System
├── script.js                          Interaktivitat
│
└── wiai/
    ├── studiengaenge.html             Studiengange-Hub (alle 6 Programme)
    ├── angewandte-informatik-bsc.html Studiengang-Detail (B.Sc.)
    └── forschung.html                 Forschungsbereich WIAI
```

---

## Vorgeschlagene Seitenstruktur

Basierend auf der Analyse von 423 HTML-Seiten der aktuellen uni-bamberg.de, hier ein vereinfachter Strukturvorschlag:

### Ebene 1: Hauptbereiche

```
/                              Startseite
├── /studium/                  Studium-Hub
├── /fakultaeten/              Fakultaten-Ubersicht
├── /forschung/                Forschungs-Hub
├── /universitaet/             Uber die Universitat
├── /international/            International Office
└── /aktuelles/                News & Events
```

### Ebene 2-3: Detailstruktur

```
/studium/
├── /finder/                   Studiengangs-Finder mit Filterung
├── /bewerbung/                Bewerbung & Zulassung
│   ├── /bachelor/
│   ├── /master/
│   └── /international/
├── /beratung/                 Beratungsangebote
│   ├── /studienberatung/
│   ├── /psychologische-beratung/
│   └── /karriereberatung/
├── /im-studium/               Wahrend des Studiums
│   ├── /pruefungen/
│   ├── /auslandsaufenthalt/
│   └── /finanzierung/
└── /studieninteressierte/     Fur Studieninteressierte

/fakultaeten/
├── /wiai/                     Fakultat WIAI
│   ├── /studiengaenge/        Alle Studiengange
│   │   ├── /angewandte-informatik-bsc/
│   │   ├── /wirtschaftsinformatik-bsc/
│   │   ├── /software-systems-science-bsc/
│   │   ├── /angewandte-informatik-msc/
│   │   ├── /wirtschaftsinformatik-msc/
│   │   └── /computing-humanities-msc/
│   ├── /forschung/            Forschungsschwerpunkte
│   ├── /personen/             Mitarbeiterverzeichnis
│   └── /aktuelles/            Fakultats-News
├── /guk/                      Geistes- & Kulturwissenschaften
├── /sowi/                     Sozial- & Wirtschaftswissenschaften
└── /huwi/                     Humanwissenschaften

/forschung/
├── /schwerpunkte/             Forschungsschwerpunkte
├── /projekte/                 Aktuelle Projekte
├── /nachwuchs/                Promotion & Habilitation
└── /transfer/                 Wissenstransfer & Partner

/universitaet/
├── /portrait/                 Portrait & Geschichte
├── /leitung/                  Prasidium & Verwaltung
├── /standorte/                Campus & Gebaude
├── /jobs/                     Stellenangebote
└── /presse/                   Pressestelle

/international/
├── /incoming/                 Internationale Studierende
├── /outgoing/                 Auslandsaufenthalte
├── /partnerhochschulen/       Kooperationen
└── /sprachenzentrum/          Sprachkurse

/aktuelles/
├── /news/                     Nachrichten
├── /veranstaltungen/          Veranstaltungskalender
└── /termine/                  Wichtige Termine
```

---

## Design-Komponenten

### Wiederverwendbare Elemente

| Komponente | Beschreibung | Verwendet in |
|------------|--------------|--------------|
| `.bamberg-corner` | Gradient-Eckenakzent | Cards, Info-Boxen |
| `.nav-panel` | Contextual Navigation Panel | Header (index.html) |
| `.section-number` | Nummerierte Sections (01, 02...) | Alle Inhaltsseiten |
| `.program-card` | Studiengang-Karte | wiai/studiengaenge.html |
| `.schwerpunkt-card` | Forschungs-Karte | wiai/forschung.html |
| `.lehrstuhl-card` | Lehrstuhl-Karte | wiai/forschung.html |
| `.filter-chip` | Filter-Element | wiai/studiengaenge.html |
| `.key-facts-bar` | Sticky Fakten-Leiste | wiai/angewandte-informatik-bsc.html |
| `.faq-item` | Accordion FAQ | wiai/angewandte-informatik-bsc.html |

### Farbschema

```css
--color-primary: #1B3A4B     /* Uni-Blau */
--color-secondary: #C4652E   /* Orange-Akzent */
--color-sand: #E8DCC4        /* Hintergrund warm */
--color-green: #2D5A3D       /* Erfolg/Status */
--color-wiai: #5B4B8A        /* WIAI Fakultatsfarbe */
```

---

## Navigationskonzept

### Desktop: Contextual Panels

Statt klassischem Mega-Menu offnet jeder Hauptnavigationspunkt ein kuratiertes Panel:

```
┌──────────────────────────────────────────────────────────────┐
│                                                              │
│  [Featured Image]           Quick Links        Fur...        │
│  ─────────────────         ────────────       ──────         │
│  Headline zum               · Link 1          > Typ A        │
│  aktuellen Bereich          · Link 2          > Typ B        │
│                             · Link 3          > Typ C        │
│  [CTA Button]               · Alle anzeigen →                │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### Mobile: Accordion

Gestaffelte Ebenen mit Chevron-Animation:
- Level 1: Hauptbereiche (touch to expand)
- Level 2: Unterbereiche (links)

---

## Templates

### Seiten-Templates

1. **Startseite** (`index.html`)
   - Hero mit Suchfeld
   - Quick Links Grid
   - News-Bereich
   - Fakultaten-Kacheln
   - Forschungs-Highlights

2. **Bereichsseite** (`studium.html`, `wiai/index.html`)
   - Hero mit Breadcrumb
   - Intro-Text
   - Nummerierte Sections
   - CTA-Banner

3. **Hub-Seite** (`wiai/studiengaenge.html`)
   - Hero
   - Filter-Leiste (sticky)
   - Card-Grid mit Gruppierung

4. **Detail-Seite** (`wiai/angewandte-informatik-bsc.html`)
   - Hero mit Breadcrumb
   - Key Facts Bar (sticky)
   - Seiten-Navigation
   - Content-Sections mit Nummern
   - FAQ-Accordion
   - Kontakt-Cards

5. **Forschungsbereich** (`wiai/forschung.html`)
   - Hero mit Statistiken
   - Schwerpunkt-Cards
   - Projekt-Cards
   - Lehrstuhl-Grid
   - Partner-Logos
   - CTA fur Promotion/Kooperation

6. **Artikel** (`artikel.html`)
   - Artikel-Header mit Meta
   - Rich Text Content
   - Related Articles

---

## Nachste Schritte (Priorisiert)

1. **Studiengangs-Finder** - Filter-Interface fur alle Studiengange
2. **Personen-Detail** - Template fur Mitarbeiter-Profile
3. **News-Ubersicht** - Nachrichten mit Kategorie-Filter
4. **Kontakt-Seite** - Allgemeine Kontaktseite mit Karte

---

## Technische Hinweise

- **Server starten:** `python3 -m http.server 8000` im Parent-Verzeichnis
- **Fonts:** Google Fonts (Playfair Display + Inter)
- **Dark Mode:** `Ctrl/Cmd + D` oder System-Praferenz
- **Responsiv:** Mobile-first, Breakpoints bei 768px, 1024px, 1280px
