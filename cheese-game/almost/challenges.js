// ── Challenge Data ────────────────────────────────────────────────────────────

const CHALLENGES = [
  // ── Difficulty 1 ──────────────────────────────────────────────────────────
  {
    id: 'bright',
    title: 'Sehr hell',
    prompt: 'Mach ein möglichst helles Foto.',
    hint: 'Halte die Kamera in Richtung einer Lichtquelle.',
    difficulty: 1,
    analysis: 'brightness',
    params: { target: 0.88, tolerance: 0.12 },
    visualization: 'solid_fill',
    vizParams: { color: '#ffffff' },
    comments: {
      perfect: ['Blendend. Im wörtlichen Sinn.', 'Das Licht hat gewonnen.', 'Sehr überzeugend hell.'],
      good:    ['Brauchbar hell. Nicht galaktisch.', 'Knapp. Fast schon konsequent.', 'Ordentlich, aber nicht radikal.'],
      mid:     ['Heller. Das Wort ist dir bekannt?', 'Mittelmaß ist auch eine Entscheidung.', 'Man erkennt die Absicht. Irgendwie.'],
      bad:     ['Das ist kein helles Bild. Das ist ein Bild.', 'Mutig, Dunkelheit als Helligkeit einzureichen.', 'Konzeptionell frei.']
    }
  },
  {
    id: 'dark',
    title: 'Sehr dunkel',
    prompt: 'Mach ein möglichst dunkles Foto.',
    hint: 'Leg die Kamera auf eine dunkle Fläche oder deck sie ab.',
    difficulty: 1,
    analysis: 'brightness',
    params: { target: 0.05, tolerance: 0.07 },
    visualization: 'solid_fill',
    vizParams: { color: '#080808' },
    comments: {
      perfect: ['Tiefes Schwarz. Respekt.', 'Das könnte auch Kunst sein.', 'Fast unsichtbar. Gut so.'],
      good:    ['Dunkel genug für ernste Absichten.', 'Solide Finsternis.', 'Knapp am Ziel. Fast perfektes Nichts.'],
      mid:     ['Dunkler. Noch dunkler. Nochmal.', 'Das ist Grau. Grau ist nicht Dunkel.', 'Erkennbarer Versuch ins Nichts.'],
      bad:     ['Das ist hell. Sehr hell sogar.', 'Formell vorhanden. Inhaltlich schwierig.', 'Du warst definitiv in der Nähe eines Fotos.']
    }
  },
  {
    id: 'gray',
    title: 'Möglichst grau',
    prompt: 'Mach ein farbloses, graues Foto.',
    hint: 'Betonwände, Asphalt, graue Stoffe — alles ohne bunte Farben.',
    difficulty: 1,
    analysis: 'grayscale',
    params: { target: 1.0, tolerance: 0.25 },
    visualization: 'solid_fill',
    vizParams: { color: '#808080' },
    comments: {
      perfect: ['Unerquicklich grau. Perfekt.', 'Trostlos und präzise zugleich.', 'Absolutes Grau. Du hast ein Talent.'],
      good:    ['Respektabel farblos.', 'Fast grau. Nur fast.', 'Sehr ordentlich. Ich hasse es fast.'],
      mid:     ['Noch etwas Farbe drin. Raus damit.', 'Erkennbar grau-ish.', 'Der Plan war da. Die Farbe leider auch.'],
      bad:     ['Das ist bunt. Sehr bunt sogar.', 'Beeindruckend farbig. Für eine graue Aufgabe.', 'Das Bild hat Ideen. Leider die falschen.']
    }
  },
  {
    id: 'red',
    title: 'Überwiegend rot',
    prompt: 'Mach ein Foto, das überwiegend rot ist.',
    hint: 'Rote Wände, Tomaten, rote Kleidung — alles was rot ist.',
    difficulty: 1,
    analysis: 'color_ratio',
    params: { hueMin: 340, hueMax: 20, target: 0.45, tolerance: 0.2 },
    visualization: 'solid_fill',
    vizParams: { color: '#cc2200' },
    comments: {
      perfect: ['Rot. Sehr rot. Konsequent rot.', 'Du hast Rot verstanden.', 'Bilderbuch-Rot.'],
      good:    ['Deutlich rot. Fast zu rot. Gibt es zu rot?', 'Gutes Rot, aber knapp.', 'Solide Rötung.'],
      mid:     ['Mehr Rot. Viel mehr Rot.', 'Da ist Rot. Nicht genug Rot.', 'Erkennbar rot-angrenzend.'],
      bad:     ['Das ist nicht rot.', 'Rot? Wo? Ich sehe keins.', 'Formal ein Foto. Inhaltlich ohne Bezug.']
    }
  },
  {
    id: 'green',
    title: 'Überwiegend grün',
    prompt: 'Mach ein Foto, das überwiegend grün ist.',
    hint: 'Gras, Pflanzen, grüne Wände — alles was grün ist.',
    difficulty: 1,
    analysis: 'color_ratio',
    params: { hueMin: 80, hueMax: 160, target: 0.45, tolerance: 0.2 },
    visualization: 'solid_fill',
    vizParams: { color: '#228833' },
    comments: {
      perfect: ['Wald-Energie. Gut.', 'Grün wie eine Wiese, die sich nicht schämt.', 'Botanisch korrekt.'],
      good:    ['Anständig grün.', 'Grün, mit Abstrichen.', 'Fast ein Dschungel.'],
      mid:     ['Mehr Grün. Geh raus.', 'Zu wenig Natur für diese Aufgabe.', 'Erkennbar grün-benachbart.'],
      bad:     ['Das ist alles außer grün.', 'Grün hat das Bild verlassen.', 'Beeindruckend grün. Für eine andere Aufgabe.']
    }
  },
  {
    id: 'blue',
    title: 'Überwiegend blau',
    prompt: 'Mach ein Foto, das überwiegend blau ist.',
    hint: 'Himmel, Wasser, blaue Stoffe oder Flächen.',
    difficulty: 1,
    analysis: 'color_ratio',
    params: { hueMin: 200, hueMax: 260, target: 0.45, tolerance: 0.2 },
    visualization: 'solid_fill',
    vizParams: { color: '#1144cc' },
    comments: {
      perfect: ['Ozean-Stimmung. Korrekt.', 'Blau wie ein Montag.', 'Tief und blau. Wie erwartet.'],
      good:    ['Solide Blauheit.', 'Ordentlich blau.', 'Knapp am Blau-Maximum.'],
      mid:     ['Blauer. Noch blauer.', 'Ansatz erkennbar. Umsetzung ausbaufähig.', 'Etwas blau. Nicht genug.'],
      bad:     ['Kein Blau zu sehen.', 'Das ist warm. Blau ist nicht warm.', 'Tapfer. Falsch.']
    }
  },

  // ── Difficulty 2 ──────────────────────────────────────────────────────────
  {
    id: 'high_contrast',
    title: 'Starker Kontrast',
    prompt: 'Mach ein Foto mit sehr starkem Kontrast — hell und dunkel gleichzeitig.',
    hint: 'Schatten neben hellem Licht, oder schwarze Gegenstände auf weißem Grund.',
    difficulty: 2,
    analysis: 'contrast',
    params: { target: 0.38, tolerance: 0.12 },
    visualization: 'half_split_h',
    vizParams: { top: '#ffffff', bottom: '#000000' },
    comments: {
      perfect: ['Kontrast-Meisterwerk. Fast erschreckend.', 'Hell und dunkel in perfekter Feindschaft.', 'Exakt. Das war unnötig präzise.'],
      good:    ['Guter Kontrast. Fast dramatisch.', 'Ordentliche Spannung im Bild.', 'Sehr solide Kontrastsituation.'],
      mid:     ['Mehr Gegensätze bitte.', 'Etwas Kontrast, aber noch harmlos.', 'Das Bild braucht mehr Konflikt.'],
      bad:     ['Das ist harmonisch. Zu harmonisch.', 'Kein Kontrast gefunden.', 'Alles gleich. Alles falsch.']
    }
  },
  {
    id: 'low_contrast',
    title: 'Wenig Kontrast',
    prompt: 'Mach ein Foto mit möglichst wenig Kontrast — alles ähnlich hell.',
    hint: 'Gleichmäßige Flächen, Nebel, oder ein einfarbiger Hintergrund.',
    difficulty: 2,
    analysis: 'contrast',
    params: { target: 0.03, tolerance: 0.04 },
    visualization: 'solid_fill',
    vizParams: { color: '#aaaaaa' },
    comments: {
      perfect: ['Vollständige Monotonie. Perfekt.', 'Kontrastfrei. Wie eine Behördenwand.', 'Das ist beruhigend falsch. Aber richtig.'],
      good:    ['Fast langweilig genug. Gut.', 'Ordentlich eintönig.', 'Respektable Gleichförmigkeit.'],
      mid:     ['Noch gleichmäßiger. Bitte.', 'Ein bisschen zu aufregend.', 'Erkennbar um Langweile bemüht.'],
      bad:     ['Das ist dramatisch. Zu dramatisch.', 'Sehr viel Kontrast für wenig Kontrast.', 'Das Gegenteil. Konsequent das Gegenteil.']
    }
  },
  {
    id: 'high_saturation',
    title: 'Maximale Buntheit',
    prompt: 'Mach ein möglichst buntes, gesättigtes Foto.',
    hint: 'Bunte Objekte, Spielzeug, Früchte, bunte Kleidung oder Grafiken.',
    difficulty: 2,
    analysis: 'saturation',
    params: { target: 0.75, tolerance: 0.2 },
    visualization: 'solid_fill',
    vizParams: { color: 'hsl(0,100%,50%)', gradient: true },
    comments: {
      perfect: ['Augenkrebs-Level erreicht. Gut.', 'Hypersaturiert. Korrekt.', 'Das schreit. Ich höre es.'],
      good:    ['Anständig bunt.', 'Sehr ordentliche Sättigung.', 'Das wird langsam verdächtig kompetent.'],
      mid:     ['Mehr Farbe. Viel mehr Farbe.', 'Erkennbar bunt, aber noch erträglich.', 'Der Weg ist richtig. Das Ziel noch nicht.'],
      bad:     ['Das ist grau. Ganz leise grau.', 'Bunt? Wo?', 'Das Bild hat Zurückhaltung geübt.']
    }
  },
  {
    id: 'mono_color',
    title: 'Fast eine Farbe',
    prompt: 'Mach ein Foto, das fast nur eine einzige Farbe enthält.',
    hint: 'Halte die Kamera ganz nah an eine gleichmäßig gefärbte Fläche.',
    difficulty: 2,
    analysis: 'mono_color',
    params: { target: 0.65, tolerance: 0.2 },
    visualization: 'solid_fill',
    vizParams: { color: '#4488ff' },
    comments: {
      perfect: ['Eine Farbe. Konsequent eine.', 'Monochrom und stolz.', 'Das ist fast erschreckend konsistent.'],
      good:    ['Fast einfarbig. Knapp daneben.', 'Sehr dominante Farbe. Gut.', 'Ordentlich monochrom.'],
      mid:     ['Noch eine Farbe, bitte alles andere entfernen.', 'Zu viele Farben für diese Aufgabe.', 'Erkennbar auf dem Weg zur Einfarbigkeit.'],
      bad:     ['Das ist ein Regenbogen.', 'Hier sind mindestens fünf Farben.', 'Das Gegenteil von mono.']
    }
  },

  // ── Difficulty 3 ──────────────────────────────────────────────────────────
  {
    id: 'top_bright_bot_dark',
    title: 'Oben hell, unten dunkel',
    prompt: 'Mach ein Foto, das oben hell und unten dunkel ist.',
    hint: 'Himmel oben, dunkler Boden unten — oder Licht von oben.',
    difficulty: 3,
    analysis: 'regional',
    params: { axis: 'horizontal', region1: 'top', region2: 'bottom', targetDelta: 0.45 },
    visualization: 'half_split_h',
    vizParams: { top: '#f0f0f0', bottom: '#111111' },
    comments: {
      perfect: ['Oben hell, unten dunkel. Wie bestellt.', 'Physik-konform und spielerisch korrekt.', 'Schwerkraft-gerechte Helligkeit.'],
      good:    ['Schon sichtbar. Noch klarer wäre besser.', 'Ordentlicher Gradient. Knapp.', 'Fast ein Horizont.'],
      mid:     ['Oben und unten müssen sich mehr unterscheiden.', 'Erkennbar versucht. Nicht erkennbar gelungen.', 'Die Helligkeit sitzt eher in der Mitte.'],
      bad:     ['Das ist umgekehrt. Oder egal.', 'Oben dunkel, unten hell? Das ist was anderes.', 'Kein Gefälle erkennbar.']
    }
  },
  {
    id: 'left_dark_right_bright',
    title: 'Links dunkel, rechts hell',
    prompt: 'Mach ein Foto, das links dunkel und rechts hell ist.',
    hint: 'Steh so, dass die Lichtquelle rechts von dir ist.',
    difficulty: 3,
    analysis: 'regional',
    params: { axis: 'vertical', region1: 'right', region2: 'left', targetDelta: 0.4 },
    visualization: 'half_split_v',
    vizParams: { left: '#111111', right: '#f0f0f0' },
    comments: {
      perfect: ['Links dunkel, rechts hell. Lehrbuchmäßig.', 'Laterale Helligkeit. Korrekt.', 'Sehr überzeugend einseitig.'],
      good:    ['Guter Unterschied. Könnte noch mehr sein.', 'Ordentliche Asymmetrie.', 'Solides Linksdunkel-Rechthell.'],
      mid:     ['Mehr Unterschied zwischen links und rechts.', 'Erkennbar versucht. Noch nicht überzeugend.', 'Die Helligkeit verteilt sich zu gleichmäßig.'],
      bad:     ['Links und rechts sind gleich hell.', 'Das ist symmetrisch. Das war nicht die Aufgabe.', 'Kein horizontales Gefälle.']
    }
  },
  {
    id: 'center_bright',
    title: 'Mitte hell, Rand dunkel',
    prompt: 'Mach ein Foto, das in der Mitte hell und am Rand dunkler ist.',
    hint: 'Halte ein Objekt mit Licht dahinter, oder nutze Vignettierungseffekte.',
    difficulty: 3,
    analysis: 'center_vs_edges',
    params: { centerBrighter: true, targetDelta: 0.25 },
    visualization: 'center_spot',
    vizParams: { centerColor: '#ffffff', edgeColor: '#111111' },
    comments: {
      perfect: ['Scheinwerfer-Ästhetik. Perfekt.', 'Dramatisches Zentrum. Korrekt.', 'Vignette des Jahres.'],
      good:    ['Gutes Zentrum. Noch mehr Kontrast wäre schöner.', 'Ordentlicher Mittelpunkt.', 'Solide Mitte-hell-Situation.'],
      mid:     ['Die Mitte braucht mehr Licht.', 'Erkennbar mittig, aber nicht überzeugend.', 'Rand und Mitte zu ähnlich.'],
      bad:     ['Die Mitte ist dunkel. Das Gegenteil.', 'Umgekehrte Vignette. Interessant. Falsch.', 'Kein Helligkeitsunterschied erkennbar.']
    }
  },

  // ── Difficulty 4 ──────────────────────────────────────────────────────────
  {
    id: 'h_stripes',
    title: 'Horizontale Streifen',
    prompt: 'Mach ein Foto mit erkennbaren horizontalen Streifen.',
    hint: 'Jalousien, Treppen, Zäune, Holzlatten — alles mit waagerechten Linien.',
    difficulty: 4,
    analysis: 'stripes',
    params: { axis: 'horizontal', bands: 8, target: 0.18, tolerance: 0.08 },
    visualization: 'stripes_h',
    vizParams: {},
    comments: {
      perfect: ['Streifen. Echte Streifen. Respekt.', 'Sehr überzeugend gestreift.', 'Das schreit Muster. Korrekt.'],
      good:    ['Erkennbare Streifen. Knapp.', 'Solide horizontale Rhythmik.', 'Ordentliche Streifenstruktur.'],
      mid:     ['Mehr Rhythmus. Deutlichere Abwechslung.', 'Streifen angedeutet, nicht überzeugend.', 'Erkennbarer Versuch zur Streifigkeit.'],
      bad:     ['Das sind keine Streifen.', 'Keine Struktur erkennbar.', 'Chaos. Ordentliches Chaos, aber Chaos.']
    }
  },
  {
    id: 'v_stripes',
    title: 'Vertikale Streifen',
    prompt: 'Mach ein Foto mit erkennbaren vertikalen Streifen.',
    hint: 'Baumstämme, Vorhänge, senkrechte Wände, Zäune von vorne.',
    difficulty: 4,
    analysis: 'stripes',
    params: { axis: 'vertical', bands: 8, target: 0.18, tolerance: 0.08 },
    visualization: 'stripes_v',
    vizParams: {},
    comments: {
      perfect: ['Vertikale Präzision. Eindrucksvoll.', 'Sehr ordentliche Senkrechte.', 'Säulenstruktur erkannt.'],
      good:    ['Gute Streifen. Noch klarer bitte.', 'Ordentliche Vertikalen.', 'Solide senkrechte Rhythmik.'],
      mid:     ['Deutlichere Vertikalen bitte.', 'Ansatz erkennbar, Ergebnis ausbaufähig.', 'Fast ein Muster.'],
      bad:     ['Das ist horizontal. Oder nichts.', 'Keine Vertikalen erkennbar.', 'Das Bild verweigert Struktur.']
    }
  },
  {
    id: 'symmetrical',
    title: 'Symmetrisch',
    prompt: 'Mach ein möglichst symmetrisches Foto.',
    hint: 'Gebäudefassaden, Spiegel, Straßen von der Mitte aus, Türen.',
    difficulty: 4,
    analysis: 'symmetry',
    params: { target: 0.78, tolerance: 0.15 },
    visualization: 'symmetry_ref',
    vizParams: {},
    comments: {
      perfect: ['Spiegelperfekt. Beunruhigend.', 'Symmetrie des Jahres.', 'Du machst dem Spiel unangenehm viel Freude.'],
      good:    ['Sehr symmetrisch. Knapp daneben.', 'Ordentliche Spiegelung.', 'Solide Symmetrie.'],
      mid:     ['Mehr Balance. Gleichmäßiger.', 'Halb symmetrisch. Halb nicht.', 'Erkennbar um Symmetrie bemüht.'],
      bad:     ['Das ist chaotisch.', 'Keine Symmetrie erkennbar.', 'Links und rechts haben nichts miteinander zu tun.']
    }
  },
  {
    id: 'high_edges',
    title: 'Viele Kanten',
    prompt: 'Mach ein Foto mit möglichst vielen Kanten und Strukturen.',
    hint: 'Enge Gassen, volle Regale, Bücherrücken, gemusterter Stoff.',
    difficulty: 4,
    analysis: 'edges',
    params: { target: 0.35, tolerance: 0.15 },
    visualization: 'edge_burst',
    vizParams: {},
    comments: {
      perfect: ['Strukturbombe. Korrekt.', 'Sehr viele Kanten. Sehr gut.', 'Das schreit Komplexität.'],
      good:    ['Ordentlich viele Kanten.', 'Gute Kantendichte.', 'Strukturreich. Fast genug.'],
      mid:     ['Mehr Details. Mehr Kanten.', 'Erkennbar kantig, aber noch ruhig.', 'Zu viel freie Fläche.'],
      bad:     ['Das ist sehr ruhig.', 'Kaum Kanten. Sehr entspannte Bildkomposition.', 'Technisch ein Foto. Kantenmäßig ausbaufähig.']
    }
  },

  // ── Difficulty 5 ──────────────────────────────────────────────────────────
  {
    id: 'dark_colorful',
    title: 'Dunkel und bunt',
    prompt: 'Mach ein dunkles, aber buntes Foto — Farbe trotz Dunkelheit.',
    hint: 'Neonlichter, farbige LEDs, bunte Lichter in einem dunklen Raum.',
    difficulty: 5,
    analysis: 'composite',
    params: {
      sub: [
        { analysis: 'brightness', params: { target: 0.15, tolerance: 0.12 }, weight: 0.5 },
        { analysis: 'saturation', params: { target: 0.65, tolerance: 0.2 }, weight: 0.5 }
      ]
    },
    visualization: 'combo_dark_sat',
    vizParams: {},
    comments: {
      perfect: ['Dunkel und trotzdem laut. Wie bestellt.', 'Neon-Energie. Korrekt.', 'Das ist verdächtig gut.'],
      good:    ['Fast dunkel genug. Fast bunt genug.', 'Ordentliche Dunkel-Bunt-Kombination.', 'Solide. Knapp daneben.'],
      mid:     ['Entweder dunkler oder bunter. Am besten beides.', 'Die Kombination stimmt noch nicht.', 'Erkennbar kompositorisch anspruchsvoll.'],
      bad:     ['Das ist weder dunkel noch bunt.', 'Hell und grau. Das Gegenteil.', 'Konzeptionell frei.']
    }
  },
  {
    id: 'bright_colorless',
    title: 'Hell aber farblos',
    prompt: 'Mach ein helles, aber farbloses (graues) Foto.',
    hint: 'Helle, graue Flächen — Betonwände im Tageslicht, weißer Himmel.',
    difficulty: 5,
    analysis: 'composite',
    params: {
      sub: [
        { analysis: 'brightness', params: { target: 0.82, tolerance: 0.12 }, weight: 0.5 },
        { analysis: 'grayscale',  params: { target: 1.0,  tolerance: 0.25 }, weight: 0.5 }
      ]
    },
    visualization: 'solid_fill',
    vizParams: { color: '#d8d8d8' },
    comments: {
      perfect: ['Hell und farblos. Klinisch korrekt.', 'Das ist beruhigend falsch. Aber richtig.', 'Grau-Meisterschaft.'],
      good:    ['Fast hell genug und fast grau genug.', 'Ordentlich grau-hell.', 'Knapp an beiden Zielen.'],
      mid:     ['Heller oder grauer. Gerne beides.', 'Nur eine Eigenschaft erfüllt.', 'Erkennbar auf dem richtigen Weg.'],
      bad:     ['Das ist bunt oder dunkel. Oder beides.', 'Weder hell noch grau.', 'Das Gegenteil in Kombination.']
    }
  },
  {
    id: 'three_zones',
    title: 'Drei Helligkeitsbänder',
    prompt: 'Mach ein Foto mit drei horizontalen Helligkeitsstufen: oben hell, Mitte mittel, unten dunkel.',
    hint: 'Himmel oben, Horizont in der Mitte, dunkler Boden — klassische Landschaft.',
    difficulty: 5,
    analysis: 'three_zones',
    params: { axis: 'horizontal', targets: [0.78, 0.45, 0.12] },
    visualization: 'three_bands_h',
    vizParams: { colors: ['#eeeeee', '#777777', '#111111'] },
    comments: {
      perfect: ['Drei Zonen. Exakt drei. Sehr gut.', 'Klassische Landschaftsstruktur. Perfekt.', 'Das war unnötig präzise.'],
      good:    ['Gute Zonen. Noch klarer bitte.', 'Drei Stufen fast erkennbar.', 'Solide Dreigliederung.'],
      mid:     ['Drei Zonen müssen deutlicher sein.', 'Zu fließend. Mehr Kontrast zwischen den Bändern.', 'Erkennbar strukturiert, nicht überzeugend.'],
      bad:     ['Keine drei Zonen erkennbar.', 'Das ist gleichmäßig. Gleichmäßig ist falsch.', 'Die Helligkeitsstruktur fehlt komplett.']
    }
  },

  // ── Difficulty 1 — additional ─────────────────────────────────────────────
  {
    id: 'orange',
    title: 'Überwiegend orange',
    prompt: 'Mach ein Foto, das überwiegend orange ist.',
    hint: 'Orangen, Karotten, Kürbisse, orangene Wände oder Kleidung.',
    difficulty: 1,
    analysis: 'color_ratio',
    params: { hueMin: 15, hueMax: 45, target: 0.4, tolerance: 0.18 },
    visualization: 'solid_fill',
    vizParams: { color: '#ff7700' },
    comments: {
      perfect: ['Kürbis-Level erreicht.', 'Das brennt orange. Respekt.', 'Orange wie ein Warnschild. Korrekt.'],
      good:    ['Ordentlich orange. Knapp.', 'Mehr Orange als üblich. Gut so.', 'Solide Zitrusatmosphäre.'],
      mid:     ['Mehr Orange. Viel mehr.', 'Ansatz erkennbar. Ergebnis: Nicht orange.', 'Das ist fast warm. Aber nicht orange.'],
      bad:     ['Das ist alles. Nur nicht orange.', 'Orange hat das Bild verlassen.', 'Mutig, Grau als Orange einzureichen.']
    }
  },
  {
    id: 'yellow',
    title: 'Überwiegend gelb',
    prompt: 'Mach ein Foto, das überwiegend gelb ist.',
    hint: 'Bananen, Zitrone, gelbe Wände, Sonnenlicht auf hellen Flächen.',
    difficulty: 1,
    analysis: 'color_ratio',
    params: { hueMin: 45, hueMax: 75, target: 0.35, tolerance: 0.18 },
    visualization: 'solid_fill',
    vizParams: { color: '#eecc00' },
    comments: {
      perfect: ['Sonnenlicht verstanden.', 'Gelb wie ein Schulbus. Korrekt.', 'Exzellente Gelbheit. Das ist ein Kompliment.'],
      good:    ['Anständig gelb. Knapp am Ziel.', 'Gute Gelbheit. Noch mehr.', 'Ordentlich zitronig.'],
      mid:     ['Mehr Gelb. Geh nach draußen.', 'Gelb angedeutet, nicht überzeugend.', 'Das ist eher beige.'],
      bad:     ['Kein Gelb erkennbar.', 'Das ist schwarz. Oder blau. Auf jeden Fall nicht gelb.', 'Die Sonne fehlt.']
    }
  },
  {
    id: 'purple',
    title: 'Überwiegend lila',
    prompt: 'Mach ein Foto, das überwiegend lila oder violett ist.',
    hint: 'Lila Stoffe, Blumen, Auberginen oder ein lila Untergrund.',
    difficulty: 1,
    analysis: 'color_ratio',
    params: { hueMin: 260, hueMax: 320, target: 0.35, tolerance: 0.18 },
    visualization: 'solid_fill',
    vizParams: { color: '#8833cc' },
    comments: {
      perfect: ['Königlich lila. Überzeugend.', 'Sehr konsequent violett.', 'Das schreit Aubergine.'],
      good:    ['Ordentlich lila. Fast genug.', 'Gut violett, mit Abstrichen.', 'Lila erkennbar. Respektabel.'],
      mid:     ['Mehr Lila. Es gibt davon.', 'Lila angedeutet. Mehr davon.', 'Das ist eher blau. Oder rot.'],
      bad:     ['Kein Lila zu finden.', 'Das ist grün. Oder grau. Nicht lila.', 'Lila ist selten. Du hast nichts dagegen getan.']
    }
  },

  // ── Difficulty 2 — additional ─────────────────────────────────────────────
  {
    id: 'dark_majority',
    title: 'Zwei Drittel dunkel',
    prompt: 'Mach ein Foto, in dem ungefähr zwei Drittel der Pixel dunkel sind.',
    hint: 'Ein Raum mit wenig Licht, oder ein kleines helles Objekt auf dunklem Hintergrund.',
    difficulty: 2,
    analysis: 'pixel_ratio',
    params: { threshold: 0.45, target: 0.33, tolerance: 0.1 },
    visualization: 'two_thirds_dark',
    vizParams: {},
    comments: {
      perfect: ['Zwei Drittel Dunkelheit. Mathematisch korrekt.', 'Dunkelheit überwiegt. Wie beabsichtigt.', 'Das ist melancholisch präzise.'],
      good:    ['Fast die richtige Mischung. Knapp.', 'Solide Mehrheitsdunkelheit.', 'Ordentlich dunkel-dominant.'],
      mid:     ['Entweder mehr Dunkel oder mehr Kontrast.', 'Die Verhältnisse stimmen noch nicht.', 'Erkennbar um Dunkelheit bemüht.'],
      bad:     ['Das ist überraschend hell.', 'Zwei Drittel dunkel. Du hast ein Drittel versucht.', 'Die Helligkeit hat gewonnen.']
    }
  },
  {
    id: 'warm_tones',
    title: 'Warme Farbtöne',
    prompt: 'Mach ein Foto mit warmen Farbtönen — Rot, Orange oder Gelb.',
    hint: 'Abendlicht, Kerzenschein, Holz, Herbstblätter, warme Farbflächen.',
    difficulty: 2,
    analysis: 'warm_ratio',
    params: { target: 0.3, tolerance: 0.15 },
    visualization: 'warm_fill',
    vizParams: {},
    comments: {
      perfect: ['Warm wie Teelichter. Korrekt.', 'Die Sonne lässt grüßen.', 'Thermisch überzeugend.'],
      good:    ['Angenehm warm. Noch wärmer bitte.', 'Ordentlich warme Töne.', 'Knapp. Fast ein Kamin.'],
      mid:     ['Wärmer. Viel wärmer.', 'Ein bisschen warm. Nicht genug.', 'Das ist lauwarm.'],
      bad:     ['Das ist kühl. Sehr kühl.', 'Keine warmen Töne. Eiskalt.', 'Das Bild friert.']
    }
  },
  {
    id: 'cool_tones',
    title: 'Kühle Farbtöne',
    prompt: 'Mach ein Foto mit kühlen Farbtönen — Blau, Türkis oder Grün.',
    hint: 'Himmel, Wasser, Pflanzen, kühle Schatten, blaue oder grüne Flächen.',
    difficulty: 2,
    analysis: 'color_ratio',
    params: { hueMin: 150, hueMax: 260, target: 0.3, tolerance: 0.15 },
    visualization: 'cool_fill',
    vizParams: {},
    comments: {
      perfect: ['Kalt wie ein Montag.', 'Sehr konsequent kühl.', 'Das fühlt sich an wie Tiefkühlgemüse.'],
      good:    ['Ordentlich kühle Töne.', 'Fast ein Eisberg.', 'Gut kühl. Noch kühler wäre perfekt.'],
      mid:     ['Kühler. Viel kühler.', 'Ein bisschen blau. Nicht genug.', 'Das ist lauwarm.'],
      bad:     ['Das ist warm. Sehr warm.', 'Kein Kühles erkennbar.', 'Das ist eher ein Sommerfoto.']
    }
  },
  {
    id: 'half_half',
    title: 'Halb hell, halb dunkel',
    prompt: 'Mach ein Foto, das zur Hälfte hell und zur Hälfte dunkel ist — egal wie.',
    hint: 'Nicht unbedingt oben/unten — irgendeine hälftige Aufteilung reicht.',
    difficulty: 2,
    analysis: 'pixel_ratio',
    params: { threshold: 0.5, target: 0.5, tolerance: 0.08 },
    visualization: 'half_split_h',
    vizParams: { top: '#f0f0f0', bottom: '#111111' },
    comments: {
      perfect: ['50/50. Absolut korrekt.', 'Mathematisch ausgewogen. Beunruhigend.', 'Genau die Hälfte. Fast erschreckend.'],
      good:    ['Gute Balance. Nicht perfekt.', 'Fast hälftig. Knapp.', 'Ordentliche Gleichverteilung.'],
      mid:     ['Hälften setzen Unterschiede voraus.', 'Zu viel von einer Seite.', 'Die Hälfte fehlt.'],
      bad:     ['Das ist einheitlich. Zu einheitlich.', 'Kein Hell/Dunkel-Kontrast erkennbar.', 'Das ist alles gleich.']
    }
  },

  // ── Difficulty 3 — additional ─────────────────────────────────────────────
  {
    id: 'bottom_bright_top_dark',
    title: 'Unten hell, oben dunkel',
    prompt: 'Mach ein Foto, das unten hell und oben dunkel ist.',
    hint: 'Gegen die physikalische Intuition — Licht von unten, oder dunkler Himmel über hellem Boden.',
    difficulty: 3,
    analysis: 'regional',
    params: { axis: 'horizontal', region1: 'bottom', region2: 'top', targetDelta: 0.4 },
    visualization: 'half_split_h',
    vizParams: { top: '#111111', bottom: '#f0f0f0' },
    comments: {
      perfect: ['Anti-Horizont. Physikalisch fragwürdig, spielerisch korrekt.', 'Unten hell, oben dunkel. Wie bestellt.', 'Die Schwerkraft des Lichts ist aufgehoben.'],
      good:    ['Gut umgekehrt. Noch überzeugender bitte.', 'Ordentliche Inversion.', 'Knapp. Fast eine Unterwasser-Perspektive.'],
      mid:     ['Mehr Unterschied zwischen oben und unten.', 'Erkennbar versucht. Noch nicht überzeugend.', 'Die Helligkeit verteilt sich zu gleichmäßig.'],
      bad:     ['Das ist das Gegenteil des Gegenteils.', 'Oben hell. Das war nicht die Aufgabe.', 'Die natürliche Ordnung hat gesiegt.']
    }
  },
  {
    id: 'center_dark_edges_bright',
    title: 'Mitte dunkel, Rand hell',
    prompt: 'Mach ein Foto, das in der Mitte dunkel und am Rand heller ist.',
    hint: 'Ein Tunnel, ein dunkles Objekt auf hellem Untergrund, oder ein Loch in der Mitte.',
    difficulty: 3,
    analysis: 'center_vs_edges',
    params: { centerBrighter: false, targetDelta: 0.2 },
    visualization: 'dark_center',
    vizParams: {},
    comments: {
      perfect: ['Dunkles Zentrum, heller Rand. Wie ein Tunnel.', 'Inverse Vignette. Gelungen.', 'Das sieht aus wie ein Loch. Korrekt.'],
      good:    ['Gute Inversion. Noch deutlicher bitte.', 'Ordentlich umgekehrte Vignette.', 'Knapp. Fast ein Portal.'],
      mid:     ['Mehr Dunkelheit in der Mitte.', 'Mitte und Rand zu ähnlich.', 'Die Umkehrung ist erkennbar, aber schwach.'],
      bad:     ['Die Mitte ist hell. Das ist das Gegenteil.', 'Umgekehrte Aufgabe, korrekt umgesetzt.', 'Kein Helligkeitsunterschied erkennbar.']
    }
  },
  {
    id: 'colorful_top_gray_bottom',
    title: 'Oben bunt, unten grau',
    prompt: 'Mach ein Foto mit bunten Farben oben und grau/farblosem Bereich unten.',
    hint: 'Bunte Gegenstände auf neutralem Boden, oder farbiger Himmel über grauem Beton.',
    difficulty: 3,
    analysis: 'regional_sat',
    params: { region1: 'top', region2: 'bottom', targetDelta: 0.25 },
    visualization: 'half_sat_h',
    vizParams: {},
    comments: {
      perfect: ['Bunt oben, farblos unten. Exakt.', 'Farbverlauf von lebendig nach grau.', 'Oben voller Ideen, unten pflichtbewusst grau.'],
      good:    ['Guter Sättigungsunterschied. Knapp.', 'Fast klar getrennt.', 'Ordentliche Farbverteilung.'],
      mid:     ['Mehr Farbe oben oder mehr Grau unten.', 'Der Unterschied ist erkennbar, aber zu schwach.', 'Zu gleichmäßig verteilt.'],
      bad:     ['Oben und unten sind gleich langweilig.', 'Kein Unterschied erkennbar.', 'Das ist einheitlich. Einheitlich falsch.']
    }
  },

  // ── Difficulty 4 — additional ─────────────────────────────────────────────
  {
    id: 'checkerboard',
    title: 'Schachbrettmuster',
    prompt: 'Mach ein Foto, das grob wie ein Schachbrett wirkt — abwechselnd helle und dunkle Felder.',
    hint: 'Geflieste Böden, Schachbretter, karierte Stoffe, Gitterstrukturen.',
    difficulty: 4,
    analysis: 'checkerboard',
    params: {},
    visualization: 'checkerboard_viz',
    vizParams: {},
    comments: {
      perfect: ['Schachbrett erkannt. Respekt.', 'Fast ein Schachbrett. Mehr als ein Schachbrett.', 'Das könnte aus einem Schachclub kommen.'],
      good:    ['Erkennbar kariert. Knapp.', 'Gutes Muster. Fast ein Schachbrett.', 'Ordentliche Alternanz.'],
      mid:     ['Mehr Abwechslung. Hell-dunkel-hell-dunkel.', 'Das Muster ist angedeutet, nicht überzeugend.', 'Fast ein Schachbrett, wenn man Schach hasst.'],
      bad:     ['Das ist kein Schachbrett.', 'Schachbretter brauchen Muster. Dieses Bild verweigert Muster.', 'Keine Schachbrettstruktur erkennbar.']
    }
  },
  {
    id: 'low_edges',
    title: 'Ruhiges Bild',
    prompt: 'Mach ein möglichst ruhiges Foto — fast keine Kanten, keine Strukturen.',
    hint: 'Klarer Himmel, eine leere Wand, eine ruhige Wasseroberfläche, Nebel.',
    difficulty: 4,
    analysis: 'edges',
    params: { target: 0.02, tolerance: 0.03 },
    visualization: 'solid_fill',
    vizParams: { color: '#aaaaaa' },
    comments: {
      perfect: ['Absolut ruhig. Beruhigend korrekt.', 'Kaum Kanten. Fast kein Bild. Perfekt.', 'Das ist entweder Nebel oder Genie.'],
      good:    ['Sehr ruhig. Noch ruhiger bitte.', 'Ordentliche Leere.', 'Fast strukturfrei.'],
      mid:     ['Noch ruhiger. Weg mit den Kanten.', 'Zu viel Struktur für diese Aufgabe.', 'Das ist entspannt, aber nicht ruhig.'],
      bad:     ['Das ist sehr unruhig.', 'Kanten überall. Sehr kantig.', 'Das Bild hat Angst vor Stille.']
    }
  },
  {
    id: 'diagonal',
    title: 'Diagonal hell nach dunkel',
    prompt: 'Mach ein Foto, das von links oben (hell) nach rechts unten (dunkel) abdunkelt.',
    hint: 'Licht von links oben, oder eine diagonal verlaufende Helligkeit im Raum.',
    difficulty: 4,
    analysis: 'diagonal',
    params: { brightCorner: 'topLeft', targetDelta: 0.25 },
    visualization: 'diagonal_viz',
    vizParams: { brightCorner: 'topLeft' },
    comments: {
      perfect: ['Diagonale Helligkeit. Geometrisch korrekt.', 'Von hell nach dunkel. Wie eine Erzählung.', 'Sehr überzeugend schräg.'],
      good:    ['Gute Diagonale. Noch klarer bitte.', 'Ordentlicher Helligkeitsgradient.', 'Knapp. Fast ein Leonardo-Licht.'],
      mid:     ['Mehr Unterschied zwischen den Ecken.', 'Die Diagonale ist angedeutet, nicht überzeugend.', 'Erkennbar schräg, aber zu flach.'],
      bad:     ['Kein diagonales Gefälle erkennbar.', 'Links oben dunkel. Das ist das Gegenteil.', 'Die Diagonale hat das Bild verlassen.']
    }
  },

  // ── Difficulty 5 — additional ─────────────────────────────────────────────
  {
    id: 'dark_symmetric',
    title: 'Dunkel und symmetrisch',
    prompt: 'Mach ein dunkles, aber symmetrisches Foto.',
    hint: 'Dunkle Gänge, Tunnel oder Bögen, die symmetrisch wirken.',
    difficulty: 5,
    analysis: 'composite',
    params: { sub: [
      { analysis: 'brightness', params: { target: 0.12, tolerance: 0.1 }, weight: 0.45 },
      { analysis: 'symmetry',  params: { target: 0.75, tolerance: 0.15 }, weight: 0.55 }
    ]},
    visualization: 'symmetry_ref',
    vizParams: {},
    comments: {
      perfect: ['Dunkel und symmetrisch. Ernsthaft beunruhigend.', 'Das ist bedrohlich präzise.', 'Ein dunkles Spiegelbild. Korrekt.'],
      good:    ['Fast dunkel genug und fast symmetrisch.', 'Ordentliche Dunkel-Symmetrie.', 'Knapp an beiden Zielen.'],
      mid:     ['Dunkler oder symmetrischer. Gerne beides.', 'Die Kombination stimmt noch nicht.', 'Erkennbar anspruchsvoll. Erkennbar nicht gelungen.'],
      bad:     ['Weder dunkel noch symmetrisch.', 'Hell und chaotisch. Das maximale Gegenteil.', 'Konzeptionell mutig. Inhaltlich frei.']
    }
  },
  {
    id: 'bright_edge_rich',
    title: 'Hell und voller Details',
    prompt: 'Mach ein helles Foto mit sehr vielen Kanten und Strukturen.',
    hint: 'Helle Regale voller Bücher, eine weiße Wand mit vielen Elementen, Strukturen im Tageslicht.',
    difficulty: 5,
    analysis: 'composite',
    params: { sub: [
      { analysis: 'brightness', params: { target: 0.72, tolerance: 0.15 }, weight: 0.4 },
      { analysis: 'edges',      params: { target: 0.28, tolerance: 0.12 }, weight: 0.6 }
    ]},
    visualization: 'edge_burst',
    vizParams: {},
    comments: {
      perfect: ['Hell und strukturreich. Eindrucksvoll.', 'Das schreit Überforderung. Korrekt.', 'Sehr ordentlich komplex und hell.'],
      good:    ['Fast hell genug und fast kantenreich genug.', 'Ordentliche Kombination.', 'Knapp an beiden Zielen.'],
      mid:     ['Heller oder strukturreicher. Gerne beides.', 'Nur ein Ziel erfüllt.', 'Erkennbar auf dem richtigen Weg.'],
      bad:     ['Dunkel und ruhig. Das Gegenteil.', 'Weder hell noch strukturreich.', 'Das Bild hat sich das einfach gemacht.']
    }
  }
];

