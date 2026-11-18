import { useEffect, useImperativeHandle, useRef } from "react"

/*
 * ASCII icon of a side-profile head (facing left) with a brain inside, centred above the
 * About page's "Meet the Founders" heading. Decorative: aria-hidden.
 *
 * Built like the Projects page ASCII (lib/asciiArt): a clean source drawing is rendered on an
 * offscreen canvas and sampled per character cell. Two layers are sampled separately:
 *   - the head outline: the smoothed contour traced into a continuous one-cell-wide chain of
 *     light characters (- on horizontal runs, : elsewhere), dim gold
 *   - the brain (filled lobes with the fold lines carved out, brainstem, cerebellum)
 *     -> sampled by coverage into a few clean levels, so lobes read as @ # and the folds as
 *     lighter channels (+ : .), bright gold
 *
 * Intro (first time in view): the outline resolves along the edge (~500ms), then the brain lights
 * up from the brainstem upward like neurons firing (~800ms). Idle: a ripple of brightness crosses
 * the folds every 4-6s; hovering triggers one immediately (as does `ref.current.pulse()`).
 * Mobile: intro only. Reduced motion: static final state. Paused off screen / tab hidden.
 */

const SCRAMBLE = "!<>-_\\/[]{}=+*^?#%@$&01"
const FONT = "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace"
const OUTLINE = "rgba(245,166,35,0.42)"
const BRAIN = [254, 178, 58] // site accent gold
const FLASH = [255, 243, 214] // #FFF3D6
const GLOW = "rgba(254,178,58,0.25)"

// Source drawing in units (box x -1..87, y 2..102)
const UX0 = -7, UY0 = 2, UW = 94, UH = 95
const HEAD = [
  [65, 95], [66, 90], [71, 84], [80, 72], [85, 56], [85, 40], [80, 25], [70, 13], [56, 6], [42, 5],
  // Forehead, a pronounced nose (tip repeated to keep it pointed), lips and chin: exaggerated a
  // little so the profile still reads at ~35 character columns
  [29, 9], [19, 17], [13, 27], [11, 36], [9, 44], [3, 51], [-5, 59], [-5, 59], [6, 62], [2, 66],
  [8, 69], [3, 73], [9, 77], [5, 83], [14, 88], [30, 88], [33, 95],
]
const BRAIN_SHAPE = [
  [26, 40], [23, 29], [28, 18], [39, 11], [53, 10], [66, 15], [75, 25], [78, 38], [73, 50], [62, 55],
  [50, 52], [38, 50], [29, 47],
]
// Fold (sulcus) curves carved out of the brain
const FOLDS = [
  [[30, 18], [35, 23], [40, 30], [33, 38], [27, 41]],
  [[40, 11], [46, 19], [48, 27], [52, 33], [45, 41], [39, 49]],
  [[60, 13], [57, 22], [64, 25], [70, 33], [61, 38], [52, 34]],
  [[76, 31], [68, 45], [57, 46], [50, 51]],
]
const STEM = [[57, 52], [58, 58], [59, 65]]
const CEREBELLUM = { x: 67, y: 58, rx: 7.5, ry: 4.5 }

const clamp = (v, lo, hi) => (v < lo ? lo : v > hi ? hi : v)
const mix = (a, b, k) => a.map((v, i) => v + (b[i] - v) * k)
const rgb = ([r, g, b], a = 1) => `rgba(${r | 0},${g | 0},${b | 0},${a.toFixed(3)})`
const LEVELS = ".:+#@"
const bump = (g, n = 1) => LEVELS[Math.min(LEVELS.length - 1, LEVELS.indexOf(g) + n)] || g

// Smooth curve through points (Catmull-Rom -> cubic Béziers)
function smoothPath(ctx, pts, closed = false) {
  const n = pts.length
  const at = (i) => (closed ? pts[(i + n) % n] : pts[clamp(i, 0, n - 1)])
  ctx.moveTo(...pts[0])
  for (let i = 0; i < (closed ? n : n - 1); i++) {
    const p0 = at(i - 1), p1 = at(i), p2 = at(i + 1), p3 = at(i + 2)
    ctx.bezierCurveTo(
      p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6,
      p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6,
      p2[0], p2[1]
    )
  }
  if (closed) ctx.closePath()
}

