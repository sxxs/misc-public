# Hashcards PWA - Spezifikation

> PWA auf GitHub Pages unter https://sxxs.github.io/misc-public/hashcards-pwa/
> Backend auf Apache + PHP 7 (append-only Logs)
> Multi-Device über Pairing-/Sync-Key
> Duolingo-Style Komfort + kindertaugliche Gamification

---

## 0) Ziele und Nicht-Ziele

### Ziele
1. **Phone-first**: primär iPhone-PWA, offline nutzbar
2. **Einfacher Import**: Markdown rein (zip/Datei), Assets optional
3. **Modernes Scheduling**: FSRS läuft komplett lokal; Server braucht keine SRS-Logik
4. **Multi-Device Sync**: iPhone + iPad + weitere Geräte → gleicher Account/Progress
5. **Robuster Sync ohne SQLite-Konflikte**: Server speichert append-only Event-Logs pro Device
6. **Kids-Komfort**: kurze Sessions, große Buttons, Audio/Voice, Streak, Missionen, Belohnungen

### Nicht-Ziele (v1)
- "Live" Bearbeiten von Markdown direkt im iCloud-Ordner aus der PWA
- Push Notifications (geht auf iOS, aber Setup + VAPID ist Overkill für v1)
- Vollständige Anki-Kompatibilität (kann später kommen)

---

## 1) Deployment: GitHub Pages unter Subpath

**URL**: `https://sxxs.github.io/misc-public/hashcards-pwa/`

### 1.1 Base Path / Router
Bei reiner Vanilla-App:
```html
<base href="/misc-public/hashcards-pwa/">
```

### 1.2 Service Worker Scope
- `service-worker.js` liegt im selben Ordner wie `index.html`
- Registrierung:
```javascript
navigator.serviceWorker.register('./service-worker.js', { scope: './' });
```

### 1.3 PWA Manifest
```json
{
  "name": "Vokabelkarten",
  "short_name": "Vokabeln",
  "start_url": "/misc-public/hashcards-pwa/",
  "scope": "/misc-public/hashcards-pwa/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#ffffff",
  "icons": [
    { "src": "icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "icons/icon-512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```

---

## 2) Architekturübersicht

### Komponenten
1. **PWA Client** (iOS Home Screen)
   - UI/UX, FSRS Scheduling, Gamification, lokale Datenhaltung
   - Sync-Modul (Upload/Download von Logs)
2. **PHP 7 Backend** (dumm & robust)
   - Auth + CORS
   - Append-only Speicherung pro Device
   - "Read since offset" pro Device
   - Optional: Meta-Datei für Idempotenz (Chunk-Dedupe)

### Prinzip
- Server ist nur Transport & Backup
- Wahrheit ist: (A) Markdown/Decks + (B) Review-Events
- Der FSRS-Zustand ist ein rebuildbarer Cache

---

## 3) Datenmodell

### 3.1 Card / Deck

**Deck**: Sammlung von Karten, importiert aus Markdown (oder ZIP)

**Karte**:
- `card_id`: stabiler Hash (siehe unten)
- `kind`: `"QA"` oder `"CLOZE"`
- `question_md`, `answer_md` (oder `cloze_md`)
- `assets`: Liste von Asset-Refs (images/audio)

**Card-ID-Regel**:
```
canonical = normalize(question_md) + "\n---\n" + normalize(answer_md)
card_id = sha256(deck_id + "\n" + canonical) → Base32/Base64url
```

`normalize()`:
- trim trailing spaces
- normalize line endings to `\n`
- collapse multiple blank lines (optional)

### 3.2 ReviewEvent (JSONL)

Jeder Review ist ein Event (eine JSON-Zeile):
```json
{
  "event_id": "uuid-v4",
  "account_id": "A1B2C3...",
  "device_id": "D-uuid",
  "deck_id": "sha256...",
  "card_id": "sha256...",
  "ts": "2026-01-06T15:10:45+01:00",
  "rating": "again|hard|good|easy",
  "rt_ms": 4200
}
```

- `event_id` muss global eindeutig sein (UUID v4) für clientseitige Deduplizierung
- `rt_ms` (Response Time) optional, nützlich für spätere Features

### 3.3 FSRS State Cache (lokal)

