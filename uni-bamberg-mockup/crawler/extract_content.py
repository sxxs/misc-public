#!/usr/bin/env python3
"""
Extrahiert allen lesbaren Text aus dem Crawl-Output als Markdown.

Verwendung:
    python extract_content.py [--single-file] [--min-words 50]
    python extract_content.py --cluster [--min-cluster-size 10]

Output:
    extracted/content/           - Ein Markdown pro Seite
    extracted/all_content.md     - Alles in einer Datei (mit --single-file)
    extracted/clusters/          - Eine Datei pro Cluster (mit --cluster)
"""

from collections import defaultdict

import argparse
import re
from pathlib import Path
from urllib.parse import unquote

try:
    from bs4 import BeautifulSoup, NavigableString
except ImportError:
    print("Fehler: BeautifulSoup nicht installiert.")
    print("Bitte installieren mit: pip install beautifulsoup4 lxml")
    exit(1)

# Konfiguration
CRAWL_OUTPUT = Path(__file__).parent / "output" / "www.uni-bamberg.de"
EXTRACTED_DIR = Path(__file__).parent / "extracted"
BASE_URL = "https://www.uni-bamberg.de"

# Tags die entfernt werden sollen
REMOVE_TAGS = ['script', 'style', 'nav', 'footer', 'header', 'aside',
               'noscript', 'iframe', 'svg', 'form', 'button']

# CSS-Selektoren für Hauptinhalt (in Prioritätsreihenfolge)
CONTENT_SELECTORS = [
    'main',
    '#content-main',
    '.page-content__main',
    'article',
    '.content',
    '#content',
    'body',
]


def clean_text(text: str) -> str:
    """Bereinigt Text von übermäßigen Leerzeichen."""
    # Mehrfache Leerzeichen/Tabs zu einem
    text = re.sub(r'[ \t]+', ' ', text)
    # Mehrfache Newlines zu maximal 2
    text = re.sub(r'\n{3,}', '\n\n', text)
    # Leerzeichen am Zeilenanfang/-ende
    lines = [line.strip() for line in text.split('\n')]
    return '\n'.join(lines).strip()


def extract_readable_content(soup, include_links=True) -> str:
    """Extrahiert lesbaren Text aus dem HTML."""

    # Finde Hauptinhalt
    content = None
    for selector in CONTENT_SELECTORS:
        content = soup.select_one(selector)
        if content:
            break

    if not content:
        content = soup.body if soup.body else soup

    # Klone um Original nicht zu verändern
    content = BeautifulSoup(str(content), 'lxml')

    # Entferne unerwünschte Tags
    for tag_name in REMOVE_TAGS:
        for tag in content.find_all(tag_name):
            tag.decompose()

    # Entferne versteckte Elemente
    for tag in content.find_all(attrs={'aria-hidden': 'true'}):
        tag.decompose()
    for tag in content.find_all(attrs={'hidden': True}):
        tag.decompose()
    for tag in content.find_all(class_=re.compile(r'(hidden|sr-only|visually-hidden)')):
        tag.decompose()

    # Baue Markdown auf
    lines = []

    def process_element(element, depth=0):
        """Rekursive Verarbeitung von Elementen."""
        if isinstance(element, NavigableString):
            text = str(element).strip()
            if text:
                return text
            return ""

        if element.name is None:
            return ""

        tag = element.name.lower()

        # Überschriften
        if tag in ['h1', 'h2', 'h3', 'h4', 'h5', 'h6']:
            level = int(tag[1])
            text = element.get_text(strip=True)
            if text:
                return f"\n{'#' * level} {text}\n"
            return ""

        # Absätze
        if tag == 'p':
            text = element.get_text(strip=True)
            if text:
                return f"\n{text}\n"
            return ""

        # Listen
        if tag == 'ul':
            items = []
            for li in element.find_all('li', recursive=False):
                text = li.get_text(strip=True)
                if text:
                    items.append(f"- {text}")
            if items:
                return "\n" + "\n".join(items) + "\n"
            return ""

        if tag == 'ol':
            items = []
            for i, li in enumerate(element.find_all('li', recursive=False), 1):
                text = li.get_text(strip=True)
                if text:
                    items.append(f"{i}. {text}")
            if items:
                return "\n" + "\n".join(items) + "\n"
            return ""

        # Tabellen
        if tag == 'table':
            rows = []
            for tr in element.find_all('tr'):
                cells = []
                for td in tr.find_all(['td', 'th']):
                    cells.append(td.get_text(strip=True))
                if cells:
                    rows.append(" | ".join(cells))
            if rows:
                return "\n" + "\n".join(rows) + "\n"
            return ""

        # Links (optional)
        if tag == 'a' and include_links:
            href = element.get('href', '')
            text = element.get_text(strip=True)
            if text and href and not href.startswith(('#', 'javascript:')):
                if href.startswith('/'):
                    href = BASE_URL + href
                return f"[{text}]({href})"
            elif text:
                return text
            return ""

        # Bilder
        if tag == 'img':
            alt = element.get('alt', '')
            if alt:
                return f"[Bild: {alt}]"
            return ""

        # Blockquote
        if tag == 'blockquote':
            text = element.get_text(strip=True)
            if text:
                lines = text.split('\n')
                return "\n" + "\n".join(f"> {line}" for line in lines) + "\n"
            return ""

        # Code
        if tag == 'pre' or tag == 'code':
            text = element.get_text(strip=True)
            if text:
                return f"\n```\n{text}\n```\n"
            return ""

        # Div, Span, etc. - rekursiv verarbeiten
        result = []
        for child in element.children:
            processed = process_element(child, depth + 1)
            if processed:
                result.append(processed)

        return " ".join(result)

    result = process_element(content)
    return clean_text(result)


