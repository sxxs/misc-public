# Potential TODOs (Generator + Mockups)

## CSS/HTML Mismatches
- DONE: Footer-Partial an `mockup/styles.css`-Klassenstruktur angepasst (Footer-Styling greift jetzt auf generierten Seiten).
- DONE: WIAI-Heroen haben jetzt eine zusaetzliche `hero_class` und die Inline-Styles wurden auf `.page-hero-*`-Selektoren harmonisiert.
- DONE: Fehlende Klassen (`document-group`, `event-highlight-content`, `timeline-content`, `page-hero-content`, `fakultaet-page`, Footer-Wrapper) wurden in `mockup/styles.css` ergaenzt.

## Unused / Doppelt Definiert
- DONE: Unbenutzte CSS-Regeln in `mockup/styles.css` und Inline-Styles entfernt (z. B. `fakultaet-forschung`, `nav-panel-backdrop`, `alert--success`, `cta-banner--image`, `bamberg-corner`, `feature-spotlight--full`).
- DONE: Accordion-Styles vereinheitlicht (nur noch `aria-expanded`-basierte Logik).
- Optional: Inline-Styles aus `styles-studiengang-detail.css` und aehnlichen Dateien in eine gemeinsame CSS-Datei auslagern.

## Generator / Template
- DONE: `render_template` unterstuetzt jetzt inverted sections (`{{^flag}}`) und Listen; Breadcrumbs und Hero-Labels funktionieren korrekt.
- DONE: `body_class` wird bereinigt, so dass `subpage` nicht dupliziert wird.
- DONE: Titelaufbau normalisiert (Titel-Duplikate vermieden).
