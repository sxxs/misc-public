#!/usr/bin/env python3
"""
Extrahiert strukturierte Daten aus dem Uni Bamberg Crawl-Output.

Verwendung:
    python extract.py

Output:
    extracted/pages.json        - Alle Seiten mit Metadaten
    extracted/struktur.json     - Hierarchische Seitenstruktur
    extracted/missing_links.json - Referenzierte aber nicht gecrawlte Links
    extracted/sitemap.md        - Menschenlesbare Sitemap
    extracted/wiai/             - WIAI-spezifische Daten
"""

import json
import os
import re
from collections import defaultdict
from pathlib import Path
from urllib.parse import urljoin, urlparse

try:
    from bs4 import BeautifulSoup
except ImportError:
    print("Fehler: BeautifulSoup nicht installiert.")
    print("Bitte installieren mit: pip install beautifulsoup4 lxml")
    exit(1)

# Konfiguration
CRAWL_OUTPUT = Path(__file__).parent / "output" / "www.uni-bamberg.de"
EXTRACTED_DIR = Path(__file__).parent / "extracted"
BASE_URL = "https://www.uni-bamberg.de"


def extract_page(html_path: Path) -> dict:
    """Extrahiert Metadaten aus einer HTML-Seite."""
    try:
        with open(html_path, 'r', encoding='utf-8') as f:
            soup = BeautifulSoup(f, 'lxml')
    except Exception as e:
        return {"error": str(e), "path": str(html_path)}

    # Relativer Pfad zur Basis
    rel_path = html_path.relative_to(CRAWL_OUTPUT)
    url_path = "/" + str(rel_path.parent) + "/" if rel_path.name == "index.html" else "/" + str(rel_path)

    # Titel
    title_tag = soup.find('title')
    title = title_tag.get_text(strip=True) if title_tag else ""

    # H1
    h1_tag = soup.find('h1')
    h1 = h1_tag.get_text(strip=True) if h1_tag else ""

    # Meta Description
    meta_desc = soup.find('meta', attrs={'name': 'description'})
    description = meta_desc.get('content', '') if meta_desc else ""

    # Breadcrumb
    breadcrumb = []
    nav_parents = soup.select('.nav-parents a, .breadcrumb a')
    for a in nav_parents:
        text = a.get_text(strip=True)
        if text and text not in ['Navigation', 'Sie befinden sich hier:']:
            breadcrumb.append(text)

    # Hauptinhalt (Text)
    content_main = soup.select_one('#content-main, .page-content__main, article')
    content_text = ""
    if content_main:
        # Entferne Scripts und Styles
        for tag in content_main.find_all(['script', 'style', 'nav']):
            tag.decompose()
        content_text = content_main.get_text(separator=' ', strip=True)[:2000]  # Max 2000 Zeichen

    # Interne Links sammeln
    internal_links = set()
    for a in soup.find_all('a', href=True):
        href = a['href']
        if href.startswith('/') and not href.startswith('//'):
            internal_links.add(href.split('#')[0].split('?')[0])
        elif href.startswith(BASE_URL):
            parsed = urlparse(href)
            internal_links.add(parsed.path.split('#')[0].split('?')[0])

    # Kontaktdaten
    contacts = extract_contacts(soup)

    # Personen
    persons = extract_persons(soup)

    # Kategorie aus Pfad
    parts = str(rel_path).split('/')
    category = parts[0] if parts else "root"

    return {
        "path": str(rel_path),
        "url": url_path,
        "title": title,
        "h1": h1,
        "description": description,
        "breadcrumb": breadcrumb,
        "content_preview": content_text[:500] + "..." if len(content_text) > 500 else content_text,
        "category": category,
        "links": list(internal_links),
        "contacts": contacts,
        "persons": persons,
    }


def extract_contacts(soup) -> dict:
    """Extrahiert Kontaktdaten aus der Seite."""
    contacts = {}

    # E-Mail
    email_links = soup.find_all('a', href=re.compile(r'^mailto:'))
    if email_links:
        contacts['emails'] = list(set(a['href'].replace('mailto:', '').replace('(at)', '@')
                                       for a in email_links))

    # Telefon
    tel_links = soup.find_all('a', href=re.compile(r'^tel:'))
    if tel_links:
        contacts['phones'] = list(set(a['href'].replace('tel:', '') for a in tel_links))

    # Adresse (heuristisch)
    address_patterns = soup.find_all(string=re.compile(r'\d{5}\s+Bamberg'))
    if address_patterns:
        contacts['has_address'] = True

    return contacts