// ── Run Selection ─────────────────────────────────────────────────────────────

function seededRandom(seed) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0xffffffff;
  };
}

function selectChallenges(seed) {
  const rng = seededRandom(seed);
  const byDifficulty = [1, 2, 3, 4, 5].map(d =>
    CHALLENGES.filter(c => c.difficulty === d)
  );
  return byDifficulty.map(group => {
    const idx = Math.floor(rng() * group.length);
    return group[idx];
  });
}

function getDailySeed() {
  const d = new Date();
  const str = `${d.getFullYear()}${d.getMonth()}${d.getDate()}`;
  let hash = 0;
  for (const ch of str) hash = (hash * 31 + ch.charCodeAt(0)) & 0xffffffff;
  return hash >>> 0;
}

function encodeSeed(seed) {
  return (seed >>> 0).toString(36);
}

function decodeSeed(str) {
  return parseInt(str, 36) >>> 0;
}

// ── Rank Titles ───────────────────────────────────────────────────────────────

function getRankTitle(total) {
  if (total >= 490) return 'Bitte aufhören';
  if (total >= 460) return 'Gruselig präzise';
  if (total >= 420) return 'Verdächtig kompetent';
  if (total >= 380) return 'Unangenehm gut';
  if (total >= 340) return 'Respektabel, wenn auch seltsam';
  if (total >= 300) return 'Solide Leistung';
  if (total >= 250) return 'Brauchbar';
  if (total >= 200) return 'Erkennbar versucht';
  if (total >= 150) return 'Konzeptionell vorhanden';
  if (total >= 100) return 'Ambitioniert, ergebnisoffen';
  if (total >= 50)  return 'Formal ein Run';
  return 'Mutig';
}

