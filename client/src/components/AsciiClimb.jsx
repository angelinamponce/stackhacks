import { useEffect, useRef } from "react"
import { ticker } from "../lib/asciiArt"
import { useIntroDone } from "../lib/intro"

/*
 * Community hero: an original ASCII scene of one person helping another up a mountain to a flag.
 * Decorative (aria-hidden). Everything is drawn here as simple vector shapes / polylines (no image)
 * and rendered as monospace characters, like the other StackHacks ASCII.
 *
 * Scene: a jagged ridgeline rising to a ledge (edge in / ^ \ _), sparse rock texture with strata
 * lines along the slope, a switchback trail, a few boulders, a bright snowcap on the ledge edge;
 * two distant peaks (dim outlines, slow parallax) and a few twinkling stars. A gold helper on the
 * ledge reaches down to a cream climber on the slope; a gold pennant waves on a pole behind them.
 *
 * Intro (once per session, or ?replay=1): mountain resolves left to right, then the flag, then the
 * figures with their hands meeting last. ~300ms later the climb starts, and repeats every 6-8s (or
 * on hover): the helper pulls and the climber steps up in three steps onto the ledge (~2s), both
 * raise their arms in a V, hop twice, sparkles pop around their hands, a ~1s hold, then both fade
 * back to the start. The flag waves continuously (stronger during the celebration).
 * Mobile: intro + one climb, flag waving, no parallax or stars. Reduced motion: final celebration
 * pose, still flag. Runs on the shared animation loop (lib/asciiArt ticker): only on screen,
 * paused while the tab is hidden.
 */

export const CLIMB_SESSION_KEY = "sh:community-climb"
const RAMP = " .:-=+*#%@"
const SCRAMBLE = "!<>-_\\/[]{}=+*^?#%@$&01"
const FONT = "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace"
const SUB = 4
const UX0 = 0, UY0 = 2, UW = 110, UH = 98 // unit box drawn into the grid
const GOLD = "254,178,58", CREAM = "241,240,236"

// ── Geometry (units, y down) ──
const LEDGE_Y = 42
const POLE = { x: 96, top: 6 }
const PENNANT = { x: 96.6, top: 7, bottom: 16, tip: 108 }

// Deterministic pseudo-random numbers, so the mountain is the same every visit
function rng(seed) {
  let s = seed >>> 0
  return () => { s = (s + 0x6d2b79f5) >>> 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t ^= t + Math.imul(t ^ (t >>> 7), 61 | t); return ((t ^ (t >>> 14)) >>> 0) / 4294967296 }
}
const surfaceY = (x) => 96 - 0.871 * (x - 4)
// Jagged ridge from bottom-left up to the ledge corner
const RIDGE = (() => {
  const r = rng(7)
  const pts = [[1, 98]]
  for (let x = 5; x < 64; x += 3 + r() * 2.5) pts.push([x, surfaceY(x) + (r() - 0.55) * 4.2])
  pts.push([66, LEDGE_Y])
  return pts
})()
const LEDGE = [[66, LEDGE_Y], [111, LEDGE_Y]]
const MOUNTAIN_POLY = [...RIDGE, [111, LEDGE_Y], [111, 101], [-1, 101]]
// Rock strata: lines parallel to the slope, under the surface
const STRATA = [9, 19, 31, 44].map((off) => {
  const pts = []
  for (let x = 2; x <= 108; x += 2) { const y = Math.max(surfaceY(x), LEDGE_Y) + off; if (y < 99) pts.push([x, y]) }
  return pts
})
// Switchback trail up the face; its upper part runs where the climber steps
const TRAIL = [[10, 95], [30, 93], [22, 86], [44, 84], [34, 76], [52, 72], [44, 64], [56, 58.5], [52, 55], [62, 48], [66, 43.5]]
const BOULDERS = [[[26, 89], "o@"], [[47, 79], "@o"], [[37, 70.5], "o"], [[58, 63], "@"], [[18, 92.5], "o"]]
const FAR_PEAKS = [
  [[-2, 66], [10, 50], [16, 54], [28, 30], [36, 38], [44, 26], [58, 46]],
  [[52, 46], [66, 26], [72, 32], [84, 18], [94, 30], [104, 24], [112, 30]],
]
const STARS = [[6, 8], [18, 14], [31, 6], [44, 12], [56, 5], [70, 10], [80, 4], [12, 26], [62, 16]]

