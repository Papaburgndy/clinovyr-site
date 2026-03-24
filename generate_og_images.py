#!/usr/bin/env python3
"""Generate branded OG images for Clinovyr."""

from PIL import Image, ImageDraw, ImageFont
import os

# Colors
DARK_NAVY = "#111827"
NAVY_BLUE = "#1e3a5f"
ACCENT_BLUE = "#2563eb"
LIGHT_GRAY = "#d1d5db"
WHITE = "#ffffff"

# Image dimensions
WIDTH = 1200
HEIGHT = 630

# Font paths
FONT_BOLD = "/usr/share/fonts/truetype/google-fonts/Poppins-Bold.ttf"
FONT_MEDIUM = "/usr/share/fonts/truetype/google-fonts/Poppins-Medium.ttf"
FONT_LATO_BLACK = "/usr/share/fonts/truetype/lato/Lato-Black.ttf"
FONT_LATO_REG = "/usr/share/fonts/truetype/lato/Lato-Regular.ttf"

# Output directory
OUTPUT_DIR = "/sessions/funny-vibrant-thompson/mnt/Loot/medical-leads/seo-site/output/images"

def draw_star(draw, center_x, center_y, size, fill_color):
    """Draw a five-pointed star polygon."""
    import math
    points = []
    for i in range(10):
        angle = math.pi / 2 + (i * math.pi / 5)
        if i % 2 == 0:
            r = size
        else:
            r = size * 0.4
        x = center_x + r * math.cos(angle)
        y = center_y - r * math.sin(angle)
        points.append((x, y))
    draw.polygon(points, fill=fill_color)

