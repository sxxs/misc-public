# WIAI 25-Jahr-Jubiläumsseite Ideen

**Created:** 1/13/2026 8:09:58  
**Updated:** 1/15/2026 21:02:19  
**Exported:** 1/15/2026 21:03:59  
**Link:** [https://claude.ai/chat/40dca3c3-48ce-4c60-933e-49f8892b3d2b](https://claude.ai/chat/40dca3c3-48ce-4c60-933e-49f8892b3d2b)  

## Prompt:
15/01/2026, 06:54:31

````plaintext
Thought process: Evaluierte Integrationsmöglichkeiten zwischen Visitor-Zähler und Frontend-Animation.

Dominik hat jetzt ein Python-Skript, das Caddy-Logs parst und echte Browser-Besucher zählt (filtert Bots raus). Das Skript:
1. Liest JSON-formatierte Caddy-Logs
2. Filtert Bots anhand von User-Agent patterns
3. Zählt unique Besucher pro Woche (IP + UA als Fingerprint)
4. Gruppiert nach URLs

Jetzt braucht er die "Verdrahtung" mit dem Frontend - also wie der Zählerstand an die WIAI25-Animation kommt.

Lass mich überlegen, wie das funktionieren könnte:

**Option 1: Statische JSON-Datei**
- Das Python-Skript läuft als Cronjob (z.B. alle 5 Minuten)
- Schreibt den aktuellen Zählerstand in eine JSON-Datei
- Frontend fetcht diese JSON-Datei
- Vorteile: Einfach, kein Backend nötig
- Nachteile: Polling, nicht ganz real-time

**Option 2: Server-Side Rendering**
- Hugo generiert die Seite mit eingebettetem Zählerstand
- Cronjob regeneriert die Seite periodisch
- Vorteile: Kein JavaScript nötig für Zähler
- Nachteile: Seite muss neu gebaut werden

**Option 3: API-Endpoint**
- Python-Script oder separater Service exposed einen Endpoint
- Frontend macht Fetch auf diesen Endpoint
- Vorteile: Real-time
- Nachteile: Mehr Infrastruktur

Für die Animation war das Konzept:
- ~20.000 Updates über 25 Wochen
- Pro Minute mit mindestens 1 Visitor → +1 Update zum Logo


- Alle Frames sind als SVG vorberechnet

Die zentrale Frage bleibt: Wie wird der aktuelle Zählerstand auf den entsprechenden Frame der Animation abgebildet? Das sollte ich mit Dominik durchgehen und verschiedene Lösungsansätze präsentieren.
````

Guter Ansatz! Das Skript zählt unique Visitors pro Woche basierend auf IP+UA-Fingerprint und filtert Bots sauber raus. Jetzt zur Verdrahtung:

## Architektur-Optionen

### Option 1: Statische JSON-Datei (Empfehlung für Hugo)

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  Caddy Logs     │────▶│  Python Cronjob  │────▶│  counter.json   │
│  (access.log)   │     │  (alle 5 min)    │     │  (public/)      │
└─────────────────┘     └──────────────────┘     └────────┬────────┘
                                                          │
                                                          ▼
                                                 ┌─────────────────┐
                                                 │  Frontend JS    │
                                                 │  fetch() + SVG  │
                                                 └─────────────────┘
```

**counter.json:**
```json
{
  "total": 1247,
  "updated_at": "2026-01-15T14:30:00Z",
  "weekly": {
    "2026-W01": 89,
    "2026-W02": 156
  }
}
```

**Vorteile:**
- Kein separates Backend nötig
- Cache-freundlich (CDN kann JSON cachen)
- Hugo-kompatibel (statische Datei)
- Ausfallsicher (Fallback auf letzten Stand)

---

### Option 2: In Hugo eingebettet (Build-Time)

Der Cronjob schreibt eine `data/counter.json` und triggert Hugo-Rebuild:

```bash
# cronjob
python3 count_visitors.py > data/counter.json
hugo --minify
```

Hugo-Template liest dann:
```html
{{ $counter := .Site.Data.counter }}
<div class="counter">{{ $counter.total }}</div>
```

**Nachteil:** Seite muss neu gebaut werden. Bei alle 5 Minuten vielleicht zu viel.

---

## Meine Empfehlung: Option 1 mit erweitertem Script

Das Script sollte:
1. Den kumulativen Gesamtzähler tracken (nicht nur aktuelle Woche)
2. Eine JSON-Datei schreiben, die das Frontend fetchen kann
3. Optional: Den aktuellen "Frame" der Animation vorberechnen

Hier eine erweiterte Version:

```python
#!/usr/bin/env python3
"""
WIAI25 Visitor Counter
Reads Caddy logs, counts unique real visitors, outputs JSON for frontend.
"""
import json
import re
import os
from collections import defaultdict
from datetime import datetime, timedelta
from pathlib import Path

# === Configuration ===
LOG_FILE = '/var/log/caddy/access.log'
OUTPUT_FILE = '/var/www/wiai25/public/api/counter.json'
STATE_FILE = '/var/lib/wiai25/counter_state.json'
URLS_OF_INTEREST = ['/', '/index.html']

# Animation config
TOTAL_FRAMES = 20000  # Total frames in animation
CAMPAIGN_START = datetime(2026, 1, 6)  # 25 weeks before June 27
CAMPAIGN_END = datetime(2026, 6, 27)

# === Bot Detection ===
BOT_PATTERNS = re.compile(
    r'bot|crawl|spider|slurp|baidu|yandex|bing|google|facebook|twitter|'
    r'semrush|ahrefs|mj12|dotbot|petalbot|bytespider|gptbot|claude|'
    r'curl|wget|python|java|go-http|node|axios|scrapy|headless',
    re.IGNORECASE
)

BROWSER_PATTERN = re.compile(
    r'Mozilla/5\.0.*?(Chrome|Firefox|Safari|Edge|Opera|MSIE|Trident)',
    re.IGNORECASE
)

def is_real_browser(user_agent):
    if not user_agent:
        return False
    if BOT_PATTERNS.search(user_agent):
        return False
    return bool(BROWSER_PATTERN.search(user_agent))


def load_state():
    """Load persistent state (already counted fingerprints)."""
    if os.path.exists(STATE_FILE):
        with open(STATE_FILE, 'r') as f:
            return json.load(f)
    return {
        'total': 0,
        'seen_fingerprints': [],  # List to preserve JSON serialization
        'last_processed_ts': 0,
        'weekly': {}
    }


def save_state(state):
    """Save state for next run."""
    Path(STATE_FILE).parent.mkdir(parents=True, exist_ok=True)
    with open(STATE_FILE, 'w') as f:
        json.dump(state, f)


def get_week_key(ts):
    dt = datetime.fromtimestamp(ts)
    year, week, _ = dt.isocalendar()
    return f"{year}-W{week:02d}"


def process_logs(state):
    """Process new log entries since last run."""
    seen = set(state['seen_fingerprints'])
    last_ts = state['last_processed_ts']
    new_visitors = 0
    max_ts = last_ts
    
    weekly = defaultdict(int, state.get('weekly', {}))
    
    try:
        with open(LOG_FILE, 'r') as f:
            for line in f:
                try:
                    entry = json.loads(line.strip())
                except json.JSONDecodeError:
                    continue
                
                ts = entry.get('ts', 0)
                if ts <= last_ts:
                    continue
                    
                max_ts = max(max_ts, ts)
                
                req = entry.get('request', {})
                uri = req.get('uri', '').split('?')[0]
                
                if uri not in URLS_OF_INTEREST:
                    continue
                
                headers = req.get('headers', {})
                ua = headers.get('User-Agent', [''])[0]
                
                if not is_real_browser(ua):
                    continue
                
                ip = req.get('remote_ip', '')
                fingerprint = f"{ip}|{ua[:100]}"  # Truncate UA
                
                if fingerprint not in seen:
                    seen.add(fingerprint)
                    new_visitors += 1
                    week = get_week_key(ts)
                    weekly[week] += 1
                    
    except FileNotFoundError:
        pass  # Log file doesn't exist yet
    
    state['total'] += new_visitors
    state['seen_fingerprints'] = list(seen)[-100000:]  # Keep last 100k
    state['last_processed_ts'] = max_ts
    state['weekly'] = dict(weekly)
    
    return new_visitors


def calculate_frame(total):
    """Map visitor count to animation frame."""
    # Simple linear mapping, kann später angepasst werden
    frame = min(total, TOTAL_FRAMES)
    
    # Calculate progress percentage
    progress = (frame / TOTAL_FRAMES) * 100
    
    # Calculate which "level" (pixel size) we're at
    # 14 levels, roughly equal distribution
    level = min(14, 1 + (frame * 14 // TOTAL_FRAMES))
    
    return {
        'frame': frame,
        'progress': round(progress, 2),
        'level': level
    }


def write_output(state):
    """Write JSON for frontend consumption."""
    now = datetime.now()
    
    animation = calculate_frame(state['total'])
    
    output = {
        'total': state['total'],
        'animation': animation,
        'updated_at': now.isoformat(),
        'campaign': {
            'start': CAMPAIGN_START.isoformat(),
            'end': CAMPAIGN_END.isoformat(),
            'weeks_total': 25,
            'weeks_elapsed': max(0, (now - CAMPAIGN_START).days // 7)
        },
        'weekly': state.get('weekly', {})
    }
    
    Path(OUTPUT_FILE).parent.mkdir(parents=True, exist_ok=True)
    with open(OUTPUT_FILE, 'w') as f:
        json.dump(output, f, indent=2)
    
    return output


def main():
    state = load_state()
    new_visitors = process_logs(state)
    save_state(state)
    output = write_output(state)
    
    print(f"Processed: +{new_visitors} new visitors")
    print(f"Total: {output['total']}")
    print(f"Animation frame: {output['animation']['frame']}")


if __name__ == '__main__':
    main()
```

---

## Frontend-Integration

Im HTML/JS:

```javascript
// Fetch counter and update animation
async function updateCounter() {
    try {
        const res = await fetch('/api/counter.json');
        const data = await res.json();
        
        // Update counter display
        document.querySelector('.visitor-count').textContent = 
            data.total.toLocaleString('de-DE');
        
        // Update animation frame
        const frame = data.animation.frame;
        const svgUrl = `/animation/frame-${String(frame).padStart(5, '0')}.svg`;
        document.querySelector('.wiai-animation').src = svgUrl;
        
    } catch (e) {
        console.log('Counter fetch failed, using fallback');
    }
}

// Initial load + periodic refresh
updateCounter();
setInterval(updateCounter, 60000); // Refresh every minute
```

---

## Offene Fragen

1. **Granularität:** Soll jeder unique Visitor = 1 Frame sein, oder soll es eine andere Mapping-Logik geben? (z.B. logarithmisch, damit es am Anfang schneller wächst)

2. **State-Persistenz:** Wo soll der State liegen? `/var/lib/wiai25/` oder im Hugo-Verzeichnis?

3. **Fingerprint-Reset:** Sollen Fingerprints täglich/wöchentlich zurückgesetzt werden, sodass wiederkehrende Besucher erneut zählen?

4. **Fallback:** Was zeigt das Frontend, wenn die JSON nicht erreichbar ist? Letzter bekannter Stand? Fester Dummy-Wert?

5. **Animation-Frames:** Liegen die SVGs bereits vor oder müssen die noch generiert werden?



## Response:
15/01/2026, 20:21:23

Für das coole gelb schwarze Design (Final) brauche ich noch Ideen wie wir die Stories layouten und wie wir weiteren content layouten? Machen wir das als Single Page die den content nachlädt? Also ohne Page url Wechsel? Klappen wir die Stories irgendwie klug auf? Machen wir ein masonry oder Patchwork grid für die Stories damit man auch die älteren gut erkennen kann (halt kleiner als die aktuelle? Und was machen wir perspektivisch mit den studentischen Arbeiten oder expobaten die wir auf der Seite teasers? Wir sollten auch Forschungshighlights und Studiengang portifolii cool aufbereiten damit Schüler und andere Zielgruppen möglichst alle sie interessierenden Infos auf einer Seite finden.  Machen wir das alles in place mit htmx oder so oder klassisch mit Unterseiten - dafür haben wir aber noch kein Page Layout und dann bräuchten wir navi usw. Wie sind pro und con für single page site (content könnte man ja durch anchor in der url direkt verlinkest machen.



## Prompt:
15/01/2026, 20:22:44

````plaintext
Thought process: Orchestrierte Hybrid-Ansatz mit asymmetrischem Grid und Alpine.js-Interaktivität.

Der User fragt nach dem Layout-Konzept für die WIAI25-Seite im Bold-Design. Die Kernfragen sind:

1. Single Page vs. Multi-Page
2. Stories-Layout (Masonry? Aufklappen?)
3. Weitere Content-Bereiche (Forschung, Studiengänge, Exponate)
4. Technische Umsetzung (htmx? klassisch?)

Lass mich das durchdenken und eine fundierte Empfehlung geben.

**Single Page vs. Multi-Page:**

Pro Single Page:
- Keine zusätzlichen Page-Templates nötig
- Keine Navigation-Komplexität
- Immersives Erlebnis, "Magazin-Feeling"
- Anchor-Links (#story-01) ermöglichen direktes Verlinken
- Weniger HTTP-Requests nach Initial Load
- Passt zum Event-Charakter (eine Seite, ein Event)

Contra Single Page:
- Kann bei viel Content sehr lang werden
- SEO theoretisch schlechter (aber für eine Event-Seite egal)
- Initial Load größer (aber mit Lazy Loading lösbar)
- Browser "Zurück" funktioniert anders

Pro Multi-Page:
- Klare URLs für jeden Content
- Leichter zu pflegen (jede Story = eigene Markdown-Datei)
- Bessere Analytics (Pageviews pro Story)
- Klassisches Hugo-Pattern

Contra Multi-Page:
- Braucht Page-Template
- Navigation muss designed werden
- Mehr Arbeit

**Meine Empfehlung:** Hybrid-Ansatz
- Landing Page als "Hub" mit allen Sections
- Stories klappen inline auf ODER laden per htmx nach
- Tieferer Content (Studiengänge, Forschung) als Overlays/Modals oder eigene Pages


- Für die 25 Stories über 25 Wochen brauche ich ein Layout, das die aktuelle Story hervorhebt, ältere aber trotzdem zugänglich macht ohne zu überfordern. Vier Optionen stehen zur Auswahl: eine vertikale Timeline (scrollbar, aber potenziell sehr lang), ein Masonry-Grid im Pinterest-Stil mit variablen Größen, ein horizontaler Scroller oder ein Akkordeon-System mit sequenziellem Aufklappen. Jeder Ansatz hat unterschiedliche Vor- und Nachteile für Usability und visuelles Interesse.

Ein asymmetrisches Grid-Layout scheint am vielversprechendsten: die neueste Story groß und prominent, die letzten 3-4 in mittlerer Größe, der Rest als kleine Thumbnails oder Titel. Das 5x5-Kalender-Grid für 25 Stories könnte auch funktionieren.

Bei den Content-Bereichen muss ich zwischen verschiedenen Zielgruppen unterscheiden – Schüler und Studieninteressierte brauchen ein Studiengänge-Portfolio mit expandierbaren Cards und "Warum WIAI?"-Argumente, während Forschung durch Highlight-Projekte und Themencluster (KI, Security, HCI) präsentiert wird. Für Exponate plane ich eine Preview-Galerie mit Status-Updates der Projekte.

Technisch wäre htmx elegant für Stories ohne Page Reload, Content-Nachladen und Filter – aber Hugo ist ein Static Site Generator und htmx benötigt Server-Endpoints. Ich muss Alternativen evaluieren.

Alpine.js mit HTML-Partials scheint der beste Kompromiss für Hugo zu sein. Ich könnte alle Stories in HTML vorrendern und Alpine.js für Client-Side Interaktivität nutzen, statt auf Vanilla JS mit fetch() auf vorgerenderte HTML-Partials zu setzen.
````

Gute Fragen. Lass mich das systematisch durchdenken:

## Single Page vs. Multi-Page: Abwägung

| Aspekt | Single Page | Multi-Page |
|--------|-------------|------------|
| **User Experience** | Immersiv, Magazin-Feeling | Klassisch, "Website" |
| **Entwicklung** | Ein Template, aber komplexere Interaktion | Mehrere Templates, aber simpler |
| **Hugo-Kompatibilität** | Geht, aber gegen den Strich | Native Pattern |
| **Verlinkbarkeit** | Anchors (`#story-01`) | Echte URLs (`/stories/01/`) |
| **SEO** | Egal für Event-Seite | Besser, aber irrelevant hier |
| **Content-Pflege** | Alles in einer Datei oder Partials | Jede Story = eigene .md |
| **Analytics** | Schwieriger (Scroll-Tracking) | Einfach (Pageviews) |
| **Performance** | Initial Load größer, dann schnell | Kleiner Initial, mehr Requests |

**Meine Empfehlung: Hybrid**

Die Landing Page bleibt der Hub. Tieferer Content lädt inline nach (kein Page-Wechsel), aber mit URL-Update für Verlinkbarkeit. Das geht mit:

```javascript
// Pseudo-Code
history.pushState({}, '', '#story-01');
// oder sogar
history.pushState({}, '', '/stories/01/');  // mit Service Worker
```

---

## Stories-Layout: Konzept "Wachsende Timeline"

### Idee: Die Stories "wachsen" wie das Logo

```
Woche 1:
┌─────────────────────────────────────────────────┐
│                                                 │
│  [GROSSE STORY #01]                             │
│                                                 │
└─────────────────────────────────────────────────┘

Woche 5:
┌─────────────────────────────────────────────────┐
│                                                 │
│  [GROSSE STORY #05 - AKTUELL]                   │
│                                                 │
├────────────────────┬────────────────────────────┤
│                    │                            │
│  [#04 mittel]      │  [#03 mittel]              │
│                    │                            │
├──────┬──────┬──────┴──────┬─────────────────────┤
│ #02  │ #01  │             │                     │
│ sm   │ sm   │             │                     │
└──────┴──────┴─────────────┴─────────────────────┘

Woche 25 (Finale):
┌─────────────────────────────────────────────────┐
│  [#25 - FINALE STORY - GROSS]                   │
├──────────────┬──────────────┬───────────────────┤
│  [#24 med]   │  [#23 med]   │  [#22 med]        │
├────┬────┬────┼────┬────┬────┼────┬────┬────┬────┤
│#21 │#20 │#19 │#18 │#17 │... │ #3 │ #2 │ #1 │    │
└────┴────┴────┴────┴────┴────┴────┴────┴────┴────┘
```

### CSS Grid Implementation

```css
.stories-grid {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 1rem;
}

/* Aktuelle Story: volle Breite */
.story-current {
  grid-column: 1 / -1;
}

/* Letzte 2-3: halbe Breite */
.story-recent {
  grid-column: span 3;
}

/* Ältere: kleine Cards */
.story-archive {
  grid-column: span 2; /* oder span 1 für ganz kleine */
}
```

### Interaktion: Inline-Expand

Statt Page-Wechsel: Story klappt auf und schiebt den Rest nach unten.

```html
<!-- Collapsed -->
<article class="story story-archive" data-story="03">
  <div class="story-preview">
    <span class="story-number">#03</span>
    <h3>Der erste Absolvent</h3>
  </div>
</article>

<!-- Expanded (nach Klick) -->
<article class="story story-archive is-expanded" data-story="03">
  <div class="story-preview">...</div>
  <div class="story-content">
    <img src="/stories/03/hero.jpg" loading="lazy">
    <div class="story-body">
      <!-- Voller Text, Bilder, etc. -->
    </div>
    <button class="story-close">Schließen</button>
  </div>
</article>
```

---

## Technische Umsetzung: Alpine.js + Hugo Partials

**Warum Alpine.js statt htmx:**
- htmx braucht Server-Endpoints → Hugo ist static
- Alpine.js ist client-side, funktioniert mit vorgerenderten Partials
- Leichtgewichtig (~15kb), kein Build-Step
- Perfekt für "ein bisschen Interaktivität"

**Struktur:**

```
content/
├── _index.md              # Landing Page
└── stories/
    ├── 01.md              # Story #01
    ├── 02.md              # Story #02
    └── ...

layouts/
├── index.html             # Landing Page Template
└── partials/
    ├── story-card.html    # Collapsed Story
    ├── story-full.html    # Expanded Story Content
    └── section-*.html     # Andere Sections

static/
└── stories/               # Pre-rendered full stories als HTML-Fragmente
    ├── 01.html
    ├── 02.html
    └── ...
```

**Alpine.js Component:**

```html
<section x-data="storiesManager()" class="stories-section">
  <div class="stories-grid">
    <!-- Hugo rendert alle Story-Cards -->
    {{ range .Site.RegularPages.ByDate.Reverse }}
      {{ if eq .Section "stories" }}
        <article 
          class="story"
          :class="{ 'is-expanded': expandedStory === '{{ .Params.number }}' }"
          data-story="{{ .Params.number }}"
        >
          <div class="story-preview" @click="toggle('{{ .Params.number }}')">
            <span class="story-number">#{{ .Params.number }}</span>
            <h3>{{ .Title }}</h3>
          </div>
          
          <div x-show="expandedStory === '{{ .Params.number }}'" x-collapse>
            <div x-html="storyContent['{{ .Params.number }}']"></div>
          </div>
        </article>
      {{ end }}
    {{ end }}
  </div>
</section>

<script>
function storiesManager() {
  return {
    expandedStory: null,
    storyContent: {},
    
    async toggle(id) {
      if (this.expandedStory === id) {
        this.expandedStory = null;
        history.pushState({}, '', '#geschichten');
        return;
      }
      
      // Load content if not cached
      if (!this.storyContent[id]) {
        const res = await fetch(`/stories/${id}.html`);
        this.storyContent[id] = await res.text();
      }
      
      this.expandedStory = id;
      history.pushState({}, '', `#story-${id}`);
      
      // Scroll into view
      this.$nextTick(() => {
        document.querySelector(`[data-story="${id}"]`)
          .scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    },
    
    init() {
      // Handle direct links (#story-03)
      const hash = window.location.hash;
      if (hash.startsWith('#story-')) {
        const id = hash.replace('#story-', '');
        this.toggle(id);
      }
    }
  }
}
</script>
```

---

## Weitere Content-Bereiche

### 1. Studiengänge-Portfolio

Für Schüler das wichtigste. Vorschlag: **Filterbares Card-Grid**

```
┌─────────────────────────────────────────────────────────────┐
│  STUDIENGÄNGE                                               │
│                                                             │
│  [Alle] [Bachelor] [Master] [International]                 │
│                                                             │
├──────────────────┬──────────────────┬───────────────────────┤
│                  │                  │                       │
│  B.Sc.           │  B.Sc.           │  B.Sc.                │
│  Informatik      │  Angewandte      │  Wirtschafts-         │
│                  │  Informatik      │  informatik           │
│  [Details ↓]     │  [Details ↓]     │  [Details ↓]          │
│                  │                  │                       │
├──────────────────┴──────────────────┴───────────────────────┤
│                                                             │
│  ▼ EXPANDED: B.Sc. Informatik                               │
│                                                             │
│  Klassische Informatik mit Wahlmöglichkeiten in KI,         │
│  Security, Software Engineering...                          │
│                                                             │
│  Regelstudienzeit: 6 Semester                               │
│  Sprache: Deutsch                                           │
│  NC: Nein                                                   │
│                                                             │
│  [→ Zur Studiengangsseite]  [→ Bewerbung]                   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 2. Forschungs-Highlights

Themencluster statt Lehrstuhl-Liste:

```
┌─────────────────────────────────────────────────────────────┐
│  FORSCHUNG                                                  │
│                                                             │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐            │
│  │             │ │             │ │             │            │
│  │  KÜNSTLICHE │ │  HUMAN-     │ │  SICHERE    │            │
│  │  INTELLIGENZ│ │  COMPUTER   │ │  SYSTEME    │            │
│  │             │ │  INTERACTION│ │             │            │
│  │  12 Projekte│ │  8 Projekte │ │  6 Projekte │            │
│  │             │ │             │ │             │            │
│  └─────────────┘ └─────────────┘ └─────────────┘            │
│                                                             │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐            │
│  │ INFORMATION │ │  SOFTWARE   │ │  DIGITAL    │            │
│  │ SYSTEMS     │ │  ENGINEERING│ │  HUMANITIES │            │
│  └─────────────┘ └─────────────┘ └─────────────┘            │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

Klick auf Cluster → zeigt Projekte/Papers/Ansprechpartner inline.

### 3. Exponate / Studentische Arbeiten

Galerie mit Status-Badges:

```
┌─────────────────────────────────────────────────────────────┐
│  EXPONATE AM 27. JUNI                                       │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐  │
│  │                                                       │  │
│  │  [VIDEO/GIF PREVIEW]                                  │  │
│  │                                                       │  │
│  │  Pattern Match                              SPIELBAR  │  │
│  │  Zwei-Spieler-Reaktionsspiel                         │  │
│  │                                                       │  │
│  │  [Dev-Log lesen →]                                    │  │
│  │                                                       │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                             │
│  ┌─────────────────┐ ┌─────────────────┐ ┌───────────────┐  │
│  │ Generative      │ │ Vorlieben-      │ │ Sammelkarten  │  │
│  │ Kunst           │ │ Quiz            │ │               │  │
│  │                 │ │                 │ │               │  │
│  │ PROTOTYP        │ │ IN ARBEIT       │ │ DESIGN-PHASE  │  │
│  └─────────────────┘ └─────────────────┘ └───────────────┘  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Vorgeschlagene Seiten-Architektur

```
LANDING PAGE (index.html)
│
├── #hero              (Animation, Datum, CTAs)
├── #stats             (Zahlen-Balken)
├── #perspektiven      (Zielgruppen-Cards)
├── #programm          (Ablauf + Highlights)
├── #geschichten       (Stories-Grid, expandable)
├── #forschung         (Themencluster, expandable)
├── #studiengaenge     (Portfolio, filterbar)
├── #exponate          (Galerie mit Status)
├── #anmeldung         (Formular)
└── #footer

Alle Sections sind:
- Direkt verlinkbar (#geschichten)
- Content lädt bei Bedarf nach (lazy)
- Expand/Collapse inline
- URL updatet bei Interaktion (#story-05, #studium-bsc-inf)
```

---

## Konkreter nächster Schritt

Soll ich einen Prototyp bauen, der das Stories-Grid mit Alpine.js implementiert? Dann siehst du, wie das Expand/Collapse funktioniert und ob das Gefühl stimmt.

Oder erst die Content-Struktur in Hugo anlegen (Ordner, Frontmatter-Schema für Stories)?



## Response:
15/01/2026, 20:31:15

Ich habe noch nicht ganz verstanden. Die Seite wird ja super lang wenn wir das alles untereinander legen. Wäre es nicht klüger zu trennen in Infos zum Event inkl Geschichten und Exponate. Dann Infos zum Studium und zur Forschung sodas sich da der main Inhalt tauscht. Also vielleicht nur der Hero stehen bleibt aber der Haupt Inhalt (Programm und highlights und Anmeldung) dann durch den anderen gewünschten content ausgetauscht werde. Dafür braucht es intuitive UI zum Wechsel der Ansicht und zurück.  Verstehst du? Wenn nicht frag nach. Und überleg mal pros und cons.



## Prompt:
15/01/2026, 20:32:20

````plaintext
Thought process: Erfasste Tab-System-Konzept und evaluierte Vor- sowie Nachteile.

Ah, jetzt verstehe ich was Dominik meint. Er will nicht eine endlos lange Single Page, sondern eine Art "Tab-System" oder "View-Switcher" auf oberster Ebene:

Der Hero bleibt immer stehen, aber der Hauptbereich darunter wechselt komplett zwischen verschiedenen "Modi":
1. Event (Programm, Geschichten, Exponate, Anmeldung)
2. Studium (Studiengänge, Infos für Schüler)
3. Forschung (Themencluster, Projekte)

Das ist wie eine App mit Tabs oder ein Single Page Application Pattern, nur ohne echten Page-Wechsel.

Lass mich das durchdenken und Pro/Con aufstellen.
````

Ja, ich verstehe jetzt! Du meinst so etwas:

```
┌─────────────────────────────────────────────────────────────┐
│  HERO (bleibt immer)                                        │
│  Animation, "25 Jahre", Datum                               │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  [ EVENT ]    [ STUDIUM ]    [ FORSCHUNG ]    ← View-Switch │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌───────────────────────────────────────────────────────┐  │
│  │                                                       │  │
│  │   MAIN CONTENT                                        │  │
│  │   (wird komplett ausgetauscht)                        │  │
│  │                                                       │  │
│  │   Event:     Programm, Geschichten, Exponate, CTA     │  │
│  │   Studium:   Studiengänge, FAQ, Bewerbung             │  │
│  │   Forschung: Themencluster, Projekte, Transfer        │  │
│  │                                                       │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│  FOOTER (bleibt immer)                                      │
└─────────────────────────────────────────────────────────────┘
```

---

## Pro & Contra

### Pro: View-Switching

| Vorteil | Erklärung |
|---------|-----------|
| **Fokussiert** | User sieht nur was ihn interessiert, kein Scrollen durch irrelevanten Content |
| **Schneller** | Weniger DOM, schnelleres Rendering |
| **Klare Zielgruppen** | Schüler → Studium, Alumni → Event, Partner → Forschung |
| **App-Feeling** | Modern, interaktiv, nicht "Website von 2010" |
| **Hero bleibt sichtbar** | Animation und Branding immer präsent |
| **Einfache Navigation** | Nur 3 Optionen, keine Deep-Hierarchie |

### Contra: View-Switching

| Nachteil | Erklärung |
|----------|-----------|
| **Versteckter Content** | User muss aktiv switchen, sieht nicht "alles auf einen Blick" |
| **Discoverability** | Schüler kommt für Event-Info, sieht Studium-Tab vielleicht nie |
| **Browser-Verhalten** | Back-Button muss manuell gehandhabt werden |
| **Komplexere Logik** | State-Management, URL-Sync, Transitions |
| **Content-Dopplung?** | Manche Infos passen in mehrere Views (z.B. Exponate = Event + Studium?) |
| **Initial-Entscheidung** | User muss sofort wählen – oder Default festlegen |

---

## Variante A: Tabs im Header (unter Hero)

```
┌─────────────────────────────────────────────────────────────┐
│  HERO                                                       │
├──────────┬──────────┬──────────┬────────────────────────────┤
│  EVENT   │  STUDIUM │ FORSCHUNG│                            │
│  ██████  │          │          │              [Anmelden]    │
└──────────┴──────────┴──────────┴────────────────────────────┘
     ▲
     └── Aktiver Tab hat Unterstrich oder Hintergrund
```

**URL-Schema:**
- `wiai25.de/` oder `wiai25.de/#event` → Event (Default)
- `wiai25.de/#studium` → Studium
- `wiai25.de/#forschung` → Forschung

**Vorteil:** Klassisch, sofort verständlich
**Nachteil:** Sieht nach "normaler Website" aus, weniger besonders

---

## Variante B: Floating Toggle / Segmented Control

```
┌─────────────────────────────────────────────────────────────┐
│  HERO                                                       │
│                                                             │
│            ┌────────────────────────────────┐               │
│            │ EVENT │ STUDIUM │ FORSCHUNG    │               │
│            └────────────────────────────────┘               │
│                      ▲                                      │
│                      └── Pill-Style Toggle                  │
└─────────────────────────────────────────────────────────────┘
```

**Vorteil:** Kompakt, modern, klar als "Modus-Wechsel" erkennbar
**Nachteil:** Kann übersehen werden wenn zu subtil

---

## Variante C: Full-Width Section Indicator

```
┌─────────────────────────────────────────────────────────────┐
│  HERO                                                       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ← STUDIUM          DIE FEIER          FORSCHUNG →          │
│                     ═══════════                             │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Konzept:** Die Hauptansicht (Event/Feier) ist zentral, links/rechts sind "Wings" die man durch horizontalen Swipe oder Klick erreicht.

**Vorteil:** Räumliche Metapher, spielerisch
**Nachteil:** Komplexer zu bauen, mobile-Swipe-Konflikt mit Browser-Gesten

---

## Variante D: Hero selbst ist der Switch

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│                      WIAI25                                 │
│                                                             │
│     ┌─────────┐   ┌─────────┐   ┌─────────┐                 │
│     │         │   │         │   │         │                 │
│     │  DIE    │   │ STUDIEN-│   │FORSCHUNG│                 │
│     │  FEIER  │   │ GÄNGE   │   │         │                 │
│     │         │   │         │   │         │                 │
│     │  27.06. │   │ 8 B+M   │   │ 30 Prof │                 │
│     │         │   │         │   │         │                 │
│     └─────────┘   └─────────┘   └─────────┘                 │
│                                                             │
└─────────────────────────────────────────────────────────────┘

Nach Klick auf "DIE FEIER":

┌─────────────────────────────────────────────────────────────┐
│  ┌──────────────────────────────────────────────────────┐   │
│  │ ← Zurück            DIE FEIER            27.06.2026  │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                             │
│  [Event Content...]                                         │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Konzept:** Die Landing Page IST der View-Switcher. Drei große Karten. Klick → Hero schrumpft zum Sticky-Header, Content erscheint.

**Vorteil:** Sehr klar, keine versteckten Optionen, jeder sieht sofort alle drei Bereiche
**Nachteil:** Ein Klick mehr bis zum Content

---

## Meine Empfehlung: Variante D mit Default-View

**Begründung:**

1. **Das Event ist der Hauptanlass** für die Seite → Event sollte Default sein
2. **Schüler/Forschung sind Bonus** → sollten erreichbar, aber nicht aufdringlich sein
3. **Die drei Karten als Einstieg** machen die Struktur sofort klar
4. **Wiederkehrende Besucher** können direkt zu ihrem Bereich springen

**Umsetzung:**

```
Erster Besuch (oder wiai25.de/):
→ Zeige die drei Karten als Hero
→ Klick auf Karte → View wechselt, URL wird #event/#studium/#forschung

Direktlink (wiai25.de/#studium):
→ Überspringe Karten-Auswahl
→ Zeige direkt Studium-Content mit Mini-Header

Cookie/LocalStorage:
→ Merke letzte Auswahl für wiederkehrende Besucher (optional)
```

---

## Technische Umsetzung

```html
<body x-data="app()" :class="{ 'view-selected': currentView }">

  <!-- Landing State: Drei Karten -->
  <section x-show="!currentView" class="hero-chooser">
    <div class="wiai25-logo">WIAI25</div>
    
    <div class="view-cards">
      <button @click="setView('event')" class="view-card view-card--event">
        <h2>Die Feier</h2>
        <p>27. Juni 2026</p>
        <span>Programm, Geschichten, Anmeldung</span>
      </button>
      
      <button @click="setView('studium')" class="view-card view-card--studium">
        <h2>Studiengänge</h2>
        <p>5 Bachelor + 7 Master</p>
        <span>Alle Infos für Studieninteressierte</span>
      </button>
      
      <button @click="setView('forschung')" class="view-card view-card--forschung">
        <h2>Forschung</h2>
        <p>~30 Professuren</p>
        <span>Themen, Projekte, Transfer</span>
      </button>
    </div>
  </section>

  <!-- Selected State: Sticky Header + Content -->
  <template x-if="currentView">
    <div>
      <header class="sticky-header">
        <button @click="setView(null)" class="back-btn">← Übersicht</button>
        <div class="wiai25-mini">WIAI25</div>
        <nav class="view-tabs">
          <button :class="{ active: currentView === 'event' }" 
                  @click="setView('event')">Feier</button>
          <button :class="{ active: currentView === 'studium' }" 
                  @click="setView('studium')">Studium</button>
          <button :class="{ active: currentView === 'forschung' }" 
                  @click="setView('forschung')">Forschung</button>
        </nav>
      </header>

      <main>
        <div x-show="currentView === 'event'" x-html="views.event"></div>
        <div x-show="currentView === 'studium'" x-html="views.studium"></div>
        <div x-show="currentView === 'forschung'" x-html="views.forschung"></div>
      </main>
    </div>
  </template>

</body>

<script>
function app() {
  return {
    currentView: null,
    views: {},
    
    async setView(view) {
      // Update URL
      if (view) {
        history.pushState({}, '', `#${view}`);
      } else {
        history.pushState({}, '', '/');
      }
      
      // Lazy-load content if needed
      if (view && !this.views[view]) {
        const res = await fetch(`/partials/${view}.html`);
        this.views[view] = await res.text();
      }
      
      this.currentView = view;
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    
    init() {
      // Handle initial hash
      const hash = window.location.hash.slice(1);
      if (['event', 'studium', 'forschung'].includes(hash)) {
        this.setView(hash);
      }
      
      // Handle browser back
      window.addEventListener('popstate', () => {
        const hash = window.location.hash.slice(1);
        this.currentView = hash || null;
      });
    }
  }
}
</script>
```

---

## Visuelle Darstellung der drei Karten

```
┌─────────────────────────────────────────────────────────────────────┐
│                                                                     │
│                            WIAI 25                                  │
│                                                                     │
│         25 Jahre Wirtschaftsinformatik & Angewandte Informatik      │
│                        Universität Bamberg                          │
│                                                                     │
│  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐        │
│  │ █████████████   │ │                 │ │                 │        │
│  │                 │ │                 │ │                 │        │
│  │   DIE FEIER     │ │  STUDIENGÄNGE   │ │   FORSCHUNG     │        │
│  │                 │ │                 │ │                 │        │
│  │   27.06.2026    │ │   5 Bachelor    │ │  ~30 Professuren│        │
│  │   ERBA-Campus   │ │   7 Master      │ │   6 Themen-     │        │
│  │                 │ │                 │ │   cluster       │        │
│  │  ─────────────  │ │  ─────────────  │ │  ─────────────  │        │
│  │  Programm       │ │  Alle Infos     │ │  Projekte       │        │
│  │  Geschichten    │ │  für Studien-   │ │  Transfer       │        │
│  │  Anmeldung      │ │  interessierte  │ │  Kooperationen  │        │
│  │                 │ │                 │ │                 │        │
│  │    [ENTER]      │ │    [ENTER]      │ │    [ENTER]      │        │
│  └─────────────────┘ └─────────────────┘ └─────────────────┘        │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

Die "Event"-Karte könnte visuell betont sein (größer, farbiger) da das der Hauptanlass ist.

---

Macht das mehr Sinn? Soll ich einen visuellen Prototyp dieser Drei-Karten-Einstiegsseite bauen?



## Response:
15/01/2026, 20:41:41

Mh. Finde ich alles nicht optimal. Discoverability ist tatsächlich problematisch. Vielleicht dann eher ein Full width collapsible für Studium und Forschung und die Geschichten? Ich will Details zu den Studiengängen zeigen (berufsperspektiven, Verlaufspläne, Erfahrungsberichte, da brauche ich Platz und mehrere Ansichten pro Studiengang). Bei Forschung eher nicht so in die Tiefe aber auch nicht nur Überblicks Blabla. Eher reportagig und schlaglichtartig.  Studentische Projekte sind eine Mischung aus Blog und Collage/portfolio. Damit man beugierig wird wäre vielleicht ein collapsed/gallery view zum scrollen gut oder etwas das man aufklappen und vergrößern kann aber mit einer Vorschau in klein im collapsed state. Was wir bräuchten: visuellenabserchslung aber auch eine gewisse Ordnung damit man die Hierarchie / Logik der Seite schnell erfassen kann. Die collapsten Inhalte sollten wir dann wirklich lazy loaded? Daher dachte ich an htmx



## Prompt:
15/01/2026, 20:43:11

````plaintext
Thought process: Architektierte Full-Width-Collapsibles mit htmx-Lazy-Loading für optimale Discoverability.

Der User hat wichtige Punkte gemacht:

1. **Discoverability ist ein Problem** bei View-Switching
2. **Full-width collapsibles** könnten besser sein für:
   - Studiengänge (viel Tiefe: Berufsperspektiven, Verlaufspläne, Erfahrungsberichte)
   - Forschung (reportagig, schlaglichtartig, nicht so tief)
   - Geschichten
3. **Studentische Projekte**: Blog + Collage/Portfolio-Mix, collapsed gallery view zum scrollen, aufklappbar
4. **Visuelle Abwechslung + Ordnung** - Hierarchie muss schnell erfassbar sein
5. **Lazy Loading** mit htmx macht Sinn für collapsed content

Lass mich das durchdenken:

Die Seite wäre dann eine lange Single-Page, aber mit intelligenten Collapsibles die den Content managebar machen. Der Vorteil: Alles ist sichtbar (collapsed), aber Details laden erst bei Bedarf.

Struktur könnte sein:

`​`​`
HERO
├── Animation, Datum, CTAs

STATS BAND

PROGRAMM (immer sichtbar, kompakt)
├── Ablauf, Highlights

GESCHICHTEN [COLLAPSIBLE BAND]
├── Collapsed: Grid/Timeline der Story-Thumbnails
├── Expanded: Volle Story inline

STUDIENGÄNGE [COLLAPSIBLE BAND]  
├── Collapsed: Cards mit Namen + kurze Tagline
├── Expanded: Deep-dive mit Tabs (Perspektiven, Verlauf, Berichte)

FORSCHUNG [COLLAPSIBLE BAND]
├── Collapsed: Themencluster-Icons/Keywords
├── Expanded: Reportage-Snippets, Schlaglichter


`​`​`

Die Bands sind volle Breite, visuell distinct, und haben einen klaren collapsed/expanded state. Für die studentischen Projekte könnte ich horizontal scrollbare Thumbnails im collapsed Zustand zeigen, die sich dann zu einer Lightbox oder Inline-Details expandieren. htmx ermöglicht es, Content in separate HTML-Fragmente aufzuteilen und diese bei Bedarf nachzuladen, während Hugo die statischen Daten bereitstellt.
````

Jetzt verstehe ich besser. Du willst:

1. **Alles auf einer Seite** (Discoverability)
2. **Aber nicht endlos lang** → Collapsible Sections
3. **Unterschiedliche Tiefen** je nach Bereich
4. **Lazy Loading** für Performance

---

## Revidierte Struktur: "Accordion-Magazine"

```
┌─────────────────────────────────────────────────────────────────────┐
│  HERO (immer sichtbar, kompakt nach Scroll)                         │
├─────────────────────────────────────────────────────────────────────┤
│  STATS BAND                                                         │
├─────────────────────────────────────────────────────────────────────┤
│  PROGRAMM & ANMELDUNG (immer sichtbar - das ist der Hauptzweck)     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌─ GESCHICHTEN ──────────────────────────────────── [▼ Expand] ─┐  │
│  │  ○ ○ ○ ○ ○ ○ ○ ●    Horizontale Dots/Mini-Timeline            │  │
│  │  #08 aktuelle Story (Teaser)                                  │  │
│  └───────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  ┌─ STUDIENGÄNGE ─────────────────────────────────── [▼ Expand] ─┐  │
│  │  [Inf] [AI] [WI] [IISM] [CiH] ...   ← Chips als Preview       │  │
│  │  "8 Studiengänge für verschiedene Interessen"                 │  │
│  └───────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  ┌─ FORSCHUNG ────────────────────────────────────── [▼ Expand] ─┐  │
│  │  KI · HCI · Security · IS ·tic                                │  │
│  │  "Menschzentrierte Digitalisierung"                           │  │
│  └───────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  ┌─ EXPONATE ─────────────────────────────────────── [▼ Expand] ─┐  │
│  │  [thumb] [thumb] [thumb] [thumb] →  Horizontal scroll         │  │
│  └───────────────────────────────────────────────────────────────┘  │
│                                                                     │
├─────────────────────────────────────────────────────────────────────┤
│  FOOTER                                                             │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Expanded States im Detail

### Geschichten (Expanded)

```
┌─ GESCHICHTEN ──────────────────────────────────────── [▲ Collapse] ─┐
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │                                                             │    │
│  │  [GROSSE AKTUELLE STORY #08]                                │    │
│  │  Voller Text, Bilder, etc.                                  │    │
│  │                                                             │    │
│  └─────────────────────────────────────────────────────────────┘    │
│                                                                     │
│  Frühere Geschichten:                                               │
│  ┌───────┐ ┌───────┐ ┌───────┐ ┌───────┐ ┌───────┐ ┌───────┐       │
│  │  #07  │ │  #06  │ │  #05  │ │  #04  │ │  #03  │ │ ...   │  →    │
│  │       │ │       │ │       │ │       │ │       │ │       │       │
│  └───────┘ └───────┘ └───────┘ └───────┘ └───────┘ └───────┘       │
│                                                                     │
│  Klick auf alte Story → ersetzt aktuelle Story inline               │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### Studiengänge (Expanded) - Das komplexeste

```
┌─ STUDIENGÄNGE ─────────────────────────────────────── [▲ Collapse] ─┐
│                                                                     │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │  [Bachelor ▼]    [Master ▼]    [International ▼]               │ │
│  └────────────────────────────────────────────────────────────────┘ │
│                                                                     │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌────────────┐  │
│  │              │ │              │ │              │ │            │  │
│  │ Informatik   │ │ Angewandte   │ │ Wirtschafts- │ │ KI & Data  │  │
│  │    B.Sc.     │ │ Informatik   │ │ informatik   │ │ Science    │  │
│  │              │ │    B.Sc.     │ │    B.Sc.     │ │   B.Sc.    │  │
│  │  [Details]   │ │  [Details]   │ │  [Details]   │ │ [Details]  │  │
│  └──────────────┘ └──────────────┘ └──────────────┘ └────────────┘  │
│                                                                     │
│  ═══════════════════════════════════════════════════════════════    │
│                                                                     │
│  ▼ B.Sc. Informatik                                                 │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │                                                                │ │
│  │  [Überblick] [Berufsperspektiven] [Verlauf] [Erfahrungen]      │ │
│  │  ──────────                                                    │ │
│  │                                                                │ │
│  │  Die klassische Informatik mit Schwerpunkten in...             │ │
│  │                                                                │ │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐               │ │
│  │  │ Regelzeit   │ │ Sprache     │ │ NC          │               │ │
│  │  │ 6 Semester  │ │ Deutsch     │ │ Nein        │               │ │
│  │  └─────────────┘ └─────────────┘ └─────────────┘               │ │
│  │                                                                │ │
│  │  [→ Zur Studiengangsseite]  [→ Jetzt bewerben]                 │ │
│  │                                                                │ │
│  └────────────────────────────────────────────────────────────────┘ │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### Forschung (Expanded) - Reportage-Stil

```
┌─ FORSCHUNG ────────────────────────────────────────── [▲ Collapse] ─┐
│                                                                     │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │                                                                │ │
│  │  "An der WIAI forschen wir an der Schnittstelle von           │ │
│  │   Technologie, Mensch und Gesellschaft."                      │ │
│  │                                                                │ │
│  └────────────────────────────────────────────────────────────────┘ │
│                                                                     │
│  ┌──────────────────────────────┐ ┌──────────────────────────────┐  │
│  │ ░░░░░░░░░░░░░░░░░░░░░░░░░░░ │ │                              │  │
│  │ ░░░░░░░░░░░░░░░░░░░░░░░░░░░ │ │  KÜNSTLICHE INTELLIGENZ      │  │
│  │ ░░░░░░ [Visual] ░░░░░░░░░░░ │ │                              │  │
│  │ ░░░░░░░░░░░░░░░░░░░░░░░░░░░ │ │  Vom Angry-Birds-Weltmeister │  │
│  │ ░░░░░░░░░░░░░░░░░░░░░░░░░░░ │ │  bis zu erklärbarer KI...    │  │
│  └──────────────────────────────┘ └──────────────────────────────┘  │
│                                                                     │
│  ┌──────────────────────────────┐ ┌──────────────────────────────┐  │
│  │                              │ │ ░░░░░░░░░░░░░░░░░░░░░░░░░░░ │  │
│  │  MENSCH-COMPUTER-            │ │ ░░░░░░░░░░░░░░░░░░░░░░░░░░░ │  │
│  │  INTERAKTION                 │ │ ░░░░░░ [Visual] ░░░░░░░░░░░ │  │
│  │                              │ │ ░░░░░░░░░░░░░░░░░░░░░░░░░░░ │  │
│  │  Wie Menschen mit Technik... │ │ ░░░░░░░░░░░░░░░░░░░░░░░░░░░ │  │
│  └──────────────────────────────┘ └──────────────────────────────┘  │
│                                                                     │
│  [Mehr: Security] [Mehr: IS] [Mehr: Digital Humanities]             │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### Exponate (Expanded) - Gallery/Portfolio

```
┌─ EXPONATE ─────────────────────────────────────────── [▲ Collapse] ─┐
│                                                                     │
│  Interaktive Installationen am 27. Juni – entwickelt von            │
│  Studierenden im Rahmen des Jubiläumsprojekts.                      │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │                                                             │    │
│  │              [FEATURED: Pattern Match]                      │    │
│  │                                                             │    │
│  │   ┌─────────────────────────────────────────────────────┐   │    │
│  │   │                                                     │   │    │
│  │   │            [GIF/Video Preview]                      │   │    │
│  │   │                                                     │   │    │
│  │   └─────────────────────────────────────────────────────┘   │    │
│  │                                                             │    │
│  │   Zwei Spieler, ein Bildschirm: Wer erkennt das Muster     │    │
│  │   schneller? Ein Reaktionsspiel für Jung und Alt.          │    │
│  │                                                             │    │
│  │   Status: ████████░░ 80%        [Dev-Log lesen →]          │    │
│  │                                                             │    │
│  └─────────────────────────────────────────────────────────────┘    │
│                                                                     │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐        │
│  │ Generative │ │ Vorlieben- │ │ Sammel-    │ │ Diese      │        │
│  │ Kunst      │ │ Quiz       │ │ karten     │ │ Website    │        │
│  │            │ │            │ │            │ │            │        │
│  │ ██████░░   │ │ ████░░░░   │ │ ██░░░░░░   │ │ LIVE ●     │        │
│  └────────────┘ └────────────┘ └────────────┘ └────────────┘        │
│       ↑                                                             │
│       Klick → wird Featured, scrollt hoch                           │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## htmx Implementation

htmx ist perfekt dafür. Jede Section lädt ihren expanded Content lazy:

```html
<!-- Collapsed State (im Initial HTML) -->
<section class="collapsible" id="studiengaenge">
  <div class="collapsible-header">
    <h2>Studiengänge</h2>
    <div class="collapsible-preview">
      <span class="chip">Informatik</span>
      <span class="chip">AI & Data Science</span>
      <span class="chip">Wirtschaftsinformatik</span>
      <span class="chip">+5 mehr</span>
    </div>
    <button 
      class="expand-btn"
      hx-get="/partials/studiengaenge.html"
      hx-target="#studiengaenge-content"
      hx-swap="innerHTML"
      hx-trigger="click once"
      @click="$el.closest('.collapsible').classList.toggle('is-expanded')"
    >
      ▼ Alle anzeigen
    </button>
  </div>
  
  <div class="collapsible-content" id="studiengaenge-content">
    <!-- Wird von htmx geladen -->
  </div>
</section>
```

**Hugo generiert die Partials:**

```
layouts/partials/
├── studiengaenge-full.html    → /public/partials/studiengaenge.html
├── forschung-full.html        → /public/partials/forschung.html
├── geschichten-full.html      → /public/partials/geschichten.html
├── exponate-full.html         → /public/partials/exponate.html
└── studiengang/
    ├── informatik.html        → /public/partials/studiengang/informatik.html
    ├── wi.html                → /public/partials/studiengang/wi.html
    └── ...
```

**Studiengang-Detail (nested htmx):**

```html
<!-- In studiengaenge-full.html -->
<div class="studiengang-card" 
     hx-get="/partials/studiengang/informatik.html"
     hx-target="#studiengang-detail"
     hx-swap="innerHTML"
     hx-trigger="click"
>
  <h3>B.Sc. Informatik</h3>
  <p>Klassische Informatik mit Wahlschwerpunkten</p>
</div>

<!-- Detail-Bereich -->
<div id="studiengang-detail" class="studiengang-detail">
  <!-- htmx lädt hier den gewählten Studiengang -->
</div>
```

**Tabs innerhalb Studiengang-Detail:**

```html
<!-- In /partials/studiengang/informatik.html -->
<div class="studiengang-tabs" x-data="{ tab: 'uebersicht' }">
  <nav>
    <button :class="{ active: tab === 'uebersicht' }" @click="tab = 'uebersicht'">Überblick</button>
    <button :class="{ active: tab === 'beruf' }" @click="tab = 'beruf'">Berufsperspektiven</button>
    <button :class="{ active: tab === 'verlauf' }" @click="tab = 'verlauf'">Studienverlauf</button>
    <button :class="{ active: tab === 'erfahrungen' }" @click="tab = 'erfahrungen'">Erfahrungen</button>
  </nav>
  
  <div x-show="tab === 'uebersicht'">
    <!-- Überblick-Content -->
  </div>
  
  <div x-show="tab === 'beruf'">
    <!-- Berufsperspektiven -->
  </div>
  
  <!-- etc. -->
</div>
```

---

## Visuelle Hierarchie / Ordnung

Um bei all den Collapsibles Ordnung zu schaffen:

```
┌─────────────────────────────────────────────────────────────────────┐
│  HERO                                        ← Schwarz, dominant    │
├─────────────────────────────────────────────────────────────────────┤
│  STATS                                       ← Gelb Band            │
├─────────────────────────────────────────────────────────────────────┤
│  PROGRAMM + ANMELDUNG                        ← Weiß, immer offen    │
├═════════════════════════════════════════════════════════════════════┤
│                                                                     │
│  ┌─ GESCHICHTEN ─────────────────────────────┐  ← Hellgrau BG       │
│  │  ...                                      │     Gelber Accent    │
│  └───────────────────────────────────────────┘                      │
│                                                                     │
│  ┌─ STUDIENGÄNGE ────────────────────────────┐  ← Weiß BG           │
│  │  ...                                      │     Schwarzer Header │
│  └───────────────────────────────────────────┘                      │
│                                                                     │
│  ┌─ FORSCHUNG ───────────────────────────────┐  ← Hellgrau BG       │
│  │  ...                                      │                      │
│  └───────────────────────────────────────────┘                      │
│                                                                     │
│  ┌─ EXPONATE ────────────────────────────────┐  ← Schwarz BG        │
│  │  ...                                      │     (hebt sich ab)   │
│  └───────────────────────────────────────────┘                      │
│                                                                     │
├═════════════════════════════════════════════════════════════════════┤
│  FOOTER                                      ← Schwarz              │
└─────────────────────────────────────────────────────────────────────┘
```

**Die Sections haben unterschiedliche visuelle Behandlung:**
- Abwechselnde Hintergründe (Weiß/Grau/Schwarz)
- Konsistente Section-Headers (schräg, schwarz mit gelb)
- Exponate bewusst schwarz → hebt studentische Arbeit hervor

---

## URL-Struktur mit htmx

htmx kann URLs updaten via `hx-push-url`:

```html
<button 
  hx-get="/partials/studiengaenge.html"
  hx-target="#studiengaenge-content"
  hx-push-url="#studiengaenge"
>
```

Direktlinks funktionieren dann:
- `wiai25.de/#studiengaenge` → Scrollt zur Section, expanded sie
- `wiai25.de/#studiengang-informatik` → Scrollt + expanded + öffnet Detail

Dafür braucht's ein kleines Init-Script:

```javascript
// On page load: check hash and trigger expansion
document.addEventListener('DOMContentLoaded', () => {
  const hash = window.location.hash;
  if (hash) {
    const section = document.querySelector(hash) || 
                    document.querySelector(`[data-hash="${hash}"]`);
    if (section) {
      // Trigger htmx load
      section.querySelector('[hx-get]')?.click();
      // Scroll into view
      section.scrollIntoView({ behavior: 'smooth' });
    }
  }
});
```

---

## Zusammenfassung: Tech Stack

| Komponente | Technologie |
|------------|-------------|
| Static Site Generator | Hugo |
| Styling | Tailwind CSS |
| Lazy Loading / Interaktion | htmx |
| Kleine UI-States (Tabs, Toggles) | Alpine.js |
| Counter/Animation | Eigenes JS + Backend-JSON |
| Hosting | Static (Netlify/Vercel/eigener Server) |

**Kein schweres Framework**, alles progressiv enhanced, funktioniert auch ohne JS (dann halt ohne Collapsibles).

---

Soll ich einen funktionierenden Prototyp bauen, der diese Collapsible-Struktur mit htmx demonstriert?



## Response:
15/01/2026, 20:46:40

Brauchen wir dann vielleicht ein floating Menü am oberen Rand (volle Breite) damit man schnell an jede Stelle springen kann wenn man was aufgeklappt hat und die Seite sehr lang wird? Bin mir echt nicht sicher ob das die beste Lösung ist oder ob ich mich verrenne



## Prompt:
15/01/2026, 20:47:13

````plaintext
Thought process: Hinterfragte Komplexität und erwog simplere Alternativen zur Single-Page-Lösung.

Der User zweifelt an der Collapsible-Lösung und fragt sich, ob ein Floating-Menü nötig wird. Das ist ein gutes Zeichen - er merkt, dass die Komplexität steigt.

Lass mich ehrlich sein: Wenn man ein Floating-Menü braucht, um die Seite navigierbar zu machen, dann ist die Seite vielleicht zu komplex für ein Single-Page-Konzept.

Ich sollte hier ehrlich Pro/Contra abwägen und vielleicht eine Alternative vorschlagen, die einfacher ist.

Kernfragen:
1. Brauchen Schüler wirklich alle Studiengangs-Details auf der Event-Seite?
2. Oder ist die Event-Seite der "Hook" und für Details verlinkt man auf die echte WIAI-Seite?
3. Muss alles auf einer Seite sein oder ist das ein self-imposed constraint?

Das ursprüngliche Ziel war:
- Jubiläumsfeier bewerben
- 25 Geschichten erzählen
- Recruiting (Schüler)
- Partner/Politik informieren

Vielleicht ist die Lösung simpler:
- Event-Seite bleibt fokussiert auf Event + Geschichten + Exponate
- Für Studiengänge: guter Teaser + Link zur (hässlichen, aber funktionalen) WIAI-Seite
- Oder: separate Unterseite /studium/ die eigenständig ist

Ich sollte dem User helfen, einen Schritt zurückzutreten.
````

Du verrennst dich nicht, aber ich glaube wir sollten einen Schritt zurücktreten.

## Ehrliche Reflexion

Wenn wir ein Floating-Menü brauchen, um die Seite navigierbar zu machen, dann ist die Seite zu komplex geworden. Dann bauen wir eigentlich eine vollständige Website mit Unterseiten – nur verkrampft in eine Single Page gepresst.

**Die ursprünglichen Ziele waren:**
1. Event bewerben (27. Juni)
2. 25 Geschichten erzählen
3. Neugier wecken (Recruiting, Partner)
4. Studentische Arbeit zeigen

**Was wir jetzt diskutieren:**
- Vollständige Studiengangs-Portfolios mit Verlaufsplänen
- Forschungs-Reportagen
- Komplexe Collapsibles mit Nested Content
- htmx, Alpine.js, Lazy Loading...

Das sind zwei verschiedene Projekte.

---

## Option A: Fokussierte Event-Seite

Die Jubiläumsseite bleibt **eine Seite**, fokussiert auf das Event:

```
HERO
PROGRAMM + ANMELDUNG
GESCHICHTEN (mit Expand)
EXPONATE (Gallery)
FOOTER
```

Für Studiengänge und Forschung: **Teaser-Cards mit Links zur echten WIAI-Seite** (oder später zu einer besseren Version).

**Pro:**
- Machbar in 1-2 Wochen
- Klarer Fokus
- Keine Komplexitätsexplosion

**Contra:**
- Verpasste Chance, die Studiengänge gut zu präsentieren
- Die alte WIAI-Seite ist halt... die alte WIAI-Seite

---

## Option B: Zwei getrennte Seiten

```
wiai25.de/                → Event-Seite (wie Option A)
wiai25.de/studium/        → Studiengänge (eigene Seite, gut gemacht)
wiai25.de/forschung/      → Optional, oder nur Teaser
```

Gemeinsamer Header/Footer, aber eigenständige Seiten.

**Pro:**
- Klare Trennung
- Jede Seite kann optimiert werden für ihren Zweck
- Klassische Navigation, keine UX-Experimente
- Studiengänge bekommen den Platz den sie brauchen

**Contra:**
- Mehr zu bauen
- Zwei "Einstiege" statt einem

---

## Option C: Event-Seite mit "Mehr entdecken"-Bereich

Die Event-Seite bleibt der Star. Ganz unten, nach Anmeldung:

```
────────────────────────────────────────────
MEHR ENTDECKEN

┌─────────────────┐ ┌─────────────────┐
│                 │ │                 │
│  STUDIENGÄNGE   │ │  FORSCHUNG      │
│                 │ │                 │
│  8 Programme    │ │  6 Themen       │
│  für deine      │ │  die uns        │
│  Zukunft        │ │  antreiben      │
│                 │ │                 │
│  [Entdecken →]  │ │  [Entdecken →]  │
│                 │ │                 │
└─────────────────┘ └─────────────────┘

→ Diese Links führen zu eigenen Seiten
────────────────────────────────────────────
```

**Pro:**
- Event-Seite bleibt fokussiert
- Studiengänge/Forschung sind auffindbar, aber nicht im Weg
- Klare Hierarchie: Event > Rest

---

## Meine Empfehlung: Option C

1. **Jetzt:** Event-Seite bauen (Hero, Programm, Geschichten, Exponate, Anmeldung)
2. **Parallel:** Studiengänge-Seite als eigenes Ding (`/studium/`)
3. **Optional:** Forschungs-Seite wenn Zeit

Die Seiten teilen sich:
- Header (Navigation zwischen Event / Studium / Forschung)
- Footer
- Visuelles Design (Schwarz/Gelb/Weiß)

Aber jede Seite ist eigenständig scrollbar, keine Collapsible-Hölle.

---

## Was denkst du?

Hilft dir diese Strukturierung? Oder willst du wirklich alles auf einer Seite haben – dann müssen wir aber akzeptieren, dass es komplex wird und ein Sticky-Nav braucht.



## Response:
15/01/2026, 20:50:21

Studium und Forschung und Praxispartner und Gesellschaft sollten wir vielleicht wirklich auf separate Seiten auslagern weil es sonst eskaliert. Was machen wir mit den Stories und den studentischen exponaten? Integriert? Also story inline und in Place aufklappbar? Dann bräuchten wir url anchors die direkt hinspringen und aufklappen. Gleiches bei den Exponaten.




Ja, das ist die richtige Entscheidung. Dann haben wir:
Finale Struktur
wiai25.de/                 → Event-Seite (Hauptseite)
wiai25.de/studium/         → Studiengänge (eigene Seite)
wiai25.de/forschung/       → Forschung (eigene Seite)
wiai25.de/praxis/          → Praxispartner (eigene Seite)
wiai25.de/gesellschaft/    → Gesellschaft/Transfer (eigene Seite)
Auf der Event-Seite integriert:

Stories (inline aufklappbar)
Exponate (inline aufklappbar)


Event-Seite: Layout
┌─────────────────────────────────────────────────────────────────────┐
│  NAVIGATION                                                         │
│  [WIAI25]  Event · Studium · Forschung · Praxis · Gesellschaft     │
├─────────────────────────────────────────────────────────────────────┤
│  HERO + ANIMATION                                                   │
├─────────────────────────────────────────────────────────────────────┤
│  STATS BAND                                                         │
├─────────────────────────────────────────────────────────────────────┤
│  PROGRAMM + HIGHLIGHTS                                              │
├─────────────────────────────────────────────────────────────────────┤
│  GESCHICHTEN                                                        │
│  (Grid mit aktueller Story groß, ältere klein, alle aufklappbar)   │
├─────────────────────────────────────────────────────────────────────┤
│  EXPONATE                                                           │
│  (Gallery-Grid, aufklappbar)                                        │
├─────────────────────────────────────────────────────────────────────┤
│  ANMELDUNG                                                          │
├─────────────────────────────────────────────────────────────────────┤
│  FOOTER                                                             │
└─────────────────────────────────────────────────────────────────────┘

Stories: Collapsed → Expanded
Collapsed State
┌─ 25 WOCHEN · 25 GESCHICHTEN ────────────────── Woche 08/25 ─┐
│                                                             │
│  ┌───────────────────────────────────────────────────────┐  │
│  │                                                       │  │
│  │  #08 · DER ERSTE HACKATHON                           │  │
│  │                                                       │  │
│  │  [Thumbnail]  Als 2007 zum ersten Mal...             │  │
│  │               [Weiterlesen →]                         │  │
│  │                                                       │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                             │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐     │
│  │ #07  │ │ #06  │ │ #05  │ │ #04  │ │ #03  │ │ #02  │ ... │
│  │      │ │      │ │      │ │      │ │      │ │      │     │
│  └──────┘ └──────┘ └──────┘ └──────┘ └──────┘ └──────┘     │
│                                                             │
└─────────────────────────────────────────────────────────────┘
Expanded State (Klick auf #05)
┌─ 25 WOCHEN · 25 GESCHICHTEN ────────────────── Woche 08/25 ─┐
│                                                             │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐     │
│  │ #08  │ │ #07  │ │ #06  │ │ #05● │ │ #04  │ │ #03  │ ... │
│  └──────┘ └──────┘ └──────┘ └──┬───┘ └──────┘ └──────┘     │
│                                │                            │
│  ┌─────────────────────────────▼───────────────────────────┐│
│  │                                                         ││
│  │  #05 · FLEXNOW UND DIE NACHT VOR DER PRÜFUNG      [×]  ││
│  │                                                         ││
│  │  ┌─────────────────────────────────────────────────┐   ││
│  │  │                                                 │   ││
│  │  │  [Großes Bild / Screenshot]                     │   ││
│  │  │                                                 │   ││
│  │  └─────────────────────────────────────────────────┘   ││
│  │                                                         ││
│  │  Es war 3 Uhr morgens im Sommersemester 2009, als...   ││
│  │                                                         ││
│  │  Lorem ipsum dolor sit amet, consectetur adipiscing    ││
│  │  elit. Sed do eiusmod tempor incididunt ut labore...   ││
│  │                                                         ││
│  │  [← #04 Vorherige]                [Nächste #06 →]      ││
│  │                                                         ││
│  └─────────────────────────────────────────────────────────┘│
│                                                             │
└─────────────────────────────────────────────────────────────┘
URL: wiai25.de/#story-05

Exponate: Collapsed → Expanded
Collapsed State
┌─ EXPONATE ──────────────────────────────────────────────────┐
│                                                             │
│  Interaktive Installationen am 27. Juni                     │
│                                                             │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌──────────┐  │
│  │            │ │            │ │            │ │          │  │
│  │  [thumb]   │ │  [thumb]   │ │  [thumb]   │ │ [thumb]  │  │
│  │            │ │            │ │            │ │          │  │
│  │  Pattern   │ │ Generative │ │ Vorlieben- │ │ Sammel-  │  │
│  │  Match     │ │ Kunst      │ │ Quiz       │ │ karten   │  │
│  │            │ │            │ │            │ │          │  │
│  │  ●●●●●●○○  │ │  ●●●●○○○○  │ │  ●●○○○○○○  │ │ ●○○○○○○○ │  │
│  └────────────┘ └────────────┘ └────────────┘ └──────────┘  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
Expanded State (Klick auf "Generative Kunst")
┌─ EXPONATE ──────────────────────────────────────────────────┐
│                                                             │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌──────────┐  │
│  │ Pattern    │ │ Generative●│ │ Vorlieben- │ │ Sammel-  │  │
│  │ Match      │ │ Kunst      │ │ Quiz       │ │ karten   │  │
│  └────────────┘ └─────┬──────┘ └────────────┘ └──────────┘  │
│                       │                                     │
│  ┌────────────────────▼────────────────────────────────────┐│
│  │                                                    [×]  ││
│  │  GENERATIVE KUNST                                       ││
│  │  Turtle-Patterns zum Mitnehmen                          ││
│  │                                                         ││
│  │  ┌──────────────────────┐ ┌───────────────────────────┐ ││
│  │  │                      │ │                           │ ││
│  │  │  [GIF / Video        │ │  Per Tastendruck ent-     │ ││
│  │  │   der Installation]  │ │  stehen einzigartige      │ ││
│  │  │                      │ │  Muster. Jeder Gast kann  │ ││
│  │  │                      │ │  sein Kunstwerk aus-      │ ││
│  │  │                      │ │  drucken und mitnehmen.   │ ││
│  │  └──────────────────────┘ │                           │ ││
│  │                           │  Team: Lisa, Max          │ ││
│  │                           │  Status: Prototyp läuft   │ ││
│  │                           │                           │ ││
│  │                           │  [Dev-Log lesen →]        │ ││
│  │                           └───────────────────────────┘ ││
│  │                                                         ││
│  │  ── DEV-LOG ────────────────────────────────────────── ││
│  │                                                         ││
│  │  15.01.2026 · Farbpalette finalisiert                  ││
│  │  08.01.2026 · Erster Druck-Test erfolgreich            ││
│  │  02.01.2026 · p5.js-Grundgerüst steht                  ││
│  │                                                         ││
│  └─────────────────────────────────────────────────────────┘│
│                                                             │
└─────────────────────────────────────────────────────────────┘
URL: wiai25.de/#exponat-generative-kunst

URL-Anchor Logik
javascript// Beim Laden der Seite
document.addEventListener('DOMContentLoaded', () => {
  const hash = window.location.hash; // z.B. "#story-05"
  
  if (hash.startsWith('#story-')) {
    const id = hash.replace('#story-', '');
    openStory(id);
    scrollToSection('geschichten');
  }
  
  if (hash.startsWith('#exponat-')) {
    const id = hash.replace('#exponat-', '');
    openExponat(id);
    scrollToSection('exponate');
  }
});

// Beim Öffnen einer Story
function openStory(id) {
  // htmx: Content laden
  htmx.ajax('GET', `/partials/story/${id}.html`, '#story-detail');
  
  // URL updaten (ohne Reload)
  history.pushState({}, '', `#story-${id}`);
  
  // UI updaten
  document.querySelector(`[data-story="${id}"]`).classList.add('is-active');
}

// Browser Back-Button
window.addEventListener('popstate', () => {
  const hash = window.location.hash;
  if (!hash) {
    closeAllExpandables();
  } else {
    // Re-open based on hash
  }
});

Gemeinsame Navigation (alle Seiten)
html<nav class="site-nav">
  <a href="/" class="logo">WIAI25</a>
  
  <div class="nav-links">
    <a href="/" class="is-active">Event</a>
    <a href="/studium/">Studium</a>
    <a href="/forschung/">Forschung</a>
    <a href="/praxis/">Praxis</a>
    <a href="/gesellschaft/">Gesellschaft</a>
  </div>
  
  <a href="/#anmeldung" class="nav-cta">Anmelden</a>
</nav>
```

**Verhalten:**
- Auf Event-Seite: Navigation bleibt oben, wird sticky nach Scroll
- Auf Unterseiten: Gleiche Navigation, aber "Event" ist nicht mehr aktiv

---

## Dateistruktur in Hugo
```
content/
├── _index.md                    # Event-Seite
├── studium/
│   ├── _index.md                # Studium-Übersicht
│   ├── informatik.md
│   ├── wi.md
│   └── ...
├── forschung/
│   └── _index.md
├── praxis/
│   └── _index.md
├── gesellschaft/
│   └── _index.md
├── stories/
│   ├── 01.md                    # Story #01
│   ├── 02.md
│   └── ...
└── exponate/
    ├── pattern-match.md
    ├── generative-kunst.md
    └── ...

layouts/
├── index.html                   # Event-Seite Template
├── studium/
│   └── single.html              # Studiengang-Detail
├── _default/
│   └── baseof.html              # Gemeinsamer Rahmen
└── partials/
    ├── nav.html
    ├── footer.html
    ├── story-card.html          # Collapsed Story
    ├── story-full.html          # Expanded Story (für htmx)
    ├── exponat-card.html
    └── exponat-full.html

static/
└── partials/                    # Von Hugo generiert, für htmx
    ├── stories/
    │   ├── 01.html
    │   └── ...
    └── exponate/
        ├── pattern-match.html
        └── ...

Zusammenfassung
BereichWoVerhaltenEvent (Programm, Anmeldung)/Direkt sichtbarStories/Grid, inline aufklappbar, #story-XXExponate/Gallery, inline aufklappbar, #exponat-XXStudium/studium/Eigene SeiteForschung/forschung/Eigene SeitePraxis/praxis/Eigene SeiteGesellschaft/gesellschaft/Eigene Seite
Soll ich jetzt einen Prototyp bauen, der die Event-Seite mit den aufklappbaren Stories und Exponaten zeigt?

User:

Da wir 25 ggf mit Bildern haben werden uns auch nochmal 10 Exponate oder so sollten wir die jeweils lazy loaden wenn man sie aufklappt damit das DOM klein und schnell bleibt. Htmx dafür? Ich würde jene topnav machen sondern inline in der Haupt  an geeigneten Stellen highlights anteasern / beschreiben und dann “mehr zur Forschung” bzw. Aus den Stories drauf verlinken. Bzw “was kann ich studieren” oder “Studium auch im Sommer starten” oder “studieren auch in Teilzeit möglich” etc.  also organisch auf Studium verlinken nicht kommentarlos übers menü