def extract_metadata(soup) -> dict:
    """Extrahiert Metadaten aus der Seite."""
    metadata = {}

    # Titel
    title_tag = soup.find('title')
    metadata['title'] = title_tag.get_text(strip=True) if title_tag else ""

    # Meta Description
    meta_desc = soup.find('meta', attrs={'name': 'description'})
    metadata['description'] = meta_desc.get('content', '') if meta_desc else ""

    # Breadcrumb
    breadcrumb = []
    nav_parents = soup.select('.nav-parents a, .breadcrumb a')
    for a in nav_parents:
        text = a.get_text(strip=True)
        if text and text not in ['Navigation', 'Sie befinden sich hier:']:
            breadcrumb.append(text)
    metadata['breadcrumb'] = breadcrumb

    # Datum
    date_meta = soup.find('meta', attrs={'name': 'date'})
    if date_meta:
        metadata['date'] = date_meta.get('content', '')

    # Author
    author_meta = soup.find('meta', attrs={'name': 'author'})
    if author_meta:
        metadata['author'] = author_meta.get('content', '')

    return metadata


def process_file(html_path: Path, relative_to: Path) -> tuple:
    """Verarbeitet eine HTML-Datei und gibt (rel_path, markdown) zurück."""
    try:
        with open(html_path, 'r', encoding='utf-8') as f:
            soup = BeautifulSoup(f, 'lxml')
    except Exception as e:
        return None, f"Fehler: {e}"

    rel_path = html_path.relative_to(relative_to)
    url_path = "/" + str(rel_path.parent) + "/" if rel_path.name == "index.html" else "/" + str(rel_path)

    metadata = extract_metadata(soup)
    content = extract_readable_content(soup)

    # Baue Markdown
    md_lines = []

    # Frontmatter
    md_lines.append("---")
    md_lines.append(f"url: {BASE_URL}{url_path}")
    md_lines.append(f"title: {metadata.get('title', '')}")
    if metadata.get('description'):
        md_lines.append(f"description: {metadata['description']}")
    if metadata.get('breadcrumb'):
        md_lines.append(f"breadcrumb: {' > '.join(metadata['breadcrumb'])}")
    if metadata.get('date'):
        md_lines.append(f"date: {metadata['date']}")
    if metadata.get('author'):
        md_lines.append(f"author: {metadata['author']}")
    md_lines.append("---")
    md_lines.append("")

    # Titel als H1 wenn vorhanden
    if metadata.get('title'):
        md_lines.append(f"# {metadata['title']}")
        md_lines.append("")

    # Inhalt
    md_lines.append(content)

    return str(rel_path), "\n".join(md_lines)


