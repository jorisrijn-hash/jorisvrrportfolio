"""
ENCODE MEDIA — project stills, from source to what the site serves.

Drop a project's source image (JPG/PNG, ideally >= 1680px wide) in
media/work/, then run:

    python3 scripts/encode-media.py

For every source it writes, into public/work/:
    <name>-1680.webp   desktop, and Retina laptops (surface ~840 CSS px)
    <name>-960.webp    phones and small tablets (surface ~360 CSS px at <=2x)
and for sources named *-thumb.*:
    <name>.webp        the index thumbnail, as-is

content/work.ts points at the source path; mediaStill()/thumbSrc() map it to
these files, so the site never ships a source it doesn't need.
"""
import os
from PIL import Image

SRC = "media/work"
OUT = "public/work"
os.makedirs(OUT, exist_ok=True)

for name in sorted(os.listdir(SRC)):
    base, ext = os.path.splitext(name)
    if ext.lower() not in (".jpg", ".jpeg", ".png"):
        continue
    im = Image.open(os.path.join(SRC, name)).convert("RGB")
    targets = [(base, im.width)] if base.endswith("-thumb") else [(f"{base}-1680", 1680), (f"{base}-960", 960)]
    for out, w in targets:
        img = im if im.width <= w else im.resize((w, round(im.height * w / im.width)), Image.LANCZOS)
        path = os.path.join(OUT, out + ".webp")
        img.save(path, "WEBP", quality=82, method=6)
        print(f"{path:44} {img.width}x{img.height}  {os.path.getsize(path) // 1024}KB  (source {os.path.getsize(os.path.join(SRC, name)) // 1024}KB)")
