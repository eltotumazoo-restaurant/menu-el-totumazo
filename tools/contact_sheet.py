"""Hoja de contacto con las fotos de los platos y su id, para revisión visual."""
import sys
from pathlib import Path
from PIL import Image, ImageDraw
from menu_data import CATEGORIAS

ROOT = Path(__file__).resolve().parent.parent
out = Path(sys.argv[1])
ids = []
for c in CATEGORIAS:
    ids += [t[0] for t in c["items"] + c.get("sub", {}).get("items", [])]
W, H, COLS = 240, 200, 6
for page in range(0, len(ids), 36):
    chunk = ids[page:page + 36]
    sheet = Image.new("RGB", (W * COLS, H * ((len(chunk) + COLS - 1) // COLS)), "black")
    d = ImageDraw.Draw(sheet)
    for i, pid in enumerate(chunk):
        x, y = (i % COLS) * W, (i // COLS) * H
        f = ROOT / "img" / "platos" / f"{pid}.webp"
        if f.exists():
            im = Image.open(f); im.thumbnail((W - 6, H - 26)); sheet.paste(im, (x + 3, y + 3))
        d.rectangle([x, y + H - 22, x + W, y + H], fill="black")
        d.text((x + 4, y + H - 20), pid, fill="yellow")
    sheet.save(out / f"sheet{page // 36 + 1}.jpg", quality=85)
