Ja. Es fehlen noch ein paar Entscheidungen, aber nicht so viele, dass man nicht schon eine solide PRD schreiben könnte.

Ich würde die PRD so aufsetzen, dass sie bereits baubar ist, aber an den kritischen Stellen bewusst Produktentscheidungen markiert. Die größte offene Frage ist nicht die Grundidee, sondern der Scope: Soll das Spiel in Phase 1 ein extrem schnelles, reibungsarmes Foto-Arcade-Spiel sein oder gleich ein social challenge game mit Rückspiel-Mechanik, Codes, OCR und Progression? Das macht einen massiven Unterschied.

Hier ist eine umfangreiche PRD als belastbarer Entwurf.

⸻

PRD – Mobile Browser Game auf Basis fotografischer Challenges

Arbeitstitel

Almost.
Untertitel: Mach ein Foto. Verfehl das Ziel knapp. Versuch’s nochmal.

Alternative Titel:
	•	Pixeljagd
	•	Photo Prompt Panic
	•	Kamera Karma
	•	Fast getroffen
	•	Dry Shot

⸻

1. Produktüberblick

1.1 Kurzbeschreibung

Ein mobiles Browserspiel, in dem Spielende mit ihrer Smartphone-Kamera Fotos aufnehmen, um visuelle Aufgaben möglichst gut zu erfüllen. Die Aufgabe ist nicht einfach „mach irgendwas Schönes“, sondern „erreiche ein messbares Bildziel“: zum Beispiel ein Bild, das überwiegend grün ist, oben hell und unten dunkel, fast symmetrisch wirkt oder ein bestimmtes Muster andeutet.

Das Spiel wertet das Foto direkt im Browser aus, gibt eine Punktzahl, zeigt eine Visualisierung des Zielbilds oder der Zielstruktur und kommentiert das Ergebnis mit trockenen, leicht spöttischen Sprüchen. Der Reiz entsteht durch:
	•	schnelle Versuche,
	•	knappe Verfehlungen,
	•	unmittelbares Feedback,
	•	steigende Absurdität der Aufgaben,
	•	und optional einen asynchronen Challenge-Modus gegen andere.

1.2 Kernversprechen

Das Spiel soll das Gefühl erzeugen:
	•	„Ach, fast.“
	•	„Okay, noch ein Versuch.“
	•	„Moment, das kriege ich besser hin.“
	•	„Was für eine absurde Aufgabe.“
	•	„Ich schicke das jemandem, mal sehen, ob die Person besser ist.“

1.3 Plattform

Primärplattform: mobiler Browser auf Smartphones
Ziel: keine Installation, sofort spielbar per Link
Technische Leitidee: client-side, schnell, leichtgewichtig, kameraorientiert

⸻

2. Problem und Opportunity

2.1 Problem

Viele Mobile Games im Browser sind entweder:
	•	sofort langweilig,
	•	zu werblich,
	•	zu kompliziert,
	•	oder basieren auf Standard-Mechaniken ohne Überraschung.

Kamerabasierte Browsergames existieren zwar, aber oft als Tech-Demos, Filter-Spielerei oder AR-Gimmick ohne starken Game Loop.

2.2 Opportunity

Fast jedes Smartphone hat:
	•	Kamera,
	•	Browser,
	•	genügend Rechenleistung für einfache Bildanalyse im Client,
	•	und eine reale Umgebung voller improvisierbarer Bildquellen.

Damit lässt sich ein Spiel bauen, das:
	•	physische Welt und Spielmechanik direkt verbindet,
	•	keine Accounts braucht,
	•	keine Assets in klassischem Sinn braucht,
	•	hohen Sharing-Reiz hat,
	•	und durch Prompts eine enorme Variantenvielfalt erzeugt.

⸻

3. Produktziele

3.1 Primäre Ziele
	1.	Wiederspielwert erzeugen
Spielende sollen nach einem Versuch sofort einen weiteren machen wollen.
	2.	Extrem geringe Einstiegshürde
Link öffnen, Kamera erlauben, spielen.
	3.	Klares, schnelles Feedback
Nach jedem Foto sofort Score, Erklärung und Zielvisualisierung.
	4.	Humor durch Tonalität
Trocken-komische Kommentare machen Misserfolge unterhaltsam.
	5.	Möglichst viel client-side
Bilder idealerweise nicht hochladen müssen.