def extract_persons(soup) -> list:
    """Erkennt Personeneinträge auf der Seite."""
    persons = []

    # Suche nach Prof. Dr., Dr., etc.
    text = soup.get_text()
    prof_pattern = re.compile(r'(Prof\.?\s*Dr\.?[^,\n<]{3,50})', re.IGNORECASE)

    matches = prof_pattern.findall(text)
    for match in matches[:10]:  # Max 10 pro Seite
        name = match.strip()
        if len(name) > 10 and len(name) < 60:
            persons.append({"name": name, "type": "professor"})

    # Entferne Duplikate
    seen = set()
    unique = []
    for p in persons:
        if p['name'] not in seen:
            seen.add(p['name'])
            unique.append(p)

    return unique


def extract_programs(pages: dict) -> list:
    """Extrahiert Studiengänge aus den Seiten."""
    programs = []

    # Suche in ba-* und ma-* Verzeichnissen
    for path, data in pages.items():
        if path.startswith(('ba-', 'ma-')) and 'index.html' in path:
            title = data.get('title', '')
            h1 = data.get('h1', '')

            # Bestimme Abschluss
            if path.startswith('ba-'):
                degree = 'B.Sc.'
                level = 'Bachelor'
            else:
                degree = 'M.Sc.'
                level = 'Master'

            programs.append({
                "name": h1 or title,
                "degree": degree,
                "level": level,
                "path": path,
                "url": data.get('url', ''),
            })

    return programs


def find_missing_links(pages: dict) -> dict:
    """Identifiziert referenzierte aber nicht gecrawlte Links."""
    # Alle existierenden Pfade
    existing_paths = set()
    for path in pages.keys():
        # Normalisiere Pfad
        url = "/" + path.replace('/index.html', '/').replace('.html', '/')
        existing_paths.add(url)
        existing_paths.add(url.rstrip('/'))
        existing_paths.add(url.rstrip('/') + '/')

    # Sammle alle referenzierten Links
    all_links = defaultdict(lambda: {"count": 0, "referenced_from": []})

    for path, data in pages.items():
        for link in data.get('links', []):
            # Normalisiere
            link = link.rstrip('/')
            if link and not link.startswith(('#', 'javascript:', 'mailto:', 'tel:')):
                all_links[link]["count"] += 1
                if len(all_links[link]["referenced_from"]) < 5:  # Max 5 Beispiele
                    all_links[link]["referenced_from"].append(path)

    # Finde fehlende
    missing = []
    for link, info in all_links.items():
        normalized = link.rstrip('/') + '/'
        if (link not in existing_paths and
            normalized not in existing_paths and
            not link.endswith(('.pdf', '.jpg', '.png', '.webp', '.svg', '.css', '.js'))):

            # Kategorisiere
            parts = link.strip('/').split('/')
            category = parts[0] if parts else "unknown"

            missing.append({
                "url": link,
                "count": info["count"],
                "referenced_from": info["referenced_from"],
                "category": category,
            })

    # Sortiere nach Häufigkeit
    missing.sort(key=lambda x: -x["count"])

    return {
        "missing": missing[:200],  # Top 200
        "stats": {
            "total_links": len(all_links),
            "crawled": len(pages),
            "missing": len(missing),
        }
    }


def build_struktur(pages: dict) -> dict:
    """Baut hierarchische Seitenstruktur."""
    struktur = {}

    for path, data in pages.items():
        parts = path.split('/')
        current = struktur

        for i, part in enumerate(parts[:-1]):  # Alle außer Dateiname
            if part not in current:
                current[part] = {"_children": {}, "_pages": []}
            current = current[part]["_children"]

        # Füge Seite hinzu
        filename = parts[-1]
        if "_pages" not in current:
            current["_pages"] = []
        current["_pages"].append({
            "file": filename,
            "title": data.get('title', ''),
            "h1": data.get('h1', ''),
        })

    return struktur


def build_sitemap(pages: dict, struktur: dict) -> str:
    """Generiert Markdown-Sitemap."""
    lines = ["# Uni Bamberg - Sitemap aus Crawl", ""]
    lines.append(f"**Gecrawlt:** {len(pages)} Seiten\n")

    # Top-Level Kategorien
    categories = defaultdict(list)
    for path, data in pages.items():
        cat = data.get('category', 'root')
        categories[cat].append(data)

    # Sortiere nach Anzahl
    sorted_cats = sorted(categories.items(), key=lambda x: -len(x[1]))

    lines.append("## Kategorien\n")
    lines.append("| Kategorie | Seiten |")
    lines.append("|-----------|--------|")
    for cat, pages_list in sorted_cats[:30]:
        lines.append(f"| {cat} | {len(pages_list)} |")

    # WIAI Details
    lines.append("\n## WIAI Fakultät\n")
    wiai_pages = categories.get('wiai', [])

    # Gruppiere WIAI-Seiten
    wiai_groups = defaultdict(list)
    for p in wiai_pages:
        parts = p['path'].split('/')
        subcat = parts[1] if len(parts) > 2 else "root"
        wiai_groups[subcat].append(p)

    for group, group_pages in sorted(wiai_groups.items()):
        lines.append(f"### {group}")
        for p in group_pages[:10]:  # Max 10 pro Gruppe
            lines.append(f"- [{p.get('h1') or p.get('title', 'Unbekannt')}]({p.get('url', '')})")
        if len(group_pages) > 10:
            lines.append(f"- ... und {len(group_pages) - 10} weitere")
        lines.append("")

    return "\n".join(lines)


