import { useEffect, useImperativeHandle, useRef } from "react"

/*
 * ASCII-art side-profile head (facing left) with a brain inside, for the About page's
 * "Meet the Founders" header. Decorative only (aria-hidden, pointer-events: none).
 *
 * The grid is rasterised from line-art geometry: cells on the head contour become dim
 * direction-aware strokes, cells inside the brain become bright folds (#, =), outline (*) and
 * texture (·).
 *
 * - First time in view: a fast left-to-right / top-to-bottom matrix decode into the final shape.
 * - Then: a bright white-gold "synapse wave" crest sweeps diagonally across the brain every
 *   ~2.5s (glyphs swap to denser characters, brighten and bloom more), the head outline breathes
 *   in opacity, and a few random characters flicker.
 * - `ref.current.pulse()`: a ~400ms scramble-and-resolve in the brain (founder switched).
 * - Only animates while on screen and the tab is visible; reduced motion shows the final grid.
 */

// Geometry in an 86 x 110 unit box
const SILHOUETTE = [
  [64, 110], [65, 93], [71, 84], [80, 72], [85, 56], [85, 40], [80, 25], [70, 13], [56, 6], [42, 5],
  [29, 9], [19, 17], [13, 27], [11, 37], [9, 45], [2, 55], [8, 59], [6, 64], [9, 67], [7, 71],
  [11, 75], [9, 81], [16, 86], [30, 88], [34, 98], [35, 110],
]
const BRAIN = [
  [26, 40], [23, 29], [28, 18], [39, 11], [53, 10], [66, 15], [75, 25], [78, 38], [73, 50], [62, 55],
  [50, 52], [38, 50], [29, 47],
]
const N = {
  F0: [35, 22], F1: [46, 19], F2: [56, 22], F3: [65, 24], F4: [70, 34], F5: [61, 38], F6: [51, 33],
  F7: [41, 30], F8: [33, 38], F9: [44, 41], F10: [55, 45], F11: [67, 46], F12: [49, 26],
  C0: [64, 60], C1: [72, 57], T0: [57, 64], T1: [59, 76],
}
BRAIN.forEach((p, i) => { N[`B${i}`] = p })
const FOLDS = [
  ["B2", "F0", "F7", "F8", "B0"], ["B3", "F1", "F12", "F6", "F9", "B11"], ["B5", "F3", "F2", "F12"],
  ["B6", "F4", "F5", "F6", "F7"], ["B7", "F11", "F10", "F9", "F8"], ["F0", "F1", "F2"], ["F3", "F4", "F11"],
  ["F5", "F10", "B10"], ["B8", "C1", "C0", "B9"], ["B9", "T0", "T1"],
].map((path) => path.map((n) => N[n]))

const OUTLINE_RGB = [245, 166, 35] // crisp warm gold; opacity breathes 0.55-0.85
const BRAIN_RGB = [255, 184, 77] // #FFB84D
const CREST_MID = [255, 209, 102] // #FFD166
const CREST_TOP = [255, 243, 214] // #FFF3D6
const SCRAMBLE = "·:-=+*#@"
const FONT = "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace"

const rgb = ([r, g, b], a = 1) => `rgba(${r | 0},${g | 0},${b | 0},${a.toFixed(3)})`
const mix = (a, b, k) => a.map((v, i) => v + (b[i] - v) * k)
const brighter = { "·": "*", ":": "*", "*": "#", "=": "#", "#": "@", "@": "@" }