3.2 Sekundäre Ziele
	1.	Asynchroner Vergleich mit Freund:innen
	2.	Prompts, die abwechslungsreich und steigerbar sind
	3.	Technisch robuste Auswertung im mobilen Browser
	4.	Gute Performance auch auf mittelmäßigen Geräten

3.3 Nicht-Ziele für MVP
	1.	Keine aufwendige AR
	2.	Keine Objekterkennung im Sinne „fotografiere einen Hund“
	3.	Keine Community-Galerie mit UGC-Moderation
	4.	Kein Echtzeit-Multiplayer
	5.	Keine große Bild-Cloud im Backend

⸻

4. Zielgruppe

4.1 Primäre Zielgruppe
	•	Jugendliche und junge Erwachsene
	•	Menschen, die kurze, kuriose, teilbare Mobile-Erlebnisse mögen
	•	Menschen, die Spaß an absurden Prompts und „Ach, fast“-Momenten haben

4.2 Sekundäre Zielgruppe
	•	Familien / Kinder mit Eltern
	•	Freundesgruppen
	•	Social-Media-affine Nutzer:innen
	•	Casual Gamer

4.3 Nutzungskontext
	•	zuhause
	•	unterwegs
	•	mit Freund:innen im Raum
	•	über Messenger geteilte Challenges
	•	kurze Sessions von 1–5 Minuten

⸻

5. Produktprinzipien
	1.	Sofort spielbar
Kein Konto, keine Hürden.
	2.	Lesbar statt mystisch
Das Spiel darf überraschend sein, aber nicht unverständlich. Nach jedem Versuch muss klarer werden, was die Aufgabe verlangt.
	3.	Humor statt Bestrafung
Scheitern soll lustig sein, nicht frustrierend.
	4.	Fast alles ist messbar
Challenges sollen auf einfach berechenbaren Bildmerkmalen beruhen.
	5.	Browser first
Mechaniken werden an Web-Realität angepasst, nicht umgekehrt.
	6.	Client-side by default
Datenschutz und Performance profitieren davon.

⸻

6. Core Gameplay

6.1 Grundloop
	1.	Spielende erhalten eine Challenge
	2.	Sie machen ein Foto oder laden eins hoch
	3.	Das Spiel analysiert das Bild
	4.	Es berechnet einen Score
	5.	Es zeigt:
	•	Ergebnis
	•	Nähe zum Ziel
	•	Zielvisualisierung / Idealbild / Overlay
	•	trockenen Kommentar
	6.	Spielende:
	•	probieren es erneut
	•	gehen zur nächsten Challenge
	•	teilen das Ergebnis
	•	starten eine Challenge gegen andere

6.2 Der eigentliche Hook

Nicht das Foto selbst ist der Inhalt, sondern die Diskrepanz zwischen Ziel und Ergebnis.
Die stärkste Emotion ist nicht „Ich habe gewonnen“, sondern:
	•	„Ich war bei 84 %.“
	•	„Jetzt weiß ich, was gemeint war.“
	•	„Das war fast ein Schachbrett.“
	•	„Okay, ich finde etwas Grüneres.“

⸻

7. Spielmodi

7.1 Solo Run (MVP)

Ein Run besteht aus z. B. 7 Challenges mit steigender Schwierigkeit.

Pro Challenge:
	•	bis zu 3 Versuche
	•	bestes Ergebnis zählt
	•	nach jedem Versuch Score + Kommentar
	•	nach Ende des Runs Gesamtpunktzahl, Rang, Replay

7.2 Daily Run (v1)
	•	alle bekommen dieselben 5–7 Challenges pro Tag
	•	gut für Vergleichbarkeit
	•	sharebar ohne direkte Freundescodes

7.3 Versus Code Challenge (v1/v2)

Spielende schicken anderen einen Code mit:
	•	Seed / Challenge-Reihenfolge
	•	optional sichtbaren Zwischenscores
	•	finalem Ergebnis
	•	optional 1–2 „Rückspiel“-Challenges

7.4 Endless Mode (v2)
	•	immer weiter
	•	steigende Schwierigkeit
	•	ein Fehlerbudget oder Zeitbudget
	•	Leaderboard nur optional

⸻

8. Challenge-System

8.1 Arten von Challenges

Challenges beruhen auf messbaren Bildparametern:

A. Globale Bildstatistik
	•	Helligkeit
	•	Dunkelheit
	•	durchschnittliche Sättigung
	•	durchschnittlicher Farbton
	•	Kontrast
	•	Grauheit / Farblosigkeit

