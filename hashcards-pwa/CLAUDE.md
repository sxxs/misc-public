# Hashcards PWA - Entwicklerhinweise

## Architektur

Single-File PWA (`index.html`, ~4600 Zeilen) mit eingebettetem CSS und JavaScript.

**Kein Build-Step** - Vanilla JS, direkt deploybar.

## Code-Struktur

Die JavaScript-Sektionen (ab Zeile ~1412):

| Zeile | Sektion | Beschreibung |
|-------|---------|--------------|
| 1413 | Version | `VERSION = '1.3.7'` |
| 1416 | Sync Server | API-URL Konfiguration |
| 1429 | State | Globale Variablen |
| 1456 | Phrases | Motivationssätze nach Session |
| 1480 | Latin Trivia | Fun Facts für Latein-Lerner |
| 1601 | IndexedDB Setup | DB-Schema und Migration |
| 1690 | DB Helpers | Promise-Wrapper für IDB |
| 1742 | Profile Management | CRUD für Profile |
| 1898 | Deck Management | CRUD für Decks |
| 2021 | Stats | Statistik-Berechnung |
| 2063 | Import | Datei-Import UI |
| 2173 | Markdown Parser | Q:/A:/C: Parsing |
| 2256 | Export / Import | ZIP-Backup, JSON-Import |
| 2539 | Sync | Multi-Device Sync-Logik |
| 3453 | Practice / FSRS | Lern-Session und Queue |
| 3837 | FSRS Algorithm | Scheduling-Berechnung |
| 3922 | Settings | Theme, Limits, etc. |
| 3981 | Modal | Modal-Dialog System |
| 4011 | Screen Navigation | View-Switching |
| 4023 | Utilities | Helfer-Funktionen |
| 4095 | Audio System | Web Audio API Sounds |
| 4215 | Session Tracking | Lernzeit-Erfassung |
| 4298 | Streak & Stats | Streak-Berechnung |
| 4352 | Hidden & Faulty Cards | Karten verstecken/melden |
| 4488 | Fireworks & Effects | Visuelles Feedback |
| 4612 | PWA | Service Worker Registration |
| 4626 | Init | App-Start |

## IndexedDB Schema

Database: `hashcards`, Version: 3

| Store | KeyPath | Indices | Beschreibung |
|-------|---------|---------|--------------|
| `profiles` | `id` | `name` | Lernprofile |
| `decks` | `id` | `profileId` | Kartenstapel |
| `cards` | `id` | `deckId` | Einzelne Karten |
| `reviews` | `id` (auto) | `profileId`, `cardId`, `ts` | Review-Log (append-only) |
| `cardStates` | `id` | `profileId`, `due` | FSRS-Cache (rebuildbar) |
| `settings` | `key` | - | App-Einstellungen |
| `sessions` | `id` (auto) | `profileId`, `date` | Lernzeit-Tracking |
| `syncState` | `profileId` | - | Sync-Credentials pro Profil |

## Sync-System

- **Server**: PHP 7 Backend unter `https://ssl.exoneon.de/hashcards-pwa/api`
- **Protokoll**: Append-only Event-Logs pro Device
- **Auth**: `account_id.account_token` als Bearer Token
- **Endpoints**: `register.php`, `append.php`, `since.php`, `devices.php`, `snapshot.php`

Details in `SPEC.md` (Abschnitt 5-7) und `SERVER-INSTALL.md`.

## FSRS-Algorithmus

Vereinfachte FSRS-Implementierung (Zeile ~3837):
- 4 Ratings: again, hard, good, easy
- Berechnet `stability`, `difficulty`, `due`
- Rebuildbar aus Review-Events

## Versionierung

Bei Änderungen aktualisieren:
1. `VERSION` in index.html (Zeile 1414)
2. `version` in sw.js
3. Commit-Message mit Version

## Theme-System

CSS Custom Properties mit uchū-Palette (OKLCH):
- `[data-theme="light"]` - Standard
- `[data-theme="dark"]` - Dunkelmodus
- `[data-theme="system"]` - Folgt OS

## Screens

Navigation über `.screen.active` CSS-Klassen:
- `#profile-screen` - Profilauswahl
- `#home-screen` - Hauptmenü
- `#deck-screen` - Deck-Verwaltung
- `#practice-screen` - Lern-Session
- `#stats-screen` - Statistiken
- `#settings-screen` - Einstellungen
- `#import-screen` - Import
