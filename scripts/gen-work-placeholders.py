"""
Placeholder media for Featured Work. NOT project work — abstract stand-ins,
generated deterministically, in the plane's exact aspect (840:537 = 1680x1074).
Replace each with real project media in content/work.ts.
"""
import numpy as np
from PIL import Image

W, H = 1680, 1074
rng = np.random.default_rng(1955)
y, x = np.mgrid[0:H, 0:W].astype(np.float32)
u, v = x / H, y / H


def save(arr, name):
    img = Image.fromarray(np.uint8(np.clip(arr, 0, 255)))
    img.save(f"public/work/{name}.jpg", quality=86, optimize=True, progressive=True)
    img.resize((320, 205), Image.LANCZOS).save(f"public/work/{name}-thumb.jpg", quality=84, optimize=True)


# 01 — flow: thin light streaks through graphite, a faint chromatic fringe
warp = u * 2.0 + 0.38 * np.sin(v * 5.2 + u * 2.6) + 0.22 * np.sin(u * 8.0 - v * 3.3)
def streak(phase):
    b = np.sin(warp * 5.4 + np.sin(v * 2.9 + u) * 1.5 + phase)
    return np.exp(-((b - 0.88) ** 2) / 0.018)
base = 18 + 34 * (np.sin(u * 1.7 + v * 0.8) * 0.5 + 0.5)
r = base + 205 * streak(0.00)
g = base + 200 * streak(0.05)
b = base + 215 * streak(0.11) + 10
save(np.dstack([r, g, b]), "placeholder-01")

# 02 — cells: a muted Voronoi mosaic with dark leading
sw, sh = W // 4, H // 4
sy, sx = np.mgrid[0:sh, 0:sw].astype(np.float32)
seeds = rng.random((70, 2)) * [sw, sh]
d = np.sqrt((sx[..., None] - seeds[:, 0]) ** 2 + (sy[..., None] - seeds[:, 1]) ** 2)
ds = np.sort(d, axis=-1)
idx = np.argmin(d, axis=-1)
edge = np.clip((ds[..., 1] - ds[..., 0]) / 1.6, 0, 1)
tones = rng.integers(0, 4, 70)
palette = np.array([[196, 198, 202], [150, 156, 166], [112, 118, 130], [226, 222, 214]], np.float32)
col = palette[tones[idx]] * (0.25 + 0.75 * edge[..., None])
save(np.array(Image.fromarray(np.uint8(col)).resize((W, H), Image.BICUBIC)), "placeholder-02")

# 03 — contour: a topographic field in fine dark lines on paper
hgt = np.zeros_like(u)
for _ in range(9):
    cx, cy, s, a = rng.random() * 1.6, rng.random(), 0.12 + rng.random() * 0.3, rng.random() * 2 - 1
    hgt += a * np.exp(-((u - cx) ** 2 + (v - cy) ** 2) / (2 * s * s))
frac = (hgt * 16) % 1.0
line = np.exp(-(np.minimum(frac, 1 - frac) ** 2) / 0.0016)
paper = 232 - 10 * v
save(np.dstack([paper - 170 * line] * 3) + np.array([2, 0, -4]), "placeholder-03")

# 04 — halftone: a dot screen over a soft gradient
cell = 34
gx, gy = (x % cell) - cell / 2, (y % cell) - cell / 2
tone = 0.5 + 0.5 * np.sin(u * 2.3 - v * 1.4)
rad = (cell / 2) * np.sqrt(tone) * 0.95
dot = np.clip((rad - np.sqrt(gx ** 2 + gy ** 2)) / 1.6 + 0.5, 0, 1)
bg = 24 + 16 * v
save(np.dstack([bg + 200 * dot, bg + 204 * dot, bg + 212 * dot]), "placeholder-04")
print("placeholders written")