// ── VS Challenge Encoding ─────────────────────────────────────────────────────

function encodeScores(scores) {
  return scores.map(s => Math.max(0, Math.min(100, Math.round(s))).toString(36).padStart(2, '0')).join('');
}

function decodeScores(str) {
  if (!str || str.length < 10) return null;
  const scores = [];
  for (let i = 0; i < str.length; i += 2) {
    const v = parseInt(str.slice(i, i + 2), 36);
    if (isNaN(v) || v < 0 || v > 100) return null;
    scores.push(v);
  }
  return scores.length === 5 ? scores : null;
}

function getVSComment(myTotal, theirTotal) {
  const diff = myTotal - theirTotal;
  if (diff >= 100)  return 'Du hast gewonnen. Deutlich. Fast mitleiderregend.';
  if (diff >= 50)   return 'Du hast gewonnen. Nicht knapp.';
  if (diff >= 20)   return 'Du hast gewonnen. Knapp genug, um bescheiden zu bleiben.';
  if (diff >= 1)    return 'Du hast gewonnen. Um ' + diff + ' Punkte. Ich würde nicht feiern.';
  if (diff === 0)   return 'Unentschieden. Das ist statistisch unwahrscheinlich und inhaltlich unbefriedigend.';
  if (diff >= -19)  return 'Du hast verloren. Um ' + Math.abs(diff) + ' Punkte. Nicht weit.';
  if (diff >= -49)  return 'Du hast verloren. Erkennbar verloren.';
  if (diff >= -99)  return 'Du hast verloren. Und zwar richtig.';
  return 'Du hast sehr deutlich verloren. Das ist auch eine Leistung.';
}

function getComment(challenge, score, attemptIndex) {
  const band = score >= 90 ? 'perfect' : score >= 70 ? 'good' : score >= 40 ? 'mid' : 'bad';
  const pool = challenge.comments[band];
  return pool[attemptIndex % pool.length];
}
