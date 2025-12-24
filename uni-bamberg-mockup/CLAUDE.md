# CLAUDE.md

Redesign-Projekt für die Website der Universität Bamberg.

## Development

```bash
python3 -m http.server 8000   # Lokaler Server (im mockup/ Ordner)
```

## Struktur

### Mockups (`mockup/`)
- `index.html`, `artikel.html`, `components.html` - Hauptseiten
- `wiai/` - WIAI-Fakultätsseiten (studium, studiengaenge, forschung, beratung, karriere, kontakt, faq, bewerbung, etc.)

### Design-System (`mockup/styles.css`)
- CSS Custom Properties für Design-Tokens
- Farbpalette: Primär-Blau (#1B3A4B), Orange (#C4652E), Sand (#E8DCC4), Grün (#2D5A3D)
- Fonts: Vollkorn (Headlines) + Inter (Body)
- Dark Mode via `[data-theme="dark"]`

### Crawler & Extraktion (`crawler/`)

Siehe [`crawler/README.md`](crawler/README.md) für Details zu Crawling, Extraktion und Cluster-Logik.

### Extrahierte Inhalte (`crawler/extracted/`)
- `clusters/` - Gecrawlte Inhalte gruppiert nach Themenbereich (Markdown)
- `cluster-summaries/` - Kurze Zusammenfassungen jedes Clusters
- `pages.json`, `struktur.json` - Strukturierte Metadaten

**Wichtig:** Für Inhalts-Überprüfung der Mockups: Erst `cluster-summaries/` lesen, dann bei Bedarf in `clusters/` nachschlagen.
