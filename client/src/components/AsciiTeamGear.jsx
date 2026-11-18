import { useEffect, useRef } from "react"
import { ticker } from "../lib/asciiArt"
import { useIntroDone } from "../lib/intro"

/*
 * ASCII team-and-gear icon for the E-Board hero: three figures above the lower half of a gear.
 * Decorative (aria-hidden).
 *
 * Two layers, both drawn as clean vector shapes on an offscreen canvas and sampled per character
 * cell into " .:-=+*#%@" (same method and type as the Projects and About page ASCII):
 *   - figures: sampled once and cached; full gold
 *   - gear (8 teeth, inner ring): re-drawn at its current angle, masked to below the gap line
 *     under the figures, and re-sampled on every frame it moves; ~70% gold
 *
 * Intro (once per session, or ?replay=1): the figures resolve from random glyphs top to bottom,
 * then the gear resolves and makes one full turn. Every 5-8s the gear ratchets one tooth (45°)
 * with a small overshoot. Hover (desktop): it spins gently, then eases to the nearest tooth.
 * Mobile: intro and ratchet only. Reduced motion: static. Runs on the shared animation loop
 * (lib/asciiArt ticker): only on screen, paused while the tab is hidden.
 */

export const GEAR_SESSION_KEY = "sh:eboard-gear"
const RAMP = " .:-=+*#%@"
const SCRAMBLE = "!<>-_\\/[]{}=+*^?#%@$&01"
const FONT = "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace"
const GOLD = "254,178,58"
const GEAR_ALPHA = 0.7
const GLOW = "rgba(254,178,58,0.25)"
const SUB = 4

// Geometry in a 100 x 100 unit box
const GEAR = { cx: 50, cy: 59, base: 30, tip: 38, hole: 20, hubOuter: 13, hubInner: 8.5, teeth: 8 }
const MASK_Y = 61.5 // gear only shows below this line (the gap under the figures starts at 56)
const TOOTH = 360 / GEAR.teeth

const FIGURES_MS = 600, GEAR_RESOLVE_MS = 220, SPIN_MS = 1200
const RATCHET_MS = 500, HOVER_SPEED = 0.06 /* deg per ms */, SETTLE_MS = 450

const clamp01 = (t) => (t < 0 ? 0 : t > 1 ? 1 : t)
const easeOutCubic = (t) => 1 - (1 - t) ** 3
const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2)
// Ratchet: fast start up to a ~3° overshoot, then settle back onto the tooth
const ratchet = (t) => (t < 0.55 ? easeOutCubic(t / 0.55) * (48 / 45) : 48 / 45 - easeInOut((t - 0.55) / 0.45) * (3 / 45))

function initialMode() {
  if (typeof window === "undefined") return "final"
  if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return "reduced"
  if (new URLSearchParams(window.location.search).get("replay") === "1") return "play"
  try { if (sessionStorage.getItem(GEAR_SESSION_KEY)) return "final" } catch { /* storage blocked */ }
  return "play"
}

function drawFigures(g) {
  const head = (x, y, r) => { g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill() }
  const center = new Path2D("M33 56 L33 49 Q33 36 50 35.5 Q67 36 67 49 L67 56 Z")
  // Side figures (behind)
  head(22, 28, 7.5)
  head(78, 28, 7.5)
  g.fill(new Path2D("M8 56 L8 51 Q8 40 22 39.5 Q30 39.7 34 45 L34 56 Z"))
  g.fill(new Path2D("M92 56 L92 51 Q92 40 78 39.5 Q70 39.7 66 45 L66 56 Z"))
  // Gap around the taller centre figure so it stands in front
  g.save()
  g.globalCompositeOperation = "destination-out"
  g.lineWidth = 3.2
  g.stroke(center)
  g.beginPath(); g.arc(50, 21, 9.5 + 1.6, 0, Math.PI * 2); g.fill()
  g.restore()
  head(50, 21, 9.5)
  g.fill(center)
  // Collar and tie: carve a V and a kite, then fill the tie back in
  g.save()
  g.globalCompositeOperation = "destination-out"
  g.fill(new Path2D("M43.5 35.5 L50 42 L56.5 35.5 Z"))
  g.fill(new Path2D("M50 38 L45.5 45 L50 56.5 L54.5 45 Z"))
  g.restore()
  g.fill(new Path2D("M48.3 40.5 L51.7 40.5 L50 42.6 Z"))
  g.fill(new Path2D("M50 42.6 L47.6 45.5 L50 54 L52.4 45.5 Z"))
}

