# Hashcards PWA - Server Installation

Backend-Setup für Multi-Device Sync.

## Voraussetzungen

- Apache 2.4+ mit mod_rewrite und mod_headers
- PHP 5.5+
- HTTPS
- Schreibrechte für Webserver-User (z.B. www-data)

## 1. Verzeichnisstruktur anlegen

- **API-Dateien**: Im Webroot unter `hashcards-pwa/api/`
- **Daten**: Außerhalb des Webroot (z.B. `/var/lib/hashcards-pwa/`)

```bash
# Web-Dateien (Pfad anpassen)
mkdir -p $WEBROOT/hashcards-pwa/api

# Daten-Verzeichnis (außerhalb Webroot für Sicherheit)
mkdir -p /var/lib/hashcards-pwa/accounts
mkdir -p /var/lib/hashcards-pwa/logs

# Berechtigungen für Webserver-User
chown -R www-data:www-data /var/lib/hashcards-pwa/
chmod -R 750 /var/lib/hashcards-pwa/
```

Zielstruktur:
```
$WEBROOT/
└── hashcards-pwa/
    ├── .htaccess
    └── api/
        ├── auth.php
        ├── register.php
        ├── append.php
        ├── since.php
        ├── devices.php
        └── snapshot.php

/var/lib/hashcards-pwa/                # Nicht über Web erreichbar
├── accounts/
│   └── <account_id>.json
└── logs/
    └── <account_id>/
        ├── <device_id>.jsonl
        ├── <device_id>.meta.json
        └── snapshot.json
```

## 2. .htaccess

Datei: `hashcards-pwa/.htaccess`

```apache
# WICHTIG: Authorization Header an PHP durchreichen
# (Apache strippt den Header standardmäßig)
RewriteEngine On
RewriteCond %{HTTP:Authorization} ^(.*)
RewriteRule .* - [e=HTTP_AUTHORIZATION:%1]

# CORS für Frontend-Origin (anpassen!)
<IfModule mod_headers.c>
    SetEnvIf Origin "^https://your-frontend-domain\.com$" CORS_ORIGIN=$0
    Header set Access-Control-Allow-Origin %{CORS_ORIGIN}e env=CORS_ORIGIN
    Header set Access-Control-Allow-Headers "Content-Type, Authorization"
    Header set Access-Control-Allow-Methods "GET, POST, OPTIONS"
    Header set Access-Control-Max-Age "86400"
</IfModule>

# OPTIONS Preflight
RewriteCond %{REQUEST_METHOD} OPTIONS
RewriteRule ^(.*)$ $1 [R=200,L]
```

> **Hinweis**: Da die Daten in `/var/lib/hashcards-pwa/` liegen (außerhalb Webroot),
> ist kein zusätzlicher Schutz in .htaccess nötig.

## 3. PHP-Dateien

Alle PHP-Dateien kommen nach `hashcards-pwa/api/`.

### auth.php

