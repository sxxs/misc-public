# SOP: Neuer Post erstellen

## Wann

Wenn eine Idee aus dem Pool in ein fertiges Remotion-Video umgesetzt werden soll.

## Voraussetzungen

- [ ] Node.js installiert, `npm install` in `wiai-social/` ausgefuehrt
- [ ] Remotion Studio laeuft (`./studio.sh`)
- [ ] Idee in `pipeline/entwuerfe/` vorhanden und mit **#ok** oder **#ja** getaggt

## Schritte

### 1. Idee waehlen

In `pipeline/entwuerfe/` die passende Datei oeffnen (z.B. `contrarian.md`, `merkste-selber.md`). Variante mit **#ok** oder **#ja** suchen. Notiere Post-Nummer und Variante.

### 2. JSON-Datei anlegen

Neue Datei erstellen: `wiai-social/posts/<datum>-<stichwort>.json`

Namenskonvention: `2026-03-27-survivorship-bias.json`

**Template (Contrarian):**

```json
{
  "id": "2026-03-27-survivorship-bias",
  "type": "contrarian",
  "accentColor": "#FACC15",
  "slide1": {
    "bigText": "Reaktion.",
    "smallText": "Der Satz, den man immer hoert."
  },
  "slide2": {
    "text": "Zeile eins.\nZeile zwei."
  },
  "slide3": {
    "text": "Kurze Punchline.",
    "button": "Optionaler Follow-up."
  }
}
```

**Template (Newsjacking):**

```json
{
  "id": "2026-03-27-stichwort",
  "type": "newsjacking",
  "accentColor": "#FACC15",
  "slide1": {
    "image": "./assets/screenshots/dateiname.png",
    "bigText": "Reaktion."
  },
  "slide2": {
    "text": "Erklaerung.\nMehrzeilig ok."
  },
  "slide3": {
    "text": "Punchline."
  }
}
```

**Farb-Palette:**

| Hex | Einsatz |
|-----|---------|
| `#FACC15` | Standard, energetisch |
| `#EF4444` | Alarm, Kritik |
| `#3B82F6` | Tech/KI, sachlich |
| `#F0EDE8` | Ruhig, emotional |

**Text-Laengen beachten:**
- slide2 (fontSize 78): ~18 Zeichen/Zeile
- slide3.text (fontSize 84): ~15 Zeichen/Zeile
- slide3.button (fontSize 48): ~30 Zeichen/Zeile

### 3. In Root.tsx registrieren

Datei: `wiai-social/src/Root.tsx`

1. Import oben ergaenzen:

```tsx
import survivorshipBiasPost from "../posts/2026-03-27-survivorship-bias.json";
```

2. Composition in der `<>...</>` registrieren:

```tsx
{cp("WiaiPost-survivorship-bias", survivorshipBiasPost as unknown as Post)}
```

### 4. Preview im Studio

```bash
./studio.sh
```

- Composition im Dropdown links auswaehlen (`WiaiPost-survivorship-bias`)
- Alle 3 Slides durchscrubben
- Safe-Zone-Overlay pruefen (nur im Studio sichtbar)
- Textlaengen kontrollieren: kein Abschneiden, kein Ueberlauf

### 5. plan.json aktualisieren

Neuen Eintrag in `pipeline/plan.json` unter `"posts"` ergaenzen:

```json
{
  "id": "2026-03-27-survivorship-bias",
  "type": "contrarian",
  "design": "pixel-wall",
  "status": "ready",
  "json": "wiai-social/posts/2026-03-27-survivorship-bias.json",
  "source": "pipeline/entwuerfe/ertappt.md#Post-35-Variante-B",
  "targetWeek": "2026-W14",
  "publishedDate": null,
  "platforms": {},
  "notes": ""
}
```

## Checkliste

- [ ] Idee mit #ok/#ja in `pipeline/entwuerfe/` gefunden
- [ ] JSON unter `wiai-social/posts/` angelegt
- [ ] `id` im JSON ist eindeutig
- [ ] Import + `cp()` in `Root.tsx` eingetragen
- [ ] Studio-Preview: alle 3 Slides ok, Text lesbar, Safe Zones frei
- [ ] `plan.json` aktualisiert (status: `"ready"`, source-Verweis gesetzt)

## Haeufige Fehler

- **JSON-Syntaxfehler**: Komma nach letztem Feld in einem Block vergessen oder zu viel. Studio zeigt dann nichts an.
- **id-Mismatch**: `id` im JSON muss zum Dateinamen und zur Composition-ID passen.
- **Zeilenumbrueche**: `\n` im JSON, nicht echte Zeilenumbrueche im String.
- **Import vergessen**: Composition taucht nicht im Studio-Dropdown auf, wenn der Import in Root.tsx fehlt.
- **Textlaenge**: slide2 mit mehr als 6 Zeilen wird zu lang. Kuerzen oder `\n\n`-Pausen reduzieren.
- **Falsche Farbe**: `accentColor` muss ein gueltiger Hex-Wert aus der Palette sein.