function drawGear(g, angleDeg) {
  const { cx, cy, base, tip, hole, hubOuter, hubInner, teeth } = GEAR
  const rad = (d) => (d * Math.PI) / 180
  g.save()
  g.translate(cx, cy)
  g.rotate(rad(angleDeg))
  g.beginPath()
  for (let k = 0; k < teeth; k++) {
    const a = k * TOOTH
    const pts = [[base, a - 13], [tip, a - 8.5], [tip, a + 8.5], [base, a + 13]]
    pts.forEach(([r, d], i) => {
      const x = r * Math.cos(rad(d)), y = r * Math.sin(rad(d))
      if (k === 0 && i === 0) g.moveTo(x, y)
      else g.lineTo(x, y)
    })
    g.arc(0, 0, base, rad(a + 13), rad(a + TOOTH - 13))
  }
  g.closePath()
  g.fill()
  g.globalCompositeOperation = "destination-out"
  g.beginPath(); g.arc(0, 0, hole, 0, Math.PI * 2); g.fill()
  g.globalCompositeOperation = "source-over"
  // Inner ring
  g.beginPath(); g.arc(0, 0, hubOuter, 0, Math.PI * 2); g.arc(0, 0, hubInner, 0, Math.PI * 2, true); g.fill()
  g.restore()
  // Mask: only the part below the gap line shows
  g.clearRect(0, 0, 100, MASK_Y)
}

/** Returns a function giving the glyph per cell for whatever `paint` draws in the 100x100 box. */
function makeSampler(cols, rows) {
  const W = cols * SUB, H = rows * SUB
  const c = document.createElement("canvas")
  c.width = W; c.height = H
  const g = c.getContext("2d", { willReadFrequently: true })
  return (paint) => {
    g.setTransform(1, 0, 0, 1, 0, 0)
    g.clearRect(0, 0, W, H)
    g.setTransform(W / 100, 0, 0, H / 100, 0, 0)
    g.fillStyle = "#000"
    paint(g)
    const px = g.getImageData(0, 0, W, H).data
    const glyphs = new Array(cols * rows)
    for (let r = 0; r < rows; r++)
      for (let q = 0; q < cols; q++) {
        let s = 0
        for (let y = 0; y < SUB; y++) for (let x = 0; x < SUB; x++) s += px[((r * SUB + y) * W + q * SUB + x) * 4 + 3]
        s /= SUB * SUB * 255
        glyphs[r * cols + q] = s < 0.1 ? " " : RAMP[Math.max(1, Math.round(Math.sqrt((s - 0.1) / 0.9) * (RAMP.length - 1)))]
      }
    return glyphs
  }
}