```php
<?php
// Gemeinsame Hilfsfunktionen

// Daten-Verzeichnis außerhalb Webroot
define('DATA_DIR', '/var/lib/hashcards-pwa');
define('ACCOUNTS_DIR', DATA_DIR . '/accounts');
define('LOGS_DIR', DATA_DIR . '/logs');

// hash_equals Polyfill für PHP < 5.6
if (!function_exists('hash_equals')) {
    function hash_equals($known, $user) {
        if (strlen($known) !== strlen($user)) return false;
        $result = 0;
        for ($i = 0; $i < strlen($known); $i++) {
            $result |= ord($known[$i]) ^ ord($user[$i]);
        }
        return $result === 0;
    }
}

// CORS Headers setzen (Origin anpassen!)
function cors_headers() {
    $origin = isset($_SERVER['HTTP_ORIGIN']) ? $_SERVER['HTTP_ORIGIN'] : '';
    if ($origin === 'https://your-frontend-domain.com') {
        header('Access-Control-Allow-Origin: https://your-frontend-domain.com');
        header('Access-Control-Allow-Headers: Content-Type, Authorization');
        header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
    }
    header('Content-Type: application/json; charset=utf-8');
}

// JSON Response
function json_response($data, $status = 200) {
    http_response_code($status);
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}

// JSON Error Response
function json_error($message, $status = 400) {
    json_response(array('ok' => false, 'error' => $message), $status);
}

// Authorization Header parsen: "Bearer account_id.token"
function parse_auth() {
    $auth = isset($_SERVER['HTTP_AUTHORIZATION']) ? $_SERVER['HTTP_AUTHORIZATION'] : '';
    if (!preg_match('/^Bearer\s+([A-Z2-7]+)\.([A-Za-z0-9_-]+)$/i', $auth, $m)) {
        return null;
    }
    return array(
        'account_id' => strtoupper($m[1]),
        'token' => $m[2]
    );
}

// Token gegen gespeicherten Hash validieren
function validate_auth() {
    $auth = parse_auth();
    if (!$auth) {
        json_error('Missing or invalid Authorization header', 401);
    }

    $account_file = ACCOUNTS_DIR . '/' . $auth['account_id'] . '.json';
    if (!file_exists($account_file)) {
        json_error('Account not found', 401);
    }

    $account = json_decode(file_get_contents($account_file), true);
    $token_hash = hash('sha256', $auth['token']);

    if (!hash_equals($account['token_sha256'], $token_hash)) {
        json_error('Invalid token', 401);
    }

    return array(
        'account_id' => $auth['account_id'],
        'account' => $account
    );
}

// Input-Validierung
function validate_id($id, $name, $pattern = '/^[A-Za-z0-9_-]+$/') {
    if (!$id || !preg_match($pattern, $id) || strlen($id) > 64) {
        json_error("Invalid $name");
    }
    return $id;
}
```

### register.php

```php
<?php
// POST /api/register.php - Neuen Account registrieren

require_once __DIR__ . '/auth.php';
cors_headers();

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    json_error('Method not allowed', 405);
}

// Request Body lesen
$input = json_decode(file_get_contents('php://input'), true);
if (!$input) {
    json_error('Invalid JSON');
}

// Felder validieren
$account_id = validate_id(isset($input['account_id']) ? $input['account_id'] : '', 'account_id', '/^[A-Z2-7]{12,16}$/i');
$account_id = strtoupper($account_id);

$token_sha256 = isset($input['token_sha256']) ? $input['token_sha256'] : '';
if (!preg_match('/^[a-f0-9]{64}$/i', $token_sha256)) {
    json_error('Invalid token_sha256');
}
$token_sha256 = strtolower($token_sha256);

$device_id = validate_id(isset($input['device_id']) ? $input['device_id'] : '', 'device_id');

// Prüfen ob Account bereits existiert
$account_file = ACCOUNTS_DIR . '/' . $account_id . '.json';
if (file_exists($account_file)) {
    json_error('Account already exists', 409);
}

// Account anlegen
$account = array(
    'token_sha256' => $token_sha256,
    'created_ts' => date('c'),
    'devices' => array($device_id)
);

// Verzeichnisse erstellen
$log_dir = LOGS_DIR . '/' . $account_id;
if (!is_dir($log_dir)) {
    mkdir($log_dir, 0750, true);
}

// Dateien schreiben
file_put_contents($account_file, json_encode($account, JSON_PRETTY_PRINT));

// Leeres Device-Log initialisieren
touch($log_dir . '/' . $device_id . '.jsonl');
file_put_contents($log_dir . '/' . $device_id . '.meta.json', json_encode(array(
    'last_chunk_id' => null,
    'size' => 0
)));

json_response(array('ok' => true));
```

### append.php

