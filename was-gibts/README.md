# Was gibt's?

Familien-Essensentscheider. Statische Seite, keine Serverkomponente, keine Konten.
Der Zustand liegt im `localStorage` des jeweiligen Geräts. Übertragen wird per QR-Code
oder per Code zum Abtippen.

Die laufende Version steht klein unter der Überschrift ("Version 1.10") - praktisch, um
auf jedem Gerät zu prüfen, ob die neue Fassung schon geladen ist. Beim Release in
`index.html` (Element `.ver`), in dieser Datei und in `CLAUDE.md` hochzählen.

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
3. Unter "Übertragen" erzeugt jeder seinen **Link** und schickt ihn ans Tablet -
   per Nachricht, oder indem das Tablet den QR-Code scannt. Die Reihenfolge ist egal,
   ein Personen-Link ändert nur diese eine Person.
4. Auf dem Tablet stehen dann unter "Ergebnis" (inkl. Bestenliste pro Person und für
   alle) und "Wochenplan" die ausgewerteten Daten.
5. Rückweg: Das Tablet erzeugt den **Familien-Link** (alle Personen, Pausenliste,
   übernommener Wochenplan und Zufriedenheits-Verlauf in einem Link) und schickt ihn
   in die Familiengruppe. Wer ihn antippt, bekommt einen Dialog und übernimmt.
   Achtung: Das überschreibt dort auch die eigene Person - wer seit der Abgabe
   weiterbewertet hat, gibt erst wieder ab und liest dann zurück. Der Dialog warnt,
   wenn auf dem Gerät mehr Bewertungen liegen als im Link stehen.

Der Wochenplan hat Mo-Fr je ein Abendessen (bevorzugt einfache Gerichte) und am
Wochenende Mittag- und Abendessen; ein Wochenendplatz ist Pizza, Burger oder Grillen
(Tag `grillen` bzw. Name), ein Platz gehört einem Experiment aus dem ganzen
Entdeckungspool. Über die Mittagessen-Chips (Mo-Fr, Auswahl bleibt gespeichert)
bekommen gewählte Werktage zusätzlich ein Mittagessen: sehr einfache Gerichte
(Aufwand 1) oder ab und zu "Reste vom Vorabend" (ohne Einkaufslisten-Zutaten).
Das Wochenende wird zuerst befüllt; reicht die Spitzengruppe (Top 44) nicht, rückt
der Rest der Liste nach, damit kein Platz leer bleibt. Die Abwechslungs-Limits
wachsen mit der Zahl der Mahlzeiten mit, Brotzeit zählt nicht gegen das Brot-Limit.

Ansicht: Der Plan steht als eine Zeile pro Tag - links der Tagesname, in der Mitte das
Mittagessen (klein und gedimmt), rechts das Abendessen. Dadurch stehen die Abendessen
aller Tage sauber untereinander. Tage ohne Mittagessen zeigen an der Stelle ein
"+ Mittagessen" zum Anschalten.

Steuerung im Wochenplan:

- **↻ Tauschen** ersetzt einen einzelnen Platz durch ein anderes passendes Gericht
  (Klassiker- und Experiment-Plätze behalten ihre Rolle, solange sie die einzigen sind).
- **🔍 Ersetzen** öffnet die Volltextsuche über die ganze Gerichteliste (Name, Tags,
  Basis, Zutaten, "Was ist das?"). Jeder Treffer zeigt, wie jede Person das Gericht
  bewertet hat und um wie viel Prozent sich der Familien-Schnitt ändert. Ohne
  Suchbegriff stehen dort Vorschläge, die der aktuell schlechtesten Person am meisten
  helfen. Auf Mittag-Plätzen lässt sich auch "Reste vom Vorabend" wählen, jeder Platz
  lässt sich leeren. Von Hand gesetzte Gerichte werden automatisch gepinnt und bleiben
  auch dann stehen, wenn die Automatik sie nie ziehen würde (außer Saison, vier Vetos).
- **Ziehen (Griff ⠿)**: Karte auf Karte tauscht zwei Essen - Mittag gegen Abend am
  selben Tag oder von Tag zu Tag. Tagesleiste auf Tagesleiste tauscht zwei ganze Tage
  (Mittagessen wechseln nur, wenn beide Tage eines haben). Mit der Maus lässt sich auch
  die ganze Karte ziehen, auf dem Touchscreen nur der Griff. "Reste vom Vorabend"
  landen nur auf einem Mittagessen ab Dienstag - sonst zeigt das Ziel einen roten
  Rahmen und die App sagt, warum nichts passiert ist.
- **📌 Pinnen** schützt einen Platz beim Neu-Würfeln ("Donnerstag ist gesetzt").
- **Zufriedenheit**: Über dem Plan steht für jede Person ein Balken, der sich bei jeder
  Änderung sofort mitrechnet (gern = 100 %, geht so = 50 %, unbekannt = 37 %, Veto mit
  Extrawurst = 25 %). Daneben stehen die Werte der letzten übernommenen Pläne, dazu ein
  Hinweis, wer diesmal am kürzesten wegkommt - und ob das schon in der Vorwoche so war.
  So lässt sich gezielt eine Woche später ausgleichen. Der Verlauf merkt sich dafür die
  letzten acht übernommenen Pläne (die Wiederholungs-Bremse nutzt weiter nur die
  letzten zwei).
