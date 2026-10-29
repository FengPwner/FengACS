# Feng-Animation Code Studio(FengACS)

**FengACS** (Feng **A**nimation **C**ode **S**tudio) is a single-file, zero-dependency browser IDE for
writing and recording HTML5 Canvas animations. Type an `animate()` function in the editor on the left,
watch it render live on the canvas on the right, press **Record**, and download a `.webm` video.
No build step, no `npm install`, no server, no uploads — one HTML file does everything.

Open `FengACS.html` in a browser and you are ready to code.

> **Sketches are canvas-only.** A sketch is a single `animate()` function that paints into the provided
> `ctx` — no DOM creation, no CSS positioning, no self-made `requestAnimationFrame` loop.
> See [Sketch authoring rules](#sketch-authoring-rules) before you press Record.

---

## Highlights

- **Truly self-contained.** One `FengACS.html` file. No frameworks, no CDN calls, no external assets, no network required at runtime.
- **Live split-pane preview.** Editor on the left, canvas on the right, both on screen at the same time. On narrow screens the layout stacks vertically.
- **A tiny, familiar sketch API.** Define `animate()` and get `canvas`, `ctx`, `width`, `height`, `t`, `dt`, `frame` for free.
- **Frame-rate governor.** Renders against a target rate of 24 / 30 / 60 / 120 / 144 FPS with drift correction, instead of just firing at the display refresh rate.
- **In-page video export.** `canvas.captureStream()` + `MediaRecorder` produce a WebM file (VP9 → VP8 → plain WebM fallback) at 8 Mbps, saved straight from a Download button.
- **Real-time telemetry in the status bar:** measured FPS, frame counter, elapsed time, and run/recording status.
- **Resolution up to 4K.** Width 100–3840, height 100–2160, so you can export clean high-resolution captures.

---

## Quick start

1. Download or clone this repository.
2. Double-click `FengACS.html` (or drag it into a browser tab). `file://` works fine.
3. Click into the editor and paste a sketch:

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

4. Press **Run** (or `Ctrl` / `Cmd` + `Enter`) to start the loop, and **Record** → **Stop** → **Download** for a video.

Want something meatier? Load [`example/PERFTEST.js`](example/PERFTEST.js) — paste its contents into the editor and run it. See [Included example](#included-example--example-perftestjs) below.

---

## The sketch API

Your editor contents are evaluated **once per Run**. The studio then looks for a function named
`animate()` in that scope and calls it once per rendered frame.

```js
function animate() {
  // draw one frame here
}
```

Because the body runs once, top-level variables are an easy way to keep state that survives across
frames (this is exactly how `example/PERFTEST.js` lazily allocates its ring buffers):

```js
let particles = null;

function animate() {
  if (particles === null) particles = buildParticles(400);
  stepAndDraw(particles);
}
```

### Available names inside `animate()`

| Name        | Type                | Meaning                                                                       |
|-------------|---------------------|-------------------------------------------------------------------------------|
| `canvas`    | `HTMLCanvasElement` | The preview canvas being rendered to.                                          |
| `ctx`       | `CanvasRenderingContext2D` | Its 2D context (pre-fetched).                                         |
| `width`     | `number`            | Canvas width in pixels — follows the **W** input.                              |
| `height`    | `number`            | Canvas height in pixels — follows the **H** input.                             |
| `t`         | `number`            | Seconds elapsed since the current Run started.                                 |
| `dt`        | `number`            | Seconds since the previously rendered frame.                                   |
| `frame`     | `number`            | Rendered frame count since the current Run started (starts at `1`).            |

Notes:

- Everything is injected into the scope of your code, so plain bare identifiers (`ctx`, `t`, …) just work.
- `t` is measured, not simulated: it reflects wall-clock time since Run started. `dt` is the real gap between frames.
- The canvas is cleared to black at the start of each Run, so a static sketch only needs to draw once; animated sketches should repaint or clear per frame.
- Standard browser globals (`Math`, `performance`, `Image`, `fetch`, …) are also reachable, since the code runs in the page's own JS context.

---

## Sketch authoring rules

FengACS is a **canvas-only** studio. The host owns the page, the frame loop, and the recorder — a sketch
owns exactly one thing: what gets painted into `ctx` this frame. Please follow these rules, otherwise your
work will not display correctly and, worse, will not appear in the exported video.

**The runtime contract**

- **Environment you are given:** `canvas` (`HTMLCanvasElement`) and `ctx` (`CanvasRenderingContext2D`);
  `width` / `height` for canvas size; `t` (elapsed seconds), `dt` (frame gap in seconds), `frame` (frame index).
- **The canvas is already centred and auto-fitted in the Preview panel.** Never try to move, resize, or style
  it — that is the host's job.
- **Coordinates:** origin `(0, 0)` is the **top-left** of the canvas, `(width, height)` is the **bottom-right**;
  `x` grows rightwards, `y` grows downwards.
- **Define only `function animate() { … }`.** The studio calls it once per frame.
  Do **not** write your own `requestAnimationFrame` loop, and do **not** call `canvas.getContext('2d')` —
  `ctx` is already provided (asking for another context on the same canvas returns the same one anyway).

**Do not touch the DOM**

| Forbidden | Use instead |
|-----------|-------------|
| `document.createElement` / `appendChild` / `removeChild` | `ctx.fillRect`, `ctx.arc`, `ctx.beginPath` + paths, `ctx.drawImage` |
| `innerHTML` / `textContent` / `insertAdjacentHTML` | `ctx.fillText` / `ctx.strokeText` |
| `document.querySelector` and friends | The pre-injected `canvas` / `ctx` |
| CSS positioning (`position: absolute` / `fixed`, `z-index`, `transform` on elements) | Draw order — later `ctx` calls paint on top of earlier ones |
| Layout via flex/grid/CSS | Explicit pixel maths from `width` / `height` |
| Managing your own animation timing | `t`, `dt`, `frame` supplied by the host |

Everything must be produced through the Canvas 2D API: `fillRect` / `strokeRect`, `arc` / `ellipse`,
`beginPath` / `moveTo` / `lineTo` / `bezierCurveTo` / `closePath`, `fill` / `stroke`,
`fillText` / `strokeText`, `drawImage`, `createLinearGradient` / `createRadialGradient`,
`save` / `restore`, `translate` / `rotate` / `scale`, globalAlpha and `globalCompositeOperation`.

**Why the rules are strict:** the export path is `canvas.captureStream()` + `MediaRecorder`, which captures
**the canvas pixels and nothing else**. A tooltip, an HTML overlay, or an extra `<canvas>` you created in the
DOM is invisible to the recorder — so it shows up while you are developing and silently vanishes from the
downloaded `.webm`. Same for layering: DOM stacking has no effect, so depth is expressed purely by draw order.
Layered "UI panels" like the HUDs in `example/PERFTEST.js` are therefore drawn *on* the canvas, not beside it.

**Compliant sketch**

```js
function animate() {
  ctx.fillStyle = "#050510";
  ctx.fillRect(0, 0, width, height);            // clear: top-left origin, full canvas

  const cx = width * 0.5, cy = height * 0.5;    // derive layout from width / height
  const r = Math.min(width, height) * 0.25 * (1 + 0.08 * Math.sin(t * 3));

  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fillStyle = "hsl(" + ((t * 40) % 360) + ", 88%, 60%)";
  ctx.fill();

  ctx.fillStyle = "rgba(255,255,255,0.85)";     // text drawn on the canvas
  ctx.font = "bold " + Math.floor(height * 0.04) + "px monospace";
  ctx.textAlign = "center";
  ctx.fillText("frame " + frame, cx, height * 0.92);
}
```

**Non-compliant, and what breaks**

```js
const el = document.createElement("div");       // no DOM: never recorded
el.style.position = "absolute";                 // no CSS: no effect on the capture
el.innerHTML = "FPS " + (1 / dt).toFixed(1);
document.body.appendChild(el);

function loop() {                               // no self-made loop: the host already
  requestAnimationFrame(loop);                  // paces and calls animate()
  ctx.fillRect(0, 0, width, height);            // per frame; a second loop double-steps
}
```

**Checklist before you press Record**

1. Does the sketch consist of one `animate()` function (plus optional top-level state)?
2. Is every visible pixel drawn through `ctx`?
3. Are positions computed from `width` / `height` rather than hard-coded for one resolution?
4. Do you clear or repaint each frame, so nothing from the previous frame leaks?
5. Is anything you would like absent from the recording (debug overlay, grid, HUD) drawn on purpose?
   Remember: on the canvas it is in the video.

---

## Frame loop and the FPS target

Rendering is driven by `requestAnimationFrame`, but with a **fixed-interval gate** so that the sketch is
paced to the selected target rate rather than to whatever the display refresh rate happens to be:

- The next permitted frame time accumulates by `1000 / FPS` milliseconds each tick.
- If the loop falls behind by more than two intervals (a background tab, a heavy sketch, a GC pause), the
  schedule is snapped back to "now" instead of trying to catch up with a burst of frames.
- A measured FPS number is recomputed once per second and shown in the overlay at the top-left of the canvas.

Practical consequence: choosing `60` on a 144 Hz monitor still yields a steady 60 FPS cadence, and
`dt` stays honest under load. The measured rate can never exceed what your display and machine can deliver.

---

## Settings

All settings live in the top bar and take effect on `change`.

| Control | Range / values | Default | Effect |
|---------|----------------|---------|--------|
| **W**   | 100 – 3840     | `1280`  | Canvas width in pixels. |
| **H**   | 100 – 2160     | `720`   | Canvas height in pixels. |
| **FPS** | 24 / 30 / 60 / 120 / 144 | `60` | Target render cadence, also passed to `captureStream()`. |

Invalid or empty size values fall back to `1280 × 720`.

> Changing **W**, **H**, or **FPS** while a sketch is running re-shows the **Run** button — press **Run**
> again to restart the loop with the new settings. Resizing a canvas clears its bitmap, which is why
> animated sketches should repaint every frame.

---

## Recording and export

**Record** does three things in order: restarts the sketch from `t = 0`, attaches a
`MediaRecorder` to the canvas stream, and starts capturing. Recording always begins at the start of
the animation, so you get a clean, deterministic take every time.

| Aspect        | Behaviour |
|---------------|-----------|
| Stream source | `canvas.captureStream(targetFPS)` |
| Codec order   | `video/webm;codecs=vp9` → `video/webm;codecs=vp8` → `video/webm` (first supported wins) |
| Bitrate       | `8,000,000` bits/s |
| Chunking      | 100 ms `timeslice`, chunks buffered into a `Blob` |
| Timer         | `mm:ss` overlay in the top-right of the canvas, with a blinking status dot |
| Output        | `animation_<epoch-ms>.webm`, triggered by **Download** |

**Stop** finalises the file, **Download** becomes enabled, and the blob URL is revoked automatically when
you start a new recording or close the page. The recorded video is what the canvas actually rendered, so
anything you draw — including debug HUDs like the ones in `PERFTEST.js` — ends up in the file.

---

## Interface reference

- **Top bar** — size and FPS inputs, plus **Run**, **Clear**, **Record**, **Download**.
- **Editor** — a monospace text area with `Tab` bound to a two-space indent and placeholder hints. It is dimmed until you click into it (the header shows `Click to edit` / `Editing...`). No syntax highlighting or autocomplete by design.
- **Preview** — the canvas, auto-fitted inside the panel while keeping its aspect ratio, plus the FPS overlay and the recording overlay.
- **Status bar** — status dot and text (`Ready`, `Running`, `Recording...`, `Done`, `Error`, `Record error`), frame counter, elapsed time.
- **Toasts** — slide-in confirmations in the top-right, auto-dismissed after 2.5 s (green = success, red = error).

### Keyboard shortcuts

| Keys                  | Action        |
|-----------------------|---------------|
| `Ctrl` / `Cmd` + `Enter` | Run sketch |
| `Tab`                 | Insert two spaces |

---

## Included example — `example/PERFTEST.js`

A self-benchmarking sketch that doubles as a stress test and a showcase for the API.

1. **Intro (first 3 seconds)** — a pulsing "PERF TEST / SYSTEM BENCHMARK" title over an animated radial gradient, with fade-in and fade-out.
2. **Live telemetry** — after the intro it renders a scrolling four-series graph over a 300-sample ring buffer:
   `FPS` (cyan), `FRAME` time (violet), `DRAW` cost (amber), `HEAP` usage (green), plus glowing head markers, a grid, and a legend.
3. **A numeric HUD** on the left reporting FPS average / current / min / max, frame time avg / max / min,
   draw-time average and peak, an estimated CPU load and headroom, current and peak JS heap, GC event count, total loop count, and elapsed time.
4. **Two mini graphs** on the right — a 120-sample frame-time plot and a 120-sample draw-time plot.

`HEAP`, peak-heap and GC counters rely on `performance.memory`, which is Chromium-only; the sketch
feature-detects it and simply reports zeros elsewhere. It is also **not** available when the page runs
without tab-measurement permissions, so treat those fields as diagnostics rather than portable metrics.

Paste the file into the editor and press **Run** at `1280 × 720 @ 60` for the intended reading.

---

## Browser support

| Capability | Requirement |
|------------|-------------|
| Editing & running sketches | Any current browser with Canvas 2D. |
| Recording & export | `HTMLCanvasElement.captureStream()` + `MediaRecorder`. Built around the WebM profiles, so Chromium browsers (Chrome, Edge, Opera, Vivaldi) and Firefox are the primary targets; Safari's `MediaRecorder` exposes MP4/H.264 profiles, so **Record** is not expected to work there (running sketches is unaffected). |
| `PERFTEST.js` heap / GC fields | `performance.memory` — Chromium only. |

Cross-browser behaviour above is derived from the code paths in this repository, not from an automated
compatibility test matrix — if you validate a browser and it behaves, feel free to open an issue.

---

## Known limitations and design notes

- **The evaluator is a convenience, not a security boundary.** User code runs in the page's own JavaScript
  context via a `with`-scoped function wrapper. There is no iframe isolation, no worker, and no permission
  sandbox, so do not paste untrusted code and do not expose an instance to strangers.
- **No persistence.** The editor does not save to `localStorage` or to disk, so a page reload loses your sketch. Keep important work in a file (as `example/PERFTEST.js` does) and paste it back in.
- **Errors thrown inside `animate()` are not caught per frame.** They surface in the browser console on every
  offending frame; the loop keeps running. Only failures while evaluating your code (syntax errors, a missing
  `animate()`) are reported in the UI as an error toast.
- **2D context only.** There is no WebGL/WebGPU helper surface; you are drawing on the `CanvasRenderingContext2D`.
- **Fixed export bitrate and container.** 8 Mbps WebM, no quality knob, no MP4/GIF/MOV path, no
  frame-exact CFR guarantee (it is a real-time capture, not an offline render).
- **No syntax highlighting, line numbers, autocomplete, or multi-file projects.** Deliberately minimal.

---

## Project structure

```
FengACS/
├── FengACS.html          # the entire application — editor, renderer, recorder, UI
├── README.md
└── example/
    └── PERFTEST.js       # example sketch: performance telemetry dashboard
```

---

## Ideas for extension

The single-file layout keeps experiments cheap. Natural next steps, if you want to fork:

- Persist sketches to `localStorage` and add save / load / share-as-URL.
- Add a WebGL or OffscreenCanvas renderer and a second context selector.
- Expose bitrate, codec, and container (MP4 via `MediaRecorder` where supported) in the UI.
- Add a "record N seconds then auto-stop" mode for deterministic clip lengths.
- Add a small helper layer (shapes, easing, noise) injected into the sandbox.

---

## Author

**FengPwner** — <https://github.com/FengPwner>

## License

No license file has been added to this repository yet, so the default GitHub "all rights reserved" terms
currently apply to the code here. Add a `LICENSE` file if you intend to open it up.
