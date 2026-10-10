/* "Others" tab: research, interests and the rest, seen through switchable lenses. */
(() => {
  "use strict";

  const D = window.PORTFOLIO;
  const O = D.others;
  const LENSES = D.lenses;
  const lab = document.getElementById("lab");
  if (!lab || !O || !LENSES) return;

  const $ = (s, el = document) => el.querySelector(s);
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const list = (items) => `<ul>${items.map((x) => `<li>${esc(x)}</li>`).join("")}</ul>`;
  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- cards ---------- */
  const card = (key, title, body) =>
    `<article class="lab-card" data-card="${key}"><p class="lab-cap mono" data-cap="${key}"></p><h3>${title}</h3>${body}</article>`;

  const h = O.hypothesis;
  const t = O.teaching;
  $("#labGrid").innerHTML = [
    card("research", "Research vision &amp; hypothesis", `
      <p class="lab-kicker mono">Core research hypothesis · H₁</p>
      <blockquote class="lab-quote">“${esc(h.statement)}”</blockquote>
      <p class="lab-status mono"><i></i>Status: open question · being explored</p>
      <div class="lab-more">
        <p class="lab-text">${esc(h.context)}</p>
        <div class="lab-cols">
          <div><h4 class="mono">Key research questions</h4>${list(h.questions)}</div>
          <div><h4 class="mono">Innovation focus</h4>${list(h.focus)}</div>
        </div>
      </div>`),
    card("teaching", "Teaching impact", `
      <div class="lab-stats">${t.stats.map(([v, l]) => `<div><b>${esc(v)}</b><small>${esc(l)}</small></div>`).join("")}</div>
      <div class="lab-more">
        <h4 class="mono">Course levels</h4>
        <ol class="lab-levels">${t.courses.map((c, i) => `<li><span class="mono">L${i + 1}</span>${esc(c)}</li>`).join("")}</ol>
        <div class="lab-chips">${t.tags.map((x) => `<span class="lab-chip">${esc(x)}</span>`).join("")}</div>
      </div>`),
    card("interests", "Hobbies &amp; activities", `
      <div class="lab-chips">${O.hobbies.map((x) => `<span class="lab-chip"><i aria-hidden="true">${x.glyph}</i>${esc(x.name)}</span>`).join("")}</div>
      <p class="lab-text lab-more">${esc(O.hobbiesNote)}</p>`),
    card("languages", "Languages", `
      <div class="lab-langs">${O.languages.map((l) => `
        <div class="lab-lang">
          <span>${esc(l.name)}</span><small class="mono">${esc(l.level)}</small>
          <span class="lang-meter" role="img" aria-label="${esc(l.name)}: ${esc(l.level)}"><i style="--v:${l.value / 100}"></i></span>
        </div>`).join("")}</div>`),
    card("aspirations", "Future aspirations", `
      <div class="lab-aims">${O.aspirations.map((a) => `<span>${esc(a)}</span>`).join("")}</div>
      <p class="lab-text lab-more">${esc(O.aspirationsNote)}</p>`),
    card("traits", "How I work", `
      <div class="lab-chips">${O.traits.map((x) => `<span class="lab-chip">${esc(x)}</span>`).join("")}</div>`),
  ].join("");

  /* ---------- lens switcher ---------- */
  const lensWrap = $("#labLenses");
  lensWrap.innerHTML = Object.entries(LENSES)
    .map(([id, l]) => `<button type="button" data-lens="${id}" aria-pressed="false"><i aria-hidden="true">${l.glyph}</i>${esc(l.label)}</button>`)
    .join("");

  const panel = (p) => `<div><span>${esc(p[0])}</span><b>${esc(p[1])}</b></div><div><span>${esc(p[2])}</span><b>${esc(p[3])}</b></div>`;
  let lens = null;
  let accent = "#fff";

  function setLens(id, animate) {
    if (!LENSES[id]) id = "quantum";
    lens = id;
    const L = LENSES[id];
    lab.dataset.lens = id;
    lensWrap.querySelectorAll("button").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.lens === id)));
    lab.querySelectorAll("[data-cap]").forEach((el) => (el.textContent = L.caps[el.dataset.cap] || ""));
    $("#labPanelL").innerHTML = panel(L.panels[0]);
    $("#labPanelR").innerHTML = panel(L.panels[1]);
    $("#labState").textContent = L.state;
    $("#labFoot").textContent = L.foot;
    if (animate) {
      lab.classList.remove("flash");
      void lab.offsetWidth;
      lab.classList.add("flash");
    }
    try { localStorage.setItem("lab-lens", id); } catch (e) {}
    scene = scenes[id];
    paintStill();
    paintLive(now());
  }

  lensWrap.addEventListener("click", (e) => {
    const b = e.target.closest("button[data-lens]");
    if (b && b.dataset.lens !== lens) setLens(b.dataset.lens, true);
  });

  lab.querySelector(".lab-views").addEventListener("click", (e) => {
    const b = e.target.closest("button[data-view]");
    if (!b) return;
    lab.dataset.view = b.dataset.view;
    lab.querySelectorAll(".lab-views button").forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
  });

  /* ---------- background: a still layer (drawn once) + a live strip behind the read-outs ---------- */
  const still = $("#labCanvas");
  const live = $("#labLive");
  const sctx = still.getContext("2d");
  const lctx = live.getContext("2d");
  const hud = $(".lab-hud");
  let W = 0;
  let H = 0;
  let liveH = 0;
  let bandY = 0;
  let bandH = 0;
  let scene = null;

  const seeded = (seed) => () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let x = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    x = (x + Math.imul(x ^ (x >>> 7), 61 | x)) ^ x;
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
  const alpha = (hex, a) => {
    const n = parseInt(hex.replace("#", ""), 16);
    return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`;
  };
  const dot = (c, x, y, r) => { c.beginPath(); c.arc(x, y, r, 0, 6.283); c.fill(); };
  const line = (c, x1, y1, x2, y2) => { c.beginPath(); c.moveTo(x1, y1); c.lineTo(x2, y2); c.stroke(); };

  function backdrop(c, id, rnd) {
    const L = LENSES[id];
    c.save();
    c.font = `italic ${Math.min(W, H) * 0.42}px "Instrument Serif", Georgia, serif`;
    c.textAlign = "right";
    c.textBaseline = "bottom";
    c.fillStyle = alpha(accent, 0.07);
    c.fillText(L.mark, W - 20, H + Math.min(W, H) * 0.06);
    c.restore();
    c.textAlign = "left";
    c.fillStyle = alpha(accent, 0.16);
    (L.equations || []).forEach((text) => {
      for (let k = 0; k < 2; k++) {
        c.font = `${12 + rnd() * 6}px "JetBrains Mono", monospace`;
        c.fillText(text, rnd() * W * 0.85, liveH + 30 + rnd() * (H - liveH - 40));
      }
    });
  }

  const scenes = {
    quantum: {
      still(c, rnd) {
        const pts = Array.from({ length: 46 }, () => [rnd() * W, rnd() * H]);
        c.lineWidth = 1;
        pts.forEach((p, i) => pts.slice(i + 1).forEach((q) => {
          const d = Math.hypot(p[0] - q[0], p[1] - q[1]);
          if (d < 160) { c.strokeStyle = alpha(accent, 0.14 * (1 - d / 160)); line(c, p[0], p[1], q[0], q[1]); }
        }));
        c.fillStyle = alpha(accent, 0.5);
        pts.forEach((p) => dot(c, p[0], p[1], 1.8));
      },
      live(c, time) {
        // qubits in superposition: each dot is in |0⟩ and |1⟩ at once, weighted by |α|² and |β|²
        const d = bandH * 0.3;
        for (let k = 0; k < 8; k++) {
          const x = W * (0.22 + k * 0.026);
          const p = Math.cos(time * (0.7 + k * 0.13) + k) ** 2;
          c.strokeStyle = alpha(accent, 0.15);
          c.lineWidth = 1;
          line(c, x, bandY - d, x, bandY + d);
          c.fillStyle = alpha(accent, 0.15 + 0.85 * p); dot(c, x, bandY - d, 3.2);
          c.fillStyle = alpha(accent, 0.15 + 0.85 * (1 - p)); dot(c, x, bandY + d, 3.2);
        }
        c.font = '11px "JetBrains Mono", monospace'; c.textAlign = "right"; c.fillStyle = alpha(accent, 0.6);
        c.fillText("|0⟩", W * 0.21, bandY - d + 4); c.fillText("|1⟩", W * 0.21, bandY + d + 4);
        // Bloch sphere
        const r = Math.min(bandH * 0.36, 56);
        const cx = W * 0.7;
        const cy = bandY;
        c.strokeStyle = alpha(accent, 0.35);
        c.beginPath(); c.arc(cx, cy, r, 0, 6.283); c.stroke();
        c.strokeStyle = alpha(accent, 0.2);
        c.beginPath(); c.ellipse(cx, cy, r, r * 0.3, 0, 0, 6.283); c.stroke();
        c.beginPath(); c.ellipse(cx, cy, Math.abs(Math.cos(time * 0.6)) * r, r, 0, 0, 6.283); c.stroke();
        const th = 0.9 + Math.sin(time * 0.7) * 0.6;
        const ph = time * 0.8;
        const sx = cx + r * Math.sin(th) * Math.cos(ph);
        const sy = cy - r * Math.cos(th) + r * 0.3 * Math.sin(th) * Math.sin(ph);
        c.strokeStyle = accent; c.lineWidth = 2;
        line(c, cx, cy, sx, sy);
        c.fillStyle = accent; dot(c, sx, sy, 4);
        c.textAlign = "center"; c.fillStyle = alpha(accent, 0.7);
        c.fillText("|0⟩", cx, cy - r - 6); c.fillText("|1⟩", cx, cy + r + 14);
      },
    },
    ai: {
      still(c) {
        const layers = [5, 8, 9, 8, 4];
        const top = liveH + 20;
        const pos = (li, k, n) => [W * (0.06 + (0.88 * li) / (layers.length - 1)), top + ((H - top - 20) * (k + 0.5)) / n];
        c.lineWidth = 1;
        c.strokeStyle = alpha(accent, 0.06);
        layers.forEach((n, li) => li < layers.length - 1 && [...Array(n)].forEach((_, a) =>
          [...Array(layers[li + 1])].forEach((_, b) => line(c, ...pos(li, a, n), ...pos(li + 1, b, layers[li + 1])))));
        layers.forEach((n, li) => [...Array(n)].forEach((_, k) => {
          const [x, y] = pos(li, k, n);
          c.fillStyle = alpha(accent, 0.25); dot(c, x, y, 5);
          c.strokeStyle = alpha(accent, 0.4); c.beginPath(); c.arc(x, y, 5, 0, 6.283); c.stroke();
        }));
      },
      live(c, time) {
        const layers = [3, 5, 5, 2];
        const pos = (li, k, n) => [W * (0.61 + (0.21 * li) / (layers.length - 1)), bandY + bandH * 0.76 * ((k + 0.5) / n - 0.5)];
        const edges = [];
        layers.forEach((n, li) => li < layers.length - 1 && [...Array(n)].forEach((_, a) =>
          [...Array(layers[li + 1])].forEach((_, b) => edges.push([pos(li, a, n), pos(li + 1, b, layers[li + 1])]))));
        c.lineWidth = 1;
        c.strokeStyle = alpha(accent, 0.14);
        edges.forEach(([p, q]) => line(c, p[0], p[1], q[0], q[1]));
        for (let i = 0; i < 14; i++) {
          const run = time * (0.5 + (i % 5) * 0.08) + i * 7.3;
          const [p, q] = edges[Math.floor(seeded(Math.floor(run) * 97 + i)() * edges.length)];
          const f = run % 1;
          c.fillStyle = accent; dot(c, p[0] + (q[0] - p[0]) * f, p[1] + (q[1] - p[1]) * f, 2.4);
        }
        layers.forEach((n, li) => [...Array(n)].forEach((_, k) => {
          const [x, y] = pos(li, k, n);
          c.fillStyle = alpha(accent, 0.3 + 0.4 * Math.abs(Math.sin(time * 1.1 + li * 2 + k)));
          dot(c, x, y, 5);
        }));
        c.font = '11px "JetBrains Mono", monospace'; c.textAlign = "left"; c.fillStyle = alpha(accent, 0.6);
        c.fillText(`epoch ${Math.floor(time * 3) % 1000}  loss ${(0.001 + 0.05 / (1 + (time % 20))).toFixed(3)}`, W * 0.2, bandY + 4);
      },
    },
    math: {
      still(c) {
        c.lineWidth = 1;
        c.strokeStyle = alpha(accent, 0.05);
        for (let x = 0; x < W; x += 32) line(c, x, 0, x, H);
        for (let y = 0; y < H; y += 32) line(c, 0, y, W, y);
      },
      live(c, time) {
        const mid = bandY;
        c.lineWidth = 1;
        c.strokeStyle = alpha(accent, 0.16);
        line(c, 0, mid, W, mid);
        // rotating circles drawing a Fourier square wave
        const R = bandH * 0.24;
        const cx = W * 0.3;
        const terms = 1 + 2 * (Math.floor(time / 2.5) % 5);
        let px = cx;
        let py = mid;
        for (let k = 1; k <= terms; k += 2) {
          const r = (R * 4) / (Math.PI * k);
          c.strokeStyle = alpha(accent, 0.18);
          c.beginPath(); c.arc(px, py, r, 0, 6.283); c.stroke();
          px += r * Math.cos(k * time * 1.2);
          py -= r * Math.sin(k * time * 1.2);
        }
        c.fillStyle = accent; dot(c, px, py, 3);
        const x0 = cx + R * 2.2;
        c.strokeStyle = alpha(accent, 0.3);
        line(c, px, py, x0, py);
        c.strokeStyle = alpha(accent, 0.75); c.lineWidth = 1.6;
        c.beginPath();
        for (let x = x0; x < W * 0.83; x += 3) {
          const s = (x - x0) * 0.02;
          let y = 0;
          for (let k = 1; k <= terms; k += 2) y += ((R * 4) / (Math.PI * k)) * Math.sin(k * (time * 1.2 - s));
          x === x0 ? c.moveTo(x, mid - y) : c.lineTo(x, mid - y);
        }
        c.stroke();
        c.font = '12px "JetBrains Mono", monospace'; c.textAlign = "left"; c.fillStyle = alpha(accent, 0.6);
        c.fillText(`f(t) = Σ (4/πk) sin(kt),  k ≤ ${terms}`, x0, mid + bandH * 0.44);
      },
    },
    physics: {
      still(c) {
        c.lineWidth = 1;
        [[W * 0.18, H], [W * 0.38, H]].forEach(([sx, sy]) => {
          for (let k = 1; k < 9; k++) {
            const r = k * 46;
            c.strokeStyle = alpha(accent, 0.2 * (1 - r / 420));
            c.beginPath(); c.arc(sx, sy, r, Math.PI, 2 * Math.PI); c.stroke();
          }
        });
      },
      live(c, time) {
        const cx = W * 0.7;
        const cy = bandY;
        const base = Math.min(W * 0.12, 130);
        const g = c.createRadialGradient(cx, cy, 0, cx, cy, 26);
        g.addColorStop(0, alpha(accent, 0.95)); g.addColorStop(1, alpha(accent, 0));
        c.fillStyle = g; dot(c, cx, cy, 26);
        c.lineWidth = 1;
        [0.42, 0.7, 1].forEach((f, i) => {
          const rx = base * f;
          const ry = Math.min(rx * 0.3, bandH * 0.4);
          c.strokeStyle = alpha(accent, 0.18);
          c.beginPath(); c.ellipse(cx, cy, rx, ry, -0.25, 0, 6.283); c.stroke();
          const a = (time * 0.9) / (i + 1) + i * 2.1;
          const x = Math.cos(a) * rx;
          const y = Math.sin(a) * ry;
          c.fillStyle = accent;
          dot(c, cx + x * Math.cos(-0.25) - y * Math.sin(-0.25), cy + x * Math.sin(-0.25) + y * Math.cos(-0.25), 3 + i);
        });
        // pendulum
        const px = W * 0.32;
        const top = bandY - bandH * 0.42;
        const len = bandH * 0.7;
        const ang = Math.sin(time * 2.2) * 0.55;
        const bx = px + Math.sin(ang) * len;
        const by = top + Math.cos(ang) * len;
        c.strokeStyle = alpha(accent, 0.45);
        line(c, px - 20, top, px + 20, top);
        line(c, px, top, bx, by);
        c.fillStyle = alpha(accent, 0.85); dot(c, bx, by, 7);
      },
    },
    glass: {
      still(c, rnd) {
        ["#a5b4fc", "#f9a8d4", "#fde68a", "#99f6e4", "#c4b5fd"].forEach((col) => {
          const x = rnd() * W;
          const y = rnd() * H;
          const r = (0.28 + rnd() * 0.18) * Math.max(W, H) * 0.6;
          const g = c.createRadialGradient(x, y, 0, x, y, r);
          g.addColorStop(0, alpha(col, 0.75)); g.addColorStop(1, alpha(col, 0));
          c.fillStyle = g; dot(c, x, y, r);
        });
      },
      live(c, time) {
        // a prism splitting white light
        const s = bandH * 0.38;
        const cx = W * 0.7;
        const cy = bandY + s * 0.15;
        const hit = [cx - s * 0.45, cy - s * 0.2];
        const out = [cx + s * 0.4, cy - s * 0.1];
        c.lineWidth = 2;
        c.strokeStyle = "rgba(79, 70, 229, 0.7)";
        c.beginPath(); c.moveTo(cx - s * 3.2, cy + s * 0.3); c.lineTo(...hit); c.lineTo(...out); c.stroke();
        ["#ef4444", "#f97316", "#eab308", "#22c55e", "#3b82f6", "#8b5cf6"].forEach((col, i) => {
          const a = -0.05 + i * 0.07 + Math.sin(time * 0.8) * 0.02;
          c.strokeStyle = alpha(col, 0.8);
          line(c, out[0], out[1], out[0] + Math.cos(a) * s * 3, out[1] + Math.sin(a) * s * 3);
        });
        c.fillStyle = "rgba(255, 255, 255, 0.55)";
        c.strokeStyle = "rgba(79, 70, 229, 0.55)";
        c.lineWidth = 1.5;
        c.beginPath(); c.moveTo(cx, cy - s); c.lineTo(cx - s * 0.9, cy + s * 0.6); c.lineTo(cx + s * 0.9, cy + s * 0.6); c.closePath(); c.fill(); c.stroke();
        for (let k = 0; k < 6; k++) {
          const tw = Math.sin(time * 1.6 + k * 1.7);
          if (tw <= 0) continue;
          c.fillStyle = `rgba(99, 102, 241, ${0.6 * tw})`;
          dot(c, W * (0.24 + k * 0.035), bandY + Math.sin(k * 2.3) * bandH * 0.3, 1.5 + tw * 2);
        }
      },
    },
  };

  function paintStill() {
    if (!W || !scene) return;
    accent = getComputedStyle(lab).getPropertyValue("--lab-acc").trim() || "#fff";
    sctx.clearRect(0, 0, W, H);
    const rnd = seeded(lens.length * 7919 + 13);
    backdrop(sctx, lens, rnd);
    scene.still(sctx, rnd);
  }
  function paintLive(time) {
    if (!W || !scene) return;
    lctx.clearRect(0, 0, W, liveH);
    scene.live(lctx, time);
  }
  const now = () => (reduceMotion ? 2 : performance.now() / 1000);

  function size(cv, c, w, h, dpr) {
    cv.width = Math.round(w * dpr);
    cv.height = Math.round(h * dpr);
    c.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  function resize() {
    const r = lab.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    W = r.width;
    H = r.height;
    bandH = hud.offsetHeight;
    bandY = hud.offsetTop + bandH / 2;
    liveH = Math.ceil(hud.offsetTop + bandH + 8);
    live.style.height = `${liveH}px`;
    size(still, sctx, W, H, dpr);
    size(live, lctx, W, liveH, dpr);
    paintStill();
    paintLive(now());
  }

  /* ---------- live strip runs only while visible, at ~30 fps ---------- */
  let running = false;
  let visible = false;
  let raf = 0;
  let lastDraw = 0;
  function loop(t) {
    raf = 0;
    if (!running) return;
    if (t - lastDraw >= 33) {
      lastDraw = t;
      paintLive(t / 1000);
    }
    raf = requestAnimationFrame(loop);
  }
  function updateRunning() {
    const should = visible && !reduceMotion && document.visibilityState === "visible";
    if (should === running) return;
    running = should;
    if (running && !raf) raf = requestAnimationFrame(loop);
  }
  new IntersectionObserver((entries) => {
    visible = entries[0].isIntersecting;
    updateRunning();
  }, { rootMargin: "60px 0px" }).observe(lab);
  document.addEventListener("visibilitychange", updateRunning);
  // canvases are sized and painted only once the section gets close, keeping page load light
  const arm = new IntersectionObserver((entries) => {
    if (!entries[0].isIntersecting) return;
    arm.disconnect();
    new ResizeObserver(resize).observe(lab);
  }, { rootMargin: "800px 0px" });
  arm.observe(lab);

  let saved = null;
  try { saved = localStorage.getItem("lab-lens"); } catch (e) {}
  setLens(saved || "quantum", false);
  if (document.fonts) document.fonts.ready.then(paintStill);
})();