B. Räumliche Verteilung
	•	oben hell / unten dunkel
	•	links rot / rechts grün
	•	Mitte dunkel / Rand hell
	•	drei vertikale Zonen mit verschiedenen Helligkeiten
	•	diagonale Verteilung

C. Verhältniswerte
	•	doppelt so viele dunkle wie helle Pixel
	•	ungefähr 60 % grün
	•	30 % rot, 30 % blau, Rest egal
	•	zwei Drittel neutral, ein Drittel stark farbig

D. Muster / Struktur
	•	abwechselnd hell / dunkel
	•	symmetrisch
	•	unruhig / viele Kanten
	•	ruhig / wenige Kanten
	•	grobes Schachbrett
	•	horizontale oder vertikale Streifen

E. Regionale Ziele
	•	nur die Mitte relevant
	•	vier Ecken sollen ähnlich sein
	•	linke obere Ecke deutlich heller als rechte untere
	•	Bildzentrum soll „anders“ sein als Rand

F. Text / OCR-nahe Ziele (eher v2)
	•	enthielt wahrscheinlich ein E
	•	nur ein dominanter Buchstabe
	•	maximal textarm / textreich
	•	Zielbuchstabe erkannt

8.2 Challenge-Design-Regeln

Jede Challenge braucht:
	1.	eine klare menschliche Formulierung
	2.	eine eindeutige Bewertungsfunktion
	3.	ein idealisiertes Referenzbild
	4.	eine visuelle Fehlererklärung
	5.	einen trockenen Kommentar-Pool

⸻

9. Scoring

9.1 Grundprinzip

Jede Challenge liefert einen Score von 0 bis 100.
100 bedeutet perfekte Zielerfüllung.
Schon 70–90 muss sich nach „fast geschafft“ anfühlen.

9.2 Score-Kategorien
	•	0–19: katastrophal daneben
	•	20–39: die Aufgabe wurde offenbar gelesen, aber nicht ernst genommen
	•	40–59: erkennbarer Versuch
	•	60–79: brauchbar, aber deutlich vorbei
	•	80–89: knapp
	•	90–99: sehr knapp
	•	100: perfekt oder auf Toleranzschwelle perfekt

9.3 Bewertungsmodell

Für jede Challenge gibt es:
	•	ein oder mehrere Zielmerkmale
	•	eine Distanzfunktion
	•	optional Gewichte
	•	eine Normalisierung auf 0–100

Beispiel:

Challenge: „Mach ein Bild, das zu 70 % grün ist.“
Messung:
	•	Anteil grüner Pixel im HSV-Farbraum
	•	Zielwert = 0,70
	•	Score = 100 - (|ist - soll| / Toleranz) * 100, gecappt

Challenge: „Oben hell, unten dunkel.“
Messung:
	•	obere Hälfte Durchschnittshelligkeit
	•	untere Hälfte Durchschnittshelligkeit
	•	Ziel: obere Hälfte signifikant heller
	•	Score aus Differenz plus Stabilität innerhalb der Hälften

9.4 Best-of-attempts

In einem Level mit mehreren Versuchen zählt der beste Score.
Das unterstützt das „nochmal, jetzt aber“-Gefühl.

⸻

10. Feedback-System

10.1 Direktes Feedback nach jedem Foto

Das Spiel zeigt:
	•	Score
	•	kurze Diagnose
	•	Visualisierung des Zielbildes
	•	Visualisierung des eigenen Bildes in vereinfachter Form
	•	Delta-Hinweis
	•	Kommentar

10.2 Idealbild / Overlay

Das ist ein zentrales Element.

Je nach Challenge:
	•	binäre Maske
	•	Heatmap
	•	Zonenmodell
	•	vereinfachte Farbflächen
	•	Muster-Vorschau
	•	„So hätte es ungefähr aussehen müssen“

Beispiel:
	•	Bei „oben hell, unten dunkel“ zeigt das Spiel ein halbes weißes / halbes schwarzes Referenzbild.
	•	Bei „Schachbrett“ zeigt es ein 4x4- oder 6x6-Idealraster.
	•	Bei „grau“ zeigt es eine graue Vollfläche plus Sättigungsanzeige.

10.3 Diagnose-Text

Nicht nur „gut / schlecht“, sondern spezifisch:
	•	„Zu bunt.“
	•	„Zu wenig Kontrast.“
	•	„Die Helligkeit sitzt eher links als oben.“
	•	„Das ist nicht grau. Das ist farblich uneinsichtig.“
	•	„Fast. Deine obere Hälfte ist nur leider unten.“

