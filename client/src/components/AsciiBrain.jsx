import { useEffect, useImperativeHandle, useRef } from "react"

/*
 * ASCII-art side-profile head (facing left) with a brain inside, for the About page's
 * "Meet the Founders" corner. Decorative only (aria-hidden, pointer-events: none).
 *
 * The grid is rasterised from line-art geometry: cells on the head contour become dim
 * direction-aware strokes, cells inside the brain become bright folds (#, =), outline (*) and
 * texture (·).
 *
 * - First time in view: a fast left-to-right / top-to-bottom matrix decode into the final shape.
 * - Then: a soft "neural wave" of brighter glyphs ripples across the brain every few seconds,
 *   with a subtle flicker on random characters.
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

const OUTLINE_COLOR = "rgba(217,138,43,0.35)"
const BRAIN_RGB = [229, 154, 56] // #E59A38
const SHIMMER_RGB = [255, 226, 168]
const SCRAMBLE = "·:-=+*#@"
const FONT = "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace"

const rgb = ([r, g, b], a = 1) => `rgba(${r | 0},${g | 0},${b | 0},${a})`
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

    let cells = []
    let brainCells = []
    let cw = 0, ch = 0, fontPx = 9, W = 0, H = 0
    let visible = false, raf = 0, timer = 0
    let decodeAt = reduced ? -Infinity : null // null until first in view
    let wave = null // { at, dur, from, to }
    let scramble = null // { at, dur }
    let flicker = new Map() // cell -> { g, until }
    let nextWave = 0, nextFlicker = 0
    let pausedAt = 0
    const DECODE = 700, WAVE = 1300, PULSE = 400

    const layout = () => {
      const r = canvas.getBoundingClientRect()
      W = r.width; H = r.height
      if (W < 20 || H < 20) return
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      canvas.width = Math.round(W * dpr)
      canvas.height = Math.round(H * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      // 8px font on smaller desktops, 9-10px on wide ones; cells follow monospace proportions
      fontPx = W < 165 ? 8 : W < 200 ? 9 : 10
      cw = fontPx * 0.6
      ch = fontPx * 0.98 // tight line height
      const cols = Math.floor(W / cw), rows = Math.floor(H / ch)
      // Keep the 86:110 head proportions inside the available grid
      const fitCols = Math.min(cols, Math.round((rows * ch * 86) / 110 / cw))
      const fitRows = Math.min(rows, Math.round((fitCols * cw * 110) / 86 / ch))
      cells = buildGrid(fitCols, fitRows)
      brainCells = cells.filter((c) => c.brain)
      const ox = W - fitCols * cw // hug the right edge
      cells.forEach((cell) => { cell.x = ox + (cell.c + 0.5) * cw; cell.y = (cell.r + 0.5) * ch })
      draw(performance.now())
    }

    const brainBox = () => {
      const xs = brainCells.map((c) => c.x)
      return [Math.min(...xs), Math.max(...xs)]
    }

    const draw = (now) => {
      ctx.clearRect(0, 0, W, H)
      if (decodeAt == null) return
      ctx.font = `500 ${fontPx}px ${FONT}`
      ctx.textAlign = "center"
      ctx.textBaseline = "middle"
      const d = (now - decodeAt) / DECODE
      const w = wave ? (now - wave.at) / wave.dur : null
      const s = scramble ? (now - scramble.at) / scramble.dur : null
      const seed = Math.floor(now / 45)

      for (const cell of cells) {
        let g = cell.g, a = 1, k = 0
        // Matrix decode: each cell locks in after a left-to-right / top-to-bottom delay
        const lockAt = (cell.c / 40) * 0.55 + (cell.r / 30) * 0.25 + cell.rand * 0.2
        if (d < lockAt) { g = SCRAMBLE[(cell.c * 7 + cell.r * 13 + seed) % SCRAMBLE.length]; a = 0.45 }
        else if (cell.brain) {
          if (s != null && s < cell.rand * 0.85) { g = SCRAMBLE[(cell.c * 5 + cell.r * 3 + seed) % SCRAMBLE.length]; k = 0.5 }
          if (w != null) {
            // Neural wave: a soft band sweeping across the brain
            const pos = wave.from + (wave.to - wave.from) * w
            const band = Math.max(0, 1 - Math.abs(cell.x - pos) / 26) * Math.sin(Math.PI * Math.min(1, w))
            if (band > 0.35) g = brighter[g] || g
            k = Math.max(k, band * 0.8)
          }
          const f = flicker.get(cell)
          if (f) { g = f.g; k = Math.max(k, 0.4) }
        }
        if (cell.brain) {
          const dim = cell.g === "·" || cell.g === ":"
          ctx.fillStyle = rgb(mix(BRAIN_RGB, SHIMMER_RGB, k), a * (dim && k < 0.3 ? 0.6 : 1))
          ctx.shadowColor = rgb(BRAIN_RGB, 0.55 + k * 0.35)
          ctx.shadowBlur = 4 + k * 4
        } else {
          ctx.fillStyle = a < 1 ? `rgba(217,138,43,${0.35 * a})` : OUTLINE_COLOR
          ctx.shadowBlur = 0
        }
        ctx.fillText(g, cell.x, cell.y)
      }
      ctx.shadowBlur = 0
    }

    const step = (now) => {
      raf = 0
      if (!visible || document.hidden || reduced || decodeAt == null) return
      const decoding = now - decodeAt < DECODE
      if (!decoding) {
        if (wave && now - wave.at > wave.dur) wave = null
        if (scramble && now - scramble.at > scramble.dur) scramble = null
        if (!wave && now >= nextWave && brainCells.length) {
          const [x0, x1] = brainBox()
          const ltr = Math.random() < 0.6 // mostly front-to-back
          wave = { at: now, dur: WAVE, from: ltr ? x0 - 30 : x1 + 30, to: ltr ? x1 + 30 : x0 - 30 }
          nextWave = now + WAVE + 2500 + Math.random() * 2500
        }
        for (const [cell, f] of flicker) if (f.until < now) flicker.delete(cell)
        if (now >= nextFlicker && brainCells.length) {
          for (let i = 0; i < 3 + Math.floor(Math.random() * 4); i++) {
            const cell = brainCells[Math.floor(Math.random() * brainCells.length)]
            flicker.set(cell, { g: brighter[cell.g] || cell.g, until: now + 90 })
          }
          nextFlicker = now + 900 + Math.random() * 1400
        }
      }
      draw(now)
      // Full frame rate while something moves; otherwise sleep until the next flicker or wave
      if (decoding || wave || scramble || flicker.size) raf = requestAnimationFrame(step)
      else timer = setTimeout(() => { timer = 0; wake() }, Math.max(16, Math.min(nextWave, nextFlicker) - performance.now()))
    }
    const wake = () => {
      if (raf || timer) return
      raf = requestAnimationFrame(step)
    }
    const sleep = () => {
      cancelAnimationFrame(raf); clearTimeout(timer)
      raf = timer = 0
    }

    api.pulse = () => {
      if (reduced || decodeAt == null) return
      scramble = { at: performance.now(), dur: PULSE }
      clearTimeout(timer); timer = 0
      wake()
    }

    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting
      if (visible && decodeAt == null) {
        decodeAt = performance.now()
        nextWave = decodeAt + DECODE + 1200
        nextFlicker = decodeAt + DECODE + 600
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
    document.fonts?.load?.(`500 9px 'JetBrains Mono'`).then(layout, () => {})
    layout()

    return () => {
      sleep()
      io.disconnect()
      ro.disconnect()
      document.removeEventListener("visibilitychange", onVisibility)
      api.pulse = () => {}
    }
  }, [])

  return <canvas ref={canvasRef} aria-hidden="true" className={`pointer-events-none ${className}`} />
}
