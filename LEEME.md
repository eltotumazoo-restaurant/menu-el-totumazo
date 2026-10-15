# Menú web El Totumazo · Sede Sur

Sitio estático (HTML + CSS + JS, sin dependencias). Para publicarlo basta subir la carpeta `menu-web/`
a cualquier hosting (Netlify, GitHub Pages, Hostinger, etc.) y apuntar el QR a `index.html`.

## Archivos
- `index.html`, `styles.css`, `app.js` — la página.
- `data.js` — la carta (generado; no editar a mano).
- `img/platos/<id>.webp` — una foto por plato (640×480).
- `img/hero.webp`, `img/logo.webp` — portada y logo.
- `tools/` — scripts para regenerar datos y fotos.

## Cambiar un precio, nombre o descripción
1. Editar `tools/menu_data.py`.
2. Ejecutar: `python tools/build_data.py`

## Cambiar la foto de un plato
Reemplazar `img/platos/<id>.webp` por una foto propia (idealmente 4:3, en .webp con el mismo nombre).
El `id` de cada plato está en `tools/menu_data.py`. Si reemplazas fotos de Commons por propias,
borra su entrada en `tools/credits.json` y vuelve a ejecutar `build_data.py`.

## Enlaces directos a una pestaña
`index.html#entradas`, `#sopas`, `#tipicos`, `#costa`, `#asados`, `#dia`, `#calderos`,
`#ejecutivos`, `#desayunos`, `#bebidas`, `#postres`, `#cocktails`, `#nocturno`.

## Ver en local
`python -m http.server 5173 --directory menu-web` y abrir http://localhost:5173
