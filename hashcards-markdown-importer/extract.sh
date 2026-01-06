#!/bin/bash
# Extrahiert Vokabeln aus PDFs in work/ mit Claude (Sonnet)

cd "$(dirname "$0")"

# Prüfe ob PDFs vorhanden
if ! ls work/*.pdf &>/dev/null; then
    echo "Keine PDFs in work/ gefunden."
    exit 1
fi

claude --model sonnet --allowedTools "Read,Write,Glob,Bash" -p "
Lies die SPEC.md in diesem Verzeichnis für das Ausgabeformat.

Deine Aufgabe:
1. Lies alle PDFs in work/
2. Extrahiere die Vokabeln (Spalte 1: Latein, Spalte 2: Deutsch, Spalte 3: optionaler Kommentar)
3. Erzeuge für jedes PDF eine Markdown-Datei in output/latein-deutsch/ mit dem gleichen Basisnamen

Ausgabeformat pro Karte:
- Q: <lateinisch>
- A: <deutsch>
- <kommentar falls vorhanden, ohne Präfix>
- Leerzeile

Wichtig:
- Substantive mit Genitiv und Genus (z.B. 'rex, regis m.')
- Verben mit Stammformen wenn sichtbar
- OCR-Fehler korrigieren wenn offensichtlich
- Unleserliches mit [?] markieren
- Keine Nummerierungen, keine Überschriften, nur Q:/A: Karten
"