10.4 Tonalität

Die Kommentare sollen trocken, leicht spöttisch, aber nicht gemein wirken.

Beispiele:
	•	„Mutig. Inhaltlich aber ohne Bezug zur Aufgabe.“
	•	„Das Bild hat Ideen. Leider die falschen.“
	•	„Fast ein Schachbrett, wenn man Schach hasst.“
	•	„Beeindruckend grün. Für eine rote Aufgabe weniger hilfreich.“
	•	„Du warst erstaunlich nah dran. Das ist fast verdächtig.“
	•	„Technisch ein Foto. Spielerisch noch ausbaufähig.“

⸻

11. Progression und Schwierigkeit

11.1 Progressionsprinzip

Die Aufgaben sollen:
	•	anfangs glasklar und leicht sein,
	•	dann präziser,
	•	dann absurder,
	•	dann kombinatorischer.

11.2 Schwierigkeitsstufen

Stufe 1 – Einfach
	•	hell
	•	dunkel
	•	überwiegend rot
	•	möglichst grau

Stufe 2 – Verhältnis
	•	mehr grün als blau
	•	ungefähr halb hell / halb dunkel
	•	deutlich gesättigt
	•	wenig Kontrast

Stufe 3 – räumliche Verteilung
	•	oben hell, unten dunkel
	•	links farbig, rechts grau
	•	Mitte grün, Rand neutral

Stufe 4 – Muster
	•	vertikale Streifen
	•	symmetrisch
	•	Schachbrett-artig
	•	drei Zonen mit abgestuften Helligkeiten

Stufe 5 – Kombinationsaufgaben
	•	oben dunkel, unten bunt
	•	links ruhig, rechts chaotisch
	•	Mitte grau, Rand gesättigt
	•	drei Helligkeitsbänder plus dominante Farbe

11.3 Anti-Frust-Regeln
	•	frühe Levels großzügige Toleranzen
	•	bei wiederholtem Scheitern optional kleiner Hint
	•	nach letzter Runde immer Lernmoment durch Idealbild
	•	keine langen Ladezeiten
	•	keine unnötigen Strafen

⸻

12. Social / Share Mechanik

12.1 Ziel

Das Spiel soll teilbar sein, ohne komplizierte Accounts.

12.2 Challenge-Code

Ein Code kann enthalten:
	•	Modus
	•	Seed
	•	ausgewählte Challenges
	•	Reihenfolge
	•	Scores eines Spielers
	•	Anzeigeeinstellungen (Scores sichtbar oder verborgen)
	•	optional Rückspiel-Parameter

Der Code sollte:
	•	kurz genug sein für Messenger
	•	als URL funktionieren
	•	auch als QR-Code darstellbar sein

12.3 Varianten

Variante A – Einfacher Vergleich

Spieler A sendet 5 Challenges + Gesamtscore.
Spieler B spielt dieselben 5 Challenges.
Am Ende Vergleich.

Variante B – Teilweise verdeckter Vergleich

Bei manchen Aufgaben sieht B As Ergebnis vorher, bei anderen erst nach dem eigenen Versuch.

Variante C – Ping-Pong

A spielt 4 Aufgaben → sendet Code
B spielt dieselben 4 + bekommt 1 neue Rückspiel-Aufgabe → sendet zurück
A spielt Rückspiel-Aufgabe → Endvergleich

12.4 Empfehlung

Für ein erstes gutes Produkt sollte Variante A der Start sein.
Ping-Pong ist interessant, aber deutlich komplexer in UX, Code-Logik und Verständlichkeit.

⸻

13. UX / User Flow

13.1 First-time User Flow
	1.	Landing Page
	2.	„Spielen“ Button
	3.	kurze Erklärung in 2–3 Sätzen
	4.	Kamera-Freigabe
	5.	Tutorial-Challenge
	6.	erstes Ergebnis
	7.	Verständnis wächst sofort durch Overlay + Kommentar

13.2 Kernscreens

A. Landing
	•	Spielname
	•	1 Satz Erklärung
	•	Solo starten
	•	Challenge-Code eingeben
	•	Daily spielen

B. Challenge Screen
	•	Challenge-Text
	•	kleiner Schwierigkeitsindikator
	•	verbleibende Versuche
	•	Kameravorschau oder Upload
	•	Auslösen-Button

