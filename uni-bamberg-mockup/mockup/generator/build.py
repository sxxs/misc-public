#!/usr/bin/env python3
"""
Minimaler Static Site Generator fur Uni Bamberg Mockup
Kombiniert Partials (header, footer, subnav) mit Content-HTML

Verwendung:
    python build.py              # Alle Seiten bauen
    python build.py faq          # Einzelne Seite bauen
"""

import os
import re
import json
import argparse
from pathlib import Path

# Pfade
SCRIPT_DIR = Path(__file__).parent
PARTIALS_DIR = SCRIPT_DIR / "partials"
CONTENT_DIR = SCRIPT_DIR / "content"
OUTPUT_DIR = SCRIPT_DIR.parent  # mockup/
PAGES_JSON = SCRIPT_DIR / "pages.json"


def load_partial(name: str) -> str:
    """Lade ein Partial aus dem partials-Ordner"""
    path = PARTIALS_DIR / f"{name}.html"
    if not path.exists():
        raise FileNotFoundError(f"Partial nicht gefunden: {path}")
    return path.read_text(encoding="utf-8")


def load_pages_config() -> dict:
    """Lade Seitenkonfiguration aus pages.json"""
    if PAGES_JSON.exists():
        return json.loads(PAGES_JSON.read_text(encoding="utf-8"))
    return {}


def render_template(template: str, context: dict) -> str:
    """
    Einfaches Template-Rendering:
    - {{variable}} -> Ersetzung
    - {{#flag}}...{{/flag}} -> Bedingte Blöcke
    """
    result = template

    # Bedingte Blöcke verarbeiten
    # {{#flag}}content{{/flag}} wird zu content wenn flag=True, sonst entfernt
    def replace_conditional(match):
        flag = match.group(1)
        content = match.group(2)
        return content if context.get(flag) else ""

    result = re.sub(
        r'\{\{#(\w+)\}\}(.*?)\{\{/\1\}\}',
        replace_conditional,
        result,
        flags=re.DOTALL
    )

    # Einfache Variablen ersetzen
    for key, value in context.items():
        if isinstance(value, str):
            result = result.replace(f"{{{{{key}}}}}", value)

    # Nicht ersetzte Variablen mit leerem String ersetzen
    result = re.sub(r'\{\{[^}]+\}\}', '', result)

    return result


def build_page(content_path: Path, config: dict) -> str:
    """Baue eine einzelne Seite"""

    # Content laden
    content = content_path.read_text(encoding="utf-8")

    # Relativen Pfad berechnen
    rel_path = content_path.relative_to(CONTENT_DIR)
    depth = len(rel_path.parts) - 1
    root_path = "../" * depth if depth > 0 else ""
    css_path = root_path
    wiai_path = f"{root_path}wiai/" if depth == 0 else ""

    # Kontext fur Templates
    context = {
        "root_path": root_path,
        "css_path": css_path,
        "wiai_path": wiai_path,
        **config,
    }

    # Wenn "full_page: true", ist der Content bereits eine komplette Seite
    if config.get("full_page"):
        # Nur Variablen im Content ersetzen
        return render_template(content, context)

    # Standard-Seitenaufbau mit Partials
    # Partials laden und rendern
    header = render_template(load_partial("header"), context)
    footer = render_template(load_partial("footer"), context)

    # Optionale Inline-Styles (für Spezialseiten wie fakultaet-wiai)
    inline_styles = ""
    if config.get("inline_styles"):
        inline_styles = config.get("inline_styles")
    elif config.get("inline_styles_file"):
        # Inline styles aus Datei laden
        styles_path = PARTIALS_DIR / config["inline_styles_file"]
        if styles_path.exists():
            inline_styles = styles_path.read_text(encoding="utf-8")

    # Header anpassen wenn inline_styles vorhanden
    if inline_styles:
        # Inline styles vor </head> einfügen
        header = header.replace("</head>", f"\n    <style>\n{inline_styles}\n    </style>\n</head>")

    # Optionale Breadcrumb (Standard: generisch, kann überschrieben werden)
    breadcrumb = ""
    if not config.get("no_breadcrumb"):
        breadcrumb_partial = config.get("breadcrumb", "breadcrumb")
        breadcrumb = render_template(load_partial(breadcrumb_partial), context)

    # Optionales Subnav
    subnav = ""
    if config.get("subnav"):
        subnav = render_template(load_partial(config["subnav"]), context)

    # Seite zusammenbauen
    # Bei custom_structure enthält content bereits alles (Hero, Subnav, Main)
    if config.get("custom_structure"):
        page = header + content + footer
    else:
        # Standard: Content wird in <main> gewrappt
        page = header + breadcrumb + subnav + "\n    <!-- Main Content -->\n    <main id=\"main-content\">\n" + content + "\n    </main>\n" + footer

    return page


def build_all():
    """Alle Seiten im content-Ordner bauen"""
    pages_config = load_pages_config()

    for content_path in CONTENT_DIR.rglob("*.html"):
        rel_path = content_path.relative_to(CONTENT_DIR)
        page_key = str(rel_path.with_suffix("")).replace(os.sep, "/")

        # Konfiguration fur diese Seite
        config = pages_config.get(page_key, {})

        # Default-Werte
        if "title" not in config:
            config["title"] = content_path.stem.replace("-", " ").title()
        if "description" not in config:
            config["description"] = f"Universitat Bamberg - {config['title']}"
        if "body_class" not in config:
            config["body_class"] = ""

        # Seite bauen
        try:
            page = build_page(content_path, config)

            # Ausgabe-Pfad
            output_path = OUTPUT_DIR / rel_path
            output_path.parent.mkdir(parents=True, exist_ok=True)
            output_path.write_text(page, encoding="utf-8")

            print(f"OK {rel_path}")

        except Exception as e:
            print(f"FEHLER {rel_path}: {e}")


def build_single(name: str):
    """Eine einzelne Seite bauen"""
    pages_config = load_pages_config()

    # Versuche verschiedene Pfade
    candidates = [
        CONTENT_DIR / f"{name}.html",
        CONTENT_DIR / "wiai" / f"{name}.html",
    ]

    content_path = None
    for path in candidates:
        if path.exists():
            content_path = path
            break

    if not content_path:
        print(f"FEHLER: Seite nicht gefunden: {name}")
        return

    rel_path = content_path.relative_to(CONTENT_DIR)
    page_key = str(rel_path.with_suffix("")).replace(os.sep, "/")
    config = pages_config.get(page_key, {})

    # Default-Werte
    if "title" not in config:
        config["title"] = content_path.stem.replace("-", " ").title()
    if "description" not in config:
        config["description"] = f"Universitat Bamberg - {config['title']}"
    if "body_class" not in config:
        config["body_class"] = ""

    page = build_page(content_path, config)

    output_path = OUTPUT_DIR / rel_path
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(page, encoding="utf-8")

    print(f"OK {rel_path}")


def main():
    parser = argparse.ArgumentParser(description="Uni Bamberg Mockup Generator")
    parser.add_argument("page", nargs="?", help="Einzelne Seite bauen (ohne .html)")
    args = parser.parse_args()

    if args.page:
        build_single(args.page)
    else:
        build_all()


if __name__ == "__main__":
    main()