```php
<?php
// POST /api/append.php - Events an Device-Log anhängen

require_once __DIR__ . '/auth.php';
cors_headers();

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    json_error('Method not allowed', 405);
}

// Auth validieren
$auth = validate_auth();
$account_id = $auth['account_id'];
$account = $auth['account'];

// Request Body
$input = json_decode(file_get_contents('php://input'), true);
if (!$input) {
    json_error('Invalid JSON');
}

$device_id = validate_id(isset($input['device_id']) ? $input['device_id'] : '', 'device_id');
$expected_offset = (int)(isset($input['expected_offset']) ? $input['expected_offset'] : 0);
$chunk_id = validate_id(isset($input['chunk_id']) ? $input['chunk_id'] : '', 'chunk_id');
$chunk = isset($input['chunk']) ? $input['chunk'] : '';

if (!is_string($chunk) || $chunk === '') {
    json_error('Missing chunk data');
}

// Pfade
$log_dir = LOGS_DIR . '/' . $account_id;
$log_file = $log_dir . '/' . $device_id . '.jsonl';
$meta_file = $log_dir . '/' . $device_id . '.meta.json';

// Neues Device? Registrieren
if (!file_exists($log_file)) {
    if (!is_dir($log_dir)) {
        mkdir($log_dir, 0750, true);
    }
    touch($log_file);
    file_put_contents($meta_file, json_encode(array(
        'last_chunk_id' => null,
        'size' => 0
    )));

    // Device zur Account-Liste hinzufügen
    if (!in_array($device_id, $account['devices'])) {
        $account['devices'][] = $device_id;
        file_put_contents(
            ACCOUNTS_DIR . '/' . $account_id . '.json',
            json_encode($account, JSON_PRETTY_PRINT)
        );
    }
}

// Meta laden
$meta = json_decode(file_get_contents($meta_file), true);
$server_size = filesize($log_file);

// Idempotenz: gleicher chunk_id = bereits verarbeitet
if ($meta['last_chunk_id'] === $chunk_id) {
    json_response(array('ok' => true, 'new_size' => $server_size));
}

// Offset-Check
if ($expected_offset !== $server_size) {
    json_response(array(
        'ok' => false,
        'error' => 'Offset mismatch',
        'server_size' => $server_size
    ), 409);
}

// Chunk anhängen (mit Lock)
$fp = fopen($log_file, 'a');
if (!$fp) {
    json_error('Cannot open log file', 500);
}

if (!flock($fp, LOCK_EX)) {
    fclose($fp);
    json_error('Cannot lock log file', 500);
}

// Nochmal Größe prüfen nach Lock
clearstatcache(true, $log_file);
$server_size = filesize($log_file);
if ($expected_offset !== $server_size) {
    flock($fp, LOCK_UN);
    fclose($fp);
    json_response(array(
        'ok' => false,
        'error' => 'Offset mismatch',
        'server_size' => $server_size
    ), 409);
}

// Chunk schreiben (mit Newline am Ende falls nötig)
$chunk_to_write = rtrim($chunk, "\n") . "\n";
fwrite($fp, $chunk_to_write);
flock($fp, LOCK_UN);
fclose($fp);

// Meta aktualisieren
clearstatcache(true, $log_file);
$new_size = filesize($log_file);

$meta['last_chunk_id'] = $chunk_id;
$meta['size'] = $new_size;
file_put_contents($meta_file, json_encode($meta));

json_response(array('ok' => true, 'new_size' => $new_size));
```

### since.php

```php
<?php
// GET /api/since.php?device_id=...&offset=... - Events ab Offset lesen

require_once __DIR__ . '/auth.php';
cors_headers();

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    json_error('Method not allowed', 405);
}

// Auth validieren
$auth = validate_auth();
$account_id = $auth['account_id'];

// Parameter
$device_id = validate_id(isset($_GET['device_id']) ? $_GET['device_id'] : '', 'device_id');
$offset = max(0, (int)(isset($_GET['offset']) ? $_GET['offset'] : 0));

// Log-Datei
$log_file = LOGS_DIR . '/' . $account_id . '/' . $device_id . '.jsonl';

if (!file_exists($log_file)) {
    // Kein Log = leere Response
    header('Content-Type: text/plain; charset=utf-8');
    header('X-Log-Size: 0');
    exit;
}

$size = filesize($log_file);
header('Content-Type: text/plain; charset=utf-8');
header('X-Log-Size: ' . $size);

if ($offset >= $size) {
    // Nichts Neues
    exit;
}

// Bytes ab Offset lesen
$fp = fopen($log_file, 'r');
if (!$fp) {
    json_error('Cannot open log file', 500);
}

fseek($fp, $offset);
echo fread($fp, $size - $offset);
fclose($fp);
```

