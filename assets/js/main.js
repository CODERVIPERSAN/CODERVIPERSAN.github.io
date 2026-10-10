(() => {
  "use strict";

  const D = window.PORTFOLIO;
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const mobileQuery = matchMedia("(max-width: 820px)");
  const isMobile = () => mobileQuery.matches;

  const FAMILY_COLORS = {
    lang: "#272b55",
    genai: "#4b4e6d",
    ml: "#8f817a",
    data: "#c4b3ae",
    tools: "#e9dcc0",
    core: "transparent",
  };
  const maskStyle = (name, color) => {
    const u = `url('assets/icons/${name}.svg')`;
    return `-webkit-mask-image:${u};mask-image:${u};--c:${color}`;
  };
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

  $("#year").textContent = new Date().getFullYear();
  $$(".hero-bgword span").forEach((s, i) => s.style.setProperty("--i", i));

  /* ---------- split headings into words ---------- */
  $$("[data-split]").forEach((el) => {
    let i = 0;
    const walk = (node) => {
      [...node.childNodes].forEach((child) => {
        if (child.nodeType === 3) {
          const frag = document.createDocumentFragment();
          child.textContent.split(/(\s+)/).forEach((part) => {
            if (!part) return;
            if (/^\s+$/.test(part)) return frag.append(part);
            const w = document.createElement("span");
            w.className = "word";
            w.style.setProperty("--i", i++);
            w.textContent = part;
            frag.append(w);
          });
          child.replaceWith(frag);
        } else if (child.nodeType === 1) {
          walk(child);
        }
      });
    };
    walk(el);
  });

  /* ---------- skills: periodic table ---------- */
  const ptable = $("#ptable");
  const chipsWrap = $("#familyChips");
  $("#elementCount").textContent = D.elements.length;

  D.families.forEach((f) => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "chip";
    b.dataset.f = f.id;
    b.style.setProperty("--fam", FAMILY_COLORS[f.id] === "transparent" ? "#fff" : FAMILY_COLORS[f.id]);
    b.innerHTML = `<i></i>${esc(f.label)}`;
    chipsWrap.append(b);
  });

  D.elements.forEach((el, i) => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "el";
    b.dataset.f = el.f;
    b.dataset.i = i;
    b.style.setProperty("--i", i);
    b.style.setProperty("--fam", FAMILY_COLORS[el.f]);
    b.setAttribute("aria-label", el.name);
    b.innerHTML = `<small>${String(i + 1).padStart(2, "0")}</small><b>${esc(el.s)}</b><span>${esc(el.name)}</span>`;
    ptable.append(b);
  });

  const pvLogo = $("#pvLogo");
  const pvName = $("#pvName");
  const pvMeta = $("#pvMeta");
  if (matchMedia("(hover: none) and (pointer: coarse)").matches) {
    pvName.textContent = "Tap any element";
    const intro = $("#elementCount")?.parentElement;
    if (intro) intro.lastChild.textContent = intro.lastChild.textContent.replace("Hover a tile", "Tap a tile");
  }
  const familyLabel = Object.fromEntries(D.families.map((f) => [f.id, f.label]));
  let lastShown = -1;

  function showElement(i) {
    if (i === lastShown) return;
    lastShown = i;
    const el = D.elements[i];
    if (el.icon) {
      pvLogo.innerHTML = `<div class="mask" style="${maskStyle(el.icon, el.color)}"></div>`;
    } else {
      const empty = el.f === "core";
      const fg = ["data", "tools"].includes(el.f) ? "#2c2d42" : "#fff";
      pvLogo.innerHTML = `<div class="glyph${empty ? " empty" : ""}" style="--fam:${FAMILY_COLORS[el.f]};--fg:${fg}">${esc(el.s)}</div>`;
    }
    pvLogo.classList.remove("pop");
    void pvLogo.offsetWidth;
    pvLogo.classList.add("pop");
    pvName.textContent = el.name;
    pvMeta.textContent = `No. ${String(i + 1).padStart(2, "0")} · ${familyLabel[el.f]}`;
  }

  ptable.addEventListener("pointerover", (e) => {
    const t = e.target.closest(".el");
    if (t) showElement(+t.dataset.i);
  });
  ptable.addEventListener("focusin", (e) => {
    const t = e.target.closest(".el");
    if (t) showElement(+t.dataset.i);
  });

  chipsWrap.addEventListener("click", (e) => {
    const chip = e.target.closest(".chip");
    if (!chip) return;
    const f = chip.dataset.f;
    const same = ptable.dataset.filter === f;
    $$(".chip", chipsWrap).forEach((c) => c.classList.toggle("active", !same && c === chip));
    if (same) {
      delete ptable.dataset.filter;
    } else {
      ptable.dataset.filter = f;
    }
    $$(".el", ptable).forEach((t) => t.classList.toggle("on", !same && t.dataset.f === f));
  });

  /* ---------- work: accordion ---------- */
  const visuals = {
    clusters(p) {
      const colors = ["#272b55", "#8f817a", "#c4b3ae", "#6f72a8"];
      const centers = [[28, 32], [68, 28], [40, 70], [74, 66]];
      let dots = "";
      for (let k = 0; k < 64; k++) {
        const c = k % 4;
        const [cx, cy] = centers[c];
        const r = 12 * Math.sqrt(Math.random());
        const a = Math.random() * Math.PI * 2;
        dots += `<i style="left:${cx + r * Math.cos(a)}%;top:${cy + r * Math.sin(a)}%;--c:${colors[c]};--dx:${(Math.random() * 10 - 5).toFixed(1)}px;--dy:${(Math.random() * 10 - 5).toFixed(1)}px;--dl:-${(Math.random() * 6).toFixed(1)}s"></i>`;
      }
      return `<div class="v-clusters">${dots}</div>
        <div class="v-card" style="position:absolute;left:22px;top:22px;padding:12px 14px">
          <div class="v-label">Incidents · 58K</div>
          <div style="font-size:12px;font-weight:600;margin-top:4px">13 new clusters</div>
        </div>
        <div class="v-ring" style="--p:${p.metric.value}"><span><small>${p.metric.label.toUpperCase()}</small>${p.metric.value}</span></div>`;
    },
    scatter() {
      const blobs = [[18, 20, 34], [52, 12, 30], [30, 52, 38], [62, 50, 32]];
      const colors = ["#272b55", "#8f817a", "#6f72a8", "#c4b3ae"];
      let html = "";
      blobs.forEach(([x, y, s], b) => {
        html += `<div class="blob" style="left:${x}%;top:${y}%;width:${s}%;height:${s * 0.9}%"></div>`;
        for (let k = 0; k < 16; k++) {
          const r = (s / 2.6) * Math.sqrt(Math.random());
          const a = Math.random() * Math.PI * 2;
          html += `<i style="position:absolute;width:7px;height:7px;border-radius:50%;background:${colors[b]};left:${x + s / 2 + r * Math.cos(a)}%;top:${y + s * 0.45 + r * Math.sin(a) * 0.9}%"></i>`;
        }
      });
      return `<div class="v-scatter">${html}</div>
        <div class="v-card" style="position:absolute;right:20px;bottom:20px;padding:10px 14px"><div class="v-label">Segments</div><div style="font-weight:700;font-size:20px">4</div></div>`;
    },
    dots() {
      let html = "";
      for (let y = 0; y < 12; y++) {
        for (let x = 0; x < 16; x++) {
          const d = Math.hypot(x - 7.5, (y - 5.5) * 1.2);
          const v = clamp(1 - d / 8 + Math.sin(x * 0.9) * 0.15, 0.08, 1);
          html += `<i style="--s:${(0.35 + v * 0.65).toFixed(2)};--o:${(0.15 + v * 0.85).toFixed(2)}"></i>`;
        }
      }
      return `<div class="v-dots">${html}</div>`;
    },
    paper() {
      const qs = [["Q1", "Easy", "#4fc08d"], ["Q2", "Medium", "#e0a33b"], ["Q3", "Hard", "#d4574a"], ["Q4", "Medium", "#e0a33b"]];
      return `<div class="v-card v-paper">
        <div class="v-label">Mid-term · Mathematics</div>
        <div class="row" style="width:70%"></div>
        ${qs.map(([q, t, c]) => `<div class="q"><b>${q}</b><div class="row" style="flex:1;margin:0"></div><span class="tag" style="--t:${c}">${t}</span></div>`).join("")}
      </div>`;
    },
    parking() {
      const states = ["taken", "", "taken", "free", "taken", "", "", "taken", "free", "taken", "taken", ""];
      return `<div><div class="v-label" style="margin-bottom:12px">Level 1 · live slots</div><div class="v-parking">${states
        .map((s, i) => `<i class="${s}">${s === "taken" ? "■" : `A${i + 1}`}</i>`)
        .join("")}</div></div>`;
    },
    quadrant() {
      return `<div class="v-quadrant">
        <div style="--a:.95">Stars<small>high growth · high share</small></div>
        <div style="--a:.55">Question marks<small>high growth · low share</small></div>
        <div style="--a:.3;--qc:#22243f">Cash cows<small>low growth · high share</small></div>
        <div style="--a:.12;--qc:#22243f">Dogs<small>low growth · low share</small></div>
      </div>`;
    },
    gantt() {
      const rows = [["Team A", "0%", "60%"], ["Team B", "20%", "50%"], ["Team C", "10%", "70%", 0.55], ["Team D", "45%", "40%"], ["Team E", "5%", "35%", 0.35]];
      return `<div class="v-card v-gantt" style="padding:18px 20px"><div class="v-label">Allocation · Q3</div>${rows
        .map(([n, x, w, o]) => `<div class="g"><b>${n}</b><span style="--x:${x};--w:${w};--o:${o || 1}"></span></div>`)
        .join("")}</div>`;
    },
  };

  const stackIcons = Object.fromEntries(
    D.elements.filter((e) => e.icon).map((e) => [e.name.toLowerCase(), e])
  );
  const stackChip = (name) => {
    const el = stackIcons[name.toLowerCase()];
    const icon = el ? `<i class="mask" style="${maskStyle(el.icon, el.color)}"></i>` : "";
    return `<span>${icon}${esc(name)}</span>`;
  };

  const accordion = $("#accordion");
  D.projects.forEach((p, i) => {
    const n = String(i + 1).padStart(2, "0");
    const panel = document.createElement("article");
    panel.className = "panel" + (i === 0 ? " active" : "");
    panel.tabIndex = 0;
    panel.setAttribute("aria-label", p.title);
    panel.innerHTML = `
      <div class="panel-tab"><small>${n}</small><b>${esc(p.title)}</b><i>+</i></div>
      <div class="panel-body">
        <div class="pb-copy">
          <div class="pb-tags"><span>${n}</span><span>${esc(p.tags)}</span></div>
          <h3>${esc(p.title)}${p.subtitle ? `<em>${esc(p.subtitle)}</em>` : ""}</h3>
          <p>${esc(p.desc)}</p>
          <ul class="pb-points">${p.points.map((x) => `<li>${esc(x)}</li>`).join("")}</ul>
          <div class="pb-stack">${p.stack.map(stackChip).join("")}</div>
          <a class="btn btn-dark" href="${esc(p.link)}" target="_blank" rel="noopener">View on GitHub <span class="arr">↗</span></a>
        </div>
        <div class="pb-visual">${visuals[p.visual] ? visuals[p.visual](p) : ""}</div>
      </div>`;
    accordion.append(panel);
  });

  const panels = $$(".panel", accordion);
  let hoverTarget = null;
  let hoverTimer = 0;
  accordion.addEventListener("pointerleave", () => { hoverTarget = null; clearTimeout(hoverTimer); });
  const openPanel = (panel) => {
    if (panel.classList.contains("active")) return;
    panels.forEach((x) => x.classList.toggle("active", x === panel));
  };
  panels.forEach((panel) => {
    // pointermove (not mouseenter) so panels sliding under a still cursor don't steal the hover
    panel.addEventListener("pointermove", (e) => {
      if (e.pointerType !== "mouse" || isMobile() || hoverTarget === panel) return;
      hoverTarget = panel;
      clearTimeout(hoverTimer);
      hoverTimer = setTimeout(() => openPanel(hoverTarget), 120);
    });
    panel.addEventListener("click", () => openPanel(panel));
    panel.addEventListener("focus", () => openPanel(panel));
  });

  /* ---------- certifications ---------- */
  const certList = $("#certList");
  D.certifications.forEach((c, i) => {
    const li = document.createElement("li");
    li.className = "cert";
    li.setAttribute("data-reveal", "");
    li.style.setProperty("--d", `${i * 80}ms`);
    li.innerHTML = `<small>${String(i + 1).padStart(2, "0")}</small><div><h3>${esc(c.title)}</h3><p>${esc(c.issuer)}</p></div><i>↗</i>`;
    certList.append(li);
  });

  /* ---------- timeline ---------- */
  const timeline = $("#timeline");
  const tlHTML = (t) => {
    const isExp = t.kind === "experience";
    return `
      <div class="tl-year">${esc(t.year)}</div>
      <div class="tl-card">
        <span class="kind${isExp ? " exp" : ""}">${isExp ? "Experience" : "Education"}</span>
        <h3>${esc(t.title)}</h3>
        <p class="org">${esc(t.org)}</p>
        <div class="meta">
          ${t.score ? `<span class="score">Grade <b>${esc(t.score)}</b></span>` : ""}
          ${t.badge ? `<span class="badge">★ ${esc(t.badge)}</span>` : ""}
          <span class="muted">${esc(t.meta)}</span>
        </div>
        ${t.points ? `<ul>${t.points.map((x) => `<li>${esc(x)}</li>`).join("")}</ul>` : ""}
        ${t.chips ? `<div class="chips">${t.chips.map((x) => `<span>${esc(x)}</span>`).join("")}</div>` : ""}
      </div>`;
  };
  D.timeline.forEach((t) => {
    const item = document.createElement("div");
    item.className = "tl-item";
    item.innerHTML = tlHTML(t);
    timeline.append(item);
  });
  const next = document.createElement("div");
  next.className = "tl-item tl-next";
  next.innerHTML = `
    <div class="tl-year">Next</div>
    <div class="tl-card">
      <span class="kind exp">Open to work</span>
      <h3>Your team?</h3>
      <p class="org">GenAI, knowledge graphs, data science.</p>
      <div class="meta"><a class="btn btn-dark" href="#contact">Let's talk <span class="arr">→</span></a></div>
    </div>`;
  timeline.append(next);

  /* ---------- achievements ---------- */
  const track = $("#achTrack");
  D.achievements.forEach((a) => {
    const card = document.createElement("div");
    if (a.quote) {
      card.className = "ach-card quote-card";
      card.innerHTML = `<p>“${esc(a.quote)}”</p><div class="who">${esc(a.who)}<small>${esc(a.role)}</small></div>`;
    } else {
      card.className = "ach-card";
      const icon = a.icon
        ? `<div class="mask" style="${maskStyle(a.icon, a.color)}"></div>`
        : esc(a.glyph || "★");
      const start = a.plain ? a.value : 0;
      card.innerHTML = `
        <div class="ach-icon">${icon}</div>
        <div class="ach-num"><span class="pre">${esc(a.prefix || "")}</span><span class="count" data-to="${a.value}" data-dec="${a.decimals || 0}">${start}</span><span class="sfx">${esc(a.suffix || "")}</span></div>
        <h3>${esc(a.title)}</h3>
        <p class="sub">${esc(a.sub)}</p>`;
      if (a.plain) card.querySelector(".count").removeAttribute("data-to");
    }
    track.append(card);
  });

  const animateCount = (el) => {
    const to = parseFloat(el.dataset.to);
    const dec = +el.dataset.dec;
    if (reduceMotion) return (el.textContent = to.toFixed(dec));
    const t0 = performance.now();
    const dur = 1600;
    const step = (now) => {
      const p = clamp((now - t0) / dur, 0, 1);
      const e = 1 - Math.pow(1 - p, 4);
      el.textContent = (to * e).toFixed(dec);
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };

  /* ---------- barcode ---------- */
  (() => {
    const bc = $("#barcode");
    let x = 0;
    let stops = [];
    let seed = 7;
    const rnd = () => ((seed = (seed * 9301 + 49297) % 233280) / 233280);
    while (x < 100) {
      const w = 0.6 + rnd() * 2.2;
      const gap = 0.5 + rnd() * 1.6;
      stops.push(`#22243f ${x.toFixed(2)}%`, `#22243f ${(x + w).toFixed(2)}%`, `transparent ${(x + w).toFixed(2)}%`, `transparent ${(x + w + gap).toFixed(2)}%`);
      x += w + gap;
    }
    bc.style.background = `linear-gradient(90deg, ${stops.join(",")})`;
  })();

  /* ---------- reveal on scroll ---------- */
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        const t = e.target;
        t.classList.add("in");
        if (t.classList.contains("ach-card")) {
          const c = t.querySelector(".count[data-to]");
          if (c) animateCount(c);
        }
        io.unobserve(t);
      });
    },
    { threshold: 0.18, rootMargin: "0px 0px -8% 0px" }
  );
  $$("[data-split], [data-reveal], .tl-item, .ach-card").forEach((el) => io.observe(el));
  new IntersectionObserver(
    (entries, obs) => entries.forEach((e) => e.isIntersecting && (ptable.classList.add("in"), obs.disconnect())),
    { threshold: 0.15 }
  ).observe(ptable);

  /* ---------- nav: scroll spy + sliding pill ---------- */
  const topbar = $("#topbar");
  const nav = $("#pillNav");
  const indicator = $(".pill-indicator", nav);
  const navLinks = $$("a", nav);
  const sections = navLinks.map((a) => document.getElementById(a.dataset.section));
  let activeId = null;

  function moveIndicator(link) {
    if (!link) {
      indicator.style.opacity = 0;
      return;
    }
    indicator.style.opacity = 1;
    indicator.style.width = `${link.offsetWidth}px`;
    indicator.style.transform = `translateX(${link.offsetLeft}px)`;
    if (isMobile()) link.scrollIntoView({ block: "nearest", inline: "center", behavior: "smooth" });
  }

  function updateSpy() {
    const mid = innerHeight * 0.45;
    let current = null;
    sections.forEach((s) => {
      const r = s.getBoundingClientRect();
      if (r.top <= mid && r.bottom > mid) current = s.id;
    });
    if (current === activeId) return;
    activeId = current;
    navLinks.forEach((a) => a.classList.toggle("active", a.dataset.section === current));
    moveIndicator(navLinks.find((a) => a.dataset.section === current));
  }

  /* ---------- hero: optional intro video ---------- */
  /* ---------- hero: talking intro (video with sound, or browser voice) ---------- */
  const heroFigure = $("#heroFigure");
  const heroCaption = $("#heroCaption");
  const introTriggers = $$("[data-intro]");
  const synth = "speechSynthesis" in window ? window.speechSynthesis : null;
  const { video: videoSrc, captions: captionsSrc, dance: danceSrc, poster: posterSrc } = heroFigure.dataset;
  let video = null;
  let videoReady = false;
  let dance = null;
  let danceReady = false;
  let live = null;
  let captionTrack = null;
  let playing = false;
  let introRun = 0;
  let autoMuted = false; // the browser refused sound, so the intro is playing muted with captions

  const setCaption = (text) => {
    heroCaption.textContent = text || "";
    heroCaption.classList.toggle("show", !!text);
  };

  function setPlaying(on) {
    playing = on;
    heroFigure.classList.toggle("speaking", on && !videoReady);
    const label = !on ? "Hear my intro" : autoMuted ? "Tap for sound" : "Stop intro";
    introTriggers.forEach((b) => {
      b.classList.toggle("playing", on);
      b.setAttribute("aria-label", !on ? "Play my intro" : autoMuted ? "Turn on sound" : "Stop intro");
      const el = b.querySelector(".intro-label");
      if (el) el.textContent = label;
    });
    if (!on) setCaption("");
  }

  const showTriggers = () => introTriggers.forEach((b) => (b.hidden = false));

  // The videos are packed: colour on the left half, alpha on the right. WebGL recombines them so the
  // avatar stands on the page with no box. While the hero is on screen the dance video loops silently;
  // the intro button plays the intro from the start with sound, then the dance resumes.
  const heroPic = heroFigure.querySelector(".hero-pic");
  const ambient = !reduceMotion;
  let gl = null;
  let canvas = null;
  let glTried = false;
  let fallback = false;
  let heroVisible = true;
  let renderId = 0;

  function setupGL() {
    glTried = true;
    canvas = document.createElement("canvas");
    canvas.className = "hero-img hero-live";
    canvas.hidden = true;
    // software-emulated WebGL would cost a full CPU core per frame; those devices get the plain video
    gl = canvas.getContext("webgl", { premultipliedAlpha: true, antialias: false, failIfMajorPerformanceCaveat: true });
    const info = gl && gl.getExtension("WEBGL_debug_renderer_info");
    if (info && /swiftshader|llvmpipe|softpipe|software|basic render/i.test(gl.getParameter(info.UNMASKED_RENDERER_WEBGL))) gl = null;
    if (!gl) return false;
    const shader = (type, src) => {
      const s = gl.createShader(type);
      gl.shaderSource(s, src);
      gl.compileShader(s);
      return s;
    };
    const prog = gl.createProgram();
    gl.attachShader(prog, shader(gl.VERTEX_SHADER,
      "attribute vec2 p;varying vec2 uv;void main(){uv=vec2(p.x+1.,1.-p.y)*.5;gl_Position=vec4(p,0.,1.);}"));
    gl.attachShader(prog, shader(gl.FRAGMENT_SHADER,
      // the colour half is composited over cream (244,240,228); subtracting that back out gives premultiplied colour
      "precision mediump float;uniform sampler2D t;varying vec2 uv;const vec3 K=vec3(.957,.941,.894);void main(){" +
      "vec3 c=texture2D(t,vec2(uv.x*.5,uv.y)).rgb;float a=smoothstep(.03,.97,texture2D(t,vec2(.5+uv.x*.5,uv.y)).g);" +
      "gl_FragColor=vec4(max(c-K*(1.-a),0.)*step(.001,a),a);}"));
    gl.linkProgram(prog);
    gl.useProgram(prog);
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, "p");
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    gl.bindTexture(gl.TEXTURE_2D, gl.createTexture());
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    canvas.width = live.videoWidth / 2;
    canvas.height = live.videoHeight;
    gl.viewport(0, 0, canvas.width, canvas.height);
    heroFigure.prepend(canvas);
    return true;
  }

  // No WebGL, or the browser won't share the frames (e.g. the page opened as a file): show the colour half as is.
  function useFallback() {
    gl = null;
    canvas?.remove();
    canvas = null;
    fallback = true;
    showLive();
  }
  function showLive() {
    if (!fallback) return;
    [video, dance].forEach((v) => {
      if (!v) return;
      v.className = v === live ? "hero-img hero-fallback" : "hero-src";
      v.hidden = false;
    });
    if (heroPic) heroPic.style.visibility = "hidden";
  }
  function goLive(v) {
    live = v;
    if (glTried) return showLive();
    // the canvas is sized from the video, so wait for its metadata (see makeVideo)
    if (v.readyState < 1) return;
    if (!setupGL()) useFallback();
  }

  function drawVideoFrame() {
    if (live.readyState < 2) return;
    try {
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, live);
    } catch (e) {
      useFallback();
      return;
    }
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    if (canvas.hidden) {
      canvas.hidden = false;
      if (heroPic) heroPic.style.visibility = "hidden";
    }
  }
  function startRender() {
    const id = ++renderId;
    const v = live;
    const step = () => {
      if (id !== renderId || !gl || v !== live || v.paused) return;
      drawVideoFrame();
      if (v.requestVideoFrameCallback) v.requestVideoFrameCallback(step);
      else requestAnimationFrame(step);
    };
    step();
  }

  function playIntroVideo() {
    dance?.pause();
    goLive(video);
    video.muted = false;
    video.loop = false;
    return video.play();
  }
  function startAmbient() {
    const v = dance || video;
    if (!v || !(dance ? danceReady : videoReady) || !ambient || playing || !heroVisible || document.hidden) return;
    if (document.documentElement.classList.contains("gated")) return;
    goLive(v);
    v.muted = true;
    v.loop = true;
    v.play().catch(() => {});
  }
  function pauseAmbient() {
    if (!playing) (dance || video)?.pause();
  }
  function showPoster() {
    if (canvas) canvas.hidden = true;
    if (!gl) [video, dance].forEach((v) => v && (v.hidden = true));
    if (heroPic) heroPic.style.visibility = "";
  }

  function makeVideo(src, preload) {
    const v = document.createElement("video");
    Object.assign(v, { muted: true, playsInline: true, preload });
    v.setAttribute("muted", "");
    v.setAttribute("playsinline", "");
    v.setAttribute("aria-hidden", "true");
    v.className = "hero-src";
    v.addEventListener("loadedmetadata", () => v === live && !glTried && goLive(v));
    v.addEventListener("playing", () => gl && v === live && startRender());
    return v;
  }

  function loadVideo() {
    if (video) return;
    video = makeVideo(videoSrc, "auto");
    if (danceSrc) {
      dance = makeVideo(danceSrc, "metadata");
      dance.src = danceSrc;
      dance.addEventListener("loadeddata", () => {
        if (danceReady) return;
        danceReady = true;
        video.preload = "auto";
        startAmbient();
      });
      heroFigure.append(dance);
    }
    if (captionsSrc) {
      const track = document.createElement("track");
      Object.assign(track, { kind: "captions", src: captionsSrc, srclang: "en", label: "English" });
      video.append(track);
      captionTrack = track.track;
      captionTrack.mode = "hidden";
      captionTrack.addEventListener("cuechange", () => {
        if (video.paused) return;
        const cue = captionTrack.activeCues && captionTrack.activeCues[0];
        setCaption(cue ? cue.text : "");
      });
    }
    video.src = videoSrc;
    video.addEventListener("loadeddata", () => {
      if (videoReady) return;
      videoReady = true;
      showTriggers();
      if (dance) dance.preload = "auto";
      else startAmbient();
    });
    video.addEventListener("ended", () => playing && stopIntro());
    heroFigure.append(video);
  }
  if (videoSrc) {
    showTriggers();
    const idle = window.requestIdleCallback || ((fn) => setTimeout(fn, 1500));
    // the poster is the same pose, so the videos can wait until first paint is out of the way
    // (pressing Enter on the welcome screen loads them straight away if they haven't started yet)
    const later = () => setTimeout(() => idle(loadVideo, { timeout: 2000 }), 1200);
    if (document.readyState === "complete") later();
    else addEventListener("load", later, { once: true });
    new IntersectionObserver((entries) => {
      heroVisible = entries[0].isIntersecting;
      heroVisible ? startAmbient() : pauseAmbient();
    }).observe(heroFigure);
    document.addEventListener("visibilitychange", () => (document.hidden ? pauseAmbient() : startAmbient()));
  } else if (synth) showTriggers();

  let voices = [];
  const loadVoices = () => (voices = synth.getVoices());
  if (synth) {
    loadVoices();
    synth.addEventListener?.("voiceschanged", loadVoices);
  }

  function pickVoice() {
    const english = voices.filter((v) => /^en/i.test(v.lang));
    const prefs = D.introVoices || [];
    let best = null;
    let bestScore = -1;
    english.forEach((v) => {
      let score = 0;
      const rank = prefs.findIndex((p) => v.name.toLowerCase().includes(p.toLowerCase()));
      if (rank >= 0) score += 20 - rank;
      if (/en[-_]IN/i.test(v.lang)) score += 6;
      if (/natural|neural|online/i.test(v.name)) score += 4;
      if (score > bestScore) (best = v), (bestScore = score);
    });
    return best;
  }

  function startIntro() {
    const run = ++introRun;
    if (videoSrc) {
      setPlaying(true);
      loadVideo();
      // play() is called right here, inside the click, even if the video is still loading: Safari only
      // allows sound when play() comes straight from a user gesture
      video.pause();
      video.currentTime = 0;
      setCaption("");
      playIntroVideo().catch((e) => {
        if (run !== introRun) return;
        if (!e || e.name !== "NotAllowedError") return stopIntro();
        // no sound allowed: play it muted with captions; the next click or key press turns the sound on
        autoMuted = true;
        video.muted = true;
        setPlaying(true);
        video.play().catch(() => run === introRun && stopIntro());
      });
      return;
    }
    if (!synth) return;
    synth.cancel();
    const voice = pickVoice();
    const lines = D.intro || [];
    let started = false;
    setTimeout(() => !started && run === introRun && stopIntro(), 2500);
    lines.forEach((line, i) => {
      const u = new SpeechSynthesisUtterance(line);
      if (voice) u.voice = voice;
      u.lang = voice ? voice.lang : "en-IN";
      u.rate = 1;
      u.onstart = () => run === introRun && ((started = true), setCaption(line));
      if (i === lines.length - 1) u.onend = u.onerror = () => run === introRun && setPlaying(false);
      synth.speak(u);
    });
    setPlaying(true);
  }

  function unmuteIntro(e) {
    if (!autoMuted || (e && e.target.closest && e.target.closest("[data-intro]"))) return;
    autoMuted = false;
    if (playing && !video.paused) {
      video.muted = false;
      // without a real user activation the browser pauses instead of unmuting; go back to muted
      setTimeout(() => {
        if (playing && video.paused && !video.ended) {
          autoMuted = true;
          video.muted = true;
          video.play().catch(() => {});
          setPlaying(true);
        }
      }, 60);
    }
    setPlaying(playing);
  }
  addEventListener("pointerup", unmuteIntro, true);
  addEventListener("keydown", unmuteIntro, true);

  function stopIntro() {
    introRun++;
    autoMuted = false;
    if (synth) synth.cancel();
    setPlaying(false);
    if (video) {
      video.pause();
      video.muted = true;
      video.currentTime = 0;
      if (dance) dance.currentTime = 0;
      if (ambient) startAmbient();
      else showPoster();
    }
  }

  introTriggers.forEach((b) => b.addEventListener("click", () => (!playing ? startIntro() : autoMuted ? unmuteIntro() : stopIntro())));

  /* ---------- welcome gate: every visit opens here; Enter starts the intro with sound ---------- */
  const gate = $("#gate");
  if (gate) {
    // a refresh starts from the top so the intro is seen; deep links (#work etc.) keep their place
    if (!location.hash && "scrollRestoration" in history) {
      history.scrollRestoration = "manual";
      scrollTo(0, 0);
    }
    const enter = gate.querySelector("[data-enter]");
    enter.focus({ preventScroll: true });
    enter.addEventListener("click", () => {
      document.documentElement.classList.remove("gated");
      gate.classList.add("leaving");
      setTimeout(() => gate.remove(), 800);
      if ((videoSrc || synth) && heroVisible) startIntro();
    }, { once: true });
  }
  addEventListener("pagehide", () => synth && synth.cancel());

  /* ---------- render loop: only runs while something is moving ---------- */
  let ticking = false;
  let scrollDirty = true;
  const requestTick = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(frame);
  };

  /* ---------- hero parallax ---------- */
  const heroSection = $("#home");
  const bgWord = $(".hero-bgword");
  const heroCopy = $(".hero-copy");
  const heroCta = $(".hero-cta");
  let mouseX = 0;
  let mouseY = 0;
  let smX = 0;
  let smY = 0;
  let heroKey = "";
  addEventListener("pointermove", (e) => {
    if (e.pointerType !== "mouse" || scrollY > innerHeight * 1.2) return;
    mouseX = e.clientX / innerWidth - 0.5;
    mouseY = e.clientY / innerHeight - 0.5;
    requestTick();
  }, { passive: true });

  function updateHero(y) {
    const limit = innerHeight * 1.2;
    let settling = false;
    if (y < limit) {
      smX += (mouseX - smX) * 0.06;
      smY += (mouseY - smY) * 0.06;
      settling = Math.abs(mouseX - smX) + Math.abs(mouseY - smY) > 0.001;
      if (!settling) (smX = mouseX), (smY = mouseY);
    }
    const yy = Math.min(y, limit);
    const key = `${yy}|${smX}|${smY}`;
    if (key === heroKey) return settling;
    heroKey = key;
    bgWord.style.transform = `translate3d(${(smX * -24).toFixed(2)}px, ${(yy * 0.35).toFixed(1)}px, 0)`;
    heroFigure.style.translate = `${(smX * 18).toFixed(2)}px ${(yy * -0.12 + smY * 8).toFixed(2)}px`;
    heroCopy.style.transform = `translate3d(0, ${(yy * -0.25).toFixed(1)}px, 0)`;
    heroCopy.style.opacity = clamp(1 - (yy / innerHeight) * 1.4, 0, 1).toFixed(3);
    heroCta.style.transform = `translate3d(0, ${(yy * -0.4).toFixed(1)}px, 0)`;
    return settling;
  }

  /* ---------- lanyard physics ---------- */
  const lanyard = $("#lanyard");
  const idCard = $("#idCard");
  const stage = $("#lanyardStage");
  const L = {
    angle: 0.5, vel: 0, flip: 0, flipVel: 0, flipTarget: 0, drop: -420, dropVel: 0,
    dragging: false, dropped: false, lastScroll: scrollY,
  };

  new IntersectionObserver(
    (entries, obs) => {
      if (entries[0].isIntersecting) {
        L.dropped = true;
        obs.disconnect();
        requestTick();
      }
    },
    { threshold: 0.25 }
  ).observe(stage);

  let dragStart = null;
  idCard.addEventListener("pointerdown", (e) => {
    L.dragging = true;
    idCard.setPointerCapture(e.pointerId);
    dragStart = { x: e.clientX, y: e.clientY, t: performance.now(), a: L.angle };
    requestTick();
  });
  idCard.addEventListener("pointermove", (e) => {
    if (!L.dragging) return;
    const r = lanyard.getBoundingClientRect();
    const pivotX = r.left + r.width / 2;
    const pivotY = stage.getBoundingClientRect().top;
    const target = Math.atan2(-(e.clientX - pivotX), Math.max(60, e.clientY - pivotY));
    const prev = L.angle;
    L.angle = clamp(target, -1.1, 1.1);
    L.vel = (L.angle - prev) * 0.9;
    L.flipVel += (e.movementX || 0) * 0.002;
    requestTick();
  });
  const endDrag = () => {
    L.dragging = false;
    requestTick();
  };
  const FLIP_BACK = 180 / 57;
  const toggleFlip = () => {
    L.flipTarget = L.flipTarget ? 0 : FLIP_BACK;
    L.flipVel += L.flipTarget ? 0.12 : -0.12;
    idCard.setAttribute("aria-pressed", String(!!L.flipTarget));
    requestTick();
  };
  idCard.addEventListener("pointerup", (e) => {
    endDrag();
    if (dragStart && Math.hypot(e.clientX - dragStart.x, e.clientY - dragStart.y) < 6 && performance.now() - dragStart.t < 400) toggleFlip();
    dragStart = null;
  });
  idCard.addEventListener("keydown", (e) => {
    if (e.key !== "Enter" && e.key !== " ") return;
    e.preventDefault();
    toggleFlip();
  });
  idCard.addEventListener("pointercancel", endDrag);
  idCard.addEventListener("mouseenter", () => {
    if (L.dragging) return;
    L.vel += 0.012;
    L.flipVel += 0.02;
    requestTick();
  });

  let cardFlipped = false;
  function stepLanyard(dt, sy) {
    const k = dt / 16.67;
    if (L.dropped) {
      L.dropVel += (0 - L.drop) * 0.06 * k;
      L.dropVel *= Math.pow(0.78, k);
      L.drop += L.dropVel * k;
    }
    const ds = sy - L.lastScroll;
    L.lastScroll = sy;
    if (!L.dragging) {
      L.vel += clamp(ds, -60, 60) * 0.00035;
      L.vel += -L.angle * 0.012 * k;
      L.vel *= Math.pow(0.975, k);
      L.angle += L.vel * k;
    }
    L.flipVel += clamp(ds, -60, 60) * 0.0006 + L.vel * 0.06 - (L.flip - L.flipTarget) * 0.02 * k;
    L.flipVel *= Math.pow(0.93, k);
    L.flip += L.flipVel * k;
    L.angle = clamp(L.angle, -1.2, 1.2);

    const moving =
      L.dragging || ds !== 0 ||
      Math.abs(L.vel) > 2e-4 || Math.abs(L.angle) > 2e-3 ||
      Math.abs(L.flipVel) > 2e-4 || Math.abs(L.flip - L.flipTarget) > 2e-3 ||
      (L.dropped && (Math.abs(L.drop) > 0.3 || Math.abs(L.dropVel) > 0.05));
    if (!moving) {
      L.vel = L.flipVel = L.dropVel = 0;
      L.flip = L.flipTarget;
      if (L.dropped) L.drop = 0;
    }

    lanyard.style.transform = `translate3d(0, ${L.drop.toFixed(1)}px, 0) rotate(${L.angle.toFixed(4)}rad)`;
    const flipDeg = L.flip * 57;
    idCard.style.transform = `rotateY(${flipDeg.toFixed(2)}deg) rotateX(${(L.vel * -120).toFixed(2)}deg)`;
    const flipped = Math.cos((flipDeg * Math.PI) / 180) < 0;
    if (flipped !== cardFlipped) idCard.classList.toggle("flipped", (cardFlipped = flipped));
    idCard.style.setProperty("--shine", `${(-60 + L.flip * 300 + L.angle * 120).toFixed(1)}%`);
    return moving;
  }

  /* ---------- timeline progress ---------- */
  const tlProgress = $("#tlProgress");
  const updateTimeline = (r) => {
    const p = clamp((innerHeight * 0.55 - r.top) / r.height, 0, 1);
    tlProgress.style.transform = `scaleY(${p.toFixed(4)})`;
  };

  /* ---------- achievements: pinned horizontal scroll ---------- */
  const ach = $("#achievements");
  const achProgress = $("#achProgress");
  let achDistance = 0;
  function sizeAchievements() {
    if (isMobile()) {
      ach.style.height = "";
      track.style.transform = "";
      return;
    }
    achDistance = Math.max(0, track.scrollWidth - innerWidth);
    ach.style.height = `${innerHeight + achDistance}px`;
  }
  const updateAchievements = (r) => {
    const p = clamp(-r.top / Math.max(1, achDistance), 0, 1);
    track.style.transform = `translate3d(${(-p * achDistance).toFixed(1)}px, 0, 0)`;
    achProgress.style.transform = `scaleX(${p.toFixed(4)})`;
  };

  /* ---------- certifications: highlight row nearest the centre on touch screens ---------- */
  const certEls = $$(".cert", certList);
  const updateCerts = (rects) => {
    const mid = innerHeight * 0.5;
    let best = -1;
    let bestD = Infinity;
    rects.forEach((r, i) => {
      const d = Math.abs(r.top + r.height / 2 - mid);
      if (d < bestD) (bestD = d), (best = i);
    });
    certEls.forEach((c, i) => c.classList.toggle("lit", i === best && bestD < 140));
  };

  /* ---------- visibility: skip work and pause loops for off-screen sections ---------- */
  const inView = new Set();
  const watched = new Map([[heroSection, "hero"], [stage, "lanyard"], [timeline, "timeline"], [ach, "ach"], [certList, "certs"]]);
  const watcher = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      const key = watched.get(e.target);
      if (e.isIntersecting) inView.add(key);
      else inView.delete(key);
    });
    scrollDirty = true;
    requestTick();
  }, { rootMargin: "20% 0px" });
  watched.forEach((_, el) => watcher.observe(el));

  const pauser = new IntersectionObserver((entries) => {
    entries.forEach((e) => e.target.classList.toggle("offscreen", !e.isIntersecting));
  });
  $$("main > section, .footer").forEach((el) => pauser.observe(el));

  /* ---------- frame ---------- */
  let last = 0;
  function frame(now) {
    ticking = false;
    const dt = last ? Math.min(48, now - last) : 16.67;
    const y = scrollY;
    const mobile = isMobile();

    let tlRect, achRect, certRects;
    const scrolled = scrollDirty;
    if (scrolled) {
      scrollDirty = false;
      updateSpy();
      if (inView.has("timeline")) tlRect = timeline.getBoundingClientRect();
      if (inView.has("ach") && !mobile) achRect = ach.getBoundingClientRect();
      if (inView.has("certs") && mobile) certRects = certEls.map((c) => c.getBoundingClientRect());
      topbar.classList.toggle("scrolled", y > 40);
      if (tlRect) updateTimeline(tlRect);
      if (achRect) updateAchievements(achRect);
      if (certRects) updateCerts(certRects);
    }

    let moving = false;
    if (!reduceMotion) {
      if (inView.has("hero") || scrolled) moving = updateHero(y) || moving;
      if (inView.has("lanyard") && L.dropped) moving = stepLanyard(dt, y) || moving;
      else L.lastScroll = y;
    }
    last = moving ? now : 0;
    if (moving) requestTick();
  }

  if (reduceMotion) {
    L.drop = 0;
    L.angle = 0;
    lanyard.style.transform = "none";
  } else {
    lanyard.style.transform = `translate3d(0, ${L.drop}px, 0) rotate(${L.angle}rad)`;
  }

  addEventListener("scroll", () => {
    scrollDirty = true;
    requestTick();
  }, { passive: true });

  const refreshLayout = () => {
    sizeAchievements();
    const link = navLinks.find((a) => a.dataset.section === activeId);
    if (link) moveIndicator(link);
    scrollDirty = true;
    requestTick();
  };
  sizeAchievements();
  let resizeRaf = 0;
  addEventListener("resize", () => {
    cancelAnimationFrame(resizeRaf);
    resizeRaf = requestAnimationFrame(refreshLayout);
  });
  addEventListener("load", refreshLayout);
  document.fonts && document.fonts.ready.then(refreshLayout);
  requestTick();
})();