C. Result Screen
	•	Score groß
	•	Kommentar
	•	Diagnose
	•	Zielbild / Overlay
	•	„Nochmal“
	•	„Weiter“

D. Run Summary
	•	Einzelscores
	•	Gesamtpunktzahl
	•	Rang-Titel
	•	Share-Button
	•	Replay

E. Versus Summary
	•	dein Score vs anderer Score
	•	pro Challenge Vergleich
	•	optionale Kommentare

13.3 UX-Prinzipien
	•	große Tap-Ziele
	•	wenige Texte, aber gute Texte
	•	keine Menüverschachtelung
	•	eine Challenge pro Screen
	•	sofort sichtbares Feedback

⸻

14. Funktionale Anforderungen

14.1 Kernfunktionen MVP
	•	mobile Kameraaufnahme im Browser
	•	Bild-Downscaling im Client
	•	Challenge-Auswahl aus Seed
	•	Bildanalyse im Client
	•	Score-Berechnung
	•	Result-Screen mit Overlay
	•	Kommentar-System
	•	3-Versuche-Logik
	•	Solo-Run
	•	Share des Run-Ergebnisses per URL

14.2 Funktionen v1
	•	Daily Seed
	•	einfache Versus-Codes
	•	Statistik lokal speichern
	•	Streaks / Badges
	•	Challenge-Historie

14.3 Funktionen v2
	•	OCR-basierte Challenges
	•	Ping-Pong-Modus
	•	adaptive Schwierigkeit
	•	Audio / haptisches Feedback
	•	lokale Achievements
	•	Browser-optimierte Bildfiltervorschau

⸻

15. Technische Produktanforderungen

15.1 Architekturprinzip

Client-side first.
Das Foto wird idealerweise lokal verarbeitet.

15.2 Bildpipeline
	1.	Kameraaufnahme oder Bildauswahl
	2.	Downscaling auf z. B. 64x64 oder 96x96
	3.	Konvertierung in:
	•	RGB
	•	HSV/HSL
	•	Graustufen
	4.	Ableitung weiterer Merkmale:
	•	Kanten
	•	Kontrast
	•	Regionenscores
	•	Symmetrie
	•	Rasteranalyse
	5.	Score-Berechnung pro Challenge

15.3 Geeignete Features für Browser-Auswertung

Sehr gut geeignet:
	•	durchschnittliche Helligkeit
	•	Helligkeitsverteilung nach Regionen
	•	Farbanteile
	•	Sättigung
	•	Kontrast
	•	Kantenanzahl
	•	simple Symmetrie
	•	Rastervergleiche
	•	Entropie / Unruhe
	•	horizontale / vertikale Gradienten

Vorsicht:
	•	OCR
	•	echte Objekterkennung
	•	robuste Formenerkennung
	•	feine Semantik

15.4 OCR-Einschätzung

OCR im Browser ist machbar, aber für MVP riskant:
	•	CPU-intensiver
	•	unzuverlässiger bei spontanen Fotos
	•	UX schwerer zu kalibrieren
	•	kann sich unfair anfühlen

Empfehlung: OCR nicht im MVP, sondern v2 als seltene Spezial-Challenge.

15.5 Performance-Ziele
	•	Analysezeit pro Foto: ideal < 300 ms, maximal < 1 s
	•	Startzeit der App: < 3 s bei gutem Netz
	•	keine serverseitige Wartezeit für Kernloop

15.6 Browser-Kompatibilität

Ziel:
	•	iOS Safari
	•	Chrome Android
	•	aktuelle mobile Browser allgemein

Besonders testen:
	•	Kamera-Zugriff
	•	Memory-Verhalten
	•	Canvas-Performance
	•	Dateiupload-Fallback

⸻

16. Datenschutz und Sicherheit

16.1 Datenschutzprinzip

Wenn möglich:
	•	keine Bilder hochladen
	•	keine Fotos dauerhaft speichern
	•	alles lokal analysieren

16.2 Falls Backend nötig

Nur speichern:
	•	Seed
	•	Scores
	•	Challenge-IDs
	•	Zeitstempel
	•	optional Geräteklasse / Browsertyp

Nicht speichern:
	•	Rohbilder ohne explizite Zustimmung

16.3 Nutzererwartung

Die App sollte ausdrücklich sagen:
	•	„Dein Foto wird standardmäßig lokal ausgewertet.“
	•	„Wir speichern keine Bilder, außer du willst explizit teilen.“