### devices.php

```php
<?php
// GET /api/devices.php - Liste aller Devices mit Log-Größen

require_once __DIR__ . '/auth.php';
cors_headers();

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    json_error('Method not allowed', 405);
}

// Auth validieren
$auth = validate_auth();
$account_id = $auth['account_id'];
$account = $auth['account'];

$devices = array();
$log_dir = LOGS_DIR . '/' . $account_id;

foreach ($account['devices'] as $device_id) {
    $log_file = $log_dir . '/' . $device_id . '.jsonl';
    $meta_file = $log_dir . '/' . $device_id . '.meta.json';

    $size = file_exists($log_file) ? filesize($log_file) : 0;
    $meta = file_exists($meta_file)
        ? json_decode(file_get_contents($meta_file), true)
        : null;

    $devices[] = array(
        'device_id' => $device_id,
        'size' => $size,
        'last_chunk_id' => $meta ? $meta['last_chunk_id'] : null
    );
}

json_response(array(
    'ok' => true,
    'devices' => $devices
));
```

### snapshot.php

```php
<?php
// GET/POST /api/snapshot.php - Entity Snapshot Sync
// GET: Aktuellen Snapshot abrufen
// POST: Snapshot hochladen/mergen

require_once __DIR__ . '/auth.php';
cors_headers();

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit;
}

// Auth validieren
$auth = validate_auth();
$account_id = $auth['account_id'];
$account = $auth['account'];

// Snapshot-Datei Pfad
$snapshot_file = LOGS_DIR . '/' . $account_id . '/snapshot.json';

// GET: Snapshot abrufen
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    if (!file_exists($snapshot_file)) {
        json_response(array(
            'ok' => true,
            'snapshot' => null,
            'version' => 0
        ));
    }

    $data = json_decode(file_get_contents($snapshot_file), true);
    json_response(array(
        'ok' => true,
        'snapshot' => $data['snapshot'],
        'version' => $data['version']
    ));
}

// POST: Snapshot speichern
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);

    if (!$input || !isset($input['snapshot'])) {
        json_error('Missing snapshot data');
    }

    $expected_version = isset($input['expected_version']) ? (int)$input['expected_version'] : 0;

    // Aktuelle Version lesen
    $current_version = 0;
    if (file_exists($snapshot_file)) {
        $current = json_decode(file_get_contents($snapshot_file), true);
        $current_version = isset($current['version']) ? $current['version'] : 0;
    }

    // Optimistic Locking: Version muss stimmen
    if ($expected_version !== $current_version) {
        json_response(array(
            'ok' => false,
            'error' => 'Version mismatch',
            'server_version' => $current_version
        ), 409);
    }

    // Neuen Snapshot schreiben
    $new_version = $current_version + 1;
    $data = array(
        'version' => $new_version,
        'updated_at' => date('c'),
        'snapshot' => $input['snapshot']
    );

    // Verzeichnis erstellen falls nötig
    $dir = dirname($snapshot_file);
    if (!is_dir($dir)) {
        mkdir($dir, 0755, true);
    }

    // Atomar schreiben
    $tmp_file = $snapshot_file . '.tmp.' . getmypid();
    if (file_put_contents($tmp_file, json_encode($data, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT)) === false) {
        @unlink($tmp_file);
        json_error('Failed to write snapshot', 500);
    }

    if (!rename($tmp_file, $snapshot_file)) {
        @unlink($tmp_file);
        json_error('Failed to save snapshot', 500);
    }

    json_response(array(
        'ok' => true,
        'version' => $new_version
    ));
}

json_error('Method not allowed', 405);
```