def count_words(text: str) -> int:
    """Zählt Wörter im Text."""
    return len(re.findall(r'\b\w+\b', text))


def get_cluster(url_path: str) -> str:
    """Extrahiert Cluster-Präfix aus URL-Pfad."""
    parts = url_path.strip('/').split('/')
    if not parts or not parts[0]:
        return "root"

    # Sonderbehandlung für /wiai/: Cluster auf 2. Ebene
    if parts[0] == "wiai" and len(parts) > 1:
        return f"wiai-{parts[1]}"

    # Sonst: Cluster auf 1. Ebene
    return parts[0]


def write_cluster_file(cluster_name: str, pages: list, output_dir: Path):
    """Schreibt eine Cluster-Datei mit allen Seiten."""
    output_path = output_dir / f"{cluster_name}.md"

    with open(output_path, 'w', encoding='utf-8') as f:
        f.write(f"# Cluster: {cluster_name}\n\n")
        f.write(f"Enthält {len(pages)} Seiten\n\n")

        for url, markdown in pages:
            f.write("---\n\n")
            f.write(markdown)
            f.write("\n\n")


def main():
    parser = argparse.ArgumentParser(description='Extrahiere lesbaren Inhalt aus Crawl-Daten')
    parser.add_argument('--single-file', action='store_true',
                        help='Alles in eine Datei schreiben')
    parser.add_argument('--cluster', action='store_true',
                        help='Nach URL-Präfix clustern')
    parser.add_argument('--min-cluster-size', type=int, default=10,
                        help='Minimum Seiten für eigenen Cluster (default: 10)')
    parser.add_argument('--min-words', type=int, default=20,
                        help='Minimum Wörter pro Seite (default: 20)')
    parser.add_argument('--output', type=str, default=None,
                        help='Output-Datei (nur mit --single-file)')
    args = parser.parse_args()

    if args.cluster and args.single_file:
        print("❌ Fehler: --cluster und --single-file können nicht kombiniert werden")
        return

    print("📖 Extrahiere lesbaren Inhalt...")
    print(f"   Quelle: {CRAWL_OUTPUT}")

    if not CRAWL_OUTPUT.exists():
        print(f"❌ Fehler: Crawl-Output nicht gefunden: {CRAWL_OUTPUT}")
        return

    # Erstelle Output-Verzeichnisse
    EXTRACTED_DIR.mkdir(exist_ok=True)

    # Finde alle HTML-Dateien
    html_files = list(CRAWL_OUTPUT.rglob("*.html"))
    print(f"   Gefunden: {len(html_files)} HTML-Dateien")

    # Sammle alle verarbeiteten Seiten
    pages = []  # Liste von (url, rel_path, markdown)
    stats = {"total": 0, "extracted": 0, "skipped": 0, "errors": 0}

    for i, html_path in enumerate(html_files):
        if (i + 1) % 100 == 0:
            print(f"   Verarbeitet: {i + 1}/{len(html_files)}")

        stats["total"] += 1

        rel_path, markdown = process_file(html_path, CRAWL_OUTPUT)

        if rel_path is None:
            stats["errors"] += 1
            continue

        # Prüfe Mindestlänge
        word_count = count_words(markdown)
        if word_count < args.min_words:
            stats["skipped"] += 1
            continue

        stats["extracted"] += 1

        # Berechne URL-Pfad
        url_path = "/" + str(Path(rel_path).parent) + "/" if rel_path.endswith("index.html") else "/" + rel_path.replace('.html', '/')

        pages.append((url_path, rel_path, markdown))

    print(f"   Extrahiert: {stats['extracted']} Seiten")

    # Sortiere nach URL
    pages.sort(key=lambda x: x[0])

    # === CLUSTER-MODUS ===
    if args.cluster:
        cluster_dir = EXTRACTED_DIR / "clusters"
        cluster_dir.mkdir(exist_ok=True)

        # Gruppiere nach Cluster
        clusters = defaultdict(list)
        for url, rel_path, markdown in pages:
            cluster_name = get_cluster(url)
            clusters[cluster_name].append((url, markdown))

        # Zähle Seiten pro Cluster
        cluster_sizes = {name: len(pages_list) for name, pages_list in clusters.items()}

        # Trenne große und kleine Cluster
        large_clusters = {name: pages_list for name, pages_list in clusters.items()
                         if len(pages_list) >= args.min_cluster_size}
        small_clusters = {name: pages_list for name, pages_list in clusters.items()
                         if len(pages_list) < args.min_cluster_size}

        # Schreibe große Cluster
        for cluster_name, pages_list in sorted(large_clusters.items()):
            write_cluster_file(cluster_name, pages_list, cluster_dir)
            print(f"   → clusters/{cluster_name}.md ({len(pages_list)} Seiten)")

        # Kombiniere kleine Cluster zu "sonstiges" bzw. "wiai-sonstiges"
        if small_clusters:
            wiai_sonstiges_pages = []
            sonstiges_pages = []

            for cluster_name in sorted(small_clusters.keys()):
                if cluster_name.startswith("wiai-"):
                    wiai_sonstiges_pages.extend(small_clusters[cluster_name])
                else:
                    sonstiges_pages.extend(small_clusters[cluster_name])

            # Schreibe wiai-sonstiges
            if wiai_sonstiges_pages:
                wiai_sonstiges_pages.sort(key=lambda x: x[0])
                wiai_small = [k for k in small_clusters.keys() if k.startswith("wiai-")]
                write_cluster_file("wiai-sonstiges", wiai_sonstiges_pages, cluster_dir)
                print(f"   → clusters/wiai-sonstiges.md ({len(wiai_sonstiges_pages)} Seiten aus {len(wiai_small)} kleinen WIAI-Clustern)")

            # Schreibe sonstiges in alphabetische Teile
            if sonstiges_pages:
                other_small = sorted([k for k in small_clusters.keys() if not k.startswith("wiai-")])

                # Teile alphabetisch in 5 Gruppen
                num_parts = 5
                chunk_size = len(other_small) // num_parts + 1
                parts = [other_small[i:i + chunk_size] for i in range(0, len(other_small), chunk_size)]

                for i, cluster_names in enumerate(parts):
                    if not cluster_names:
                        continue
                    first = cluster_names[0]
                    last = cluster_names[-1]
                    part_pages = []
                    for cn in cluster_names:
                        part_pages.extend(small_clusters[cn])
                    part_pages.sort(key=lambda x: x[0])
                    filename = f"sonstiges-{first[0]}-{last[0]}"
                    write_cluster_file(filename, part_pages, cluster_dir)
                    print(f"   → clusters/{filename}.md ({len(part_pages)} Seiten, {first}...{last})")

        print(f"\n✨ Fertig!")
        print(f"   {len(large_clusters)} Cluster + sonstiges")

    # === SINGLE-FILE-MODUS ===
    elif args.single_file:
        output_file = Path(args.output) if args.output else EXTRACTED_DIR / "all_content.md"
        with open(output_file, 'w', encoding='utf-8') as f:
            f.write(f"# Uni Bamberg - Extrahierte Inhalte\n\n")
            f.write(f"Extrahiert aus {stats['extracted']} Seiten\n\n")
            for url, rel_path, markdown in pages:
                f.write("---\n\n")
                f.write(markdown)
                f.write("\n\n")
        print(f"   → {output_file}")
        print(f"\n✨ Fertig!")

    # === EINZELDATEIEN-MODUS ===
    else:
        content_dir = EXTRACTED_DIR / "content"
        content_dir.mkdir(exist_ok=True)

        for url, rel_path, markdown in pages:
            output_path = content_dir / (rel_path.replace('.html', '.md'))
            output_path.parent.mkdir(parents=True, exist_ok=True)
            with open(output_path, 'w', encoding='utf-8') as f:
                f.write(markdown)

        print(f"   → {content_dir}/ ({stats['extracted']} Dateien)")
        print(f"\n✨ Fertig!")

    print(f"   Total: {stats['total']}")
    print(f"   Extrahiert: {stats['extracted']}")
    print(f"   Übersprungen (< {args.min_words} Wörter): {stats['skipped']}")
    print(f"   Fehler: {stats['errors']}")


if __name__ == "__main__":
    main()
