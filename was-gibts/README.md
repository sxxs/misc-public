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
- **📌 Pinnen** schützt einen Platz beim Neu-Würfeln ("Donnerstag ist gesetzt").
- **Plan übernehmen** friert den Plan ein: Er bleibt beim Tab-Wechsel stehen und lässt
  sich als Text teilen; dazu gibt es eine **Einkaufsliste** aus den Hauptzutaten
  (Feld `z` in dishes.json). "Neuen Plan machen" startet den nächsten Entwurf.
- **Wiederholungs-Bremse**: Gerichte der letzten zwei übernommenen Pläne werden
  gemieden (Brotzeit und Pizza/Burger/Grillen dürfen sich wiederholen).
- **Brotzeit-Woche**: Haken setzen, wenn Brot da ist - der Plan legt zweimal Brotzeit
  auf Mo/Di oder Di/Mi (Gerichte mit Tag `brotzeit`).
- **Pausierte Gerichte**: global abschalten, was gerade nicht geht (Raclette ohne
  Gerät, Grillen ohne Grill-Saison). Fliegt aus dem Plan, Bewertungen bleiben; die
  Pausenliste wandert mit dem Familien-Code auf die anderen Geräte.

Vetos und Extrawurst:

- Ein einzelnes Veto blockiert ein Gericht nicht mehr: Es ist im Wochenplan erlaubt
  und wird mit "Extrawurst für X" markiert (höchstens zwei pro Woche, nie zweimal
  für dieselbe Person). Ab zwei Vetos ist das Gericht raus.
- Saison-Tags: `sommer`-Gerichte pausieren Nov-Mär automatisch, `winter`-Gerichte
  (Raclette, Fondue, Kürbissuppe) Mai-Sep - nur im Wochenplan.

Auswertungen unter "Ergebnis": Streit-Index (größte Meinungsspreizung), Unentdeckte
Perlen (mag jeder, zieht der Plan aber nie), Veto-Bilanz (wer allein wie viel
blockiert, mit Probier-Kandidaten), Turnier-Check (Favoriten, die fast jedes Duell
verlieren - Kandidaten fürs Revidieren).

Sicherung: Unter "Übertragen" lässt sich der komplette Gerätestand als Datei
herunterladen und wieder einlesen (inkl. Duell-Zähler, Pausenliste, übernommenem
Plan - mehr als der Familien-Code abdeckt).

Turnier und Revidieren:

- Wird ein Favorit unter "Sichtung" heruntergestuft, fliegt er aus dem Turnier-Ranking.
- Neu oder wieder auf "gern" gestufte Gerichte haben Duellzähler 0 und kommen bei den
  nächsten Duellen zuerst dran - so wiederholt man gezielt die Teile des Turniers,
  die nicht mehr passen. "Turnier neu starten" pro Person gibt es auch.
- Die Startseite zeigt pro Person eine Duell-Empfehlung ("noch ~X Duelle").

## Gerichteliste ändern

Die Liste steht in `dishes.json` (Felder: `n` Name, `b` Basis, `p` Protein, `e` Aufwand
0-3 mit 0 = wird geliefert, `t` Tags, `w` kindgerechte Erklärung "Was ist das?",
`z` Hauptzutaten für die Einkaufsliste).
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
