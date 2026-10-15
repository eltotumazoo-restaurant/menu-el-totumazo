"""Busca en Wikimedia Commons una foto por plato y la guarda en img/platos/<id>.webp.

Uso: python fetch_images.py [id ...]   (sin ids: solo descarga las que faltan)
Overrides manuales en overrides.json: {"id": "File:Nombre.jpg" | "consulta alternativa"}
"""
import io, json, re, sys, time, urllib.parse, urllib.request
from pathlib import Path
from PIL import Image, ImageOps
from menu_data import CATEGORIAS

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "img" / "platos"
OUT.mkdir(parents=True, exist_ok=True)
CREDITS = ROOT / "tools" / "credits.json"
OVR = ROOT / "tools" / "overrides.json"
UA = {"User-Agent": "ElTotumazoMenu/1.0 (menu web; contacto local)"}
API = "https://commons.wikimedia.org/w/api.php"


def get(url):
    for i in range(4):
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=40) as r:
                return r.read()
        except Exception as e:
            print("  reintento", i + 1, e, flush=True)
            time.sleep(30 + i * 30)
    raise RuntimeError("fallo " + url)


def search(q, skip=0):
    if q.startswith("File:"):
        params = {"titles": q}
    else:
        params = {"generator": "search", "gsrnamespace": 6, "gsrlimit": 12,
                  "gsrsearch": q + " filetype:bitmap"}
    params.update(action="query", prop="imageinfo", iiprop="url|size|extmetadata",
                  iiurlwidth=960, format="json")
    data = json.loads(get(API + "?" + urllib.parse.urlencode(params)))
    pages = sorted(data.get("query", {}).get("pages", {}).values(), key=lambda p: p.get("index", 0))
    good = []
    for p in pages:
        ii = (p.get("imageinfo") or [{}])[0]
        if ii.get("width", 0) < 500 or not ii.get("thumburl"):
            continue
        if re.search(r"\.(svg|gif|tif)", p["title"], re.I):
            continue
        md = ii.get("extmetadata", {})
        good.append({
            "file": p["title"], "thumb": ii["thumburl"], "page": ii.get("descriptionurl"),
            "artist": re.sub("<[^>]+>", "", md.get("Artist", {}).get("value", "")).strip(),
            "license": md.get("LicenseShortName", {}).get("value", ""),
        })
    return good[skip] if len(good) > skip else None


def main():
    credits = json.loads(CREDITS.read_text("utf-8")) if CREDITS.exists() else {}
    ovr = json.loads(OVR.read_text("utf-8")) if OVR.exists() else {}
    only = set(sys.argv[1:])
    items = []
    for c in CATEGORIAS:
        items += c["items"] + c.get("sub", {}).get("items", [])
    for pid, name, _, _, q in items:
        dest = OUT / f"{pid}.webp"
        if only and pid not in only:
            continue
        if not only and dest.exists():
            continue
        if only:  # rehacer: mejor sin foto que con una equivocada
            dest.unlink(missing_ok=True)
            credits.pop(pid, None)
        o = ovr.get(pid, q)
        skip = 0
        if isinstance(o, list):
            o, skip = o
        try:
            hit = search(o, skip)
        except RuntimeError as e:
            print("ERROR", pid, e, flush=True)
            continue
        if not hit:
            print("SIN RESULTADO", pid, o)
            continue
        time.sleep(2)
        try:
            im = Image.open(io.BytesIO(get(hit["thumb"]))).convert("RGB")
        except RuntimeError as e:
            print("ERROR", pid, e, flush=True)
            continue
        im = ImageOps.fit(im, (640, 480), Image.LANCZOS)
        im.save(dest, "WEBP", quality=80)
        credits[pid] = hit
        print("ok", pid, "<-", hit["file"], flush=True)
        CREDITS.write_text(json.dumps(credits, ensure_ascii=False, indent=1), "utf-8")
        time.sleep(3)
    CREDITS.write_text(json.dumps(credits, ensure_ascii=False, indent=1), "utf-8")


if __name__ == "__main__":
    main()