Das ist nicht nur datenschutzfreundlich, sondern auch ein gutes Produktargument.

⸻

17. Content-System für Challenges

17.1 Challenge-Datenmodell

Jede Challenge braucht:
	•	id
	•	title
	•	prompt_text
	•	category
	•	difficulty
	•	analysis_type
	•	parameters
	•	ideal_visualization_type
	•	tolerance_profile
	•	comment_pool_success
	•	comment_pool_fail
	•	hint_text
	•	score_explanation_template

17.2 Beispielstruktur

{
  "id": "brightness_top_bottom_01",
  "prompt_text": "Mach ein Bild, das oben hell und unten dunkel ist.",
  "category": "spatial_brightness",
  "difficulty": 2,
  "analysis_type": "regional_luminance_difference",
  "parameters": {
    "target_top_luma": 0.8,
    "target_bottom_luma": 0.2,
    "smoothness_weight": 0.3
  },
  "ideal_visualization_type": "half_half_horizontal",
  "tolerance_profile": "normal"
}


⸻

18. Challenge-Katalog – Beispielhafte Startliste

Hier eine robuste Liste, aus der man für MVP und v1 auswählen kann.

18.1 Helligkeit / Dunkelheit
	1.	Mach ein sehr helles Bild.
	2.	Mach ein sehr dunkles Bild.
	3.	Mach ein Bild, das ungefähr mittelhell ist.
	4.	Mach ein Bild mit starkem Kontrast.
	5.	Mach ein Bild mit möglichst wenig Kontrast.
	6.	Mach ein Bild, das zur Hälfte hell und zur Hälfte dunkel ist.
	7.	Mach ein Bild, das doppelt so viele dunkle wie helle Pixel hat.
	8.	Mach ein Bild, das nur in einem kleinen Bereich hell ist.

18.2 Farben global
	9.	Mach ein Bild, das überwiegend rot ist.
	10.	Mach ein Bild, das überwiegend grün ist.
	11.	Mach ein Bild, das überwiegend blau ist.
	12.	Mach ein Bild, das möglichst grau ist.
	13.	Mach ein Bild, das möglichst bunt ist.
	14.	Mach ein Bild mit mehr Rot als Grün.
	15.	Mach ein Bild mit mehr Grün als Blau.
	16.	Mach ein Bild mit fast nur einer Farbe.
	17.	Mach ein Bild mit drei deutlich unterschiedlichen Farben.
	18.	Mach ein Bild, in dem zwei Farben ungefähr gleich stark vorkommen.

18.3 Räumliche Farbverteilung
	19.	Oben warm, unten kalt.
	20.	Links rot, rechts grün.
	21.	Mitte farbig, Rand grau.
	22.	Oben bunt, unten farblos.
	23.	Linke Hälfte dunkel, rechte Hälfte farbig.
	24.	Drei vertikale Zonen mit unterschiedlichen Farben.
	25.	Drei horizontale Zonen mit unterschiedlichen Helligkeiten.

18.4 Symmetrie / Balance
	26.	Mach ein möglichst symmetrisches Bild.
	27.	Mach ein Bild, dessen linke und rechte Hälfte fast gleich aussehen.
	28.	Mach ein Bild, dessen obere und untere Hälfte ähnlich sind.
	29.	Mach ein Bild, bei dem die vier Ecken ähnlich wirken.
	30.	Mach ein Bild mit klarer Mitte und unruhigem Rand.

18.5 Muster / Streifen / Raster
	31.	Mach ein Bild mit horizontalen Streifen.
	32.	Mach ein Bild mit vertikalen Streifen.
	33.	Mach ein Bild, das grob wie ein Schachbrett wirkt.
	34.	Mach ein Bild mit abwechselnd hellen und dunklen Bereichen.
	35.	Mach ein Bild mit drei Helligkeitsbändern.
	36.	Mach ein Bild mit regelmäßiger Wiederholung.
	37.	Mach ein Bild mit bewusst unregelmäßigem Muster.

18.6 Struktur / Kanten
	38.	Mach ein Bild mit vielen Kanten.
	39.	Mach ein ruhiges Bild mit möglichst wenigen Kanten.
	40.	Mach ein Bild mit einem klaren Übergang in der Mitte.
	41.	Mach ein Bild, das diagonal von hell nach dunkel läuft.
	42.	Mach ein Bild, das in der Mitte schärfer wirkt als am Rand.
	43.	Mach ein Bild mit chaotischer Struktur.
	44.	Mach ein Bild mit geordneter Struktur.