/** Samples the two source layers into a cols x rows grid of character cells. */
function buildGrid(cols, rows) {
  const SUB = 6
  const W = cols * SUB, H = rows * SUB
  // Units -> source pixels. One cell is SUB px in both directions, so stroke widths given in
  // cells come out even-weight in the character grid even though cells are taller than wide.
  const P = ([x, y]) => [((x - UX0) / UW) * W, ((y - UY0) / UH) * H]
  const sample = (paint) => {
    const c = document.createElement("canvas")
    c.width = W; c.height = H
    const g = c.getContext("2d", { willReadFrequently: true })
    paint(g)
    const px = g.getImageData(0, 0, W, H).data
    const out = new Float32Array(cols * rows)
    for (let r = 0; r < rows; r++)
      for (let q = 0; q < cols; q++) {
        let s = 0
        for (let y = 0; y < SUB; y++)
          for (let x = 0; x < SUB; x++) s += px[((r * SUB + y) * W + q * SUB + x) * 4 + 3]
        out[r * cols + q] = s / (SUB * SUB * 255)
      }
    return out
  }

  const brain = sample((g) => {
    g.fillStyle = "#000"
    g.beginPath(); smoothPath(g, BRAIN_SHAPE.map(P), true); g.fill()
    const [cx, cy] = P([CEREBELLUM.x, CEREBELLUM.y])
    g.beginPath()
    g.ellipse(cx, cy, (CEREBELLUM.rx / UW) * W, (CEREBELLUM.ry / UH) * H, 0, 0, Math.PI * 2)
    g.fill()
    g.lineCap = g.lineJoin = "round"
    g.lineWidth = SUB * 1.1
    g.strokeStyle = "#000"
    g.beginPath(); smoothPath(g, STEM.map(P)); g.stroke()
    // Carve the folds out of the lobes
    g.globalCompositeOperation = "destination-out"
    g.lineWidth = SUB * 0.85
    FOLDS.forEach((f) => { g.beginPath(); smoothPath(g, f.map(P)); g.stroke() })
    g.lineWidth = SUB * 0.5
    g.beginPath(); g.moveTo(cx - (CEREBELLUM.rx / UW) * W * 0.8, cy); g.lineTo(cx + (CEREBELLUM.rx / UW) * W * 0.8, cy); g.stroke()
  })

  // Head outline: walk the smoothed contour in cell coordinates and keep each cell it crosses,
  // giving a continuous chain one cell wide (staircase corners removed so the weight stays even)
  const headPts = HEAD.map(P).map(([x, y]) => [x / SUB, y / SUB])
  const n = headPts.length
  const at = (i) => headPts[clamp(i, 0, n - 1)]
  const chain = [] // { q, r, dx, dy }
  for (let i = 0; i < n - 1; i++) {
    const p0 = at(i - 1), p1 = at(i), p2 = at(i + 1), p3 = at(i + 2)
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6]
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6]
    for (let t = 0; t <= 1; t += 0.02) {
      const u = 1 - t
      const x = u * u * u * p1[0] + 3 * u * u * t * c1[0] + 3 * u * t * t * c2[0] + t * t * t * p2[0]
      const y = u * u * u * p1[1] + 3 * u * u * t * c1[1] + 3 * u * t * t * c2[1] + t * t * t * p2[1]
      const dx = 3 * u * u * (c1[0] - p1[0]) + 6 * u * t * (c2[0] - c1[0]) + 3 * t * t * (p2[0] - c2[0])
      const dy = 3 * u * u * (c1[1] - p1[1]) + 6 * u * t * (c2[1] - c1[1]) + 3 * t * t * (p2[1] - c2[1])
      const q = clamp(Math.floor(x), 0, cols - 1), r = clamp(Math.floor(y), 0, rows - 1)
      const last = chain[chain.length - 1]
      if (!last || last.q !== q || last.r !== r) chain.push({ q, r, dx, dy })
    }
  }
  // Drop staircase corners (a cell whose neighbours on either side meet diagonally), one at a
  // time, so the line stays one cell wide without gaps. Spikes like the nose tip are kept.
  const thin = []
  for (const c of chain) {
    const pp = thin[thin.length - 2]
    if (pp && Math.abs(pp.q - c.q) === 1 && Math.abs(pp.r - c.r) === 1) thin.pop()
    thin.push(c)
  }
  const seen = new Set()
  const outline = []
  thin.forEach((c, i) => {
    const key = c.r * cols + c.q
    if (seen.has(key)) return
    seen.add(key)
    // Slope in screen space (cells are 1.85x taller than wide)
    const horizontal = Math.abs(c.dy * 1.85) < Math.abs(c.dx) * 0.6
    outline.push({ q: c.q, r: c.r, g: horizontal ? "-" : ":", t: i / Math.max(1, thin.length - 1) })
  })

  const [stemX, stemY] = P(STEM[STEM.length - 1]).map((v) => v / SUB)

  const cells = []
  let maxD = 0
  for (let r = 0; r < rows; r++)
    for (let q = 0; q < cols; q++) {
      const b = brain[r * cols + q]
      if (b < 0.12) continue
      // A few clean levels: solid lobes, lighter fold channels and edges
      const g = b > 0.86 ? "@" : b > 0.66 ? "#" : b > 0.46 ? "+" : b > 0.28 ? ":" : "."
      // Distance from the brainstem (in cells, rows weighted by their taller height)
      const d = Math.hypot(q + 0.5 - stemX, (r + 0.5 - stemY) * 1.85)
      maxD = Math.max(maxD, d)
      cells.push({ q, r, g, brain: true, d, rand: Math.random() })
    }
  const taken = new Set(cells.map((c) => c.r * cols + c.q))
  outline.forEach((c) => { if (!taken.has(c.r * cols + c.q)) cells.push({ ...c, brain: false, rand: Math.random() }) })
  cells.forEach((c) => { if (c.brain) c.d /= maxD || 1 })
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
    const mobileMq = window.matchMedia?.("(max-width: 767px)")

    let cells = [], brainCells = []
    let W = 0, H = 0, cw = 0, ch = 0, fontPx = 9, bx0 = 0, bx1 = 1
    let visible = false, raf = 0, timer = 0
    let introAt = reduced ? -Infinity : null // null until first in view
    let ripple = null // { at }
    let nextRipple = Infinity
    let pausedAt = 0
    const HEAD_MS = 500, BRAIN_AT = 420, BRAIN_MS = 800, FLASH_MS = 260, RIPPLE_MS = 750
    const INTRO_END = BRAIN_AT + BRAIN_MS + FLASH_MS
    const idleOn = () => !reduced && !mobileMq?.matches
    const scheduleRipple = (now) => { nextRipple = idleOn() ? now + 4000 + Math.random() * 2000 : Infinity }

    const layout = () => {
      const rect = canvas.getBoundingClientRect()
      W = rect.width; H = rect.height
      if (W < 20 || H < 20) return
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      canvas.width = Math.round(W * dpr)
      canvas.height = Math.round(H * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      // Same cell proportions and weight as the Projects ASCII (rows 1.85x the column width)
      const cellW = H < 150 ? 3.7 : 4.6
      const cols = Math.max(12, Math.round(Math.min(W, (H * UW) / UH) / cellW))
      const rows = Math.max(8, Math.round((cols * cellW * (UH / UW)) / (cellW * 1.85)))
      cw = Math.min(W / cols, H / (rows * 1.85))
      ch = cw * 1.85
      fontPx = Math.min(ch, cw / 0.6) * 1.12
      cells = buildGrid(cols, rows)
      brainCells = cells.filter((c) => c.brain)
      const ox = (W - cols * cw) / 2, oy = (H - rows * ch) / 2
      cells.forEach((c) => { c.x = ox + (c.q + 0.5) * cw; c.y = oy + (c.r + 0.5) * ch })
      const xs = brainCells.map((c) => c.x)
      bx0 = Math.min(...xs); bx1 = Math.max(...xs)
      draw(performance.now())
    }

    const draw = (now) => {
      ctx.clearRect(0, 0, W, H)
      if (introAt == null) return
      ctx.font = `700 ${fontPx}px ${FONT}`
      ctx.textAlign = "center"
      ctx.textBaseline = "middle"
      const e = now - introAt
      const seed = Math.floor(now / 55)

      // Head outline: resolves along the contour
      ctx.shadowBlur = 0
      ctx.fillStyle = OUTLINE
      for (const c of cells) {
        if (c.brain) continue
        const at = c.t * HEAD_MS
        if (e < at) continue
        const g = e - at < 70 ? SCRAMBLE[(c.q * 7 + c.r * 13 + seed) % SCRAMBLE.length] : c.g
        ctx.fillText(g, c.x, c.y)
      }

      // Brain: neurons fire from the brainstem upward, then the idle ripple
      ctx.shadowColor = GLOW
      ctx.shadowBlur = 6
      const rp = ripple ? (now - ripple.at) / RIPPLE_MS : null
      for (const c of brainCells) {
        const fireAt = BRAIN_AT + (c.d * 0.9 + c.rand * 0.1) * BRAIN_MS
        let g = c.g, k = 0, a = 1
        if (e < fireAt) {
          if (e < BRAIN_AT) continue
          g = "."; a = 0.18 // not yet lit
        } else if (e - fireAt < FLASH_MS) {
          k = 1 - (e - fireAt) / FLASH_MS
          g = bump(c.g, k > 0.5 ? 2 : 1)
        }
        if (rp != null) {
          // A soft band of brightness crossing the folds front to back
          const pos = bx0 - 20 + (bx1 - bx0 + 40) * rp
          const band = Math.max(0, 1 - Math.abs(c.x - pos) / 18) * Math.sin(Math.PI * rp)
          if (band > 0.4) g = bump(g, 1)
          k = Math.max(k, band * 0.75)
        }
        ctx.fillStyle = rgb(mix(BRAIN, FLASH, k), a)
        ctx.fillText(g, c.x, c.y)
      }
      ctx.shadowBlur = 0
    }

    const step = (now) => {
      raf = 0
      if (!visible || document.hidden || reduced || introAt == null) return
      if (ripple && now - ripple.at > RIPPLE_MS) { ripple = null; scheduleRipple(now) }
      if (!ripple && now >= nextRipple && now - introAt > INTRO_END) ripple = { at: now }
      draw(now)
      if (now - introAt < INTRO_END || ripple) raf = requestAnimationFrame(step)
      else if (Number.isFinite(nextRipple)) timer = setTimeout(() => { timer = 0; wake() }, Math.max(16, nextRipple - performance.now()))
    }
    const wake = () => { if (!raf) { clearTimeout(timer); timer = 0; raf = requestAnimationFrame(step) } }
    const sleep = () => { cancelAnimationFrame(raf); clearTimeout(timer); raf = timer = 0 }

    const rippleNow = () => {
      if (reduced || introAt == null || ripple) return
      if (performance.now() - introAt < INTRO_END) return
      ripple = { at: performance.now() }
      wake()
    }
    api.pulse = rippleNow
    const onEnter = (e) => { if (e.pointerType !== "touch") rippleNow() }
    canvas.addEventListener("pointerenter", onEnter)

    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting
      if (visible && introAt == null) {
        introAt = performance.now()
        scheduleRipple(introAt + INTRO_END)
      }
      if (visible) { if (reduced) draw(performance.now()); else wake() }
      else sleep()
    }, { threshold: 0.4 })
    io.observe(canvas)

    const onVisibility = () => {
      if (document.hidden) { pausedAt = performance.now(); sleep(); return }
      // Resume the intro where it stopped
      const gap = pausedAt ? performance.now() - pausedAt : 0
      if (introAt != null && Number.isFinite(introAt)) introAt += gap
      nextRipple += gap
      if (visible) wake()
    }
    document.addEventListener("visibilitychange", onVisibility)

    const ro = new ResizeObserver(layout)
    ro.observe(canvas)
    document.fonts?.load?.(`700 10px 'JetBrains Mono'`).then(layout, () => {})
    layout()

    return () => {
      sleep()
      io.disconnect()
      ro.disconnect()
      canvas.removeEventListener("pointerenter", onEnter)
      document.removeEventListener("visibilitychange", onVisibility)
      api.pulse = () => {}
    }
  }, [])

  return <canvas ref={canvasRef} aria-hidden="true" className={`block ${className}`} />
}