// Distance from p to segment ab, measured in cell units (so the threshold is ~half a cell)
function segDist(px, py, [ax, ay], [bx, by], sx, sy) {
  const dx = (bx - ax) / sx, dy = (by - ay) / sy
  const qx = (px - ax) / sx, qy = (py - ay) / sy
  const t = Math.max(0, Math.min(1, (qx * dx + qy * dy) / (dx * dx + dy * dy || 1)))
  return Math.hypot(qx - t * dx, qy - t * dy)
}
function nearest(px, py, polyline, sx, sy, closed = false) {
  let best = Infinity, dir = 0
  const n = closed ? polyline.length : polyline.length - 1
  for (let i = 0; i < n; i++) {
    const a = polyline[i], b = polyline[(i + 1) % polyline.length]
    const d = segDist(px, py, a, b, sx, sy)
    if (d < best) { best = d; dir = Math.atan2((b[1] - a[1]) / sy, (b[0] - a[0]) / sx) }
  }
  return [best, dir]
}
function inside(px, py, poly) {
  let hit = false
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i], [xj, yj] = poly[j]
    if (yi > py !== yj > py && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi) hit = !hit
  }
  return hit
}
// Contour glyph for a stroke direction (radians)
function strokeGlyph(a) {
  const d = ((((a * 180) / Math.PI) % 180) + 180) % 180
  // Canvas y points down, so a 45° segment runs down-right ("\\") and 135° runs down-left ("/")
  return d < 25 || d > 155 ? "-" : d > 65 && d < 115 ? ":" : d <= 65 ? "\\" : "/"
}

/** Rasterises the head into a cols x rows grid of { g, brain, x, y }. */
function buildGrid(cols, rows) {
  const sx = 86 / cols, sy = 110 / rows // units per cell
  const cells = []
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x = (c + 0.5) * sx, y = (r + 0.5) * sy
      const [dFold, fDir] = FOLDS.reduce((best, f) => { const v = nearest(x, y, f, sx, sy); return v[0] < best[0] ? v : best }, [Infinity, 0])
      const [dBrain] = nearest(x, y, BRAIN, sx, sy, true)
      const [dSil, sDir] = nearest(x, y, SILHOUETTE, sx, sy)
      const inBrain = inside(x, y, BRAIN)
      let g = null, brain = false
      if (dFold < 0.5) { g = strokeGlyph(fDir) === "-" ? "=" : "#"; brain = true }
      else if (dBrain < 0.5) { g = "*"; brain = true }
      else if (inBrain) { g = (r + c) % 2 ? "·" : ":"; brain = true }
      else if (dSil < 0.62) g = strokeGlyph(sDir)
      if (g) cells.push({ c, r, g, brain, rand: Math.random() })
    }
  }
  return cells
}

