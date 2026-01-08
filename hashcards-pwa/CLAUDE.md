# Hashcards PWA - Entwicklerhinweise

## Architektur

Single-File PWA (`index.html`, ~5800 Zeilen) mit eingebettetem CSS und JavaScript.

**Kein Build-Step** - Vanilla JS, direkt deploybar.

## Code-Struktur

Die JavaScript-Sektionen (ab Zeile ~1624):

| Zeile | Sektion | Beschreibung |
|-------|---------|--------------|
| 1624 | Version | `VERSION = '1.4.4'` |
| 1627 | Sync Server | API-URL Konfiguration |
| 1640 | State | Globale Variablen |
| 1667 | Phrases | Motivationssätze nach Session |
| 1691 | Latin Trivia | Fun Facts für Latein-Lerner |
| 1814 | IndexedDB Setup | DB-Schema und Migration (v4) |
| 2047 | DB Helpers | Promise-Wrapper für IDB |
| 2109 | Profile Management | CRUD für Profile |
| 2264 | Deck Management | CRUD für Decks |
| 2375 | Group Management | Gruppen-CRUD, Cache, Batch-Ops |
| 2541 | Group Manager UI | Gruppen-UI und Interaktion |
| 2721 | Group Filter | Lernbereich-Filter für Practice |
| 2863 | Stats | Statistik-Berechnung |
| 2905 | Import | Datei-Import UI |
| 3081 | Markdown Parser | Q:/A:/C: Parsing |
| 3248 | Export / Import | ZIP-Backup, JSON-Import |
| 3612 | Sync | Multi-Device Sync-Logik |
| 4566 | Practice / FSRS | Lern-Session und Queue |
| 4955 | FSRS Algorithm | Scheduling-Berechnung |
| 5040 | Settings | Theme, Limits, etc. |
| 5099 | Modal | Modal-Dialog System |
| 5129 | Screen Navigation | View-Switching |
| 5141 | Utilities | Helfer-Funktionen |
| 5213 | Audio System | Web Audio API Sounds |
| 5333 | Session Tracking | Lernzeit-Erfassung |
| 5416 | Streak & Stats | Streak-Berechnung |
| 5470 | Hidden & Faulty Cards | Karten verstecken/melden |
| 5606 | Fireworks & Effects | Visuelles Feedback |
| 5730 | PWA | Service Worker Registration |
| 5744 | Init | App-Start |

## IndexedDB Schema

Database: `hashcards`, Version: 4

| Store | KeyPath | Indices | Beschreibung |
|-------|---------|---------|--------------|
| `profiles` | `id` | `name` | Lernprofile |
| `decks` | `id` | `profileId` | Kartenstapel |
| `cards` | `id` | `deckId` | Einzelne Karten (mit `importOrder`, `groupId`) |
| `groups` | `id` | `deckId` | Kartengruppen innerhalb von Decks |
| `reviews` | `id` (auto) | `profileId`, `cardId`, `ts` | Review-Log (append-only) |
| `cardStates` | `id` | `profileId`, `due` | FSRS-Cache (rebuildbar) |
| `settings` | `key` | - | App-Einstellungen |
| `sessions` | `id` (auto) | `profileId`, `date` | Lernzeit-Tracking |
| `syncState` | `profileId` | - | Sync-Credentials pro Profil |

## Gruppen-System (v1.4)

Karten können in Gruppen organisiert werden:
- Jedes Deck hat eine Standard-Gruppe (`{deckId}_default`)
- Gruppen werden durch Trenner zwischen Karten erstellt
- `importOrder` erhält die Original-Reihenfolge aus der Quelldatei
- Lernbereich-Filter erlaubt Üben nach Gruppe oder "neueste N Gruppen"

Migration von v3 → v4:
- Automatisch bei App-Start (`migrateToV4IfNeeded`)
- Erstellt Standard-Gruppen für existierende Decks
- Setzt `importOrder` (aber verliert Original-Reihenfolge)
- "Reihenfolge aus Datei laden" für nachträgliche Korrektur

## Sync-System

- **Server**: PHP 7 Backend unter `https://ssl.exoneon.de/hashcards-pwa/api`
- **Protokoll**: Snapshot-basiert (ersetzt alte Event-Logs)
- **Auth**: `account_id.account_token` als Bearer Token
- **Endpoints**: `register.php`, `snapshot.php`, `devices.php`
- **Schema**: `schemaVersion: 4` im Snapshot für Kompatibilität

Details in `SPEC.md` (Abschnitt 5-7) und `SERVER-INSTALL.md`.

## FSRS-Algorithmus

Vereinfachte FSRS-Implementierung (Zeile ~4955):
- 4 Ratings: again, hard, good, easy
- Berechnet `stability`, `difficulty`, `due`
- Rebuildbar aus Review-Events

## Versionierung

Bei Änderungen aktualisieren:
1. `VERSION` in index.html (Zeile 1624)
2. `CACHE_NAME` in sw.js
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
- `#group-manager-screen` - Gruppen-Manager
- `#practice-screen` - Lern-Session
- `#stats-screen` - Statistiken
- `#settings-screen` - Einstellungen
- `#import-screen` - Import
