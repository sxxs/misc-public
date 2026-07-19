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

Die Liste steht als Array `D` in `index.html`. Wird sie geändert, passen alte Codes nicht
mehr und werden beim Einlesen abgewiesen. Alle Geräte sollten dieselbe Version benutzen.
Nach einer Änderung in `sw.js` den Cache-Namen `C` hochzählen, sonst liefert der Service
Worker die alte Fassung aus.