- **Plan übernehmen** friert den Plan ein: Er bleibt beim Tab-Wechsel stehen und lässt
  sich als Text teilen; dazu gibt es eine **Einkaufsliste** aus den Hauptzutaten
  (Feld `z` in dishes.json). "✎ Plan bearbeiten" holt den übernommenen Plan als
  Entwurf zurück (alle Plätze gepinnt, der Verlaufseintrag wird zurückgenommen);
  Mittagessen-Tage des Plans werden dabei dazugeschaltet, die gespeicherte
  Chip-Auswahl bleibt erhalten. "Neuen Plan machen" startet den nächsten Entwurf
  von vorn.
- **Wiederholungs-Bremse**: Gerichte der letzten zwei übernommenen Pläne werden
  gemieden (Brotzeit und Pizza/Burger/Grillen dürfen sich wiederholen).
- **Brotzeit-Woche**: Haken setzen, wenn Brot da ist - der Plan legt zweimal Brotzeit
  auf Mo/Di oder Di/Mi (Gerichte mit Tag `brotzeit`).
- **Pausierte Gerichte**: global abschalten, was gerade nicht geht (Raclette ohne
  Gerät, Grillen ohne Grill-Saison). Fliegt aus dem Plan, Bewertungen bleiben; die
  Pausenliste wandert mit dem Familien-Code auf die anderen Geräte.

Vetos und Extrawurst:

- Bis zu drei Vetos blockieren ein Gericht nicht: Es ist im Wochenplan erlaubt und
  wird mit "Extrawurst für X, Y" markiert (höchstens zwei Extrawurst-Essen pro
  Woche, niemand braucht zweimal pro Woche eine). Jedes Veto kostet 1,5 Punkte -
  Mehrfach-Veto-Gerichte wie Lachs kommen so vor, aber selten. Ab vier Vetos ist
  das Gericht raus.
- Die App schlägt als Extrawurst ein Gericht vor, das alle Veto-Leute "gern" oder
  "geht so" mögen (einfach, verfügbar, in Saison) - im übernommenen Plan, im
  geteilten Text und in der Einkaufsliste samt Zutaten.
- Saison-Tags: `sommer`-Gerichte pausieren Nov-Mär automatisch, `winter`-Gerichte
  (Raclette, Fondue, Kürbissuppe) Mai-Sep - nur im Wochenplan.

Auswertungen unter "Ergebnis": Streit-Index (größte Meinungsspreizung), Unentdeckte
Perlen (mag jeder, zieht der Plan aber nie), Veto-Bilanz (wer allein wie viel
blockiert, mit Probier-Kandidaten), Turnier-Check (Favoriten, die fast jedes Duell
verlieren - Kandidaten fürs Revidieren).

Sicherung: Unter "Übertragen" lässt sich der komplette Gerätestand als Datei
herunterladen und wieder einlesen (inkl. Duell-Zähler und Mittagessen-Auswahl - noch
etwas mehr als der Familien-Link abdeckt).

Turnier und Revidieren:

- Wird ein Favorit unter "Sichtung" heruntergestuft, fliegt er aus dem Turnier-Ranking.
- Neu oder wieder auf "gern" gestufte Gerichte haben Duellzähler 0 und kommen bei den
  nächsten Duellen zuerst dran - so wiederholt man gezielt die Teile des Turniers,
  die nicht mehr passen. "Turnier neu starten" pro Person gibt es auch.
- Die Startseite zeigt pro Person eine Duell-Empfehlung ("noch ~X Duelle").

## Übertragen per Link

Jeder Stand passt in einen Link; alles Interessante steht im Fragment hinter dem `#`
und wird deshalb nie an einen Server geschickt.

| Link | Inhalt | Länge |
| --- | --- | --- |
| Person | Bewertungen und Duell-Ranking einer Person | ~90 Zeichen |
| Ganze Familie | alle fünf Personen, Pausenliste, Wochenplan, Verlauf | ~490 Zeichen |
| Nur Wochenplan | der übernommene Plan, sonst nichts | ~25 Zeichen |

- **Erzeugen** unter "Übertragen"; den Wochenplan-Link gibt es zusätzlich direkt im
  Wochenplan ("🔗 Plan-Link"). Jede Karte hat einen QR-Code, "Link teilen" (öffnet das
  Teilen-Menü des Geräts) und "Link kopieren". Der abtippbare Code steht eingeklappt
  darunter, falls ein Link unterwegs zerbricht.
- **Einlesen:** Wer den Link antippt, bekommt zuerst einen Dialog: Was steckt drin
  (welche Personen, wie viele Bewertungen, Pausenliste, Plan, Verlauf), was wird
  überschrieben - mit einem Häkchen je Teil zum Abwählen. Erst "Übernehmen" ändert
  etwas. Danach steht oben ein **Rückgängig**: Der Stand von vor dem Einlesen wird
  gesichert und lässt sich einen Tag lang mit einem Klick zurückholen.
- **iPhone/iPad mit App auf dem Home-Bildschirm:** Diese App hat einen eigenen
  Speicher, getrennt von Safari. Ein Link aus WhatsApp öffnet den Browser und landet
  deshalb dort. Deswegen nimmt das Feld "Link oder Code einlesen" auch einen ganzen
  eingefügten Link an - so wirkt er in der App, in der man ihn einfügt.
- **Codeformat:** Der Code ist bitgepackt (3 Bit je Bewertung) und dann Base64url -
  in dieser Form kleiner als jede nachträgliche Komprimierung (gzip darauf wird
  größer, gemessen). Wochenplan und Verlauf hängen als eigene Blöcke hinten dran:
  Ältere App-Stände lesen sie nicht und ignorieren sie, ältere Codes liefern an der
  Stelle nichts - beide Richtungen bleiben also lesbar. Der Plan-Link nutzt den
  Personen-Index 6, ältere Stände melden dafür sauber "Unbekannte Person im Code".

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
