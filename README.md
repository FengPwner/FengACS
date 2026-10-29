<div align="center">

# 🎨 FengACS — Feng Animation Code Studio

### *A single-file, zero-dependency browser IDE for HTML5 Canvas animations*

> *"Write an `animate()`, watch it live, export a WebM. That's it."*

[![Made with Canvas 2D](https://img.shields.io/badge/Canvas%202D-API-blue?style=for-the-badge&logo=html5&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D)
[![Zero Dependency](https://img.shields.io/badge/Zero-Dependency-success?style=for-the-badge&logo=package)](https://github.com/FengPwner/FengACS)
[![Single File](https://img.shields.io/badge/Single-File%20App-purple?style=for-the-badge&logo=github)](https://github.com/FengPwner/FengACS)
[![No Build](https://img.shields.io/badge/No-Build%20Step-orange?style=for-the-badge&logo=npm)](https://github.com/FengPwner/FengACS)
[![FPS 24–144](https://img.shields.io/badge/FPS-24%E2%80%93144-critical?style=for-the-badge&logo=playstation)](https://github.com/FengPwner/FengACS)

</div>

<details open>
<summary><strong>📑 Table of Contents</strong></summary>

- [✨ Highlights](#-highlights)
- [🚀 Quick Start](#-quick-start)
- [🧠 The Sketch API](#-the-sketch-api)
- [📜 Sketch Authoring Rules](#-sketch-authoring-rules)
- [⚙️ Frame Loop & FPS Target](#️-frame-loop--fps-target)
- [🎛️ Settings](#️-settings)
- [📼 Recording & Export](#-recording--export)
- [🖥️ Interface Reference](#️-interface-reference)
- [📊 Included Example — PERFTEST.js](#-included-example--perftestjs)
- [🌐 Browser Support](#-browser-support)
- [⚠️ Known Limitations](#️-known-limitations)
- [📁 Project Structure](#-project-structure)
- [💡 Ideas for Extension](#-ideas-for-extension)
- [👤 Author](#-author)
- [📄 License](#-license)

</details>

---

<a id="-highlights"></a>
## ✨ Highlights

> **Truly self-contained.** One `FengACS.html` file. No frameworks, no CDN calls, no external assets, no network required at runtime.

- ✅ **Live split-pane preview** — editor on the left, canvas on the right, both visible at once.
- 🎯 **Frame-rate governor** — target **24 / 30 / 60 / 120 / 144 FPS** with drift correction.
- 📼 **In-page video export** — `canvas.captureStream()` + `MediaRecorder` → **WebM** at 8 Mbps.
- 📊 **Real-time telemetry** — measured FPS, frame counter, elapsed time, run/record status.
- 🖥️ **Resolution up to 4K** — width `100–3840`, height `100–2160`.
- 🧩 **A tiny, familiar sketch API** — `canvas`, `ctx`, `width`, `height`, `t`, `dt`, `frame` for free.

---

<a id="-quick-start"></a>
## 🚀 Quick Start

1. **Download or clone** this repository.
2. **Open** `FengACS.html` in any browser — `file://` works fine, no server needed.
3. **Paste** a sketch into the editor:

```js
function animate() {
  ctx.fillStyle = "#050510";
  ctx.fillRect(0, 0, width, height);

  ctx.save();
  ctx.translate(width / 2, height / 2);
  ctx.rotate(t * 1.5);
  ctx.fillStyle = "hsl(" + ((t * 60) % 360) + ", 90%, 60%)";
  ctx.fillRect(-90, -90, 180, 180);
  ctx.restore();
}
```

4. Press **Run** (or `Ctrl` / `Cmd` + `Enter`), then **Record** → **Stop** → **Download**.

> 💡 Want something meatier? Load `example/PERFTEST.js` and paste it into the editor.

---

<a id="-the-sketch-api"></a>
## 🧠 The Sketch API

Your editor contents are evaluated **once per Run**. FengACS then looks for `animate()` and calls it once per rendered frame.

### Available names inside `animate()`

| Name | Type | Meaning |
| :--- | :--- | :--- |
| `canvas` | `HTMLCanvasElement` | The preview canvas being rendered to. |
| `ctx` | `CanvasRenderingContext2D` | Its 2D context (pre-fetched). |
| `width` | `number` | Canvas width in pixels — follows the **W** input. |
| `height` | `number` | Canvas height in pixels — follows the **H** input. |
| `t` | `number` | Seconds elapsed since the current Run started. |
| `dt` | `number` | Seconds since the previously rendered frame. |
| `frame` | `number` | Rendered frame count since Run started (starts at `1`). |

### Keep state across frames

Because the body runs once, top-level variables persist between frames:

```js
let particles = null;

function animate() {
  if (particles === null) particles = buildParticles(400);
  stepAndDraw(particles);
}
```

> 📌 **Note:** The canvas is cleared to black at the start of each Run. Animated sketches should repaint or clear every frame.

---

<a id="-sketch-authoring-rules"></a>
## 📜 Sketch Authoring Rules

> FengACS is a **canvas-only** studio. A sketch owns exactly one thing: *what gets painted into `ctx` this frame.*

### ✅ The runtime contract

- You are given `canvas`, `ctx`, `width`, `height`, `t`, `dt`, `frame`.
- Define **only** `function animate() { … }` — no own `requestAnimationFrame` loop, no `canvas.getContext('2d')`.
- Origin `(0, 0)` is the **top-left**; `x` grows right, `y` grows down.

### 🚫 Do not touch the DOM

| ❌ Forbidden | ✅ Use instead |
| :--- | :--- |
| `document.createElement` / `appendChild` | `ctx.fillRect`, `ctx.arc`, `ctx.beginPath` + paths |
| `innerHTML` / `textContent` | `ctx.fillText` / `ctx.strokeText` |
| `document.querySelector` | The pre-injected `canvas` / `ctx` |
| CSS positioning / `z-index` / `transform` | Draw order — later `ctx` calls paint on top |
| Flex / grid layout | Explicit pixel maths from `width` / `height` |
| Own animation timing | `t`, `dt`, `frame` supplied by the host |

> ⚠️ **Why so strict?** The export path is `canvas.captureStream()` + `MediaRecorder`, which captures **the canvas pixels and nothing else**. Any DOM overlay silently vanishes from the downloaded `.webm`.

### ✅ Checklist before you press Record

- [ ] Does the sketch consist of one `animate()` function (plus optional top-level state)?
- [ ] Is every visible pixel drawn through `ctx`?
- [ ] Are positions computed from `width` / `height` rather than hard-coded?
- [ ] Do you clear or repaint each frame, so nothing leaks from the previous one?
- [ ] Is anything you *wouldn't* want in the recording (debug HUD) drawn on purpose?

---

<a id="️-frame-loop--fps-target"></a>
## ⚙️ Frame Loop & FPS Target

Rendering uses `requestAnimationFrame` behind a **fixed-interval gate**:

```text
next_frame += 1000 / FPS         # accumulate the next permitted frame time
if (now - next_frame > 2 ticks)  # fell too far behind (tab switch / GC pause)?
    next_frame = now             # snap back to "now" instead of bursting frames
```

- Choosing `60` on a 144 Hz monitor still yields a steady **60 FPS**.
- `dt` stays honest under load.
- Measured rate is recomputed once per second and shown in the top-left overlay.

---

<a id="️-settings"></a>
## 🎛️ Settings

| Control | Range / Values | Default | Effect |
| :--- | :--- | :--- | :--- |
| **W** | `100 – 3840` | `1280` | Canvas width in pixels |
| **H** | `100 – 2160` | `720` | Canvas height in pixels |
| **FPS** | `24 / 30 / 60 / 120 / 144` | `60` | Target render cadence + `captureStream()` |

> ⚠️ Changing **W / H / FPS** while running re-shows **Run** — press it again to restart with the new settings.

---

<a id="-recording--export"></a>
## 📼 Recording & Export

**Record** restarts the sketch from `t = 0`, attaches a `MediaRecorder`, and starts capturing — a clean, deterministic take every time.

| Aspect | Behaviour |
| :--- | :--- |
| Stream source | `canvas.captureStream(targetFPS)` |
| Codec order | `vp9` → `vp8` → `video/webm` (first supported wins) |
| Bitrate | `8,000,000` bits/s |
| Chunking | 100 ms `timeslice`, buffered into a `Blob` |
| Output | `animation_<epoch-ms>.webm` |

---

<a id="️-interface-reference"></a>
## 🖥️ Interface Reference

| Zone | Description |
| :--- | :--- |
| **Top bar** | Size + FPS inputs, **Run**, **Clear**, **Record**, **Download** |
| **Editor** | Monospace textarea, `Tab` → 2-space indent, placeholder hints |
| **Preview** | Auto-fitted canvas + FPS overlay + recording overlay |
| **Status bar** | Status dot, frame counter, elapsed time |
| **Toasts** | Slide-in confirmations, auto-dismiss after 2.5 s |

### ⌨️ Keyboard shortcuts

| Keys | Action |
| :--- | :--- |
| <kbd>Ctrl</kbd> / <kbd>Cmd</kbd> + <kbd>Enter</kbd> | Run sketch |
| <kbd>Tab</kbd> | Insert two spaces |

---

<a id="-included-example--perftestjs"></a>
## 📊 Included Example — `example/PERFTEST.js`

A self-benchmarking sketch that doubles as a stress test and an API showcase:

1. **Intro (first 3s)** — pulsing *"PERF TEST / SYSTEM BENCHMARK"* title over an animated radial gradient.
2. **Live telemetry** — a scrolling 4-series graph over a 300-sample ring buffer (`FPS`, `FRAME`, `DRAW`, `HEAP`).
3. **Numeric HUD** — FPS avg / current / min / max, frame-time stats, heap, GC events, elapsed time.
4. **Two mini graphs** — a 120-sample frame-time plot and a 120-sample draw-time plot.

> 📌 `HEAP` / GC fields rely on `performance.memory`, which is **Chromium-only** — they report zeros elsewhere.

---

<a id="-browser-support"></a>
## 🌐 Browser Support

| Capability | Requirement |
| :--- | :--- |
| Editing & running | Any current browser with **Canvas 2D** |
| Recording & export | `captureStream()` + `MediaRecorder` (Chromium + Firefox; Safari exposes MP4 profiles) |
| `PERFTEST.js` heap / GC | `performance.memory` — Chromium only |

---

<a id="️-known-limitations"></a>
## ⚠️ Known Limitations

- 🛡️ **The evaluator is a convenience, not a security boundary** — no iframe, no worker, no sandbox. *Do not paste untrusted code.*
- 💾 **No persistence** — a page reload loses your sketch.
- 🐛 **Errors inside `animate()` aren't caught per frame** — they surface in the console.
- 🎨 **2D context only** — no WebGL / WebGPU helper surface.
- 📦 **Fixed export** — 8 Mbps WebM, no MP4 / GIF / MOV path.

---

<a id="-project-structure"></a>
## 📁 Project Structure

```text
FengACS/
├── FengACS.html        # the entire application — editor, renderer, recorder, UI
├── README.md
└── example/
    └── PERFTEST.js     # example sketch: performance telemetry dashboard
```

---

<a id="-ideas-for-extension"></a>
## 💡 Ideas for Extension

- [ ] Persist sketches to `localStorage`, add save / load / share-as-URL.
- [ ] Add a **WebGL / OffscreenCanvas** renderer + context selector.
- [ ] Expose bitrate, codec, and container (MP4 where supported).
- [ ] Add *"record N seconds then auto-stop"* for deterministic clip lengths.
- [ ] Inject a small helper layer (shapes, easing, noise) into the sandbox.

---

<div align="center">

```text
┌─────────────────────────────────────────────────────┐
│   F e n g A C S  ·  W r i t e .  R e n d e r .       │
│   R e c o r d .  E x p o r t .                      │
└─────────────────────────────────────────────────────┘
```

<sub>FengACS — Feng Animation Code Studio · <sup>zero-dependency · single-file</sup></sub>

</div>

---

<a id="-author"></a>
## 👤 Author

**FengPwner** — [github.com/FengPwner](https://github.com/FengPwner)

---

<a id="-license"></a>
## 📄 License

> ⚠️ **No license file has been added yet** — the default GitHub *"all rights reserved"* terms currently apply.
> Add a `LICENSE` file if you intend to open it up.

---

<div align="center">

*Stay curious, stay sharp — and always animate with authorization.*

[⬆️ Back to top](#-highlights)

</div>