18.7 Kombo-Challenges
	45.	Mach ein dunkles, aber buntes Bild.
	46.	Mach ein helles, aber farbarmes Bild.
	47.	Mach ein Bild mit grünem Zentrum und dunklem Rand.
	48.	Mach ein symmetrisches Bild mit hohem Kontrast.
	49.	Mach ein Bild mit drei Zonen und insgesamt wenig Farbe.
	50.	Mach ein Bild, das fast grau ist, aber an einer Stelle stark farbig.
	51.	Mach ein Bild, das links ruhig und rechts chaotisch ist.
	52.	Mach ein Bild, das oben hell, unten dunkel und insgesamt grünlich ist.

18.8 Spätere Spezial-Challenges
	53.	Finde etwas, das wie ein E erkannt wird.
	54.	Finde genau einen dominanten Buchstaben.
	55.	Mach ein Bild mit möglichst viel erkennbarem Text.
	56.	Mach ein Bild mit möglichst wenig textähnlicher Struktur.

⸻

19. Kommentar-System

19.1 Anforderungen

Kommentare sollen:
	•	kurz sein
	•	trocken sein
	•	nicht identisch wiederholt werden
	•	zum Score passen
	•	bei Spezial-Challenges den Challenge-Typ spiegeln

19.2 Kommentar-Klassen

Sehr schlecht
	•	„Konzeptionell frei.“
	•	„Formal vorhanden. Inhaltlich schwierig.“
	•	„Du warst definitiv in der Nähe eines Fotos.“

Mittel
	•	„Man erkennt die Absicht. Das hilft schon mal.“
	•	„Nicht falsch genug für Kunst, nicht richtig genug für Punkte.“
	•	„Der Plan war da. Die Umsetzung hat Vorbehalte.“

Gut
	•	„Das wird langsam verdächtig kompetent.“
	•	„Knapp. Leider zählt knapp nicht als perfekt.“
	•	„Sehr ordentlich. Ich hasse es fast ein bisschen.“

Perfekt / fast perfekt
	•	„Unerquicklich gut.“
	•	„Exakt. Das war unnötig präzise.“
	•	„Du machst dem Spiel unangenehm viel Freude.“

⸻

20. Erfolgsmessung

20.1 Primäre Metriken
	•	durchschnittliche Anzahl Versuche pro Challenge
	•	Run-Abschlussrate
	•	Wiedereinstiegsrate
	•	Anteil von Challenges mit Score 70–90
	•	Anteil geteilter Runs / Codes
	•	Zeit bis zum ersten zweiten Versuch

20.2 Gute Signale
	•	viele „knapp daneben“-Ergebnisse
	•	kurze Pause zwischen Versuch 1 und 2
	•	hohe Quote von „nochmal“
	•	hohe Zahl an geteilten Challenge-Links

20.3 Warnsignale
	•	zu viele Scores unter 30
	•	zu viele sofortige Abbrüche
	•	Nutzer:innen verstehen Prompts nicht
	•	zu lange Analysezeiten
	•	Browser-Kamera-Probleme

⸻

21. Risiken

21.1 Produkt-Risiken
	1.	Zu wenig Spiel, zu viel Messaufgabe
Wenn es sich wie ein Bildanalyse-Test anfühlt, ist der Spaß weg.
	2.	Zu viel Trial and Error
Ohne gutes Feedback wird es stumpf.
	3.	Zu technische Prompts
„Sättigung“ ist okay, „HSV Hue 120°“ nicht.
	4.	Zu unfaire Challenges
Wenn Aufgaben stark von Umgebungslicht oder Zufall abhängen, kippt das Gefühl.

21.2 Technische Risiken
	1.	Kamera-API auf iOS
	2.	Speicher / Performance auf älteren Geräten
	3.	OCR-Unzuverlässigkeit
	4.	Unterschiede zwischen Kamera und Upload
	5.	Browserberechtigungen als Abbruchpunkt

⸻

22. MVP-Empfehlung

22.1 Was in MVP rein sollte
	•	Solo-Mode
	•	20–25 gute Challenges
	•	3 Versuche pro Challenge
	•	lokale Bildanalyse
	•	Score + Overlay + Kommentar
	•	Sharebarer Ergebnislink
	•	täglicher Seed optional, aber nicht zwingend