def extract_wiai_data(pages: dict) -> dict:
    """Extrahiert WIAI-spezifische Daten."""
    wiai = {
        "dekanat": [],
        "studiengaenge": [],
        "lehrstuehle": [],
    }

    # Dekanat
    dekanat_path = "wiai/fakultaetsleitung-und-dekanat/index.html"
    if dekanat_path in pages:
        # Lade die Seite direkt nochmal für detaillierte Extraktion
        html_path = CRAWL_OUTPUT / dekanat_path
        if html_path.exists():
            with open(html_path, 'r', encoding='utf-8') as f:
                soup = BeautifulSoup(f, 'lxml')

            # Suche nach Rollen und Namen
            for item in soup.select('.gallery__item'):
                h2 = item.find('h2')
                if h2:
                    role = h2.get_text(strip=True)
                    if role in ['Dekan', 'Forschungsdekan (Stellvertretung des Dekans)',
                                'Studiendekan', 'Transferdekan']:
                        text = item.get_text()
                        prof_match = re.search(r'Prof\. Dr\.[^,\n]+', text)
                        if prof_match:
                            wiai["dekanat"].append({
                                "rolle": role,
                                "name": prof_match.group().strip(),
                            })

    # Studiengänge
    wiai["studiengaenge"] = extract_programs(pages)

    return wiai


def main():
    """Hauptfunktion."""
    print("🔍 Starte Extraktion aus Crawl-Output...")
    print(f"   Quelle: {CRAWL_OUTPUT}")

    if not CRAWL_OUTPUT.exists():
        print(f"❌ Fehler: Crawl-Output nicht gefunden: {CRAWL_OUTPUT}")
        return

    # Erstelle Output-Verzeichnis
    EXTRACTED_DIR.mkdir(exist_ok=True)
    (EXTRACTED_DIR / "wiai").mkdir(exist_ok=True)

    # Finde alle HTML-Dateien
    html_files = list(CRAWL_OUTPUT.rglob("*.html"))
    print(f"   Gefunden: {len(html_files)} HTML-Dateien")

    # Extrahiere Daten
    pages = {}
    for i, html_path in enumerate(html_files):
        if (i + 1) % 100 == 0:
            print(f"   Verarbeitet: {i + 1}/{len(html_files)}")

        rel_path = str(html_path.relative_to(CRAWL_OUTPUT))
        pages[rel_path] = extract_page(html_path)

    print(f"✅ Extraktion abgeschlossen: {len(pages)} Seiten")

    # Speichere pages.json
    with open(EXTRACTED_DIR / "pages.json", 'w', encoding='utf-8') as f:
        json.dump(pages, f, ensure_ascii=False, indent=2)
    print(f"   → pages.json ({len(pages)} Einträge)")

    # Struktur
    struktur = build_struktur(pages)
    with open(EXTRACTED_DIR / "struktur.json", 'w', encoding='utf-8') as f:
        json.dump(struktur, f, ensure_ascii=False, indent=2)
    print(f"   → struktur.json")

    # Fehlende Links
    missing = find_missing_links(pages)
    with open(EXTRACTED_DIR / "missing_links.json", 'w', encoding='utf-8') as f:
        json.dump(missing, f, ensure_ascii=False, indent=2)
    print(f"   → missing_links.json ({missing['stats']['missing']} fehlende Links)")

    # Sitemap
    sitemap = build_sitemap(pages, struktur)
    with open(EXTRACTED_DIR / "sitemap.md", 'w', encoding='utf-8') as f:
        f.write(sitemap)
    print(f"   → sitemap.md")

    # WIAI-Daten
    wiai = extract_wiai_data(pages)
    with open(EXTRACTED_DIR / "wiai" / "dekanat.json", 'w', encoding='utf-8') as f:
        json.dump(wiai["dekanat"], f, ensure_ascii=False, indent=2)
    with open(EXTRACTED_DIR / "wiai" / "studiengaenge.json", 'w', encoding='utf-8') as f:
        json.dump(wiai["studiengaenge"], f, ensure_ascii=False, indent=2)
    print(f"   → wiai/dekanat.json ({len(wiai['dekanat'])} Einträge)")
    print(f"   → wiai/studiengaenge.json ({len(wiai['studiengaenge'])} Einträge)")

    print("\n✨ Fertig! Output in:", EXTRACTED_DIR)


if __name__ == "__main__":
    main()
