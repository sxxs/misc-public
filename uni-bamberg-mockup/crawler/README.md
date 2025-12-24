# Crawler & Extraktion

Tools zum Crawlen und Extrahieren von Inhalten der uni-bamberg.de Website.

## Crawling

`crawl.sh` nutzt wget um Seiten zu laden.

```bash
# Basis-Nutzung (nur HTML, alle Links, Tiefe 1)
./crawl.sh

# Spezifische Seite crawlen
./crawl.sh www.uni-bamberg.de/wiai/ 2

# Mit Assets (CSS/JS/Bilder)
./crawl.sh www.uni-bamberg.de/wiai/ 1 --with-assets

# CSS/JS aber keine Bilder
./crawl.sh www.uni-bamberg.de/wiai/ 1 --no-images

# Nur Unterseiten (nicht alle Links verfolgen)
./crawl.sh www.uni-bamberg.de/wiai/ 2 --strict
```

**Defaults:** Nur HTML, alle Links verfolgen, Tiefe 1

**Optionen:**
- `--with-assets` - Auch CSS/JS/Bilder/Fonts laden
- `--no-images` - CSS/JS laden, aber keine Bilder
- `--strict` - Nur Unterseiten der Start-URL crawlen

**Output:** `output/`

## Extraktion

### extract.py - Strukturierte Daten (JSON)

```bash
python3 extract.py
```

**Output:**
- `extracted/pages.json` - Metadaten aller Seiten
- `extracted/struktur.json` - Hierarchische Seitenstruktur
- `extracted/missing_links.json` - Nicht gecrawlte Links
- `extracted/sitemap.md` - Übersicht
- `extracted/wiai/` - WIAI-spezifische Daten

### extract_content.py - Lesbarer Volltext (Markdown)

```bash
# Einzelne .md Dateien pro Seite
python3 extract_content.py

# Alles in einer Datei
python3 extract_content.py --single-file

# Nach URL-Präfix clustern (eine Datei pro Themenbereich)
python3 extract_content.py --cluster

# Mit Optionen
python3 extract_content.py --cluster --min-cluster-size 15
python3 extract_content.py --single-file --min-words 50 --output ../inhalt.md
```

**Output:**
- `extracted/content/` - Ein Markdown pro HTML
- `extracted/all_content.md` - Kombinierte Datei
- `extracted/clusters/` - Eine Datei pro Cluster

### Cluster-Logik

- Normale Seiten: Cluster nach 1. Pfad-Segment (`/nachhaltigkeit/...` → `nachhaltigkeit.md`)
- WIAI-Seiten: Cluster nach 2. Pfad-Segment (`/wiai/gbwiss/...` → `wiai-gbwiss.md`)
- Kleine Cluster (<10 Seiten): `wiai-sonstiges.md` bzw. `sonstiges-a-f.md` (alphabetisch aufgeteilt)

### Cluster-Summaries

`extracted/cluster-summaries/` enthält 2-Absatz-Zusammenfassungen jeder Cluster-Datei auf Deutsch. Nützlich für schnellen Überblick über Inhalte der gecrawlten Website.
