from pathlib import Path

from PIL import Image

asset_dir = Path(__file__).resolve().parents[1] / "assets" / "images"
targets = [
    "icon.png",
    "splash-icon.png",
    "favicon.png",
    "android-icon-foreground.png",
]

for name in targets:
    path = asset_dir / name
    with Image.open(path) as source:
        image = source.convert("RGBA")
        image.thumbnail((1024, 1024), Image.Resampling.LANCZOS)
        image.save(path, format="PNG", optimize=True, compress_level=9)
        print(f"optimized {name}: {image.width}x{image.height}")
