/* "Games" tab: a Manim maths theatre plus five small games.
   Nothing here runs until the section is close to the viewport. */
(() => {
  const arcade = document.getElementById("arcade");
  if (!arcade) return;

  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const $ = (sel, root = document) => root.querySelector(sel);
  const el = (tag, cls, html) => {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html != null) n.innerHTML = html;
    return n;
  };
  const store = {
    get(k, d = 0) { try { const v = localStorage.getItem("arcade-" + k); return v == null ? d : JSON.parse(v); } catch { return d; } },
    set(k, v) { try { localStorage.setItem("arcade-" + k, JSON.stringify(v)); } catch {} },
  };
  const rand = (n) => Math.floor(Math.random() * n);
  const shuffle = (a) => { for (let i = a.length - 1; i > 0; i--) { const j = rand(i + 1); [a[i], a[j]] = [a[j], a[i]]; } return a; };

  /* ---------- theatre ---------- */
  const CHAPTERS = [
    { id: "linear-transform", title: "Linear transformations", note: "A matrix is simply where î and ĵ land. Every embedding, attention layer and graph projection I work with is built on this idea." },
    { id: "fourier-epicycles", title: "Fourier epicycles", note: "Forty-eight spinning circles, added tip to tip, draw a heart. Audio, images and signals all break down into rotations like these." },
    { id: "gradient-descent", title: "Gradient descent", note: "How every model I train actually learns: take a step downhill along −∇L. The zig-zag is why the learning rate η matters." },
    { id: "odd-squares", title: "A proof without words", note: "Odd numbers wrap around each other into squares, so 1 + 3 + 5 + ⋯ + (2n − 1) = n². No algebra needed." },
    { id: "bloch-sphere", title: "A qubit on the Bloch sphere", note: "A Hadamard gate tips |0⟩ onto the equator into superposition; a phase then spins it around. My research lives here." },
  ];

  function initTheatre() {
    const video = $("#theatreVideo");
    const list = $("#chapters");
    const title = $("#theatreTitle");
    const note = $("#theatreNote");
    const bar = $("#theatreBar");
    const toggle = $("#theatreToggle");
    if (!video || !list) return;
    let cur = 0, visible = false, userPaused = reduceMotion;

    CHAPTERS.forEach((c, i) => {
      const b = el("button", "chapter", `<span class="mono">${String(i + 1).padStart(2, "0")}</span>${c.title}`);
      b.type = "button";
      b.addEventListener("click", () => { userPaused = false; show(i); });
      list.appendChild(el("li")).appendChild(b);
    });

    const setToggle = () => {
      const paused = video.paused;
      toggle.classList.toggle("is-paused", paused);
      toggle.setAttribute("aria-label", paused ? "Play animation" : "Pause animation");
    };
    const sync = () => {
      if (visible && !userPaused && !document.hidden) video.play().catch(() => {});
      else video.pause();
    };
    function show(i) {
      cur = i;
      const c = CHAPTERS[i];
      video.poster = `assets/manim/${c.id}.webp`;
      video.src = `assets/manim/${c.id}.mp4`;
      title.textContent = c.title;
      note.textContent = c.note;
      bar.style.transform = "scaleX(0)";
      [...list.children].forEach((li, k) => li.firstChild.setAttribute("aria-current", k === i ? "true" : "false"));
      sync();
    }

    video.addEventListener("ended", () => show((cur + 1) % CHAPTERS.length));
    video.addEventListener("timeupdate", () => {
      if (video.duration) bar.style.transform = `scaleX(${video.currentTime / video.duration})`;
    });
    video.addEventListener("play", setToggle);
    video.addEventListener("pause", setToggle);
    toggle.addEventListener("click", () => {
      userPaused = !video.paused;
      if (userPaused) video.pause();
      else { visible = true; sync(); }
    });
    document.addEventListener("visibilitychange", sync);
    new IntersectionObserver(([e]) => { visible = e.intersectionRatio >= 0.35; sync(); }, { threshold: [0, 0.35] })
      .observe(video);
    video.preload = "metadata";
    show(0);
    setToggle();
  }

  /* ---------- shared game shell ---------- */
  const stage = $("#gameStage");
  const tabs = $("#arcadeTabs");

  function shell({ name, how, stats, hint, actions = [] }) {
    const root = el("div", "game");
    root.dataset.game = name;
    const board = el("div", "game-board");
    const overlay = el("div", "game-overlay");
    overlay.hidden = true;
    board.appendChild(overlay);
    const info = el("aside", "game-info");
    info.appendChild(el("h3", "game-title", name));
    info.appendChild(el("p", "game-how", how));
    const statsEl = el("div", "game-stats");
    const vals = {};
    stats.forEach((s) => {
      const box = el("div", "game-stat", `<small class="mono">${s}</small>`);
      vals[s] = box.appendChild(el("b", "", "0"));
      statsEl.appendChild(box);
    });
    info.appendChild(statsEl);
    const btns = el("div", "game-actions");
    const btnMap = {};
    actions.forEach((a, i) => {
      const b = el("button", "game-btn" + (i ? " ghost" : ""), a);
      b.type = "button";
      btnMap[a] = btns.appendChild(b);
    });
    info.appendChild(btns);
    if (hint) info.appendChild(el("p", "game-hint mono", hint));
    root.append(board, info);
    return {
      root, board, info, btn: btnMap,
      stat(k, v) { vals[k].textContent = v; },
      say(html, button, onClick) {
        overlay.innerHTML = `<div class="go-card">${html}</div>`;
        if (button) {
          const b = el("button", "game-btn", button);
          b.type = "button";
          b.addEventListener("click", (e) => { e.stopPropagation(); onClick(); stage.focus({ preventScroll: true }); });
          overlay.firstChild.appendChild(b);
        }
        overlay.hidden = false;
      },
      hush() { overlay.hidden = true; },
    };
  }

  function onSwipe(target, cb) {
    let sx = 0, sy = 0, id = null;
    target.addEventListener("pointerdown", (e) => { id = e.pointerId; sx = e.clientX; sy = e.clientY; });
    target.addEventListener("pointerup", (e) => {
      if (e.pointerId !== id) return;
      id = null;
      const dx = e.clientX - sx, dy = e.clientY - sy;
      if (Math.max(Math.abs(dx), Math.abs(dy)) < 24) return;
      cb(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? "right" : "left") : (dy > 0 ? "down" : "up"));
    });
  }
  const KEY_DIR = { ArrowLeft: "left", ArrowRight: "right", ArrowUp: "up", ArrowDown: "down", a: "left", d: "right", w: "up", s: "down", A: "left", D: "right", W: "up", S: "down" };

  /* ---------- 1. 2048 ---------- */
  function game2048() {
    const ui = shell({
      name: "2048",
      how: "Slide the tiles. Equal numbers merge into their sum. Reach 2048, or just beat your best.",
      stats: ["Score", "Best"],
      hint: "Arrow keys / WASD · swipe on touch",
      actions: ["New game", "Undo"],
    });
    const grid = el("div", "g2048");
    for (let i = 0; i < 16; i++) grid.appendChild(el("i"));
    ui.board.prepend(grid);
    let tiles = [], score = 0, best = store.get("2048-best"), won = false, prev = null, over = false, pending = null, timer = 0;

    const place = (t) => { t.el.style.setProperty("--r", t.r); t.el.style.setProperty("--c", t.c); };
    const paint = (t) => { t.el.textContent = t.v; t.el.dataset.v = t.v > 2048 ? "big" : t.v; };
    function addTile(v, r, c, pop = true) {
      const t = { v, r, c, el: el("span", "tile" + (pop ? " pop" : "")) };
      paint(t); place(t); grid.appendChild(t.el); tiles.push(t);
      return t;
    }
    function spawn() {
      const free = [];
      for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) if (!tiles.some((t) => t.r === r && t.c === c)) free.push([r, c]);
      if (!free.length) return;
      const [r, c] = free[rand(free.length)];
      addTile(Math.random() < 0.9 ? 2 : 4, r, c);
    }
    function setScore(s) {
      score = s;
      if (score > best) { best = score; store.set("2048-best", best); }
      ui.stat("Score", score); ui.stat("Best", best);
    }
    function reset(snapshot) {
      flush();
      tiles.forEach((t) => t.el.remove());
      tiles = [];
      ui.hush();
      over = false;
      if (snapshot) { snapshot.tiles.forEach(([v, r, c]) => addTile(v, r, c, false)); setScore(snapshot.score); won = snapshot.won; }
      else { prev = null; won = false; setScore(0); spawn(); spawn(); }
    }
    const canMove = () => {
      if (tiles.length < 16) return true;
      const at = (r, c) => tiles.find((t) => t.r === r && t.c === c)?.v;
      for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) if (at(r, c) === at(r, c + 1) || at(r, c) === at(r + 1, c)) return true;
      return false;
    };
    function move(dir) {
      flush();
      if (over) return;
      const snap = { tiles: tiles.map((t) => [t.v, t.r, t.c]), score, won };
      let moved = false, gained = 0;
      const merging = [];
      for (let i = 0; i < 4; i++) {
        const cells = [0, 1, 2, 3].map((k) => {
          if (dir === "left") return [i, k];
          if (dir === "right") return [i, 3 - k];
          if (dir === "up") return [k, i];
          return [3 - k, i];
        });
        const line = cells.map(([r, c]) => tiles.find((t) => t.r === r && t.c === c)).filter(Boolean);
        const out = [], eaten = [];
        line.forEach((t) => {
          const last = out[out.length - 1];
          if (last && !last.merged && last.v === t.v) {
            last.merged = true; last.v *= 2; gained += last.v;
            t.dead = last; eaten.push(t);
          } else out.push(t);
        });
        out.forEach((t, k) => {
          const [r, c] = cells[k];
          if (t.r !== r || t.c !== c) moved = true;
          t.r = r; t.c = c;
        });
        eaten.forEach((t) => { moved = true; t.r = t.dead.r; t.c = t.dead.c; merging.push(t); });
      }
      if (!moved) return;
      prev = snap;
      tiles.forEach(place);
      tiles = tiles.filter((t) => !t.dead);
      setScore(score + gained);
      pending = () => {
        pending = null;
        merging.forEach((t) => t.el.remove());
        tiles.forEach((t) => { if (t.merged) { t.merged = false; paint(t); t.el.classList.remove("merge"); void t.el.offsetWidth; t.el.classList.add("merge"); } });
        spawn();
        if (!won && tiles.some((t) => t.v >= 2048)) { won = true; ui.say("<b>2048!</b><span>You made it. Keep going?</span>", "Keep going", () => ui.hush()); }
        else if (!canMove()) { over = true; ui.say(`<b>No moves left</b><span>Score ${score}</span>`, "Try again", () => reset()); }
      };
      timer = setTimeout(pending, 115);
    }
    const flush = () => { if (pending) { clearTimeout(timer); pending(); } };
    ui.btn["New game"].addEventListener("click", () => reset());
    ui.btn["Undo"].addEventListener("click", () => { if (prev) { reset(prev); prev = null; } });
    onSwipe(ui.board, move);
    reset();
    return {
      root: ui.root,
      key(e) { const d = KEY_DIR[e.key]; if (d) { e.preventDefault(); move(d); } },
    };
  }

  /* ---------- 2. Snake ---------- */
  function gameSnake() {
    const ui = shell({
      name: "Snake",
      how: "Eat the yellow dots, grow longer, don't hit the walls or yourself. It speeds up as you grow.",
      stats: ["Score", "Best"],
      hint: "Arrow keys / WASD · swipe · Space to pause",
      actions: ["Restart"],
    });
    const N = 18;
    const canvas = el("canvas", "snake-canvas");
    ui.board.prepend(canvas);
    ui.board.classList.add("square");
    const ctx = canvas.getContext("2d");
    let size = 0, cell = 0, snake, dir, queue, food, score, best = store.get("snake-best"), running = false, dead = false, acc = 0, last = 0, raf = 0;
    const tick = () => Math.max(62, 125 - score * 2.5);
    const VEC = { left: [-1, 0], right: [1, 0], up: [0, -1], down: [0, 1] };

    function resize() {
      const w = Math.floor(ui.board.clientWidth);
      if (!w || w === size) return;
      size = w;
      const dpr = Math.min(2, devicePixelRatio || 1);
      canvas.width = canvas.height = Math.round(w * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      cell = w / N;
      draw();
    }
    function placeFood() {
      do food = [rand(N), rand(N)]; while (snake.some(([x, y]) => x === food[0] && y === food[1]));
    }
    function reset() {
      snake = [[6, 9], [5, 9], [4, 9]];
      dir = "right"; queue = []; score = 0; dead = false; running = false;
      placeFood();
      ui.stat("Score", 0); ui.stat("Best", best);
      ui.say("<b>Snake</b><span>Press an arrow key or swipe to start.</span>");
      draw();
    }
    function step() {
      if (queue.length) dir = queue.shift();
      const [vx, vy] = VEC[dir];
      const head = [snake[0][0] + vx, snake[0][1] + vy];
      const hitSelf = snake.some(([x, y], i) => i < snake.length - 1 && x === head[0] && y === head[1]);
      if (head[0] < 0 || head[1] < 0 || head[0] >= N || head[1] >= N || hitSelf) {
        dead = true; stop();
        if (score > best) { best = score; store.set("snake-best", best); ui.stat("Best", best); }
        ui.say(`<b>Game over</b><span>Score ${score}${score && score === best ? " · new best!" : ""}</span>`, "Play again", () => { reset(); start(); });
        return;
      }
      snake.unshift(head);
      if (head[0] === food[0] && head[1] === food[1]) { score++; ui.stat("Score", score); placeFood(); }
      else snake.pop();
    }
    function loop(now) {
      raf = 0;
      if (!running) return;
      acc += last ? Math.min(250, now - last) : 0;
      last = now;
      let stepped = false;
      while (acc >= tick() && running) { acc -= tick(); step(); stepped = true; }
      if (stepped) draw();
      if (running) raf = requestAnimationFrame(loop);
    }
    function start() {
      if (dead) return;
      ui.hush();
      if (running) return;
      running = true; last = 0; acc = 0;
      raf = raf || requestAnimationFrame(loop);
    }
    function stop() {
      running = false;
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
    }
    function pause() {
      if (!running) return;
      stop();
      ui.say("<b>Paused</b><span>Press an arrow key or tap to resume.</span>");
    }
    function turn(d) {
      const lastDir = queue.length ? queue[queue.length - 1] : dir;
      const [ax, ay] = VEC[lastDir], [bx, by] = VEC[d];
      if (ax + bx === 0 && ay + by === 0) { start(); return; }
      if (d !== lastDir && queue.length < 2) queue.push(d);
      start();
    }
    function draw() {
      if (!cell) return;
      ctx.clearRect(0, 0, size, size);
      ctx.fillStyle = "rgba(236,233,223,0.07)";
      for (let x = 0; x < N; x++) for (let y = 0; y < N; y++) ctx.fillRect((x + 0.5) * cell - 1, (y + 0.5) * cell - 1, 2, 2);
      const fx = (food[0] + 0.5) * cell, fy = (food[1] + 0.5) * cell;
      const g = ctx.createRadialGradient(fx, fy, 0, fx, fy, cell);
      g.addColorStop(0, "rgba(255,224,112,0.55)"); g.addColorStop(1, "rgba(255,224,112,0)");
      ctx.fillStyle = g; ctx.fillRect(fx - cell, fy - cell, cell * 2, cell * 2);
      ctx.fillStyle = "#FFE070";
      ctx.beginPath(); ctx.arc(fx, fy, cell * 0.3, 0, Math.PI * 2); ctx.fill();
      const n = snake.length;
      snake.forEach(([x, y], i) => {
        const k = i / Math.max(1, n - 1);
        ctx.fillStyle = `rgb(${Math.round(92 - 4 * k)},${Math.round(208 - 60 * k)},${Math.round(179 + 40 * k)})`;
        const p = i ? cell * 0.12 : cell * 0.06;
        ctx.beginPath();
        ctx.roundRect ? ctx.roundRect(x * cell + p, y * cell + p, cell - 2 * p, cell - 2 * p, cell * 0.28) : ctx.rect(x * cell + p, y * cell + p, cell - 2 * p, cell - 2 * p);
        ctx.fill();
      });
      const [hx, hy] = snake[0], [vx, vy] = VEC[dir];
      ctx.fillStyle = "#14162b";
      [-1, 1].forEach((s) => {
        ctx.beginPath();
        ctx.arc((hx + 0.5 + vx * 0.18 - vy * 0.2 * s) * cell, (hy + 0.5 + vy * 0.18 + vx * 0.2 * s) * cell, cell * 0.08, 0, Math.PI * 2);
        ctx.fill();
      });
    }
    ui.btn["Restart"].addEventListener("click", () => { stop(); reset(); });
    ui.board.addEventListener("click", () => { if (!running && !dead) start(); });
    onSwipe(ui.board, turn);
    const ro = new ResizeObserver(resize);
    reset();
    return {
      root: ui.root,
      activate() { ro.observe(ui.board); resize(); },
      deactivate() { pause(); ro.disconnect(); },
      pause,
      key(e) {
        if (e.key === " ") { e.preventDefault(); running ? pause() : start(); return; }
        const d = KEY_DIR[e.key];
        if (d) { e.preventDefault(); if (!dead) turn(d); }
      },
    };
  }

  /* ---------- 3. Quick Math ---------- */
  function gameQuickMath() {
    const ui = shell({
      name: "Quick Math",
      how: "60 seconds. Type the answer; it checks itself, no Enter needed. Questions get harder as your streak grows.",
      stats: ["Score", "Best", "Streak"],
      hint: "Enter skips a question (−2 s)",
      actions: ["Start"],
    });
    const wrap = el("div", "qm");
    const timer = el("span", "qm-time", "<i></i>");
    const q = el("p", "qm-q", "7 × 8");
    const input = el("input", "qm-input");
    Object.assign(input, { type: "text", inputMode: "numeric", autocomplete: "off", placeholder: "?", disabled: true });
    input.setAttribute("aria-label", "Your answer");
    input.setAttribute("enterkeyhint", "next");
    wrap.append(timer, q, input);
    ui.board.prepend(wrap);
    let answer = 0, score = 0, streak = 0, best = store.get("qm-best"), end = 0, raf = 0, running = false;
    ui.stat("Best", best);

    function next() {
      const lvl = Math.min(4, Math.floor(score / 5));
      const pick = (arr) => arr[rand(arr.length)];
      const r = (a, b) => a + rand(b - a + 1);
      const op = pick([["+", "−"], ["+", "−", "×"], ["+", "−", "×", "÷"], ["×", "÷", "+", "−"], ["×", "÷", "+", "−", "²"]][lvl]);
      let a, b, text;
      if (op === "+") { a = r(2, [9, 20, 50, 99, 199][lvl]); b = r(2, [9, 20, 50, 99, 199][lvl]); answer = a + b; text = `${a} + ${b}`; }
      else if (op === "−") { a = r(3, [12, 30, 60, 120, 250][lvl]); b = r(1, a); answer = a - b; text = `${a} − ${b}`; }
      else if (op === "×") { a = r(2, [5, 6, 9, 12, 15][lvl]); b = r(2, [5, 6, 9, 12, 19][lvl]); answer = a * b; text = `${a} × ${b}`; }
      else if (op === "÷") { b = r(2, lvl > 2 ? 12 : 9); answer = r(2, lvl > 2 ? 12 : 9); text = `${b * answer} ÷ ${b}`; }
      else { a = r(4, 19); answer = a * a; text = `${a}²`; }
      q.textContent = text;
      q.classList.remove("in"); void q.offsetWidth; q.classList.add("in");
      input.value = "";
    }
    function frame() {
      const left = Math.max(0, end - performance.now());
      timer.firstChild.style.transform = `scaleX(${left / 60000})`;
      timer.classList.toggle("low", left < 10000);
      if (left <= 0) return finish();
      raf = requestAnimationFrame(frame);
    }
    function start() {
      score = 0; streak = 0; running = true;
      ui.stat("Score", 0); ui.stat("Streak", 0); ui.hush();
      input.disabled = false;
      input.focus({ preventScroll: true });
      end = performance.now() + 60000;
      next();
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(frame);
    }
    function finish() {
      running = false;
      input.disabled = true;
      cancelAnimationFrame(raf);
      const isBest = score > best;
      if (isBest) { best = score; store.set("qm-best", best); ui.stat("Best", best); }
      ui.say(`<b>${score} correct</b><span>${isBest && score ? "New best!" : `Best ${best}`}</span>`, "Again", start);
    }
    input.addEventListener("input", () => {
      input.value = input.value.replace(/[^0-9]/g, "");
      if (!running || input.value === "") return;
      if (Number(input.value) === answer) {
        score++; streak++;
        if (streak % 5 === 0) end += 3000;
        ui.stat("Score", score); ui.stat("Streak", streak);
        wrap.classList.remove("ok"); void wrap.offsetWidth; wrap.classList.add("ok");
        next();
      } else if (input.value.length >= String(answer).length) {
        streak = 0; ui.stat("Streak", 0);
        wrap.classList.remove("bad"); void wrap.offsetWidth; wrap.classList.add("bad");
        setTimeout(() => { if (Number(input.value) !== answer) input.value = ""; }, 260);
      }
    });
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && running) { e.preventDefault(); streak = 0; ui.stat("Streak", 0); end -= 2000; next(); }
    });
    ui.btn["Start"].addEventListener("click", start);
    ui.say("<b>Quick Math</b><span>How many can you solve in a minute? Every 5 in a row adds 3 seconds.</span>", "Start", start);
    return {
      root: ui.root,
      deactivate() { if (running) finish(); },
    };
  }

  /* ---------- 4. Memory Match ---------- */
  const ICONS = ["python", "pytorch", "tensorflow", "pandas", "numpy", "scikitlearn", "jupyter", "neo4j", "langchain", "openai", "django", "flask", "mysql", "git", "github", "linux", "javascript", "vuedotjs", "qiskit", "opencv", "databricks", "microsoftazure", "tableau", "powerbi"];
  function gameMemory() {
    const ui = shell({
      name: "Memory Match",
      how: "Flip two cards at a time and find all eight pairs of tools from my stack, in as few moves as you can.",
      stats: ["Moves", "Pairs", "Best"],
      hint: "Click or tap the cards",
      actions: ["Shuffle"],
    });
    const grid = el("div", "mm");
    ui.board.prepend(grid);
    let first = null, lock = false, moves = 0, pairs = 0, best = store.get("mm-best", null), t0 = 0;
    ui.stat("Best", best ?? "–");

    function deal() {
      grid.innerHTML = "";
      first = null; lock = false; moves = 0; pairs = 0; t0 = 0;
      ui.stat("Moves", 0); ui.stat("Pairs", "0/8"); ui.hush();
      const picks = shuffle(ICONS.slice()).slice(0, 8);
      shuffle([...picks, ...picks]).forEach((name) => {
        const card = el("button", "mm-card", `<span class="mm-face mm-back" aria-hidden="true">∑</span><span class="mm-face mm-front"><img src="assets/icons/${name}.svg" alt="" width="40" height="40" decoding="async"></span>`);
        card.type = "button";
        card.dataset.name = name;
        card.setAttribute("aria-label", "Hidden card");
        grid.appendChild(card);
      });
    }
    grid.addEventListener("click", (e) => {
      const card = e.target.closest(".mm-card");
      if (!card || lock || card.classList.contains("up")) return;
      if (!t0) t0 = performance.now();
      card.classList.add("up");
      card.setAttribute("aria-label", card.dataset.name);
      if (!first) { first = card; return; }
      moves++; ui.stat("Moves", moves);
      if (first.dataset.name === card.dataset.name) {
        first.classList.add("done"); card.classList.add("done");
        first = null; pairs++; ui.stat("Pairs", `${pairs}/8`);
        if (pairs === 8) {
          const secs = Math.round((performance.now() - t0) / 1000);
          const isBest = best == null || moves < best;
          if (isBest) { best = moves; store.set("mm-best", best); ui.stat("Best", best); }
          setTimeout(() => ui.say(`<b>All pairs found</b><span>${moves} moves · ${secs}s${isBest ? " · new best!" : ""}</span>`, "Play again", deal), 500);
        }
      } else {
        lock = true;
        const a = first;
        first = null;
        setTimeout(() => {
          [a, card].forEach((c) => { c.classList.remove("up"); c.setAttribute("aria-label", "Hidden card"); });
          lock = false;
        }, 750);
      }
    });
    ui.btn["Shuffle"].addEventListener("click", deal);
    deal();
    return { root: ui.root };
  }

  /* ---------- 5. Lights Out ---------- */
  const NB = (i) => {
    const r = Math.floor(i / 5), c = i % 5, out = [i];
    if (r > 0) out.push(i - 5);
    if (r < 4) out.push(i + 5);
    if (c > 0) out.push(i - 1);
    if (c < 4) out.push(i + 1);
    return out;
  };
  const popcount = (x) => { let n = 0; while (x) { x &= x - 1; n++; } return n; };
  // Solves A·x = b over GF(2); returns the bitmask of presses with the fewest ones, or null.
  function solveLights(lights) {
    const rows = lights.map((on, i) => [NB(i).reduce((m, j) => m | (1 << j), 0), on]);
    const piv = [];
    let r = 0;
    for (let c = 0; c < 25 && r < 25; c++) {
      const p = rows.findIndex((row, k) => k >= r && (row[0] >> c) & 1);
      if (p < 0) continue;
      [rows[r], rows[p]] = [rows[p], rows[r]];
      rows.forEach((row, k) => { if (k !== r && (row[0] >> c) & 1) { row[0] ^= rows[r][0]; row[1] ^= rows[r][1]; } });
      piv.push(c); r++;
    }
    if (rows.slice(r).some((row) => row[1])) return null;
    const free = [...Array(25).keys()].filter((c) => !piv.includes(c));
    let best = null;
    for (let f = 0; f < 1 << free.length; f++) {
      let x = 0;
      free.forEach((c, i) => { if ((f >> i) & 1) x |= 1 << c; });
      piv.forEach((c, i) => { if (rows[i][1] ^ (popcount(rows[i][0] & ~(1 << c) & x) & 1)) x |= 1 << c; });
      if (best == null || popcount(x) < popcount(best)) best = x;
    }
    return best;
  }
  function gameLights() {
    const ui = shell({
      name: "Lights Out",
      how: "Pressing a cell flips it and its four neighbours. Turn every light off. Par is the true minimum number of presses.",
      stats: ["Level", "Moves", "Par"],
      hint: "Each board is a linear system Ax = b over GF(2); the hint solves it with Gaussian elimination.",
      actions: ["Hint", "Reset level"],
    });
    const grid = el("div", "lo");
    const cells = [...Array(25)].map((_, i) => {
      const b = el("button", "lo-cell");
      b.type = "button";
      b.dataset.i = i;
      b.setAttribute("aria-label", `Cell ${Math.floor(i / 5) + 1}, ${(i % 5) + 1}`);
      return grid.appendChild(b);
    });
    ui.board.prepend(grid);
    ui.board.classList.add("square");
    let level = store.get("lo-level", 1), lights, start, moves = 0;

    const paint = () => cells.forEach((c, i) => { c.classList.toggle("on", !!lights[i]); c.setAttribute("aria-pressed", lights[i] ? "true" : "false"); });
    function newLevel() {
      do {
        lights = Array(25).fill(0);
        const presses = Math.min(3 + level * 2, 16);
        for (let k = 0; k < presses; k++) NB(rand(25)).forEach((j) => (lights[j] ^= 1));
      } while (!lights.some(Boolean));
      start = lights.slice();
      begin();
    }
    function begin() {
      moves = 0;
      ui.hush();
      ui.stat("Level", level); ui.stat("Moves", 0); ui.stat("Par", popcount(solveLights(lights)));
      cells.forEach((c) => c.classList.remove("hint"));
      paint();
    }
    grid.addEventListener("click", (e) => {
      const c = e.target.closest(".lo-cell");
      if (!c || !ui.board.querySelector(".game-overlay").hidden) return;
      cells.forEach((x) => x.classList.remove("hint"));
      NB(+c.dataset.i).forEach((j) => (lights[j] ^= 1));
      moves++; ui.stat("Moves", moves);
      paint();
      if (!lights.some(Boolean)) {
        const par = popcount(solveLights(start));
        level++; store.set("lo-level", level);
        ui.say(`<b>Lights out!</b><span>${moves} moves${moves <= par ? " · perfect" : ` · par ${par}`}</span>`, "Next level", newLevel);
      }
    });
    ui.btn["Hint"].addEventListener("click", () => {
      const x = solveLights(lights);
      if (!x) return;
      const i = [...Array(25).keys()].find((k) => (x >> k) & 1);
      if (i != null) cells[i].classList.add("hint");
    });
    ui.btn["Reset level"].addEventListener("click", () => { lights = start.slice(); begin(); });
    newLevel();
    return { root: ui.root };
  }

  /* ---------- arcade wiring ---------- */
  const GAMES = [
    { id: "2048", label: "2048", make: game2048 },
    { id: "snake", label: "Snake", make: gameSnake },
    { id: "quickmath", label: "Quick Math", make: gameQuickMath },
    { id: "memory", label: "Memory", make: gameMemory },
    { id: "lights", label: "Lights Out", make: gameLights },
  ];
  const built = {};
  let active = null;

  function open(id, focus) {
    const g = GAMES.find((x) => x.id === id) || GAMES[0];
    if (active === g.id) return;
    if (active) { built[active].deactivate?.(); built[active].root.hidden = true; }
    if (!built[g.id]) { built[g.id] = g.make(); stage.appendChild(built[g.id].root); }
    built[g.id].root.hidden = false;
    built[g.id].activate?.();
    active = g.id;
    store.set("game", g.id);
    [...tabs.children].forEach((b) => b.setAttribute("aria-selected", b.dataset.id === g.id ? "true" : "false"));
    if (focus) stage.focus({ preventScroll: true });
  }

  function initArcade() {
    GAMES.forEach((g) => {
      const b = el("button", "arcade-tab", g.label);
      b.type = "button";
      b.dataset.id = g.id;
      b.setAttribute("role", "tab");
      b.setAttribute("aria-controls", "gameStage");
      b.addEventListener("click", () => open(g.id, true));
      tabs.appendChild(b);
    });
    stage.addEventListener("keydown", (e) => { if (e.target.tagName !== "INPUT") built[active]?.key?.(e); });
    stage.addEventListener("pointerdown", (e) => {
      if (!e.target.closest("button, input")) stage.focus({ preventScroll: true });
    });
    new IntersectionObserver(([e]) => { if (!e.isIntersecting) built[active]?.pause?.(); }).observe(stage);
    document.addEventListener("visibilitychange", () => { if (document.hidden) built[active]?.pause?.(); });
    open(store.get("game", "2048"));
  }

  const arm = new IntersectionObserver((entries) => {
    if (!entries.some((e) => e.isIntersecting)) return;
    arm.disconnect();
    initTheatre();
    initArcade();
  }, { rootMargin: "800px 0px" });
  arm.observe(arcade);
})();
