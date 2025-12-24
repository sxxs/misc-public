#!/bin/bash
# Uni-Bamberg Crawler - Flexibel mit Start-URL und Tiefe
#
# Defaults: Nur HTML, alle Links verfolgen, Tiefe 1
# Optionen zum Ändern der Defaults:
#   --with-assets   Auch CSS/JS/Bilder laden
#   --no-images     CSS/JS laden, aber keine Bilder
#   --strict        Nur Unterseiten der Start-URL (kein --follow-all)
#   --from-list     URLs aus Datei crawlen (z.B. to_crawl.txt)

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

# --from-list: URLs aus Datei crawlen
if [[ "$1" == "--from-list" ]]; then
    LIST_FILE="${2:-$SCRIPT_DIR/to_crawl.txt}"
    if [[ ! -f "$LIST_FILE" ]]; then
        echo "Fehler: Datei nicht gefunden: $LIST_FILE"
        exit 1
    fi

    total=$(wc -l < "$LIST_FILE" | tr -d ' ')
    count=0
    echo "=== Crawle URLs aus Liste ==="
    echo "Datei: $LIST_FILE"
    echo "URLs:  $total"
    echo ""

    while IFS= read -r url || [[ -n "$url" ]]; do
        [[ -z "$url" ]] && continue
        [[ "$url" == \#* ]] && continue  # Kommentare überspringen
        ((count++))
        echo "[$count/$total] $url"
        # Rekursiver Aufruf ohne --from-list, Tiefe 0 = nur diese Seite
        "$0" "$url" 0
        echo ""
    done < "$LIST_FILE"

    echo "Fertig! $count URLs gecrawlt."
    exit 0
fi

# Defaults
DEFAULT_URL="https://www.uni-bamberg.de/"
DEFAULT_LEVEL=1
OUTPUT_DIR="./output"

# Neue Defaults: HTML-only und follow-all sind AN
HTML_ONLY=1
WITH_ASSETS=""
NO_IMAGES=""
STRICT_MODE=""

# Optionen parsen
while [[ $# -gt 0 ]]; do
  case $1 in
    --with-assets)
      HTML_ONLY=""
      WITH_ASSETS=1
      shift
      ;;
    --no-images)
      HTML_ONLY=""
      NO_IMAGES=1
      shift
      ;;
    --strict)
      STRICT_MODE=1
      shift
      ;;
    -*)
      echo "Unbekannte Option: $1"
      echo "Usage: ./crawl.sh [URL] [LEVEL] [OPTIONS]"
      echo "       ./crawl.sh --from-list [FILE]"
      echo ""
      echo "Defaults: Nur HTML, alle Links verfolgen, Tiefe 1"
      echo ""
      echo "Optionen:"
      echo "  --with-assets  Auch CSS/JS/Bilder/Fonts laden"
      echo "  --no-images    CSS/JS laden, aber keine Bilder"
      echo "  --strict       Nur Unterseiten der Start-URL crawlen"
      echo "  --from-list    URLs aus Datei crawlen (default: to_crawl.txt)"
      exit 1
      ;;
    *)
      if [[ -z "$URL" ]]; then
        URL="$1"
      elif [[ -z "$LEVEL_SET" ]]; then
        LEVEL="$1"
        LEVEL_SET=1
      fi
      shift
      ;;
  esac
done

# Defaults setzen falls nicht angegeben
URL="${URL:-$DEFAULT_URL}"
LEVEL="${LEVEL:-$DEFAULT_LEVEL}"

# URL normalisieren (trailing slash hinzufügen falls nötig)
[[ "$URL" != */ ]] && URL="$URL/"

# https:// hinzufügen falls nicht vorhanden
[[ "$URL" != http* ]] && URL="https://$URL"

mkdir -p "$OUTPUT_DIR"

# Asset-Optionen aufbauen (Default: nur HTML)
PAGE_REQ=""
REJECT_OPT="--reject jpg,jpeg,png,gif,webp,svg,ico,css,js,woff,woff2,ttf,eot,pdf,mp4,webm"
MODE_DESC="Nur HTML"
TIMESTAMP_OPT=""
TIMESTAMP_MSG="(Kein Caching - HTML ist schnell)"

if [[ -n "$WITH_ASSETS" ]]; then
  PAGE_REQ="--page-requisites"
  REJECT_OPT=""
  MODE_DESC="Alles (HTML + Assets)"
  TIMESTAMP_OPT="-N"
  TIMESTAMP_MSG="(Timestamping: existierende Dateien werden übersprungen)"
elif [[ -n "$NO_IMAGES" ]]; then
  PAGE_REQ="--page-requisites"
  REJECT_OPT="--reject jpg,jpeg,png,gif,webp,svg,ico,pdf,mp4,webm"
  MODE_DESC="HTML + CSS/JS (keine Bilder)"
  TIMESTAMP_OPT="-N"
  TIMESTAMP_MSG="(Timestamping: existierende Dateien werden übersprungen)"
fi

# Default: alle Links verfolgen (kein --no-parent)
# Mit --strict nur Unterseiten der Start-URL
NO_PARENT_OPT=""
if [[ -n "$STRICT_MODE" ]]; then
  NO_PARENT_OPT="--no-parent"
  MODE_DESC="$MODE_DESC (nur Unterseiten)"
fi

echo "=== Uni-Bamberg Crawler ==="
echo "URL:    $URL"
echo "Tiefe:  $LEVEL"
echo "Assets: $MODE_DESC"
echo "Output: $OUTPUT_DIR"
echo "$TIMESTAMP_MSG"
echo ""

wget \
  --recursive \
  --level="$LEVEL" \
  $PAGE_REQ \
  --convert-links \
  --adjust-extension \
  $NO_PARENT_OPT \
  $TIMESTAMP_OPT \
  $REJECT_OPT \
  --domains=uni-bamberg.de,www.uni-bamberg.de \
  --directory-prefix="$OUTPUT_DIR" \
  --wait=1 \
  --random-wait \
  --user-agent="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36" \
  "$URL"

echo ""
echo "Crawling abgeschlossen!"
echo "Dateien in: $OUTPUT_DIR/"
