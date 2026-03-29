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
  if (total >= 450) return 'Gruselig präzise';
  if (total >= 400) return 'Verdächtig gut';
  if (total >= 350) return 'Unangenehm kompetent';
  if (total >= 300) return 'Respektabel';
  if (total >= 200) return 'Brauchbar';
  if (total >= 100) return 'Solide Idee, wacklige Umsetzung';
  return 'Erkennbar versucht';
}

function getComment(challenge, score, attemptIndex) {
  const band = score >= 90 ? 'perfect' : score >= 70 ? 'good' : score >= 40 ? 'mid' : 'bad';
  const pool = challenge.comments[band];
  return pool[attemptIndex % pool.length];
}
