# Uni Bamberg Static Site Generator

Minimaler Static Site Generator für das Uni Bamberg Mockup. Generiert **alle Seiten** inkl. Homepage und Spezialseiten.

## Verwendung

```bash
python build.py              # Alle 11 Seiten bauen
python build.py studium      # Einzelne Seite bauen
```

## Generierte Seiten (11 total)

- ✅ `index.html` - Homepage (full_page)
- ✅ `studium.html` - Hauptseite Studium
- ✅ `artikel.html` - Artikel-Seite
- ✅ `wiai/index.html` - WIAI Fakultät (custom_structure)
- ✅ 7x WIAI-Unterseiten (studium, faq, bewerbung, beratung, im-studium, karriere, kontakt)

## Struktur

### Content (`content/`)
Seiteninhalt - abhängig vom Seitentyp:

```
content/
├── index.html             # Komplette Homepage (full_page: true)
├── studium.html           # Hero + Content (Standard)
├── artikel.html           # Hero + Content (Standard)
├── wiai/index.html    # Hero + Subnav + Main (custom_structure: true)
└── wiai/
    ├── studium.html       # Hero + Content (Standard)
    ├── faq.html
    └── ...
```

### Partials (`partials/`)
Wiederverwendbare Template-Teile:
- `header.html` - Site-Header mit Navigation
- `footer.html` - Site-Footer
- `breadcrumb.html` - Generisches Breadcrumb
- `breadcrumb-wiai.html` - WIAI-spezifisches Breadcrumb
- `subnav-wiai.html` - WIAI Subnavigation
- `styles-fakultaet-wiai.css` - Inline-CSS für wiai/index.html

### Konfiguration (`pages.json`)

**Standard-Seite:**
```json
"studium": {
  "title": "Studium",
  "description": "...",
  "body_class": "subpage",
  "nav_studium": true,
  "breadcrumb_current": "Studium"
}
```

**WIAI-Seite:**
```json
"wiai/studium": {
  "title": "Studium | Fakultät WIAI",
  "breadcrumb": "breadcrumb-wiai",
  "subnav": "subnav-wiai",
  "breadcrumb_current": "Studium",
  "subnav_studium": true
}
```

**Custom-Struktur (fakultaet-wiai):**
```json
"fakultaet-wiai": {
  "title": "Fakultät WIAI",
  "inline_styles_file": "styles-fakultaet-wiai.css",
  "custom_structure": true,
  "no_breadcrumb": true
}
```

**Full-Page (index):**
```json
"index": {
  "title": "Universität Bamberg",
  "full_page": true
}
```

## Template-System

### Variablen

- `{{title}}` - Seitentitel
- `{{description}}` - Meta-Description
- `{{body_class}}` - Body-Klasse
- `{{root_path}}` - Pfad zum Root (z.B. `../`)
- `{{css_path}}` - Pfad zu CSS
- `{{breadcrumb_current}}` - Aktueller Breadcrumb-Eintrag
- `{{breadcrumb_parent}}` - Übergeordneter Breadcrumb-Eintrag
- `{{breadcrumb_parent_url}}` - URL des übergeordneten Eintrags

### Conditionals

```html
{{#nav_studium}} class="active"{{/nav_studium}}
```

Invertiert:
```html
{{^hero_degree}}<span class="page-hero-label">{{hero_label}}</span>{{/hero_degree}}
```

### Optionale Partials

**Breadcrumb:**
- Standard: `breadcrumb.html` (automatisch für alle Seiten außer Homepage)
- Custom: `breadcrumb: "breadcrumb-wiai"` in pages.json
- Deaktivieren: `no_breadcrumb: true`

**Subnav:**
```json
"subnav": "subnav-wiai"
```

## Seitentypen

### 1. Standard-Seiten (studium.html, artikel.html)
- **Struktur:** Header → Breadcrumb → Main(Hero + Content) → Footer
- **Breadcrumb:** generisch (`breadcrumb.html`)
- **Kein Subnav**
- **Hero:** `.page-hero--with-image` oder `.page-hero--immersive`

### 2. WIAI-Seiten (wiai/studium.html, etc.)
- **Struktur:** Header → Breadcrumb → Subnav → Main(Hero + Content) → Footer
- **Breadcrumb:** `breadcrumb-wiai.html`
- **Subnav:** `subnav-wiai.html` (sticky)
- **Hero:** `.page-hero--fakultaet`

### 3. Custom-Struktur (wiai/index.html)
- **Struktur:** Header → Hero + Subnav + Main → Footer
- **Flag:** `custom_structure: true`
- **Inline-Styles:** `inline_styles_file: "styles-fakultaet-wiai.css"`
- **Kein Breadcrumb** (`no_breadcrumb: true`)

### 4. Full-Page (index.html)
- **Struktur:** Komplette HTML-Datei (von `<!DOCTYPE>` bis `</html>`)
- **Flag:** `full_page: true`
- **Keine Partials** - Content ist die vollständige Seite

## Konfigurationsoptionen

### Basis
- `title` - Seitentitel
- `description` - Meta-Description
- `body_class` - CSS-Klasse für `<body>`

### Navigation
- `nav_studium`, `nav_fak`, etc. - Aktiver Menüpunkt
- `breadcrumb: "partial-name"` - Custom Breadcrumb-Partial
- `breadcrumb_current` - Aktueller Breadcrumb-Text
- `breadcrumb_parent`, `breadcrumb_parent_url` - Übergeordneter Link
- `subnav: "partial-name"` - Subnav-Partial einfügen

### Spezialseiten
- `full_page: true` - Content ist komplette HTML-Seite
- `custom_structure: true` - Content enthält Hero + Subnav + Main (nicht wrappen)
- `inline_styles_file: "file.css"` - Inline-CSS aus Partial laden
- `no_breadcrumb: true` - Kein Breadcrumb rendern
- `hero_class: "class-name"` - Zusätzliche Klasse am Hero-Section (z.B. für Inline-Styles)

## Hero-Varianten

Im Content-HTML:
- `.page-hero` - Basis (kompakt, Gradient)
- `.page-hero--with-image` - Mit Hintergrundbild
- `.page-hero--immersive` - Groß/immersiv (Artikel)
- `.page-hero--fakultaet` - Fakultäts-Hero mit Stats
