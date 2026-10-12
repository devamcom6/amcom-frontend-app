"""
Builds optimised image assets from the designer exports in docs/images.

Two outputs:
  1. src/assets/images/*.webp   - static marketing imagery bundled by Vite
                                   (hero visuals, product cards, illustration, logo).
  2. public/mock-media/*.webp    - responsive variants that emulate what the Laravel
                                   backend will return from Cloudinary (estates,
                                   properties, galleries). Only used by the mock API.
     src/mocks/media-manifest.json describes every mock asset (width, height,
     variants, dominant colour) so mock payloads mirror the real media contract.

Run:  python scripts/build_mock_media.py      (requires Pillow)
"""

from __future__ import annotations

import json
import os
import sys
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "docs" / "images"
DESIGNS = ROOT / "docs" / "amcom-ui"
STATIC_OUT = ROOT / "src" / "assets" / "images"
MOCK_OUT = ROOT / "public" / "mock-media"
MANIFEST = ROOT / "src" / "mocks" / "media-manifest.json"

QUALITY = 82

# name -> (source file, optional crop box (l, t, r, b))
STATIC = {
    "hero-home": ("Right_Visual_Wrapper.png", None),
    "hero-home-mobile": ("Right_Visual_Wrapper.png", (72, 0, 672, 560)),
    "hero-buyback": ("Right_Visual.png", None),
    "hero-capital": ("Right_Visual (1).png", None),
    "hero-property": ("Right_Visual (2).png", None),
    "product-buyback": ("Image Area.png", None),
    "product-capital": ("Image Area (1).png", None),
    "product-property": ("Image Area (2).png", None),
    "path-find": ("Illustration Area.png", None),
    "path-list": ("Illustration Area (1).png", None),
    "testimonial-avatar": ("Frame 2147238433.png", None),
}

# Mock CDN media: name -> (source, crop)
MOCK = {
    "estate-greenlush-aerial": ("Aerial photo.png", (0, 60, 608, 408)),
    "estate-greenlush": ("Background.png", None),
    "estate-ridgewood": ("Link.png", (0, 0, 416, 318)),
    "estate-devilla": ("Background (1).png", None),
    "property-tower": ("Frame 427318238.png", (0, 0, 770, 504)),
    "property-living": ("Frame 427318238 (1).png", (90, 0, 990, 764)),
    "property-lounge": ("Image.png", None),
    "property-terrace": ("image 12.png", None),
    "property-bedroom": ("Image (1).png", None),
    "property-kitchen": ("image 12 (1).png", None),
    "property-bathroom": ("image 13.png", None),
    "property-building": ("image 14.png", None),
    "property-apartments": ("Illustration Area.png", None),
    "property-villa": ("Illustration Area (1).png", None),
    "property-mansion": ("Image Area (2).png", None),
    "property-estate-row": ("Illustration Area (2).png", None),
}

WIDTHS = (480, 960, 1440)


def load(name: str, crop):
    src = Image.open(SRC / name)
    # Keep transparency (e.g. the hero composite with a floating card) - WebP supports alpha.
    im = src.convert("RGBA") if "A" in src.getbands() or "transparency" in src.info else src.convert("RGB")
    if crop:
        im = im.crop(crop)
    return im


def save_webp(im: Image.Image, path: Path, width: int | None = None) -> tuple[int, int]:
    if width and im.width > width:
        h = round(im.height * width / im.width)
        im = im.resize((width, h), Image.LANCZOS)
    path.parent.mkdir(parents=True, exist_ok=True)
    im.save(path, "WEBP", quality=QUALITY, method=6)
    return im.size


def dominant(im: Image.Image) -> str:
    r, g, b = im.convert("RGB").resize((1, 1), Image.BOX).getpixel((0, 0))
    return f"#{r:02x}{g:02x}{b:02x}"


def build_static() -> None:
    for name, (src, crop) in STATIC.items():
        im = load(src, crop)
        save_webp(im, STATIC_OUT / f"{name}.webp")

    # Success illustration is only available inside the design screenshots.
    illus = Image.open(DESIGNS / "Setup Confirmation - Mobile.png").convert("RGB").crop((130, 160, 275, 275))
    illus.save(STATIC_OUT / "success-illustration.png", optimize=True)

    logo = Image.open(SRC / "Logo.png").convert("RGBA")
    logo.save(STATIC_OUT / "logo.png", optimize=True)
    fav = ROOT / "public" / "favicon.png"
    logo.resize((64, 64), Image.LANCZOS).save(fav, optimize=True)


def build_mock() -> None:
    manifest: dict[str, dict] = {}
    for name, (src, crop) in MOCK.items():
        im = load(src, crop)
        variants = {}
        for w in WIDTHS:
            if w > im.width and variants:
                continue
            target = min(w, im.width)
            size = save_webp(im, MOCK_OUT / f"{name}-{target}.webp", target)
            variants[str(target)] = f"/mock-media/{name}-{target}.webp"
        thumb = im.copy()
        thumb.thumbnail((320, 320))
        save_webp(thumb, MOCK_OUT / f"{name}-thumb.webp")
        manifest[name] = {
            "width": im.width,
            "height": im.height,
            "dominant_color": dominant(im),
            "variants": variants,
            "thumbnail": f"/mock-media/{name}-thumb.webp",
        }
    MANIFEST.parent.mkdir(parents=True, exist_ok=True)
    MANIFEST.write_text(json.dumps(manifest, indent=2))


def build_agreement_pdf() -> None:
    """Sample multi-page agreement PDF served by the mock API (real PDFs come from Laravel)."""
    from PIL import ImageDraw, ImageFont

    pages = []
    for n in range(1, 4):
        page = Image.new("RGB", (1240, 1754), "white")
        d = ImageDraw.Draw(page)
        try:
            font = ImageFont.truetype("arial.ttf", 30)
            title = ImageFont.truetype("arialbd.ttf", 40)
        except OSError:
            font = title = ImageFont.load_default()
        d.text((620, 140), "Investment Agreement (SAMPLE)", fill="black", font=title, anchor="mm")
        d.text((620, 200), f"Page {n} of 3 - generated for local development only", fill="#666", font=font, anchor="mm")
        y = 300
        for line in [
            "This Agreement is executed between HOUVINCITY Global Limited",
            "(the Promoter) and the registered Investor.",
            "",
            "1. Investment Amount - as stated in the summary schedule.",
            "2. Tenure and Return - fixed at the point of signing.",
            "3. Disbursement - paid to the Investor's designated account",
            "   within five (5) business days of maturity.",
        ]:
            d.text((140, y), line, fill="black", font=font)
            y += 52
        pages.append(page)
    pages[0].save(MOCK_OUT / "agreement-sample.pdf", save_all=True, append_images=pages[1:], resolution=150)


if __name__ == "__main__":
    if not SRC.exists():
        sys.exit(f"Missing design assets in {SRC}")
    build_static()
    build_mock()
    build_agreement_pdf()
    total = sum(f.stat().st_size for f in MOCK_OUT.glob("*.webp")) // 1024
    print(f"static -> {STATIC_OUT.relative_to(ROOT)}; mock -> {MOCK_OUT.relative_to(ROOT)} ({total} KB)")
    os.sys.exit(0)
