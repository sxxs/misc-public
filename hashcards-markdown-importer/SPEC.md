# Hashcards Markdown Importer

Extrahiert Vokabeln aus gescannten PDF-Listen und erzeugt Hashcards-kompatible Markdown-Dateien.

## Verzeichnisstruktur

```
hashcards-markdown-importer/
├── SPEC.md
├── extract.sh          # Startet Claude zur PDF-Extraktion
├── reverse.sh          # Erzeugt Deutsch→Latein aus Latein→Deutsch
├── work/               # Input: PDF-Scans ablegen
│   └── *.pdf
└── output/             # Output: generierte Markdown-Dateien
    ├── latein-deutsch/
    │   └── *.md
    └── deutsch-latein/
        └── *.md
```

## PDF-Format (Input)

Die PDFs enthalten gescannte Vokabellisten mit 2-3 Spalten:

| Spalte 1 | Spalte 2 | Spalte 3 (optional) |
|----------|----------|---------------------|
| Lateinisch | Deutsch | Kommentar/Hinweis |

Beispiele:
- `amare` | `lieben` |
- `rex, regis m.` | `der König` | `auch: Herrscher`
- `videre, video, vidi, visum` | `sehen` |

## Ausgabeformat

### Latein → Deutsch (`output/latein-deutsch/*.md`)

```markdown
Q: amare
A: lieben

Q: rex, regis m.
A: der König
auch: Herrscher

Q: videre, video, vidi, visum
A: sehen
```

**Regeln:**
- `Q:` enthält den lateinischen Begriff (1. Spalte)
- `A:` enthält die deutsche Übersetzung (2. Spalte)
- Kommentar (3. Spalte) steht direkt unter der Übersetzung, ohne Präfix
- Leerzeile zwischen jeder Karte
- Keine zusätzlichen Formatierungen oder Nummerierungen

### Deutsch → Latein (`output/deutsch-latein/*.md`)

Wird automatisch aus Latein→Deutsch generiert (siehe `reverse.sh`):

```markdown
Q: lieben
A: amare

Q: der König
A: rex, regis m.

Q: sehen
A: videre, video, vidi, visum
```

**Hinweis:** Kommentare werden in der Rückrichtung weggelassen, da sie sich auf die lateinische Form beziehen.

## Workflow

### 1. PDFs extrahieren

```bash
./extract.sh
```

Startet Claude (Sonnet), das alle PDFs in `work/` analysiert und Markdown-Dateien in `output/latein-deutsch/` erzeugt.

### 2. Rückrichtung generieren

```bash
./reverse.sh
```

Erzeugt aus jeder `output/latein-deutsch/*.md` die entsprechende `output/deutsch-latein/*.md`.

## Hinweise für die Extraktion

- Substantive mit Genitiv und Genus angeben (z.B. "rex, regis m.")
- Verben mit Stammformen wenn vorhanden (z.B. "videre, video, vidi, visum")
- Bei mehreren Bedeutungen: alle durch Komma getrennt oder Hauptbedeutung
- OCR-Fehler wenn möglich korrigieren
- Unleserliche Stellen mit `[?]` markieren