Pro Karte (rebuildbar):
- `last_review_ts`
- `due_ts`
- FSRS interne Werte: `stability`, `difficulty`, `reps`, `lapses`, etc.

### 3.4 Gamification State (lokal, rebuildbar aus Events)
- `streak_days`
- `daily_xp`
- `missions_done`
- `badges`
- `avatar_items`
- `last_active_day`

Streak: primär aus `ReviewEvent.ts` ableiten (rebuildbar)

---

## 4) Lokale Speicherung in der PWA

### 4.1 Hybrid Storage
- **IndexedDB**: strukturierte Daten (Deck index, CardState cache, settings)
- **OPFS** (optional): große Dateien/ZIP-Imports/Asset-Blobs/ReviewLogs als Datei

Minimal-v1 geht auch nur mit IndexedDB.

### 4.2 Offline-Queue
- Events sofort lokal schreiben
- Sync läuft "best effort":
  - on app start
  - on "Sync now"
  - alle X Minuten, wenn online

### 4.3 Backups

UI: großer Button "Export Backup" → ZIP:
- `decks/*.md`
- `assets/*`
- `reviews/*.jsonl`
- `settings.json`

---

## 5) Server-Sync Design (PHP 7)

### 5.1 Auth: Pairing-/Sync-Key

Beim ersten Gerät erzeugt der Client:
- `account_id` (kurz, 12–16 chars base32)
- `account_token` (lang, 32+ bytes base64url)
- `device_id` (UUID)

Client registriert `account_id` + `hash(token)` am Server.

**Sync-Key** (copy/paste):
```
account_id + "." + account_token
```

Auf zweitem Gerät: "Sync-Key eingeben" → speichert token lokal → fertig.

### 5.2 Server-Dateistruktur

```
data/
  accounts/
    <account_id>.json
  logs/
    <account_id>/
      <device_id>.jsonl
      <device_id>.meta.json
```

`accounts/<account_id>.json`:
```json
{
  "token_sha256": "....",
  "created_ts": "...",
  "devices": ["..."]
}
```

`<device_id>.meta.json`:
```json
{ "last_chunk_id": "uuid", "size": 123456 }
```

---

## 6) API Endpoints

**CORS**: `Access-Control-Allow-Origin: https://sxxs.github.io`

### 6.1 POST /api/register.php

Registriert neuen Account.

Request:
```json
{
  "account_id": "A1B2C3...",
  "token_sha256": "hex...",
  "device_id": "uuid"
}
```

Response:
```json
{ "ok": true }
```

### 6.2 POST /api/append.php

Append new events chunk (JSONL).

Headers: `Authorization: Bearer <account_id>.<account_token>`

Request:
```json
{
  "device_id": "uuid",
  "expected_offset": 123456,
  "chunk_id": "uuid",
  "chunk": "{\"event_id\":...}\n{\"event_id\":...}\n"
}
```

Response ok:
```json
{ "ok": true, "new_size": 124321 }
```

Response conflict:
```json
{ "ok": false, "error": "Offset mismatch", "server_size": 130000 }
```

### 6.3 GET /api/since.php?device_id=...&offset=...

Gibt bytes ab offset aus dem Device-log zurück.

Headers: `Authorization: Bearer <account_id>.<account_token>`

Response: JSONL lines (Content-Type: text/plain)

### 6.4 GET /api/devices.php (optional)

Listet bekannte devices + sizes.

---

## 7) Sync-Algorithmus (Client)

### 7.1 Begriffe
- Pro Device-Log: `server_offset[device_id]` (bytes schon lokal bekannt)
- Eigenes Device: `local_unsynced_events`

### 7.2 Upload (eigener device log)
1. `expected_offset = server_offset[self_device]`
2. Baue chunk aus neuen lokalen Events (JSONL)
3. POST `append.php`
   - 200: setze `server_offset[self_device] = new_size`, markiere events als synced
   - 409: `server_offset` aktualisieren, hole missing bytes per `since.php`, merge, retry

### 7.3 Download (alle devices)

Für jedes bekannte device:
- GET `since.php?device_id=X&offset=server_offset[X]`
- Append Zeilen lokal
- `server_offset[X] += bytes_received`
- Dedup über `event_id`

---

## 8) FSRS: Scheduling aus Events

### 8.1 Rebuild vs Incremental
- Normal: incremental pro Review (schnell)
- Sicherheit: rebuild pro deck bei Inkonsistenz

