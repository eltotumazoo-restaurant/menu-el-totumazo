(() => {
  const M = window.MENU;
  const COLORES = ["#ffd400", "#ff2ba6", "#19d3c5", "#ff7a00", "#1e5bff", "#19a84b", "#e6192e", "#9b4dff"];
  const $ = (s) => document.querySelector(s);
  const fmt = (n) => "$" + n.toLocaleString("es-CO");
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

  const cats = M.categorias.map((c, i) => ({ ...c, color: COLORES[i % COLORES.length] }));
  const todos = [];
  cats.forEach((c) => {
    c.items.forEach((p) => todos.push({ ...p, cat: c }));
    (c.sub?.items || []).forEach((p) => todos.push({ ...p, cat: c }));
  });
  const porId = Object.fromEntries(todos.map((p) => [p.id, p]));

  /* ---------- Banderines ---------- */
  const band = $(".banderines--top");
  const bcol = ["#ffd400", "#e6192e", "#ff2ba6", "#f4f4f4", "#9b4dff", "#1e5bff", "#19a84b", "#ff7a00"];
  let svg = '<path d="M0 8 Q600 40 1200 8" stroke="#f4ead2" stroke-width="2" fill="none"/><g class="tira">';
  for (let i = 0; i < 30; i++) {
    const x = i * 40 + 4, y = 8 + Math.sin((i / 29) * Math.PI) * 30;
    svg += `<path d="M${x} ${y} h34 l-17 46z" fill="${bcol[i % bcol.length]}" style="animation-delay:${(i % 6) * -0.4}s"/>`;
  }
  band.innerHTML = svg + "</g>";

  /* ---------- Tabs ---------- */
  const tabs = $("#tabs");
  tabs.innerHTML = cats.map((c) =>
    `<button class="tab" role="tab" id="tab-${c.id}" data-id="${c.id}" style="--c:${c.color}" aria-selected="false">
      <span class="tab__ico" aria-hidden="true">${c.icono}</span>${esc(c.nombre)}</button>`).join("");
  tabs.addEventListener("click", (e) => {
    const b = e.target.closest(".tab");
    if (b) ir(b.dataset.id, true);
  });

  /* ---------- Render ---------- */
  const tarjeta = (p, i, color) => {
    const r = ((i * 37) % 5) - 2; // rotación sutil y variada
    const foto = p.img
      ? `<img src="${p.img}" alt="${esc(p.nombre)}" loading="lazy" width="640" height="480">`
      : "";
    return `<button class="plato" data-id="${p.id}" style="--c:${color};--i:${i};--r:${r}deg">
      <span class="plato__precio">${fmt(p.precio)}</span>
      <span class="plato__foto ${p.img ? "" : "plato__foto--vacia"}">${foto || p.cat?.icono || ""}</span>
      <span class="plato__cuerpo">
        <h3 class="plato__nombre">${esc(p.nombre)}</h3>
        ${p.desc ? `<p class="plato__desc">${esc(p.desc)}</p>` : ""}
      </span>
    </button>`;
  };
  const grid = (items, c, base = 0) => {
    const pal = [c.color, ...COLORES.filter((x) => x !== c.color)];
    return `<div class="grid">${items.map((p, i) => tarjeta({ ...p, cat: c }, i + base, pal[(i + base) % pal.length])).join("")}</div>`;
  };

  const panel = $("#panel");
  // Inicio de la carta: justo debajo de la portada (la barra de pestañas es sticky,
  // así que su offsetTop no sirve cuando está pegada arriba).
  const inicioCarta = () => { const h = $(".hero"); return h.offsetTop + h.offsetHeight; };
  let actual = null;

  function render(c) {
    const idx = cats.indexOf(c);
    const prev = cats[idx - 1], next = cats[idx + 1];
    let html = `<section class="seccion" style="--acento:${c.color}" aria-labelledby="tab-${c.id}">
      <div class="seccion__cabeza">
        <h2 class="seccion__titulo"><span class="ico">${c.icono}</span> ${esc(c.nombre)}</h2>
        ${c.nota ? `<p class="seccion__nota">${esc(c.nota)}</p>` : ""}
      </div>`;
    if (c.id === "desayunos") {
      html += `<div class="precio-unico">Todos a <b>${fmt(c.items[0].precio)}</b></div>`;
    }
    html += grid(c.items, c);
    if (c.sub) {
      html += `<h3 class="seccion__sub">${esc(c.sub.nombre)}</h3>` + grid(c.sub.items, c, c.items.length);
    }
    if (c.id === "cocktails" && M.promo) {
      html += `<div class="banner" role="note">
        <div class="banner__x">2<b>x</b></div>
        <p class="banner__etq">¡PROMO!</p>
        <p class="banner__t">Margarita<br>Fusión</p>
        <p class="banner__p">${fmt(M.promo.precio)}</p>
      </div>`;
    }
    html += `<nav class="siguiente">
      ${prev ? `<button data-ir="${prev.id}"><small>← Anterior</small><span>${prev.icono} ${esc(prev.nombre)}</span></button>` : "<i></i>"}
      ${next ? `<button data-ir="${next.id}"><small>Siguiente →</small><span>${next.icono} ${esc(next.nombre)}</span></button>` : ""}
    </nav></section>`;
    panel.innerHTML = html;
  }

  function ir(id, desdeClick) {
    const c = cats.find((x) => x.id === id) || cats[0];
    if (actual === c && desdeClick) return;
    actual = c;
    cerrarBusqueda(false);
    document.querySelectorAll(".tab").forEach((t) => t.setAttribute("aria-selected", String(t.dataset.id === c.id)));
    const t = $(`#tab-${c.id}`);
    tabs.scrollTo({ left: t.offsetLeft - tabs.clientWidth / 2 + t.offsetWidth / 2, behavior: "smooth" });
    render(c);
    if (location.hash !== "#" + c.id) history.replaceState(null, "", "#" + c.id);
    if (desdeClick) {
      const top = inicioCarta();
      if (Math.abs(scrollY - top) > 5) scrollTo({ top, behavior: Math.abs(scrollY - top) > 2500 ? "auto" : "smooth" });
      const r = t.getBoundingClientRect();
      confeti(r.left + r.width / 2, r.bottom, 40, c.color);
    }
  }

  panel.addEventListener("click", (e) => {
    const nav = e.target.closest("[data-ir]");
    if (nav) return ir(nav.dataset.ir, true);
    const p = e.target.closest(".plato");
    if (p) abrir(porId[p.dataset.id], p.style.getPropertyValue("--c"));
  });

  /* ---------- Búsqueda ---------- */
  const norm = (s) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
  const buscador = $("#buscador"), q = $("#q");
  $("#btnBuscar").addEventListener("click", () => {
    buscador.hidden = !buscador.hidden;
    if (!buscador.hidden) { q.focus(); scrollTo({ top: inicioCarta(), behavior: "smooth" }); }
    else cerrarBusqueda(true);
  });
  $("#cerrarBuscar").addEventListener("click", () => cerrarBusqueda(true));
  function cerrarBusqueda(rerender) {
    if (buscador.hidden && !q.value) return;
    buscador.hidden = true;
    const had = q.value;
    q.value = "";
    if (rerender && had && actual) render(actual);
  }
  q.addEventListener("input", () => {
    const t = norm(q.value.trim());
    if (!t) return actual && render(actual);
    const res = todos.filter((p) => norm(p.nombre + " " + p.desc + " " + p.cat.nombre).includes(t));
    document.querySelectorAll(".tab").forEach((x) => x.setAttribute("aria-selected", "false"));
    panel.innerHTML = `<section class="seccion" style="--acento:#ffd400">
      <div class="seccion__cabeza"><h2 class="seccion__titulo"><span class="ico">🔎</span> ${res.length} resultado${res.length === 1 ? "" : "s"}</h2></div>
      ${res.length ? `<div class="grid">${res.map((p, i) => tarjeta(p, i, p.cat.color)).join("")}</div>` : `<p class="vacio">No encontramos “${esc(q.value)}” en la carta.</p>`}
    </section>`;
  });

  /* ---------- Modal ---------- */
  const modal = $("#modal");
  function abrir(p, color) {
    if (!p) return;
    modal.style.setProperty("--mc", color || p.cat.color);
    const img = $("#mImg");
    img.hidden = !p.img;
    if (p.img) { img.src = p.img; img.alt = p.nombre; } else img.removeAttribute("src");
    $("#mFoto").classList.toggle("modal__foto--vacia", !p.img);
    $("#mIco").textContent = p.img ? "" : p.cat.icono;
    $("#mCat").textContent = p.cat.icono + " " + p.cat.nombre;
    $("#mNombre").textContent = p.nombre;
    const ing = (p.desc || "").split(/,\s*|\s+y\s+/).map((s) => s.trim()).filter(Boolean);
    $("#mIngWrap").hidden = !ing.length;
    $("#mIng").innerHTML = ing.map((s) => `<li>${esc(s.charAt(0).toUpperCase() + s.slice(1))}</li>`).join("");
    $("#mPrecio").textContent = fmt(p.precio);
    const cr = p.credito;
    $("#mCred").innerHTML = cr ? `Foto de referencia: <a href="${esc(cr.page)}" target="_blank" rel="noopener">${esc(cr.artist || "Wikimedia Commons")}</a>${cr.license ? " · " + esc(cr.license) : ""}` : "";
    modal.showModal();
  }
  document.querySelectorAll("dialog").forEach((d) => {
    d.addEventListener("click", (e) => { if (e.target === d || e.target.closest("[data-close]")) d.close(); });
  });

  $("#btnCreditos").addEventListener("click", () => {
    const vistos = new Set();
    $("#listaCreditos").innerHTML = todos.filter((p) => p.credito && !vistos.has(p.credito.file) && vistos.add(p.credito.file))
      .map((p) => `<li>${esc(p.nombre)}: <a href="${esc(p.credito.page)}" target="_blank" rel="noopener">${esc(p.credito.file.replace(/^File:/, ""))}</a> — ${esc(p.credito.artist || "autor desconocido")} (${esc(p.credito.license || "ver licencia")})</li>`).join("");
    $("#modalCreditos").showModal();
  });

  $("#notaFinal").textContent = M.notaFinal;

  /* ---------- Confeti ---------- */
  const cv = $("#confeti"), cx = cv.getContext("2d");
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  let piezas = [], anim = null;
  const tam = () => { cv.width = innerWidth * devicePixelRatio; cv.height = innerHeight * devicePixelRatio; };
  tam(); addEventListener("resize", tam);
  function confeti(x, y, n, color) {
    if (reduce) return;
    const d = devicePixelRatio;
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2, v = 3 + Math.random() * 7;
      piezas.push({
        x: x * d, y: y * d, vx: Math.cos(a) * v * d, vy: (Math.sin(a) * v - 5) * d,
        w: (6 + Math.random() * 7) * d, h: (4 + Math.random() * 5) * d, rot: Math.random() * 6, vr: (Math.random() - .5) * .4,
        c: Math.random() < .35 && color ? color : bcol[(Math.random() * bcol.length) | 0], vida: 90 + Math.random() * 50,
      });
    }
    if (!anim) anim = requestAnimationFrame(paso);
  }
  function paso() {
    cx.clearRect(0, 0, cv.width, cv.height);
    piezas = piezas.filter((p) => p.vida-- > 0 && p.y < cv.height + 40);
    for (const p of piezas) {
      p.vy += .25 * devicePixelRatio; p.vx *= .985; p.x += p.vx; p.y += p.vy; p.rot += p.vr;
      cx.save(); cx.translate(p.x, p.y); cx.rotate(p.rot); cx.globalAlpha = Math.min(1, p.vida / 30);
      cx.fillStyle = p.c; cx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h * Math.abs(Math.cos(p.rot * 2)));
      cx.restore();
    }
    anim = piezas.length ? requestAnimationFrame(paso) : (cx.clearRect(0, 0, cv.width, cv.height), null);
  }
  $(".hero__logo").addEventListener("click", (e) => confeti(e.clientX, e.clientY, 90));

  /* ---------- Inicio ---------- */
  ir(location.hash.slice(1), false);
  addEventListener("hashchange", () => ir(location.hash.slice(1), true));
  addEventListener("load", () => {
    setTimeout(() => { confeti(innerWidth * .2, innerHeight * .25, 60); confeti(innerWidth * .8, innerHeight * .25, 60); }, 350);
  });
})();
