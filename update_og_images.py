#!/usr/bin/env python3
"""Update HTML files with proper OG image references."""

import os
import re
from pathlib import Path

OUTPUT_DIR = "/sessions/funny-vibrant-thompson/mnt/Loot/medical-leads/seo-site/output"

# Mapping of page patterns to OG image names
def get_og_image(filepath):
    """Determine which OG image to use based on file path."""
    relative_path = os.path.relpath(filepath, OUTPUT_DIR)

    # Homepage
    if relative_path == "index.html":
        return "og-home.jpg"

    # Blog pages
    if "blog/" in relative_path:
        return "og-blog.jpg"

    # City pages (cities/CITY/SERVICE/index.html)
    if "cities/" in relative_path:
        return "og-cities.jpg"

    # Service pages (services/SERVICE/index.html)
    if "services/" in relative_path:
        # Map service to specific OG image
        if "botox" in relative_path or "fillers" in relative_path:
            return "og-botox.jpg"
        elif "med-spa" in relative_path or "medica-spa" in relative_path:
            return "og-med-spa.jpg"
        elif "laser-hair" in relative_path:
            return "og-laser.jpg"
        elif "dentist" in relative_path or "dental" in relative_path:
            return "og-dentist.jpg"
        elif "chiropractor" in relative_path:
            return "og-chiropractor.jpg"
        elif "plastic-surgeon" in relative_path or "plastic-surgery" in relative_path:
            return "og-plastic-surgery.jpg"
        elif "dermatologist" in relative_path:
            return "og-dermatologist.jpg"
        elif "coolsculpting" in relative_path:
            return "og-coolsculpting.jpg"
        elif "iv-therapy" in relative_path:
            return "og-iv-therapy.jpg"
        elif "hormone" in relative_path:
            return "og-hormone-therapy.jpg"
        elif "hair-restoration" in relative_path or "hair-transplant" in relative_path:
            return "og-hair-restoration.jpg"
        elif "lasik" in relative_path or "lasik-eye" in relative_path:
            return "og-lasik.jpg"
        elif "fertility" in relative_path:
            return "og-fertility.jpg"
        else:
            return "og-services.jpg"

    # Default
    return "og-default.jpg"

def update_html_file(filepath):
    """Update a single HTML file with correct OG image."""
    with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
        content = f.read()

    og_image = get_og_image(filepath)
    og_image_url = f"/images/{og_image}"

    # Check if og:image meta tag exists
    og_image_pattern = r'<meta property="og:image" content="[^"]*">'

    if re.search(og_image_pattern, content):
        # Replace existing og:image tag
        new_content = re.sub(og_image_pattern, f'<meta property="og:image" content="{og_image_url}">', content)
    else:
        # Add og:image tag after og:url
        new_content = content.replace(
            '<meta property="og:url"',
            f'<meta property="og:image" content="{og_image_url}">\n<meta property="og:url"'
        )

    if new_content != content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)
        return True
    return False

def main():
    """Update all HTML files."""
    count = 0
    updated = 0

    for root, dirs, files in os.walk(OUTPUT_DIR):
        # Skip .git and images directories
        dirs[:] = [d for d in dirs if d not in ['.git', 'images']]

        for file in files:
            if file.endswith('.html'):
                filepath = os.path.join(root, file)
                count += 1
                if update_html_file(filepath):
                    updated += 1
                    relative = os.path.relpath(filepath, OUTPUT_DIR)
                    og_img = get_og_image(filepath)
                    print(f"Updated {relative} -> {og_img}")

    print(f"\nProcessed {count} HTML files, updated {updated} files")

if __name__ == "__main__":
    main()