// ── Figures ──
// Pose joints: head, shoulder, hip, kneeA, footA, kneeB, footB, elbowA, handA (reaching), elbowB, handB
const J = (head, shoulder, hip, kneeA, footA, kneeB, footB, elbowA, handA, elbowB, handB) =>
  ({ head, shoulder, hip, kneeA, footA, kneeB, footB, elbowA, handA, elbowB, handB })
// Cream climber, stepping up the slope
const CLIMBER = [
  J([52.5, 32], [52, 38], [48, 48], [46, 55], [44, 61.2], [52, 50], [50, 55.9], [57, 35], [62, 32], [50, 43], [47, 46]),
  J([58.5, 27.5], [58, 33.5], [54, 43], [52, 50], [50, 55.9], [58, 45], [56, 50.7], [62, 31], [66, 29], [55, 38.5], [52.5, 41.5]),
  J([63.5, 23.5], [63, 29], [60, 38], [58, 45], [56, 50.7], [63.5, 40], [62, 45.5], [67, 27.5], [70, 27], [60.5, 34], [58, 36.5]),
  J([69, 17.5], [69, 23], [69, 31], [67, 37], [66, 42], [71.5, 37], [72, 42], [72, 27], [75, 29], [66, 27], [64.5, 31.5]),
]
// Gold helper, on the ledge, reaching down and pulling
const HELPER = [
  J([72, 18.5], [76, 23], [82, 31], [79, 37], [80, 42], [85, 37], [86, 42], [69, 27], [62, 32], [80, 28], [84, 31]),
  J([75, 18], [78, 23], [83, 31], [80, 37], [80, 42], [85.5, 37], [86, 42], [71.5, 26], [66, 29], [82, 28], [86, 31]),
  J([78.5, 17.5], [80, 23], [84, 31], [81, 37], [80, 42], [86, 37], [87, 42], [75, 26], [70, 27], [84, 28], [87.5, 31]),
  J([82, 17.5], [82, 23], [84, 31], [82, 37], [80, 42], [86, 37], [87, 42], [78, 27], [75, 29], [86, 27], [88, 31]),
]
const lerp = (a, b, t) => a + (b - a) * t
const lerpPt = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t)]
const lerpPose = (a, b, t) => Object.fromEntries(Object.keys(a).map((k) => [k, lerpPt(a[k], b[k], t)]))
const poseAt = (frames, t) => { const i = Math.min(frames.length - 2, Math.floor(t)); return lerpPose(frames[i], frames[i + 1], t - i) }
/** Arms raised in a V over the head (k = 0..1), body hopped up by `lift` units. */
function celebrate(p, k, lift) {
  const s = p.shoulder
  // A narrow, tall V so the two celebrating figures' hands stay apart
  const v = { ...p, elbowA: lerpPt(p.elbowA, [s[0] - 2.2, s[1] - 5.8], k), handA: lerpPt(p.handA, [s[0] - 3.8, s[1] - 12], k),
    elbowB: lerpPt(p.elbowB, [s[0] + 2.2, s[1] - 5.8], k), handB: lerpPt(p.handB, [s[0] + 3.8, s[1] - 12], k) }
  if (!lift) return v
  return Object.fromEntries(Object.entries(v).map(([key, [x, y]]) => [key, [x, y - lift]]))
}