### 8.2 FSRS Inputs
Pro Review:
- Zeitpunkt
- Bewertung (again/hard/good/easy)
- (optional) elapsed

### 8.3 Ablauf beim Start einer Session
1. "Due Queue" bestimmen:
   - Karten mit `due_ts <= now`, sortiert nach due
   - plus Limit neuer Karten pro Tag
2. Session-Länge: z.B. 10 Karten oder 5 Minuten

---

## 9) Duolingo-Style Komfort & Kids-Gamification

### 9.1 UX-Flow (Home)
- Großer Button: **"Lernen (5 Min)"**
- Sekundär:
  - "Deck wählen"
  - "Import"
  - "Profil/Avatare"
  - "Sync"

### 9.2 Sessions
- Standard: 5 Minuten oder 10 Karten
- "Tagesziel": 10 Karten / 1 Session

### 9.3 Bewertung UI (kindgerecht)

| Button | Bedeutung | FSRS Rating |
|--------|-----------|-------------|
| 😵 "Nope" | Nicht gewusst | again |
| 😬 "knapp" | Mit Mühe | hard |
| 🙂 "ok" | Gewusst | good |
| 😎 "easy" | Sofort gewusst | easy |

### 9.4 Audio & Voice
- Pro Karte optional: Play button für Audio (mp3)
- TTS: System-Voices (v1 optional)
- Voice Input: Textfeld fokussieren → iOS Diktat-Taste nutzen

### 9.5 Belohnungssystem (kindertauglich)
- **Streak**: 1 Session/Tag
- **Sticker-Album**: alle 3 Tage 1 Sticker
- **Avatar-Items**: nach 7 Sessions ein Item
- **Missionen** (täglich 1–2):
  - "5 Karten mit Audio"
  - "3 Cloze-Sätze"
  - "0x 😵 heute"

### 9.6 Elternmodus
- Import/Deck-Management hinter "Elternknopf" (3 Sekunden halten)
- Kinder sehen nur: "Lernen", "Sticker", "Deck auswählen"

### 9.7 Alternative zu Hearts
- Kein "Leben"-System
- Bei again: kurze Mini-Hilfe + "gleich nochmal später"

---

## 10) CORS/Config (GitHub Pages + PHP)

PWA Origin: `https://sxxs.github.io`

PHP Headers:
```php
Access-Control-Allow-Origin: https://sxxs.github.io
Access-Control-Allow-Headers: Content-Type, Authorization
Access-Control-Allow-Methods: GET, POST, OPTIONS
```

**API muss HTTPS sein** (sonst blockt iOS Mixed Content).

---

## 11) Implementierungsplan

### MVP 1 (Grundfunktion)
- [ ] Deck Import: .md Datei → Kartenparsing Q:/A:/C:
- [ ] Local storage: IndexedDB
- [ ] Learn session: due queue + 4 rating buttons
- [ ] FSRS: ts-fsrs lokal
- [ ] Events: JSONL intern
- [ ] Export backup

### MVP 2 (Sync)
- [ ] device_id + account_id/token
- [ ] register.php + append.php + since.php
- [ ] Sync UI: "Sync-Key anzeigen / eingeben"

### MVP 3 (Kids)
- [ ] Missions + Stickers
- [ ] Elternmodus
- [ ] Große UI + 5-Min Session button

---

## 12) Offene Fragen

> Diese Fragen müssen vor der Implementierung geklärt werden:

### Technisch
- [ ] API-Base-URL für PHP Backend?
- [ ] Markdown-Format: Genaue Syntax für Q:/A:/C: oder andere Konvention?
- [ ] ZIP-Import: Struktur (Assets relativ zu MD-Datei oder in assets/ Ordner)?
- [ ] FSRS-Library: `ts-fsrs` npm package oder eigene Implementierung?

### UX/Design
- [ ] Farbschema / Theme?
- [ ] Soll es mehrere Profile (Kinder) auf einem Gerät geben?
- [ ] Avatar-System: Welche Art von Items/Customization?
- [ ] Sticker: Welche Motive / Themen?

### Scope v1
- [ ] Cloze-Karten in v1 oder später?
- [ ] TTS in v1 oder später?
- [ ] Missionen in v1 oder später?
