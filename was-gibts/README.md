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

1. Jeder öffnet die Seite auf seinem Gerät und sichtet unter "Sichtung" die Gerichte.
2. Wer mag, spielt anschließend ein paar Duelle unter "Turnier".
3. Unter "Übertragen" erzeugt jeder seinen Code und zeigt den QR-Code dem Tablet.
   Alternative ohne Kamera: den QR-Code mit der normalen Kamera-App öffnen, der Link
   liest den Stand direkt ein. Oder die Zeichenfolge abtippen. Die Reihenfolge beim
   Einlesen ist egal - jeder Code ändert nur die eigene Person.
4. Auf dem Tablet stehen dann unter "Ergebnis" (inkl. Bestenliste pro Person und für
   alle) und "Wochenplan" die ausgewerteten Daten.
5. Rückweg: Das Tablet erzeugt unter "Übertragen" den **Familien-Code** (alle Personen
   in einem Code). Liest ein Gerät ihn ein, hat es den kompletten Familienstand.
   Achtung: Das überschreibt dort auch die eigene Person - wer seit der Abgabe
   weiterbewertet hat, gibt erst wieder ab und liest dann zurück.

Der Wochenplan hat Mo-Fr je ein Essen (bevorzugt einfache Gerichte) und am Wochenende
Mittag- und Abendessen; ein Wochenendplatz ist Pizza, Burger oder Grillen (Tag
`grillen` bzw. Name), ein Platz gehört dem Entdeckungspool.

Steuerung im Wochenplan:

- **↻ Tauschen** ersetzt einen einzelnen Platz durch ein anderes passendes Gericht
  (Klassiker- und Experiment-Plätze behalten ihre Rolle, solange sie die einzigen sind).
- **Brotzeit-Woche**: Haken setzen, wenn Brot da ist - der Plan legt zweimal Brotzeit
  auf Mo/Di oder Di/Mi (Gerichte mit Tag `brotzeit`).
- **Pausierte Gerichte**: global abschalten, was gerade nicht geht (Raclette ohne
  Gerät, Grillen ohne Grill-Saison). Fliegt aus dem Plan, Bewertungen bleiben; die
  Pausenliste wandert mit dem Familien-Code auf die anderen Geräte.

## Gerichteliste ändern

Die Liste steht in `dishes.json` (Felder: `n` Name, `b` Basis, `p` Protein, `e` Aufwand
0-3 mit 0 = wird geliefert, `t` Tags, `w` kindgerechte Erklärung "Was ist das?").
Der Service Worker arbeitet network-first: Nach einem Commit reicht es, die Seite auf
jedem Gerät einmal mit Netz neu zu laden.

Namen kindgerecht wählen; bei ausländischen Gerichten eine kurze Erklärung in `w`
mitgeben, sie erscheint in der Sichtung unter dem Namen. Der Tag `"grillen"` markiert
Grill-Gerichte für den Wochenend-Klassiker im Wochenplan (Pizza und Burger werden am
Namen erkannt).

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