export default function AsciiBrain({ className = "", ref }) {
  const canvasRef = useRef(null)
  const apiRef = useRef({ pulse: () => {} })
  useImperativeHandle(ref, () => ({ pulse: () => apiRef.current.pulse() }), [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const api = apiRef.current
    const ctx = canvas.getContext("2d")
    const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
    // Brain glyphs are drawn to their own layer and composited with two blurred copies, the canvas
    // equivalent of text-shadow: 0 0 8px rgba(255,184,77,.65), 0 0 18px rgba(245,158,11,.35)
    const layer = document.createElement("canvas")
    const lctx = layer.getContext("2d")
    const FILTERS = "filter" in ctx

    let cells = []
    let brainCells = []
    let cw = 0, ch = 0, fontPx = 11, W = 0, H = 0, dpr = 1
    let visible = false, raf = 0, timer = 0, lastDraw = 0
    let decodeAt = reduced ? -Infinity : null // null until first in view
    let wave = null // { at, dur, from, to }
    let scramble = null // { at, dur }
    const flicker = new Map() // cell -> { g, until }
    let nextWave = 0, nextFlicker = 0
    let pausedAt = 0
    const DECODE = 700, WAVE = 1150, WAVE_EVERY = 2500, PULSE = 400, BREATH = 4200
    const IDLE_FPS_MS = 50 // between waves only the slow breathing moves: ~20fps is plenty

    const layout = () => {
      const r = canvas.getBoundingClientRect()
      W = r.width; H = r.height
      if (W < 20 || H < 20) return
      dpr = Math.min(window.devicePixelRatio || 1, 2)
      for (const c of [canvas, layer]) { c.width = Math.round(W * dpr); c.height = Math.round(H * dpr) }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      lctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      // ~31 columns across the box: 11-12px on desktop, compact (8px) when stacked on small screens
      fontPx = Math.max(7, Math.min(12, Math.round(W / 31 / 0.6)))
      cw = fontPx * 0.6
      ch = fontPx * 0.98 // tight line height
      const cols = Math.floor(W / cw), rows = Math.floor(H / ch)
      // Keep the 86:110 head proportions inside the available grid
      const fitCols = Math.min(cols, Math.round((rows * ch * 86) / 110 / cw))
      const fitRows = Math.min(rows, Math.round((fitCols * cw * 110) / 86 / ch))
      cells = buildGrid(fitCols, fitRows)
      brainCells = cells.filter((c) => c.brain)
      const ox = (W - fitCols * cw) / 2, oy = (H - fitRows * ch) / 2
      cells.forEach((cell) => { cell.x = ox + (cell.c + 0.5) * cw; cell.y = oy + (cell.r + 0.5) * ch })
      draw(performance.now())
    }

    // Diagonal coordinate (front-top of the brain -> back-bottom) used by the synapse wave
    const diag = (cell) => cell.x + cell.y * 0.7
    const brainRange = () => {
      const ds = brainCells.map(diag)
      return [Math.min(...ds), Math.max(...ds)]
    }

    const draw = (now) => {
      ctx.clearRect(0, 0, W, H)
      lctx.clearRect(0, 0, W, H)
      if (decodeAt == null) return
      lastDraw = now
      const font = `600 ${fontPx}px ${FONT}`
      for (const c of [ctx, lctx]) { c.font = font; c.textAlign = "center"; c.textBaseline = "middle" }
      const d = (now - decodeAt) / DECODE
      const w = wave ? (now - wave.at) / wave.dur : null
      const s = scramble ? (now - scramble.at) / scramble.dur : null
      const seed = Math.floor(now / 45)
      const breath = reduced ? 0.75 : 0.55 + 0.3 * (0.5 + 0.5 * Math.sin((now / BREATH) * Math.PI * 2))
      const crestPos = w != null ? wave.from + (wave.to - wave.from) * w : null
      const crestW = Math.max(18, cw * 4)
      const hot = [] // crest glyphs get an extra, wider bloom

      for (const cell of cells) {
        let g = cell.g, a = 1, k = 0
        // Matrix decode: each cell locks in after a left-to-right / top-to-bottom delay
        const lockAt = (cell.c / 40) * 0.55 + (cell.r / 30) * 0.25 + cell.rand * 0.2
        const decoding = d < lockAt
        if (decoding) { g = SCRAMBLE[(cell.c * 7 + cell.r * 13 + seed) % SCRAMBLE.length]; a = 0.5 }
        else if (cell.brain) {
          if (s != null && s < cell.rand * 0.85) { g = SCRAMBLE[(cell.c * 5 + cell.r * 3 + seed) % SCRAMBLE.length]; k = 0.55 }
          if (crestPos != null) {
            const band = Math.max(0, 1 - Math.abs(diag(cell) - crestPos) / crestW)
            if (band > 0) {
              k = Math.max(k, band)
              // Characters swap as the crest passes: denser at the front, scrambling right on top
              g = band > 0.8 ? (cell.rand > 0.5 ? "@" : "#") : band > 0.45 ? (brighter[g] || g) : g
            }
          }
          const f = flicker.get(cell)
          if (f) { g = f.g; k = Math.max(k, 0.45) }
        }

        if (cell.brain && !decoding) {
          const dim = cell.g === "·" || cell.g === ":"
          const col = k > 0.5 ? mix(CREST_MID, CREST_TOP, (k - 0.5) * 2) : mix(BRAIN_RGB, CREST_MID, k * 2)
          lctx.fillStyle = rgb(col, dim && k < 0.3 ? 0.62 : 1)
          lctx.fillText(g, cell.x, cell.y)
          if (k > 0.35) hot.push([g, cell.x, cell.y, k, col])
        } else if (cell.brain) {
          lctx.fillStyle = rgb(BRAIN_RGB, a)
          lctx.fillText(g, cell.x, cell.y)
        } else {
          ctx.fillStyle = rgb(OUTLINE_RGB, decoding ? 0.4 * a : breath)
          ctx.fillText(g, cell.x, cell.y)
        }
      }

      // Composite the brain: wide soft bloom, tight bloom, then the crisp glyphs on top
      ctx.save()
      ctx.setTransform(1, 0, 0, 1, 0, 0)
      if (FILTERS) {
        ctx.filter = `blur(${9 * dpr}px)`
        ctx.globalAlpha = 0.45
        ctx.drawImage(layer, 0, 0)
        ctx.filter = `blur(${4 * dpr}px)`
        ctx.globalAlpha = 0.85
        ctx.drawImage(layer, 0, 0)
        ctx.filter = "none"
        ctx.globalAlpha = 1
      } else {
        ctx.shadowColor = "rgba(255,184,77,0.65)"
        ctx.shadowBlur = 8 * dpr
      }
      ctx.drawImage(layer, 0, 0)
      ctx.restore()

      // Crest glyphs: an extra white-gold bloom so the wave reads at a glance
      if (hot.length) {
        ctx.save()
        for (const [g, x, y, k, col] of hot) {
          ctx.shadowColor = rgb(CREST_MID, 0.9)
          ctx.shadowBlur = 6 + k * 10
          ctx.fillStyle = rgb(col, 0.5 + k * 0.5)
          ctx.fillText(g, x, y)
        }
        ctx.restore()
      }
    }

    const step = (now) => {
      raf = 0
      if (!visible || document.hidden || reduced || decodeAt == null) return
      const decoding = now - decodeAt < DECODE
      if (!decoding) {
        if (wave && now - wave.at > wave.dur) wave = null
        if (scramble && now - scramble.at > scramble.dur) scramble = null
        if (!wave && now >= nextWave && brainCells.length) {
          const [d0, d1] = brainRange()
          wave = { at: now, dur: WAVE, from: d0 - 30, to: d1 + 30 }
          nextWave = now + WAVE_EVERY
        }
        for (const [cell, f] of flicker) if (f.until < now) flicker.delete(cell)
        if (now >= nextFlicker && brainCells.length) {
          for (let i = 0; i < 3 + Math.floor(Math.random() * 4); i++) {
            const cell = brainCells[Math.floor(Math.random() * brainCells.length)]
            flicker.set(cell, { g: brighter[cell.g] || cell.g, until: now + 90 })
          }
          nextFlicker = now + 700 + Math.random() * 1100
        }
      }
      // Full frame rate while the wave, decode or scramble moves; ~20fps for the slow breathing
      const busy = decoding || wave || scramble || flicker.size
      if (busy || now - lastDraw >= IDLE_FPS_MS) draw(now)
      raf = requestAnimationFrame(step)
    }
    const wake = () => {
      if (raf) return
      clearTimeout(timer); timer = 0
      raf = requestAnimationFrame(step)
    }
    const sleep = () => {
      cancelAnimationFrame(raf); clearTimeout(timer)
      raf = timer = 0
    }

    api.pulse = () => {
      if (reduced || decodeAt == null) return
      scramble = { at: performance.now(), dur: PULSE }
      wake()
    }

    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting
      if (visible && decodeAt == null) {
        decodeAt = performance.now()
        nextWave = decodeAt + DECODE + 600
        nextFlicker = decodeAt + DECODE + 400
      }
      if (visible) { if (reduced) draw(performance.now()); else wake() }
      else sleep()
    }, { threshold: 0.3 })
    io.observe(canvas)

    const onVisibility = () => {
      if (document.hidden) { pausedAt = performance.now(); sleep(); return }
      // Shift the clock so a decode in progress resumes where it stopped
      const gap = pausedAt ? performance.now() - pausedAt : 0
      if (decodeAt != null && Number.isFinite(decodeAt)) decodeAt += gap
      nextWave += gap; nextFlicker += gap
      if (visible) wake()
    }
    document.addEventListener("visibilitychange", onVisibility)

    const ro = new ResizeObserver(layout)
    ro.observe(canvas)
    document.fonts?.load?.(`600 11px 'JetBrains Mono'`).then(layout, () => {})
    layout()

    return () => {
      sleep()
      io.disconnect()
      ro.disconnect()
      document.removeEventListener("visibilitychange", onVisibility)
      api.pulse = () => {}
    }
  }, [])

  return (
    <div aria-hidden="true" className={`pointer-events-none ${className}`}>
      {/* Soft gold backlight so the block lifts off the dark background */}
      <div className="absolute inset-[-12%] bg-[radial-gradient(closest-side_at_56%_38%,rgba(245,166,35,0.12),transparent)]" />
      <canvas ref={canvasRef} className="relative block h-full w-full" />
    </div>
  )
}
