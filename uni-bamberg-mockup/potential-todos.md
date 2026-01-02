# Potential TODOs (Generator + Mockups)

## CSS/HTML Mismatches
- `mockup/generator/partials/footer.html` nutzt Klassen wie `footer-brand`, `footer-nav`, `footer-contact`, `footer-tagline`, `footer-bottom`, `footer-copyright`, waehrend `mockup/styles.css` eher `footer-address`, `footer-heading`, `footer-links`, `copyright` stylt. Klassen/Struktur angleichen, damit die generierten Seiten das Footer-Styling bekommen.
- `mockup/generator/partials/hero-wiai.html` rendert `.page-hero*`, aber die Inline-CSS-Dateien `mockup/generator/partials/styles-forschung.css`, `mockup/generator/partials/styles-studiengaenge.css`, `mockup/generator/partials/styles-studiengang-detail.css` stylen `.forschung-hero`, `.studiengaenge-hero`, `.studiengang-hero`, `.hero-subtitle`, `.hero-degree`. Entweder die CSS-Selektoren auf `.page-hero*` umstellen oder das Markup anpassen.
- Klassen, die im HTML vorkommen, aber keine CSS-Regeln haben: `document-group`, `event-highlight-content`, `timeline-content`, `page-hero-content`, `fakultaet-page`, `footer-*` Wrapper. Entscheiden, ob Styling fehlt oder Klassen entfernt werden sollen.

## Unused / Doppelt Definiert
- Mehrere CSS-Klassen werden nirgends im generierten HTML/JS referenziert (z. B. `fakultaet-forschung`, `nav-panel-backdrop`, `alert--success`, `cta-banner--image`, `bamberg-corner`, `feature-spotlight--full`). Aufraeumen oder im Markup nachziehen.
- Accordion-Styles sind in `mockup/styles.css` doppelt und mit zwei Mechaniken definiert (`.accordion-item.active ...` vs. `.accordion-trigger[aria-expanded="true"] + .accordion-content`). Eine Logik auswaehlen, damit JS/CSS konsistent sind.
- Inline-Styles aus `styles-studiengang-detail.css` und aehnlichen Dateien werden auf vielen Seiten identisch eingebettet. Optional in eine gemeinsame CSS-Datei auslagern, um Duplikate zu vermeiden.

## Generator / Template
- `render_template` unterstuetzt keine inverted sections (`{{^flag}}`) oder Listen, obwohl `mockup/generator/partials/hero-wiai.html` und `mockup/generator/partials/breadcrumb.html` diese Syntax verwenden. Ergebnis: leere `page-hero-label`-Spans bei `hero_degree` und Breadcrumb-Fallback immer aktiv. Syntax vereinheitlichen oder Engine erweitern.
- `mockup/generator/partials/header.html` setzt immer `class="subpage {{body_class}}"`; `mockup/generator/pages.json` fuehrt bei `studium` zu `class="subpage subpage"`. Entweder Defaults anpassen oder `body_class` bereinigen.
- `mockup/generator/partials/header.html` haengt `| Universitat Bamberg` immer an den Titel, waehrend viele `pages.json`-Titel den Namen bereits enthalten. Titelaufbau normalisieren, um Duplikate zu vermeiden.
