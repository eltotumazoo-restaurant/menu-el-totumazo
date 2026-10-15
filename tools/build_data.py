"""Genera ../data.js a partir de menu_data.py y credits.json."""
import json
from pathlib import Path
from menu_data import CATEGORIAS, PROMO, NOTA_FINAL

ROOT = Path(__file__).resolve().parent.parent
credits = {}
cf = ROOT / "tools" / "credits.json"
if cf.exists():
    credits = json.loads(cf.read_text("utf-8"))


def item(t):
    pid, nombre, precio, desc, _ = t
    img = ROOT / "img" / "platos" / f"{pid}.webp"
    c = credits.get(pid, {})
    return {
        "id": pid, "nombre": nombre, "precio": precio, "desc": desc,
        "img": f"img/platos/{pid}.webp" if img.exists() else "",
        "credito": {k: c.get(k, "") for k in ("file", "page", "artist", "license")} if c else None,
    }


cats = []
for c in CATEGORIAS:
    d = {k: c[k] for k in ("id", "nombre", "icono", "nota")}
    d["items"] = [item(t) for t in c["items"]]
    if "sub" in c:
        d["sub"] = {"nombre": c["sub"]["nombre"], "items": [item(t) for t in c["sub"]["items"]]}
    cats.append(d)

data = {"categorias": cats, "promo": PROMO, "notaFinal": NOTA_FINAL}
(ROOT / "data.js").write_text("window.MENU = " + json.dumps(data, ensure_ascii=False, indent=1) + ";\n", "utf-8")
print("data.js listo:", sum(len(c["items"]) + len(c.get("sub", {}).get("items", [])) for c in cats), "platos")
