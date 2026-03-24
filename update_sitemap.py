#!/usr/bin/env python3
"""Update sitemap with comparison pages."""

import xml.etree.ElementTree as ET
from pathlib import Path

OUTPUT_DIR = Path("/sessions/funny-vibrant-thompson/mnt/Loot/medical-leads/seo-site/output")
SITEMAP_PATH = OUTPUT_DIR / "sitemap.xml"
COMPARE_DIR = OUTPUT_DIR / "compare"

COMPARISONS = [
    "botox-vs-dysport",
    "coolsculpting-vs-liposuction",
    "coolsculpting-vs-emsculpt",
    "botox-vs-fillers",
    "invisalign-vs-braces",
    "laser-vs-ipl",
    "med-spa-vs-plastic-surgeon",
    "hair-transplant-vs-prp",
    "lasik-vs-prk",
    "chemical-peel-vs-microdermabrasion",
    "dental-implants-vs-veneers",
    "hormone-therapy-types",
]

def update_sitemap():
    """Update sitemap with new comparison pages."""

    # Register namespace
    ET.register_namespace('', 'http://www.sitemaps.org/schemas/sitemap/0.9')

    # Parse existing sitemap
    tree = ET.parse(SITEMAP_PATH)
    root = tree.getroot()

    ns = {'': 'http://www.sitemaps.org/schemas/sitemap/0.9'}

    # Add compare index
    url_elem = ET.Element('url')
    loc = ET.SubElement(url_elem, 'loc')
    loc.text = 'https://clinovyr.com/compare/'
    changefreq = ET.SubElement(url_elem, 'changefreq')
    changefreq.text = 'monthly'
    priority = ET.SubElement(url_elem, 'priority')
    priority.text = '0.8'
    root.append(url_elem)

    # Add individual comparison pages
    for comparison in COMPARISONS:
        url_elem = ET.Element('url')
        loc = ET.SubElement(url_elem, 'loc')
        loc.text = f'https://clinovyr.com/compare/{comparison}/'
        changefreq = ET.SubElement(url_elem, 'changefreq')
        changefreq.text = 'monthly'
        priority = ET.SubElement(url_elem, 'priority')
        priority.text = '0.7'
        root.append(url_elem)

    # Write updated sitemap
    tree.write(SITEMAP_PATH, encoding='utf-8', xml_declaration=True)
    print(f"Updated sitemap with {len(COMPARISONS) + 1} new URLs")

if __name__ == "__main__":
    update_sitemap()
