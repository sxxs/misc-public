# SOP: Wochenreview

## Wann

Einmal pro Woche, idealerweise Montag morgens.

## Schritte

1. **Digest laufen lassen**
   ```bash
   node digest.mjs
   ```
   Pruefen: Sind fuer diese Woche Posts eingeplant? Haben alle ein JSON?

2. **Swimlane-Kalender oeffnen**
   ```bash
   node pipeline/server.mjs
   ```
   Visuell pruefen: Variable Reward Schedule eingehalten? Luecken?

3. **Scheduled Posts pruefen** — Fuer jeden Post mit Zieldatum diese Woche:
   - [ ] JSON existiert
   - [ ] Remotion-Preview sieht gut aus
   - [ ] Wenn nein: Rendern oder Post verschieben

4. **FYP scannen** — 10 Minuten TikTok scrollen:
   - Hat ein Creator mit Reichweite ueber IT/KI/Datenschutz/Karriere gesprochen?
   - Lohnt sich ein Stitch? (→ `sops/creator-reaktion.md`)

5. **News scannen** — Spiegel, Tagesschau, Heise kurz checken:
   - Datenskandal, KI-Regulierung, IT-Sicherheitsvorfall?
   - Wenn ja und relevant: → `sops/newsjacking.md`

6. **Kommentare lesen** — Auf allen 3 Plattformen:
   - Substanzielle Kommentare kurz beantworten
   - Trolle ignorieren
   - Nichts erzwingen

7. **Ideen-Backlog pflegen** — Neue #stark-Ideen aus den Stoffsammlungen oder spontane Einfaelle:
   - In `pipeline/ideen/` notieren oder direkt in passende `pipeline/entwuerfe/`-Datei schreiben

8. **Naechste 2 Wochen planen** — In der Swimlane-UI:
   - Posts aus dem Backlog in Kalenderwochen ziehen
   - Mischung pruefen (nie 2x gleicher Typ hintereinander)

## Checkliste

- [ ] Digest ausgefuehrt
- [ ] Diese Woche: alle Posts ready
- [ ] FYP gescannt (Stitch-Chancen?)
- [ ] News gescannt (Newsjacking?)
- [ ] Kommentare gelesen
- [ ] Naechste 2 Wochen geplant