function drawFigure(g, p, clasp) {
  g.lineCap = g.lineJoin = "round"
  const line = (w, ...pts) => { g.lineWidth = w; g.beginPath(); g.moveTo(...pts[0]); pts.slice(1).forEach((q) => g.lineTo(...q)); g.stroke() }
  line(3.4, p.shoulder, p.hip)
  line(2.5, p.hip, p.kneeA, p.footA)
  line(2.5, p.hip, p.kneeB, p.footB)
  line(2.2, p.shoulder, p.elbowA, p.handA)
  line(2.2, p.shoulder, p.elbowB, p.handB)
  g.beginPath(); g.arc(p.head[0], p.head[1], 4.3, 0, Math.PI * 2); g.fill()
  // Clasped hands: a small solid knot so the two hands read as connected
  if (clasp) { g.beginPath(); g.arc(p.handA[0], p.handA[1], 1.9, 0, Math.PI * 2); g.fill() }
}

/** Pole + pennant: a travelling sine ripple, still at the pole and strongest at the free edge. */
function drawFlag(g, amp, phase) {
  g.lineWidth = 1.4
  g.lineCap = "round"
  g.beginPath(); g.moveTo(POLE.x, LEDGE_Y); g.lineTo(POLE.x, POLE.top); g.stroke()
  const { x, top, bottom, tip } = PENNANT
  const mid = (top + bottom) / 2
  const N = 12
  const off = (u) => Math.sin(phase - u * 4.2) * 1.7 * amp * u
  g.beginPath()
  for (let i = 0; i <= N; i++) { const u = i / N; g.lineTo(lerp(x, tip, u), lerp(top, mid, u * 0.92) + off(u)) }
  for (let i = N; i >= 0; i--) { const u = i / N; g.lineTo(lerp(x, tip, u), lerp(bottom, mid, u * 0.92) + off(u)) }
  g.closePath(); g.fill()
}

/** Coverage sampler for a rectangle of cells (so moving parts only re-sample their own area). */
function makeSampler(cols, rows, q0 = 0, r0 = 0, qn = cols, rn = rows) {
  const W = qn * SUB, H = rn * SUB
  const c = document.createElement("canvas")
  c.width = W; c.height = H
  const g = c.getContext("2d", { willReadFrequently: true })
  const sx = (cols * SUB) / UW, sy = (rows * SUB) / UH
  return (paint) => {
    g.setTransform(1, 0, 0, 1, 0, 0)
    g.clearRect(0, 0, W, H)
    g.setTransform(sx, 0, 0, sy, -UX0 * sx - q0 * SUB, -UY0 * sy - r0 * SUB)
    g.fillStyle = g.strokeStyle = "#000"
    paint(g)
    const px = g.getImageData(0, 0, W, H).data
    const out = []
    for (let r = 0; r < rn; r++)
      for (let q = 0; q < qn; q++) {
        let s = 0
        for (let y = 0; y < SUB; y++) for (let x = 0; x < SUB; x++) s += px[((r * SUB + y) * W + q * SUB + x) * 4 + 3]
        s /= SUB * SUB * 255
        if (s >= 0.08) out.push([q0 + q, r0 + r, RAMP[Math.max(1, Math.round(Math.sqrt((s - 0.08) / 0.92) * (RAMP.length - 1)))]])
      }
    return out
  }
}

function inside(x, y, poly) {
  let hit = false
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i], [xj, yj] = poly[j]
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) hit = !hit
  }
  return hit
}

/** Cells along a polyline (one cell wide, no gaps), with the local direction in screen space. */
function traceCells(pts, cols, rows) {
  const toCell = ([x, y]) => [((x - UX0) / UW) * cols, ((y - UY0) / UH) * rows]
  const chain = []
  for (let i = 1; i < pts.length; i++) {
    const a = toCell(pts[i - 1]), b = toCell(pts[i])
    const n = Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) * 4) + 1
    const dx = b[0] - a[0], dy = (b[1] - a[1]) * 1.85
    for (let k = 0; k <= n; k++) {
      const q = Math.floor(lerp(a[0], b[0], k / n)), r = Math.floor(lerp(a[1], b[1], k / n))
      if (q < 0 || r < 0 || q >= cols || r >= rows) continue
      const last = chain[chain.length - 1]
      if (!last || last.q !== q || last.r !== r) chain.push({ q, r, dx, dy })
    }
  }
  const thin = []
  for (const c of chain) {
    const pp = thin[thin.length - 2]
    if (pp && Math.abs(pp.q - c.q) === 1 && Math.abs(pp.r - c.r) === 1) thin.pop()
    thin.push(c)
  }
  return thin
}
// Edge glyph from the direction of travel (screen space): rising "/", falling "\", flat "_"
const edgeGlyph = (dx, dy) => { const a = (Math.atan2(-dy, dx) * 180) / Math.PI; return Math.abs(a) < 20 ? "_" : a > 0 ? "/" : "\\" }