## 4. Testen mit curl

```bash
# Basis-URL anpassen
API_URL="https://your-api-domain.com/hashcards-pwa/api"
```

### Account registrieren

```bash
# Token generieren (client-seitig)
TOKEN=$(openssl rand -base64 32 | tr '+/' '-_' | tr -d '=')
ACCOUNT_ID="ABCDEFGHIJ2345"  # Base32: A-Z, 2-7
DEVICE_ID="test-device-001"
TOKEN_HASH=$(echo -n "$TOKEN" | sha256sum | cut -d' ' -f1)

# Registrieren
curl -X POST "$API_URL/register.php" \
  -H "Content-Type: application/json" \
  -d "{
    \"account_id\": \"$ACCOUNT_ID\",
    \"token_sha256\": \"$TOKEN_HASH\",
    \"device_id\": \"$DEVICE_ID\"
  }"

# Response: {"ok":true}
```

### Events hochladen

```bash
AUTH="$ACCOUNT_ID.$TOKEN"

curl -X POST "$API_URL/append.php" \
  -H "Authorization: Bearer $AUTH" \
  -H "Content-Type: application/json" \
  -d "{
    \"device_id\": \"$DEVICE_ID\",
    \"expected_offset\": 0,
    \"chunk_id\": \"chunk-001\",
    \"chunk\": \"{\\\"event_id\\\":\\\"e1\\\",\\\"rating\\\":\\\"good\\\"}\"
  }"

# Response: {"ok":true,"new_size":42}
```

### Events abrufen

```bash
curl -X GET "$API_URL/since.php?device_id=$DEVICE_ID&offset=0" \
  -H "Authorization: Bearer $AUTH"

# Response: {"event_id":"e1","rating":"good"}
```

### Devices auflisten

```bash
curl -X GET "$API_URL/devices.php" \
  -H "Authorization: Bearer $AUTH"

# Response: {"ok":true,"devices":[{"device_id":"test-device-001","size":42,"last_chunk_id":"chunk-001"}]}
```

### Snapshot hochladen

```bash
curl -X POST "$API_URL/snapshot.php" \
  -H "Authorization: Bearer $AUTH" \
  -H "Content-Type: application/json" \
  -d '{
    "expected_version": 0,
    "snapshot": {
      "profile": {"name": "Test"},
      "decks": [],
      "cardStates": [],
      "reviews": [],
      "sessions": []
    }
  }'

# Response: {"ok":true,"version":1}
```

### Snapshot abrufen

```bash
curl -X GET "$API_URL/snapshot.php" \
  -H "Authorization: Bearer $AUTH"

# Response: {"ok":true,"snapshot":{...},"version":1}
```

## 5. Troubleshooting

### CORS-Fehler

- Prüfen ob mod_headers aktiviert: `a2enmod headers && systemctl reload apache2`
- Browser DevTools > Network > Response Headers prüfen
- Origin in `.htaccess` und `auth.php` muss zum Frontend passen

### Daten-Verzeichnis prüfen

```bash
# Existiert es?
ls -la /var/lib/hashcards-pwa/

# Berechtigungen korrekt?
# Sollte Webserver-User gehören, 750
```

### 500 Internal Server Error

```bash
# PHP Error Log prüfen
tail -f /var/log/apache2/error.log

# Berechtigungen prüfen
ls -la /var/lib/hashcards-pwa/

# PHP-Syntax prüfen
php -l hashcards-pwa/api/register.php
```

### Offset Mismatch

- Client muss Server-Size aus Response lesen
- Bei Konflikt: Events seit server_size holen, mergen, retry

### Token-Fehler (401)

- Token muss Base64url-encoded sein (keine +/=)
- SHA256-Hash muss lowercase hex sein
- Account-ID ist case-insensitive (wird uppercase gespeichert)
