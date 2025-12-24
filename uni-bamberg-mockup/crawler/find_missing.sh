#!/bin/bash
#
# Findet fehlende URLs im Crawl-Output
#
# Verwendung:
#   ./find_missing.sh              # Listet alle fehlenden URLs
#   ./find_missing.sh --select     # Interaktive Auswahl für späteren Crawl
#   ./find_missing.sh --refresh    # Regeneriert missing_links.json vor Ausgabe
#
# Output:
#   to_crawl.txt - Markierte URLs (bei --select)

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
EXTRACTED="$SCRIPT_DIR/extracted"
MISSING_JSON="$EXTRACTED/missing_links.json"
TO_CRAWL="$SCRIPT_DIR/to_crawl.txt"

# Prüfe ob jq installiert ist
if ! command -v jq &> /dev/null; then
    echo "Fehler: jq nicht installiert."
    echo "Installieren mit: brew install jq"
    exit 1
fi

# extract.py ausführen wenn nötig oder --refresh
if [[ ! -f "$MISSING_JSON" ]] || [[ "$1" == "--refresh" ]]; then
    echo "Generiere missing_links.json..."
    python3 "$SCRIPT_DIR/extract.py"
    echo ""
fi

# Modus: --select = interaktiv, sonst Liste
if [[ "$1" == "--select" ]]; then
    # Interaktiver Auswahlmodus
    total=$(jq '.missing | length' "$MISSING_JSON")
    echo "Fehlende URLs: $total"
    echo "Enter = Markieren zum Crawlen, andere Taste = Überspringen"
    echo "---"

    > "$TO_CRAWL"  # Datei leeren
    selected=0
    count=0

    # Alle Einträge als Tab-separierte Zeilen: url\tcount\tcategory
    jq -r '.missing[] | [.url, .count, .category] | @tsv' "$MISSING_JSON" | \
    while IFS=$'\t' read -r url refs category; do
        ((count++))
        full_url="www.uni-bamberg.de${url}"

        echo -n "[$count/$total] $full_url ($refs Refs, $category) [Enter=Ja]: "
        read -rsn1 key </dev/tty

        if [[ -z "$key" ]]; then  # Enter gedrückt
            echo "$full_url" >> "$TO_CRAWL"
            ((selected++))
            echo " ✓"
        else
            echo " -"
        fi
    done

    selected_count=$(wc -l < "$TO_CRAWL" 2>/dev/null | tr -d ' ')
    echo "---"
    echo "Gespeichert: $TO_CRAWL ($selected_count URLs)"
    echo "Crawlen mit: ./crawl.sh --from-list to_crawl.txt"
else
    # Einfache Liste ausgeben
    jq -r '.missing[].url | "www.uni-bamberg.de\(.)"' "$MISSING_JSON"
fi