22.2 Was bewusst draußen bleiben sollte
	•	OCR
	•	Ping-Pong-Rückspiel
	•	Leaderboards
	•	Accounts
	•	Cloud-Fotospeicherung
	•	komplexe Meta-Progression

Das ist wichtig. Sonst baut man drei Produkte gleichzeitig:
	1.	Bildanalyse-Spiel
	2.	Social-Challenge-System
	3.	Content-/Backend-Plattform

⸻

23. Vorschlag für Umsetzungsphasen

Phase 1 – Playable Core
	•	15–20 Challenges
	•	Solo Run
	•	Bildanalyse lokal
	•	Score + Feedback
	•	Kommentarstil finden
	•	reale Usability testen

Phase 2 – Content und Polishing
	•	40–50 Challenges
	•	bessere Visualisierungen
	•	Difficulty Tuning
	•	Daily Mode
	•	feinere Kommentarsysteme

Phase 3 – Social Layer
	•	Seed-Link
	•	Versus Code
	•	Vergleichsansicht
	•	verdeckte / offene Scores

Phase 4 – Experimental Features
	•	OCR
	•	Ping-Pong
	•	Spezialmodi
	•	Events / Wochen-Challenges

⸻

24. Was noch diskutiert werden sollte

Ja, es fehlen noch ein paar Dinge. Das sind die wichtigsten:

24.1 Was ist die eigentliche Session-Struktur?

Offen:
	•	einzelne Challenges frei spielbar?
	•	Run mit 5 / 7 / 10 Aufgaben?
	•	Endless?
	•	Daily?

Das muss früh entschieden werden, weil davon alles abhängt: Scoring, UX, Sharing, Motivation.

24.2 Wie stark soll das Spiel erklären?

Offen:
	•	nur Score?
	•	Score + Diagnose?
	•	Score + Diagnose + Idealbild?
	•	zusätzlich Hinweise nach Fehlschlägen?

Mein Urteil: Ohne Diagnose und Idealbild wird das Spiel schnell öde.

24.3 Wie bissig darf der Humor sein?

Offen:
	•	neutral trocken
	•	leicht frech
	•	deutlich spöttisch
	•	sehr absurd

Das ist kein Detail. Der Ton ist Teil des Produkts.

24.4 Sollen Fotos nur live aufgenommen werden oder auch aus der Galerie kommen?

Live-only:
	•	fairer
	•	spieliger
	•	spontaner

Galerie erlauben:
	•	einfacher
	•	zugänglicher
	•	aber leichter „zu cheesen“

24.5 Wie „fair“ muss das Spiel sein?

Offen:
	•	geht es um exakte Vergleichbarkeit?
	•	oder um lustige Improvisation?

Wenn versus wichtig ist, muss die Bewertungslogik robuster und transparenter sein.

24.6 Wie viel soziale Mechanik wirklich?

Der Ping-Pong-Gedanke ist gut, aber nicht zwingend MVP-tauglich.
Hier muss man entscheiden, ob das Kernprodukt zuerst allein Spaß macht. Wenn nicht, rettet Social es auch nicht.

24.7 OCR: ja oder nein?

Mein klares Urteil: nicht am Anfang.
OCR ist eher „coole Idee für später“ als „saubere Basis für den ersten Release“.

24.8 Speichert das Spiel überhaupt etwas serverseitig?

Wenn nein:
	•	einfacher Datenschutz
	•	aber weniger Social/Stats

Wenn ja:
	•	mehr Möglichkeiten
	•	aber deutlich mehr Produktlast

⸻

25. Mein Produkturteil

Die Idee trägt. Aber nur dann, wenn du konsequent das Richtige priorisierst:

Nicht „was könnte man theoretisch alles aus Bildern messen?“
sondern:
Welche Challenges erzeugen tatsächlich dieses knappe, lustige, sofort wiederholbare Gefühl?

Der kritische Erfolgsfaktor ist deshalb nicht primär die Technik, sondern die Kombination aus:
	•	gut ausgewählten Challenges,
	•	gutem Scoring,
	•	starker Ergebnisvisualisierung,
	•	trockenem Feedback,
	•	und sehr kurzer Schleifenzeit.

Wenn du willst, mache ich dir als Nächstes direkt eine zweite, noch praktischere Fassung als PRD mit User Stories, Akzeptanzkriterien, Datenmodell, Screenliste und MVP-Backlog für ein Dev-Team.