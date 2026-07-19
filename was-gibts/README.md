# Was gibt's?

Familien-Essensentscheider. Statische Seite, keine Serverkomponente, keine Konten.
Der Zustand liegt im `localStorage` des jeweiligen Geräts. Übertragen wird per QR-Code
oder per Code zum Abtippen.

## Auf GitHub Pages veröffentlichen

1. Neues Repository anlegen, diese Dateien in den Wurzelordner legen.
2. Settings -> Pages -> Source: `Deploy from a branch`, Branch `main`, Ordner `/ (root)`.
3. Nach ein paar Minuten liegt die Seite unter `https://<name>.github.io/<repo>/`.

HTTPS ist Pflicht, sonst funktionieren weder Service Worker noch Kamera. GitHub Pages
liefert das mit.

## Auf dem Tablet als App installieren

- iPadOS/Safari: Teilen -> "Zum Home-Bildschirm"
- Android/Chrome: Menü -> "App installieren"

Danach läuft die Seite offline.

## Ablauf

1. Jeder öffnet die Seite auf seinem Gerät und sichtet unter "Sichtung" die 100 Gerichte.
2. Wer mag, spielt anschließend ein paar Duelle unter "Turnier".
3. Unter "Übertragen" erzeugt jeder seinen Code und zeigt den QR-Code dem Tablet.
   Alternative ohne Kamera: den QR-Code mit der normalen Kamera-App öffnen, der Link
   liest den Stand direkt ein. Oder die Zeichenfolge abtippen.
4. Auf dem Tablet stehen dann unter "Ergebnis" und "Wochenplan" die ausgewerteten Daten.

## Gerichteliste ändern

Die Liste steht in `dishes.json` (Felder: `n` Name, `b` Basis, `p` Protein, `e` Aufwand
0-3, `t` Tags). Der Service Worker arbeitet network-first: Nach einem Commit reicht es,
die Seite auf jedem Gerät einmal mit Netz neu zu laden.

**Regeln, damit alte Codes und Bewertungen gültig bleiben:**

- **Neue Gerichte nur ans Ende anfügen.** Die Position in der Datei ist die feste ID
  eines Gerichts; Bewertungen und Übertragungscodes hängen daran.
- **Nie mittendrin einfügen, löschen oder umsortieren.** Sonst rutschen alle IDs und
  die Bewertungen landen bei den falschen Gerichten.
- **Ausmustern statt löschen:** einem Gericht `"aus": true` geben. Es verschwindet aus
  Sichtung, Ergebnis und Wochenplan, hält aber die IDs der übrigen stabil.
- Umbenennen und Felder korrigieren (`b`, `p`, `e`, `t`) ist jederzeit erlaubt.
- Maximal 511 Einträge (Codeformat).

Neue Gerichte tauchen bei allen automatisch in der Sichtung auf – jeder bewertet nach
und nach nur die noch fehlenden. Codes von Geräten mit einer älteren Liste lassen sich
weiterhin einlesen; nur umgekehrt (Code von neuerer Liste auf altem Stand) muss das
Gerät erst neu laden.

## Meinung ändern

Unter "Sichtung" -> "Alle Bewertungen ansehen" (bzw. "Bewertungen ändern", wenn jemand
schon durch ist) steht die komplette Liste mit Suchfeld. Dort lässt sich jede Bewertung
einzeln umstellen; die Änderung gilt sofort und wandert mit dem nächsten Code aufs
Tablet.
