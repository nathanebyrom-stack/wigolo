"""Render the FPUK 360 flyer with a new photo.
Usage: python3 render.py <photo> <out.jpg> [object-position, default '50% 40%']
Needs: npm i @fontsource/montserrat @fontsource/ibm-plex-mono (in this folder), playwright + chromium, Pillow.
Wording and layout are fixed (Nathan, 21 Oct 2026). Only the photo changes.
"""
import sys, os, shutil
from playwright.sync_api import sync_playwright
from PIL import Image
here = os.path.dirname(os.path.abspath(__file__))
photo, out = sys.argv[1], sys.argv[2]
pos = sys.argv[3] if len(sys.argv) > 3 else "50% 40%"
shutil.copy(photo, os.path.join(here, "_photo.jpg"))
html = open(os.path.join(here, "template.html")).read().replace("__PHOTO__", "_photo.jpg").replace("__POS__", pos)
page = os.path.join(here, "_page.html"); open(page, "w").write(html)
with sync_playwright() as p:
    b = p.chromium.launch(); pg = b.new_page(viewport={"width": 1080, "height": 1350}, device_scale_factor=2)
    pg.goto("file://" + page); pg.wait_for_timeout(800); pg.screenshot(path=os.path.join(here, "_big.png")); b.close()
Image.open(os.path.join(here, "_big.png")).convert("RGB").resize((1080, 1350), Image.LANCZOS).save(out, quality=93)
print("rendered", out)
