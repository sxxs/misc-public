#!/bin/bash
# Erzeugt Deutsch→Latein Karten aus Latein→Deutsch

cd "$(dirname "$0")"

for src in output/latein-deutsch/*.md; do
    [ -f "$src" ] || continue

    name=$(basename "$src")
    dst="output/deutsch-latein/$name"

    echo "Konvertiere: $name"

    awk '
    BEGIN { q=""; a=""; }

    /^Q: / {
        # Neue Karte - vorherige ausgeben falls vorhanden
        if (q != "" && a != "") {
            print "Q: " a
            print "A: " q
            print ""
        }
        q = substr($0, 4)
        a = ""
        next
    }

    /^A: / {
        a = substr($0, 4)
        next
    }

    # Kommentarzeilen ignorieren (gehören zur lateinischen Form)
    /^[^Q][^A]/ && !/^$/ {
        next
    }

    END {
        # Letzte Karte ausgeben
        if (q != "" && a != "") {
            print "Q: " a
            print "A: " q
            print ""
        }
    }
    ' "$src" > "$dst"
done

echo "Fertig."
