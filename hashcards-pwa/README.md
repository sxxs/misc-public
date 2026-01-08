# Hashcards PWA

Spaced Repetition Lernkarten-App als Progressive Web App.

**Live:** https://sxxs.github.io/misc-public/hashcards-pwa/

## Features

- **FSRS-Algorithmus** - Modernes Spaced Repetition Scheduling (lokal)
- **Gruppen** - Karten in Lernbereiche organisieren, nach Gruppe üben
- **Multi-Profil** - Mehrere Lernende auf einem Gerät
- **Multi-Device Sync** - Fortschritt zwischen Geräten synchronisieren
- **Offline-fähig** - Funktioniert ohne Internet
- **Cloze-Karten** - Lückentexte mit `[eckigen Klammern]`
- **Q&A-Karten** - Klassische Frage-Antwort-Karten
- **Import/Export** - Markdown-Dateien und ZIP-Backups
- **Dark Mode** - Hell/Dunkel/System-Theme

## Installation

### Als PWA (empfohlen)

1. App im Browser öffnen: https://sxxs.github.io/misc-public/hashcards-pwa/
2. **iOS**: Teilen → "Zum Home-Bildschirm"
3. **Android**: Menü → "App installieren"

### Multi-Device Sync

1. Erstes Gerät: Einstellungen → "Sync aktivieren"
2. Sync-Key kopieren
3. Zweites Gerät: Einstellungen → "Sync-Key eingeben"

## Kartenformat (Markdown)

```markdown
Q: Was bedeutet "amare"?
A: lieben

Q: rex, regis m.
A: der König
auch: Herrscher

C: Speech is [produced] in [Broca's] area.
```

- `Q:` / `A:` für Frage-Antwort-Karten
- `C:` für Cloze-Karten (Lücken in `[eckigen Klammern]`)
- Leerzeilen trennen Karten
- Mehrzeilige Antworten erlaubt

## Tech Stack

- Vanilla JS (Single-File, ~5800 Zeilen)
- IndexedDB für lokale Datenhaltung
- Service Worker für Offline-Support
- PHP 7 Backend für Sync (optional)

## Verwandte Dateien

- `SPEC.md` - Ausführliche technische Spezifikation
- `SERVER-INSTALL.md` - Backend-Setup für Multi-Device Sync
- `decks/` - Beispiel-Decks