const clamp01 = (t) => (t < 0 ? 0 : t > 1 ? 1 : t)
const easeInOut = (t) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2)
const easeOut = (t) => 1 - (1 - t) ** 3

// Climb timeline (ms from the climb's start); the celebration holds until FADE starts
const STEPS = [[0, 550], [700, 1250], [1400, 2000]]
const ARMS = [2000, 2250], HOP_AT = 2250, HOP_MS = 300, HOPS = 2, SPARKLE_AT = 2250, SPARKLE_MS = 500
const BOOST = [2000, 3000], FADE = [3850, 4350]
const HOP_UNITS = 3 // ~1.5 rows
const FLAG_CYCLE = 1500
const INTRO = { mountain: 800, flag: [800, 1150], figures: [1150, 2000] }

function initialMode() {
  if (typeof window === "undefined") return "final"
  if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return "reduced"
  if (new URLSearchParams(window.location.search).get("replay") === "1") return "play"
  try { if (sessionStorage.getItem(CLIMB_SESSION_KEY)) return "final" } catch { /* storage blocked */ }
  return "play"
}

export default function AsciiClimb({ className = "" }) {
  const canvasRef = useRef(null)
  const introDone = useIntroDone()
  const driverRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    const mode = initialMode()
    const reduced = mode === "reduced"
    const mobile = !!window.matchMedia?.("(max-width: 1023px)").matches
    const sceneryOn = !mobile // stars + parallax
    const rand = (a, b) => a + Math.random() * (b - a)

    let W = 0, H = 0, cols = 0, rows = 0, cw = 0, ch = 0, ox = 0, oy = 0, fontPx = 10, dpr = 1
    let ready = false
    let mountain = [] // { q, r, g, a, col, lock }
    let far = [] // { q, r, g, lock }
    let stars = [] // { q, r, g, next, at }
    let flagSampler = null, figSampler = null
    let flagCells = [], climberCells = [], helperCells = []
    let mountainBmp = null, farBmp = null
    let sparkles = []
    const st = { pose: 0, celebrate: 0, lift: 0, figAlpha: 1, clasp: true, flagPhase: 0, flagAmp: reduced ? 0 : 1 }
    if (reduced) { st.pose = 3; st.celebrate = 1; st.clasp = false }
    let lastFrame = 0, introLock = null

    const cellX = (q) => ox + (q + 0.5) * cw
    const cellY = (r) => oy + (r + 0.5) * ch

    const sampleFigures = () => {
      const c = celebrate(poseAt(CLIMBER, st.pose), st.celebrate, st.lift)
      const h = celebrate(poseAt(HELPER, st.pose), st.celebrate, st.lift)
      climberCells = figSampler((g) => drawFigure(g, c, st.clasp))
      helperCells = figSampler((g) => drawFigure(g, h, st.clasp))
      return { c, h }
    }
    const sampleFlag = () => { flagCells = flagSampler((g) => drawFlag(g, st.flagAmp, st.flagPhase)) }

    // Static layers pre-rendered once per layout: the mountain and the distant peaks
    const renderStatic = () => {
      const make = () => {
        const c = document.createElement("canvas")
        c.width = canvas.width; c.height = canvas.height
        const g = c.getContext("2d")
        g.setTransform(dpr, 0, 0, dpr, 0, 0)
        g.font = `700 ${fontPx}px ${FONT}`; g.textAlign = "center"; g.textBaseline = "middle"
        return [c, g]
      }
      const [m, mg] = make()
      mg.shadowBlur = 6
      for (const c of mountain) { mg.shadowColor = `rgba(${c.col},${c.a * 0.4})`; mg.fillStyle = `rgba(${c.col},${c.a})`; mg.fillText(c.g, cellX(c.q), cellY(c.r)) }
      const [f, fg] = make()
      fg.fillStyle = `rgba(${GOLD},0.17)`
      for (const c of far) fg.fillText(c.g, cellX(c.q), cellY(c.r))
      mountainBmp = m; farBmp = f
    }

    // Moving glyphs clear their cell first, so the mountain never shows through behind them
    const glyphAt = (g, q, r, rgba, clear = true) => {
      if (clear) ctx.clearRect(ox + q * cw, oy + r * ch, cw, ch)
      ctx.fillStyle = rgba
      ctx.fillText(g, cellX(q), cellY(r))
    }

    const render = (now, e = Infinity) => {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.clearRect(0, 0, W, H)
      ctx.font = `700 ${fontPx}px ${FONT}`
      ctx.textAlign = "center"
      ctx.textBaseline = "middle"
      const seed = Math.floor(now / 55)
      const scramble = (q, r) => SCRAMBLE[(q * 7 + r * 13 + seed) % SCRAMBLE.length]

      if (e < Infinity) {
        // Intro: everything drawn live, locking in on its own schedule
        for (const c of far) { if (e < c.lock - 200) continue; ctx.fillStyle = `rgba(${GOLD},0.17)`; ctx.fillText(e < c.lock ? scramble(c.q, c.r) : c.g, cellX(c.q), cellY(c.r)) }
        for (const c of mountain) { if (e < c.lock - 220) continue; ctx.fillStyle = `rgba(${c.col},${c.a * (e < c.lock ? 0.7 : 1)})`; ctx.fillText(e < c.lock ? scramble(c.q, c.r) : c.g, cellX(c.q), cellY(c.r)) }
      } else {
        // Parallax: the distant peaks drift a pixel or two, very slowly
        const drift = sceneryOn && !reduced ? Math.sin(now / 7000) * 1.6 : 0
        ctx.setTransform(1, 0, 0, 1, 0, 0)
        if (farBmp) ctx.drawImage(farBmp, drift * dpr, 0)
        if (mountainBmp) ctx.drawImage(mountainBmp, 0, 0)
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      }

      // Stars, each twinkling at its own random intervals
      if (sceneryOn && e >= INTRO.mountain * 0.6) for (const s of stars) {
        let a = 0.22
        if (!reduced) {
          const t = (now - s.at) / 600
          if (t >= 0 && t < 1) a = 0.22 + 0.45 * Math.sin(t * Math.PI)
          if (now > s.next) { s.at = now; s.next = now + rand(1500, 4500) }
        }
        glyphAt(s.g, s.q, s.r, `rgba(${CREAM},${a})`, false)
      }

      ctx.shadowBlur = 6
      // Flag
      ctx.shadowColor = "rgba(254,178,58,0.25)"
      for (const [q, r, g] of flagCells) {
        if (e < Infinity) {
          const lock = introLock.flag(q, r)
          if (e < lock - 200) continue
          glyphAt(e < lock ? scramble(q, r) : g, q, r, `rgba(${GOLD},1)`)
          continue
        }
        glyphAt(g, q, r, `rgba(${GOLD},1)`)
      }
      // Figures: gold helper, then the cream climber on top
      const drawFig = (cells, col, glow) => {
        ctx.shadowColor = glow
        for (const [q, r, g] of cells) {
          if (e < Infinity) {
            const lock = introLock.fig(q, r)
            if (e < lock - 220) continue
            glyphAt(e < lock ? scramble(q, r) : g, q, r, `rgba(${col},${e < lock ? 0.6 : 1})`)
            continue
          }
          if (st.figAlpha <= 0.01) continue
          glyphAt(g, q, r, `rgba(${col},${st.figAlpha})`)
        }
      }
      drawFig(helperCells, GOLD, "rgba(254,178,58,0.25)")
      drawFig(climberCells, CREAM, "rgba(241,240,236,0.22)")
      // Sparkles around the raised hands
      ctx.shadowColor = "rgba(254,178,58,0.5)"
      for (const s of sparkles) {
        const t = (now - s.at) / SPARKLE_MS
        if (t < 0 || t >= 1) continue
        ctx.fillStyle = `rgba(${GOLD},${1 - t})`
        ctx.fillText(s.g, s.x, s.y - t * ch * 0.6)
      }
      ctx.shadowBlur = 0
    }

    const d = {
      visible: false,
      ready: false,
      static: reduced,
      idle: !reduced,
      introDone: mode !== "play",
      nextFlickerAt: Infinity,
      nextClimb: Infinity,
      climbsLeft: mobile ? 1 : Infinity,
      anim: null, // { kind: 'intro' | 'climb', start }
      tick(now) {
        if (!this.visible || !ready) return
        const dt = Math.min(64, now - (lastFrame || now))
        const a = this.anim
        // Idle frames (only the flag, stars and parallax move) run at ~30fps
        if (!a && now - lastFrame < 32) return
        lastFrame = now

        // Flag: continuous ripple, boosted ~1.5x during the celebration
        let boost = 0
        if (a?.kind === "climb") { const e = now - a.start; boost = e > BOOST[0] && e < BOOST[1] ? Math.sin(((e - BOOST[0]) / (BOOST[1] - BOOST[0])) * Math.PI) : 0 }
        st.flagAmp = 1 + 0.5 * boost
        st.flagPhase += (dt / FLAG_CYCLE) * Math.PI * 2 * (1 + 0.5 * boost)
        sampleFlag()

        if (a?.kind === "intro") {
          const e = now - a.start
          render(now, e)
          if (e >= INTRO.figures[1] + 100) {
            this.anim = null
            this.introDone = true
            this.nextClimb = this.climbsLeft > 0 ? now + 300 : Infinity // the climb starts right after the intro
          }
          return
        }
        if (!a && this.introDone && now >= this.nextClimb && this.climbsLeft > 0) this.startClimb(now)
        if (this.anim?.kind === "climb") this.stepClimb(now)
        render(now)
      },
      startClimb(now) {
        this.climbsLeft--
        this.anim = { kind: "climb", start: now }
        this.nextClimb = this.climbsLeft > 0 ? now + rand(6000, 8000) : Infinity
        sparkles = []
        ticker.wake()
      },
      stepClimb(now) {
        const e = now - this.anim.start
        // Steps up the slope, with short pauses between them
        let pose = 3
        for (let i = 0; i < STEPS.length; i++) {
          const [s, en] = STEPS[i]
          if (e < s) { pose = i; break }
          if (e < en) { pose = i + easeInOut((e - s) / (en - s)); break }
        }
        st.pose = pose
        st.clasp = e < ARMS[0]
        st.celebrate = easeOut(clamp01((e - ARMS[0]) / (ARMS[1] - ARMS[0])))
        const h = e - HOP_AT
        st.lift = h > 0 && h < HOP_MS * HOPS ? Math.sin(((h % HOP_MS) / HOP_MS) * Math.PI) * HOP_UNITS : 0
        // Fade out, jump back to the start, fade in
        const f = (e - FADE[0]) / (FADE[1] - FADE[0])
        if (f >= 0.5) { st.pose = 0; st.celebrate = 0; st.clasp = true; st.lift = 0 }
        st.figAlpha = f <= 0 || f >= 1 ? 1 : f < 0.5 ? 1 - f * 2 : (f - 0.5) * 2
        const { c, h: hp } = sampleFigures()
        if (e >= SPARKLE_AT && !sparkles.length) {
          // A few sparkles around the four raised hands
          for (const hand of [c.handA, c.handB, hp.handA, hp.handB]) {
            for (let k = 0; k < 2; k++) {
              const x = hand[0] + rand(-4, 4), y = hand[1] + rand(-4, 1.5)
              sparkles.push({ x: ox + ((x - UX0) / UW) * cols * cw, y: oy + ((y - UY0) / UH) * rows * ch, g: "*+·"[Math.floor(Math.random() * 3)], at: now + rand(0, 180) })
            }
          }
        }
        if (e >= FADE[1]) {
          this.anim = null
          Object.assign(st, { pose: 0, celebrate: 0, lift: 0, figAlpha: 1, clasp: true })
          sampleFigures()
        }
      },
      needsFrames() { return this.visible && !this.static && ready },
      maybeStart() {
        if (this.introDone || this.anim || !this.visible || !this.ready || !ready) return
        try { sessionStorage.setItem(CLIMB_SESSION_KEY, "1") } catch { /* storage blocked */ }
        this.anim = { kind: "intro", start: performance.now() }
        ticker.wake()
      },
    }
    driverRef.current = d

    const layout = () => {
      const rect = canvas.getBoundingClientRect()
      W = rect.width; H = rect.height
      if (W < 20 || H < 20) return
      dpr = Math.min(window.devicePixelRatio || 1, 2)
      canvas.width = Math.round(W * dpr)
      canvas.height = Math.round(H * dpr)
      const aspect = UW / UH
      const lw = Math.min(W * 0.96, H * 0.96 * aspect)
      cols = Math.max(56, Math.min(100, Math.round(lw / 5.2)))
      cw = lw / cols
      rows = Math.round(lw / aspect / (cw * 1.85))
      ch = lw / aspect / rows
      ox = (W - cols * cw) / 2; oy = (H - rows * ch) / 2
      fontPx = Math.min(ch, cw / 0.6) * 1.12
      const uToQ = (x) => Math.floor(((x - UX0) / UW) * cols), uToR = (y) => Math.floor(((y - UY0) / UH) * rows)
      const unitsOf = (q, r) => [UX0 + ((q + 0.5) / cols) * UW, UY0 + ((r + 0.5) / rows) * UH]
      const mountainLock = (q) => 80 + (q / cols) * (INTRO.mountain - 160) + Math.random() * 80

      // Mountain cells, highest priority first: snowcap, ridge edge, trail, boulders, strata, texture
      const taken = new Map()
      const put = (q, r, g, a, col = GOLD) => {
        const key = r * cols + q
        if (q < 0 || r < 0 || q >= cols || r >= rows || taken.has(key)) return
        taken.set(key, { q, r, g, a, col, lock: mountainLock(q) })
      }
      for (const c of traceCells(LEDGE, cols, rows)) put(c.q, c.r, Math.random() < 0.5 ? "=" : "~", 0.85, CREAM) // snowcap
      const ridge = traceCells(RIDGE, cols, rows)
      ridge.forEach((c, i) => {
        const prev = ridge[i - 1], next = ridge[i + 1]
        const peak = prev && next && prev.r > c.r && next.r > c.r
        put(c.q, c.r, peak ? "^" : edgeGlyph(c.dx, c.dy), 0.6)
      })
      traceCells(TRAIL, cols, rows).forEach((c, i) => { if (i % 2 === 0) put(c.q, c.r, i % 4 === 0 ? ":" : ".", 0.42) })
      for (const [[x, y], gl] of BOULDERS) [...gl].forEach((g, k) => put(uToQ(x) + k, uToR(y), g, 0.55))
      const r2 = rng(11)
      for (const line of STRATA) traceCells(line, cols, rows).forEach((c) => { if (r2() < 0.55) put(c.q, c.r, edgeGlyph(c.dx, c.dy) === "_" ? "_" : "/", 0.28) })
      const tex = ".:-~'"
      for (let r = 0; r < rows; r++)
        for (let q = 0; q < cols; q++) {
          const [x, y] = unitsOf(q, r)
          if (!inside(x, y, MOUNTAIN_POLY) || y < LEDGE_Y + 1.5) continue
          if (r2() < 0.16) put(q, r, tex[Math.floor(r2() * tex.length)], 0.3)
        }
      mountain = [...taken.values()]
      // Distant peaks: outlines only, hidden behind the main mountain
      far = []
      FAR_PEAKS.forEach((pk) => traceCells(pk, cols, rows).forEach((c, i, arr) => {
        const [x, y] = unitsOf(c.q, c.r)
        if (inside(x, y, MOUNTAIN_POLY) || taken.has(c.r * cols + c.q)) return
        const prev = arr[i - 1], next = arr[i + 1]
        const peak = prev && next && prev.r > c.r && next.r > c.r
        far.push({ q: c.q, r: c.r, g: peak ? "^" : edgeGlyph(c.dx, c.dy), lock: mountainLock(c.q) })
      }))
      stars = sceneryOn ? STARS.map(([x, y], i) => ({ q: uToQ(x), r: uToR(y), g: i % 3 ? "·" : "*", at: -1e9, next: performance.now() + rand(300, 4000) })) : []

      // Moving parts only re-sample their own area
      const fq0 = Math.max(0, uToQ(POLE.x - 1.5)), fr0 = Math.max(0, uToR(POLE.top - 3))
      flagSampler = makeSampler(cols, rows, fq0, fr0, Math.min(cols - 1, uToQ(PENNANT.tip + 2)) - fq0 + 1, uToR(LEDGE_Y) - fr0 + 1)
      const gq0 = uToQ(38), gr0 = 0
      figSampler = makeSampler(cols, rows, gq0, gr0, uToQ(95) - gq0 + 1, Math.min(rows, uToR(66)) - gr0)
      sampleFlag()
      sampleFigures()
      // Intro lock times for the flag (bottom to top) and the figures (hands meeting last)
      const clasp = HELPER[0].handA
      introLock = {
        flag: (q, r) => { const [, y] = unitsOf(q, r); return INTRO.flag[0] + 150 + ((LEDGE_Y - y) / (LEDGE_Y - POLE.top)) * (INTRO.flag[1] - INTRO.flag[0] - 150) },
        fig: (q, r) => { const [x, y] = unitsOf(q, r); const dist = clamp01(Math.hypot(x - clasp[0], y - clasp[1]) / 34); return INTRO.figures[0] + 220 + (1 - dist) * (INTRO.figures[1] - INTRO.figures[0] - 300) },
      }
      renderStatic()
      ready = true
      if (d.anim) return
      if (d.introDone) render(performance.now())
      else d.maybeStart()
    }

    // Later visits: the first climb comes soon after the hero is shown
    if (d.introDone && !reduced) d.nextClimb = performance.now() + (mobile ? 600 : rand(1500, 3000))
    ticker.add(d)

    // Hover (desktop): climb now if one isn't running
    const onEnter = (ev) => {
      if (ev.pointerType !== "mouse" || mobile || reduced || !d.introDone || d.anim) return
      d.startClimb(performance.now())
    }
    canvas.addEventListener("pointerenter", onEnter)

    const io = new IntersectionObserver(([en]) => {
      d.visible = en.isIntersecting
      if (d.visible) { d.maybeStart(); if (ready && d.introDone && !d.anim) render(performance.now()) }
      ticker.wake()
    }, { threshold: 0.3 })
    io.observe(canvas)
    const ro = new ResizeObserver(layout)
    ro.observe(canvas)
    document.fonts?.load?.(`700 10px 'JetBrains Mono'`).then(layout, () => {})
    layout()

    return () => {
      ticker.remove(d)
      io.disconnect()
      ro.disconnect()
      canvas.removeEventListener("pointerenter", onEnter)
      driverRef.current = null
    }
  }, [])

  // The intro waits for the first-visit splash
  useEffect(() => {
    const d = driverRef.current
    if (!d) return
    d.ready = introDone
    d.maybeStart()
  }, [introDone])

  return <canvas ref={canvasRef} aria-hidden="true" className={`block ${className}`} />
}