def create_og_image(headline, category=""):
    """Create a single OG image."""
    # Create image with gradient background
    img = Image.new('RGB', (WIDTH, HEIGHT), DARK_NAVY)
    pixels = img.load()

    # Create gradient from dark navy to navy blue
    for y in range(HEIGHT):
        ratio = y / HEIGHT
        # Interpolate between colors
        r = int(0x11 + (0x1e - 0x11) * ratio)
        g = int(0x18 + (0x3a - 0x18) * ratio)
        b = int(0x27 + (0x5f - 0x5f) * ratio)
        for x in range(WIDTH):
            pixels[x, y] = (r, g, b)

    draw = ImageDraw.Draw(img)

    # Draw left accent bar
    draw.rectangle([(0, 0), (12, HEIGHT)], fill=ACCENT_BLUE)

    # Load fonts
    try:
        font_brand = ImageFont.truetype(FONT_BOLD, 36)
        font_category = ImageFont.truetype(FONT_MEDIUM, 20)
        font_headline = ImageFont.truetype(FONT_LATO_BLACK, 62)
        font_subtitle = ImageFont.truetype(FONT_LATO_REG, 24)
        font_footer = ImageFont.truetype(FONT_MEDIUM, 18)
    except:
        # Fallback to default font
        font_brand = ImageFont.load_default()
        font_category = ImageFont.load_default()
        font_headline = ImageFont.load_default()
        font_subtitle = ImageFont.load_default()
        font_footer = ImageFont.load_default()

    # Draw brand name at top
    draw.text((40, 25), "Clinovyr", fill=ACCENT_BLUE, font=font_brand)

    # Draw category pill if provided
    if category:
        category_width = 200
        category_height = 32
        category_x = 40
        category_y = 75
        draw.rectangle(
            [(category_x, category_y), (category_x + category_width, category_y + category_height)],
            outline=ACCENT_BLUE,
            width=2
        )
        draw.text(
            (category_x + 10, category_y + 6),
            category,
            fill=ACCENT_BLUE,
            font=font_category
        )

    # Draw headline (bold white text, centered)
    headline_y = 150
    lines = []
    words = headline.split()
    current_line = []

    for word in words:
        current_line.append(word)
        test_line = " ".join(current_line)
        bbox = draw.textbbox((0, 0), test_line, font=font_headline)
        line_width = bbox[2] - bbox[0]
        if line_width > 1000:
            current_line.pop()
            lines.append(" ".join(current_line))
            current_line = [word]
    if current_line:
        lines.append(" ".join(current_line))

    # Center headline vertically
    total_height = len(lines) * 75
    start_y = headline_y - (total_height // 2)

    for i, line in enumerate(lines):
        bbox = draw.textbbox((0, 0), line, font=font_headline)
        line_width = bbox[2] - bbox[0]
        x = (WIDTH - line_width) // 2
        y = start_y + (i * 75)
        draw.text((x, y), line, fill=WHITE, font=font_headline)

    # Draw bottom bar with stars
    bar_height = 80
    bar_y = HEIGHT - bar_height
    # Create semi-transparent overlay by blending
    overlay = Image.new('RGBA', (WIDTH, bar_height), (255, 255, 255, 13))
    img_rgba = img.convert('RGBA')
    img_rgba.paste(overlay, (0, bar_y), overlay)
    img = img_rgba.convert('RGB')

    # Draw stars
    star_size = 12
    stars_start_x = 40
    for i in range(5):
        star_x = stars_start_x + (i * 35)
        star_y = bar_y + 40
        draw.polygon(
            _star_points(star_x, star_y, star_size),
            fill=ACCENT_BLUE
        )

    # Draw URL
    url_x = 40
    url_y = bar_y + 20
    draw.text((url_x, url_y), "clinovyr.com", fill=LIGHT_GRAY, font=font_footer)

    # Draw year
    year_x = WIDTH - 120
    year_y = bar_y + 25
    draw.text((year_x, year_y), "2026", fill=LIGHT_GRAY, font=font_footer)

    return img

def _star_points(cx, cy, size):
    """Generate star polygon points."""
    import math
    points = []
    for i in range(10):
        angle = math.pi / 2 + (i * math.pi / 5)
        if i % 2 == 0:
            r = size
        else:
            r = size * 0.4
        x = cx + r * math.cos(angle)
        y = cy - r * math.sin(angle)
        points.append((x, y))
    return points

def main():
    """Generate all OG images."""
    images_data = [
        ("og-home.jpg", "Find Top Medical & Aesthetic Providers Near You", ""),
        ("og-botox.jpg", "Best Botox & Fillers Providers Near You", "Botox"),
        ("og-med-spa.jpg", "Find Top Med Spas in Your City", "Med Spa"),
        ("og-laser.jpg", "Laser Hair Removal Clinics Near You", "Laser"),
        ("og-dentist.jpg", "Top Dentists & Dental Offices Near You", "Dentist"),
        ("og-chiropractor.jpg", "Find Trusted Chiropractors Near You", "Chiropractor"),
        ("og-blog.jpg", "Medical & Aesthetic Treatment Guides", "Blog"),
        ("og-default.jpg", "Find Top Medical Providers Near You", ""),
        ("og-services.jpg", "Compare Medical & Aesthetic Services", "Services"),
        ("og-cities.jpg", "Find Providers in Your City", "Cities"),
        ("og-plastic-surgery.jpg", "Board-Certified Plastic Surgeons Near You", "Surgery"),
        ("og-dermatologist.jpg", "Top Dermatologists Near You", "Dermatology"),
        ("og-coolsculpting.jpg", "CoolSculpting & Body Contouring Near You", "Sculpting"),
        ("og-iv-therapy.jpg", "IV Therapy & Hydration Clinics Near You", "IV Therapy"),
        ("og-hormone-therapy.jpg", "Hormone Therapy Specialists Near You", "Hormones"),
        ("og-hair-restoration.jpg", "Hair Restoration & Transplant Clinics", "Hair Care"),
        ("og-lasik.jpg", "Top LASIK Surgeons Near You", "LASIK"),
        ("og-fertility.jpg", "Fertility Clinics & Specialists Near You", "Fertility"),
    ]

    for filename, headline, category in images_data:
        print(f"Generating {filename}...")
        img = create_og_image(headline, category)
        filepath = os.path.join(OUTPUT_DIR, filename)
        img.save(filepath, "JPEG", quality=85)
        print(f"  Saved to {filepath}")

    print(f"\nGenerated {len(images_data)} OG images in {OUTPUT_DIR}")

if __name__ == "__main__":
    main()
