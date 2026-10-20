#!/usr/bin/env python3
import os
from PIL import Image

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.abspath(os.path.join(SCRIPT_DIR, ".."))
LOGO_SRC = os.path.join(PROJECT_ROOT, "assets", "logo.png")

RES_DIRS = []
app_res = os.path.join(PROJECT_ROOT, "app", "src", "main", "res")
if os.path.exists(app_res):
    RES_DIRS.append(app_res)
apps_res = os.path.join(PROJECT_ROOT, "apps", "android", "res")
if os.path.exists(apps_res):
    RES_DIRS.append(apps_res)
if not RES_DIRS and os.path.exists(os.path.join(PROJECT_ROOT, "res")):
    RES_DIRS.append(os.path.join(PROJECT_ROOT, "res"))

ICON_SIZES = {
    "mipmap-mdpi": 48,
    "mipmap-hdpi": 72,
    "mipmap-xhdpi": 96,
    "mipmap-xxhdpi": 144,
    "mipmap-xxxhdpi": 192
}

def generate_icons():
    if not os.path.exists(LOGO_SRC):
        print(f"Error: {LOGO_SRC} not found")
        return

    img = Image.open(LOGO_SRC).convert("RGBA")
    
    for res_dir in RES_DIRS:
        for folder, size in ICON_SIZES.items():
            out_dir = os.path.join(res_dir, folder)
            os.makedirs(out_dir, exist_ok=True)
            out_path = os.path.join(out_dir, "ic_launcher.png")
            resized = img.resize((size, size), Image.Resampling.LANCZOS)
            resized.save(out_path, "PNG")
            print(f"Generated {out_path} ({size}x{size})")

        # Also save drawable/ic_launcher.png
        drawable_dir = os.path.join(res_dir, "drawable")
        os.makedirs(drawable_dir, exist_ok=True)
        img.resize((192, 192), Image.Resampling.LANCZOS).save(os.path.join(drawable_dir, "ic_launcher.png"), "PNG")
    print("Icon generation complete.")

if __name__ == "__main__":
    generate_icons()