export default function AsciiTeamGear({ className = "" }) {
  const canvasRef = useRef(null)
  const introDone = useIntroDone()
  const driverRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    const mode = initialMode()
    const mobile = !!window.matchMedia?.("(max-width: 1023px)").matches
    const rand = (a, b) => a + Math.random() * (b - a)

    let W = 0, H = 0, cols = 0, rows = 0, cw = 0, ch = 0, fontPx = 10
    let sample = null, figures = null, gearGlyphs = null, gearAt = null
    const cellRand = []

    const d = {
      visible: false,
      ready: false, // the first-visit splash has handed over
      static: mode === "reduced",
      idle: mode !== "reduced",
      introDone: mode !== "play",
      nextFlickerAt: Infinity, // next ratchet
      anim: null, // { kind: 'intro' | 'ratchet' | 'spin' | 'settle', start, from?, to? }
      angle: 0,
      tick(now) {
        if (!this.visible || !figures) return
        const a = this.anim
        if (!a) {
          if (this.idle && this.introDone && now >= this.nextFlickerAt) this.anim = { kind: "ratchet", start: now, from: this.angle }
          return
        }
        const e = now - a.start
        if (a.kind === "intro") {
          this.angle = -360 + 360 * easeOutCubic(clamp01((e - FIGURES_MS) / SPIN_MS))
          draw(now, e)
          if (e >= FIGURES_MS + SPIN_MS) { this.anim = null; this.introDone = true; this.angle = 0; this.schedule(now) }
          return
        }
        if (a.kind === "ratchet") {
          const p = clamp01(e / RATCHET_MS)
          this.angle = a.from + TOOTH * ratchet(p)
          if (p >= 1) { this.angle = a.from + TOOTH; this.anim = null; this.schedule(now) }
        } else if (a.kind === "spin") {
          this.angle = a.from + e * HOVER_SPEED
        } else if (a.kind === "settle") {
          const p = clamp01(e / SETTLE_MS)
          this.angle = a.from + (a.to - a.from) * easeOutCubic(p)
          if (p >= 1) { this.angle = a.to; this.anim = null; this.schedule(now) }
        }
        draw(now, Infinity)
      },
      needsFrames() { return this.visible && !!this.anim },
      schedule(now) { this.nextFlickerAt = this.static ? Infinity : now + rand(5000, 8000) },
      maybeStart() {
        if (this.introDone || this.anim || !this.visible || !this.ready || !figures) return
        try { sessionStorage.setItem(GEAR_SESSION_KEY, "1") } catch { /* storage blocked */ }
        this.anim = { kind: "intro", start: performance.now() }
        ticker.wake()
      },
    }
    driverRef.current = d

    const draw = (now, e) => {
      ctx.clearRect(0, 0, W, H)
      if (!figures) return
      // Re-sample the gear only when its angle changed
      if (gearAt !== d.angle) { gearGlyphs = sample((g) => drawGear(g, d.angle)); gearAt = d.angle }
      ctx.font = `700 ${fontPx}px ${FONT}`
      ctx.textAlign = "center"
      ctx.textBaseline = "middle"
      ctx.shadowColor = GLOW
      ctx.shadowBlur = 6
      const seed = Math.floor(now / 55)
      const figureRows = Math.ceil(rows * 0.58)
      for (let r = 0; r < rows; r++)
        for (let q = 0; q < cols; q++) {
          const i = r * cols + q
          const x = (q + 0.5) * cw, y = (r + 0.5) * ch
          let g = figures[i]
          if (g !== " ") {
            // Intro: figures lock in top to bottom
            if (e < (r / figureRows) * FIGURES_MS * 0.8 + cellRand[i] * FIGURES_MS * 0.2) g = SCRAMBLE[(q * 7 + r * 13 + seed) % SCRAMBLE.length]
            ctx.fillStyle = `rgba(${GOLD},1)`
            ctx.fillText(g, x, y)
            continue
          }
          g = gearGlyphs[i]
          if (g === " " || e < FIGURES_MS) continue
          if (e < FIGURES_MS + GEAR_RESOLVE_MS * (0.4 + 0.6 * cellRand[i])) g = SCRAMBLE[(q * 5 + r * 3 + seed) % SCRAMBLE.length]
          ctx.fillStyle = `rgba(${GOLD},${GEAR_ALPHA})`
          ctx.fillText(g, x, y)
        }
      ctx.shadowBlur = 0
    }

    const layout = () => {
      const rect = canvas.getBoundingClientRect()
      W = rect.width; H = rect.height
      if (W < 20 || H < 20) return
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      canvas.width = Math.round(W * dpr)
      canvas.height = Math.round(H * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      // ~45-80 columns (rows 1.85x the column width, as in the Projects / About ASCII)
      cols = Math.max(44, Math.min(80, Math.round(W / 6.5)))
      cw = W / cols
      rows = Math.round(H / (cw * 1.85))
      ch = H / rows
      fontPx = Math.min(ch, cw / 0.6) * 1.12
      sample = makeSampler(cols, rows)
      figures = sample(drawFigures)
      gearAt = null
      cellRand.length = 0
      for (let i = 0; i < cols * rows; i++) cellRand.push(Math.random())
      if (d.anim) return
      if (d.introDone) draw(performance.now(), Infinity)
      else d.maybeStart()
    }

    if (d.introDone) d.schedule(performance.now())
    ticker.add(d)

    // Hover (desktop): spin gently, then settle on the nearest tooth ahead
    const onEnter = (ev) => {
      if (ev.pointerType !== "mouse" || mobile || d.static || !d.introDone) return
      d.anim = { kind: "spin", start: performance.now(), from: d.angle }
      ticker.wake()
    }
    const onLeave = () => {
      if (d.anim?.kind !== "spin") return
      d.anim = { kind: "settle", start: performance.now(), from: d.angle, to: Math.ceil(d.angle / TOOTH) * TOOTH }
      ticker.wake()
    }
    canvas.addEventListener("pointerenter", onEnter)
    canvas.addEventListener("pointerleave", onLeave)

    const io = new IntersectionObserver(([en]) => {
      d.visible = en.isIntersecting
      if (d.visible) { d.maybeStart(); if (d.introDone && !d.anim) draw(performance.now(), Infinity) }
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
      canvas.removeEventListener("pointerleave", onLeave)
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
