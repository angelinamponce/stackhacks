import { useEffect, useRef } from "react"
import { loadImage, ticker } from "../lib/asciiArt"

/*
 * The home hero's SH mark as ASCII (same type and " .:-=+*#%@" ramp as the other StackHacks ASCII),
 * sampled from public/SHTrans.png with each cell's colour taken from the artwork: a cream/white S,
 * the orange-gold H gradient, and a single column of "|" for the divider in pale cream with a glow.
 *
 * - Intro (`startAt` set): the S and H characters fly in from scattered positions on opposite sides
 *   and settle into place; the divider draws top to bottom last.
 * - Cursor scramble (mouse only): characters within ~70px scramble, then resolve ~250ms after the
 *   cursor moves on. Click/tap: a decode wave sweeps left to right while the S and H push ~8px away
 *   from the divider and snap back. The divider pulses like a text cursor (~1.2s).
 * - Idle: every 6-10s a quick glitch offsets 2-3 horizontal slices for ~120ms.
 * Runs on the shared animation loop (lib/asciiArt ticker): only on screen, paused while the tab is
 * hidden. Reduced motion: static. Calls onFail() if the artwork can't be sampled.
 */

const SRC = `${import.meta.env.BASE_URL}SHTrans.png`
// Logo crop and regions in SHTrans.png pixels (see components/ShLogo.jsx)
const CROP = { x: 90, y: 40, w: 310, h: 388 }
const S_MAX_X = 228, LINE_MAX_X = 251, LINE_CENTER = 240
const LOGO_ASPECT = CROP.w / CROP.h
const RAMP = " .:-=+*#%@"
const SCRAMBLE = "!<>-_\\/[]{}=+*^?#%@$&01"
const FONT = "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace"
const LINE_RGB = [255, 244, 220]
const SUB = 4

// Intro timeline (ms from startAt, desktop; mobile is shortened by `introScale`)
const T = { assemble: [800, 2200], fly: [600, 760], line: [1900, 2250] }
const SCRAMBLE_R = 70, HEAT_MS = 250, WAVE_MS = 700, PUSH_MS = 420, PUSH_PX = 8
const GLITCH_MS = 120

const clamp01 = (t) => (t < 0 ? 0 : t > 1 ? 1 : t)
const easeOut = (t) => 1 - (1 - t) ** 3
const bez = (a, c, b, t) => [(1 - t) ** 2 * a[0] + 2 * (1 - t) * t * c[0] + t * t * b[0], (1 - t) ** 2 * a[1] + 2 * (1 - t) * t * c[1] + t * t * b[1]]
const scrambleAt = (q, r, now) => SCRAMBLE[(q * 7 + r * 13 + Math.floor(now / 50)) % SCRAMBLE.length]

/** Samples the artwork into covered cells: { q, r, region, g, rgb }. Throws if it can't read pixels. */
function sampleLogo(img, cols, rows) {
  const W = cols * SUB, H = rows * SUB
  const c = document.createElement("canvas")
  c.width = W; c.height = H
  const g = c.getContext("2d", { willReadFrequently: true })
  g.drawImage(img, CROP.x, CROP.y, CROP.w, CROP.h, 0, 0, W, H)
  const px = g.getImageData(0, 0, W, H).data
  const lineCol = Math.round(((LINE_CENTER - CROP.x) / CROP.w) * cols - 0.5)
  const out = []
  for (let r = 0; r < rows; r++)
    for (let q = 0; q < cols; q++) {
      let a = 0, R = 0, G = 0, B = 0
      for (let y = 0; y < SUB; y++)
        for (let x = 0; x < SUB; x++) {
          const o = ((r * SUB + y) * W + q * SUB + x) * 4
          const al = px[o + 3] / 255
          a += al; R += px[o] * al; G += px[o + 1] * al; B += px[o + 2] * al
        }
      const cov = a / (SUB * SUB)
      const srcX = CROP.x + ((q + 0.5) / cols) * CROP.w
      const region = srcX < S_MAX_X ? "s" : srcX < LINE_MAX_X ? "line" : "h"
      if (region === "line") { if (q === lineCol && cov >= 0.15) out.push({ q, r, region, g: "|", rgb: LINE_RGB }); continue }
      if (cov < 0.12) continue
      const glyph = RAMP[Math.max(1, Math.round(Math.sqrt((cov - 0.12) / 0.88) * (RAMP.length - 1)))]
      out.push({ q, r, region, g: glyph, rgb: [R / a, G / a, B / a] })
    }
  return out
}

export default function AsciiShLogo({ startAt = null, waiting = false, introScale = 1, reduced = false, onFail, onIntroEnd, className = "", style }) {
  const canvasRef = useRef(null)
  const driverRef = useRef(null)
  const failRef = useRef(onFail)
  const endRef = useRef(onIntroEnd)
  // While the intro is pending (waiting for the splash), nothing is drawn
  const waitingRef = useRef(waiting)
  useEffect(() => { failRef.current = onFail; endRef.current = onIntroEnd; waitingRef.current = waiting })

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    const rand = (a, b) => a + Math.random() * (b - a)
    let W = 0, H = 0, dpr = 1, cw = 0, ch = 0, ox = 0, oy = 0, fontPx = 10, rows = 0
    let cells = [], lineCells = []
    let bmp = { s: null, h: null }
    let img = null, lastFrame = 0
    let mouse = null
    const heat = new Map() // cell index -> 0..1
    const fx = { wave: null, push: null, glitch: null } // start times / glitch slices

    const d = {
      visible: false, static: reduced, idle: !reduced, introDone: true, nextFlickerAt: Infinity,
      anim: null, // { start } while the intro plays
      nextGlitch: Infinity,
      tick(now) {
        if (!this.visible || !cells.length) return
        if (this.anim) {
          const e = (now - this.anim.start) / introScale
          drawIntro(now, e)
          if (e >= T.line[1] + 80) { this.anim = null; this.nextGlitch = now + rand(6000, 10000); endRef.current?.() }
          return
        }
        if (reduced) return
        if (waitingRef.current) { ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, canvas.width, canvas.height); return }
        // Idle frames (only the divider pulse moves) run at ~30fps
        const busy = heat.size || fx.wave || fx.push || fx.glitch || mouse
        if (!busy && now - lastFrame < 32) return
        if (now >= this.nextGlitch && !fx.glitch) {
          const n = 2 + Math.floor(Math.random() * 2)
          fx.glitch = { start: now, slices: Array.from({ length: n }, () => ({ r0: Math.floor(rand(0, rows - 4)), h: Math.floor(rand(2, 5)), dx: Math.round(rand(-4, 4)) * cw || cw })) }
          this.nextGlitch = now + rand(6000, 10000)
        }
        drawRest(now, now - (lastFrame || now))
        lastFrame = now
      },
      needsFrames() { return this.visible && !reduced && cells.length > 0 },
    }
    driverRef.current = d

    const cellX = (c) => ox + (c.q + 0.5) * cw
    const cellY = (c) => oy + (c.r + 0.5) * ch
    const rgba = (rgb, a = 1) => `rgba(${rgb[0] | 0},${rgb[1] | 0},${rgb[2] | 0},${a})`
    const setFont = (g) => { g.font = `700 ${fontPx}px ${FONT}`; g.textAlign = "center"; g.textBaseline = "middle" }

    // Two resting bitmaps (S and H) so the halves can push apart and slices can glitch cheaply
    const renderBitmaps = () => {
      for (const region of ["s", "h"]) {
        const b = document.createElement("canvas")
        b.width = canvas.width; b.height = canvas.height
        const g = b.getContext("2d")
        g.setTransform(dpr, 0, 0, dpr, 0, 0); setFont(g)
        g.shadowBlur = 5
        g.shadowColor = region === "h" ? "rgba(245,166,35,0.3)" : "rgba(255,248,230,0.22)"
        for (const c of cells) if (c.region === region) { g.fillStyle = rgba(c.rgb); g.fillText(c.g, cellX(c), cellY(c)) }
        bmp[region] = b
      }
    }

    const drawLine = (now, alphaFor) => {
      // Divider: pale cream with a soft glow, pulsing like a text cursor
      const pulse = reduced ? 1 : 0.62 + 0.38 * (0.5 + 0.5 * Math.cos((now / 1200) * Math.PI * 2))
      ctx.shadowColor = "rgba(255,236,190,0.75)"
      ctx.shadowBlur = 10
      for (const c of lineCells) {
        const a = alphaFor ? alphaFor(c) : pulse
        if (a <= 0) continue
        ctx.fillStyle = rgba(LINE_RGB, a)
        ctx.fillText("|", cellX(c), cellY(c))
      }
      ctx.shadowBlur = 0
    }

    const drawIntro = (now, e) => {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.clearRect(0, 0, W, H)
      setFont(ctx)
      ctx.shadowBlur = 4
      for (const c of cells) {
        const t = clamp01((e - c.delay) / c.dur)
        if (e < c.delay - 300) continue
        const [x, y] = t >= 1 ? [cellX(c), cellY(c)] : bez(c.from, c.ctrl, [cellX(c), cellY(c)], easeOut(t))
        ctx.shadowColor = c.region === "h" ? "rgba(245,166,35,0.3)" : "rgba(255,248,230,0.2)"
        ctx.fillStyle = rgba(c.rgb, t <= 0 ? 0.25 : 0.4 + 0.6 * t)
        ctx.fillText(t < 0.85 ? scrambleAt(c.q, c.r, now) : c.g, x, y)
      }
      // The divider draws top to bottom last
      const [l0, l1] = T.line
      drawLine(now, (c) => (e >= l0 + (c.r / rows) * (l1 - l0) ? 1 : 0))
    }

    const drawRest = (now, dt) => {
      ctx.setTransform(1, 0, 0, 1, 0, 0)
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      // Push apart on click: out fast, snap back
      let push = 0
      if (fx.push) {
        const p = (now - fx.push) / PUSH_MS
        if (p >= 1) fx.push = null
        else push = PUSH_PX * (p < 0.35 ? easeOut(p / 0.35) : 1 - easeOut((p - 0.35) / 0.65))
      }
      // Glitch: a few horizontal slices shift sideways
      const g = fx.glitch && now - fx.glitch.start < GLITCH_MS ? fx.glitch : null
      if (fx.glitch && !g) fx.glitch = null
      for (const [region, dx0] of [["s", -push], ["h", push]]) {
        const b = bmp[region]
        if (!b) continue
        ctx.drawImage(b, Math.round(dx0 * dpr), 0)
        if (g) for (const sl of g.slices) {
          const y = Math.round((oy + sl.r0 * ch) * dpr), h = Math.round(sl.h * ch * dpr)
          ctx.clearRect(0, y, canvas.width, h)
          ctx.drawImage(b, 0, y, b.width, h, Math.round((dx0 + sl.dx) * dpr), y, b.width, h)
        }
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      setFont(ctx)

      // Cursor scramble: heat cells near the pointer, let them cool over ~250ms
      if (mouse) {
        for (let i = 0; i < cells.length; i++) {
          const c = cells[i]
          if (Math.abs(cellX(c) - mouse[0]) > SCRAMBLE_R || Math.abs(cellY(c) - mouse[1]) > SCRAMBLE_R) continue
          if (Math.hypot(cellX(c) - mouse[0], cellY(c) - mouse[1]) < SCRAMBLE_R) heat.set(i, 1)
        }
      }
      // Decode wave: a scrambling band sweeps left to right
      let front = null
      if (fx.wave) {
        const p = (now - fx.wave) / WAVE_MS
        if (p >= 1) fx.wave = null
        else front = ox + p * (W - 2 * ox + 60) - 30
      }
      for (const [i, h] of heat) {
        const nh = h - dt / HEAT_MS
        if (nh <= 0) heat.delete(i); else heat.set(i, nh)
      }
      const overlay = (c, alpha) => {
        const shift = c.region === "s" ? -push : push
        const x = cellX(c) + shift, y = cellY(c)
        ctx.clearRect(x - cw / 2, y - ch / 2, cw, ch)
        ctx.fillStyle = rgba(c.rgb, alpha)
        ctx.fillText(scrambleAt(c.q, c.r, now), x, y)
      }
      for (const [i, h] of heat) overlay(cells[i], 0.55 + 0.45 * h)
      if (front != null) for (const c of cells) { const dxw = front - cellX(c); if (dxw > 0 && dxw < 46) overlay(c, 1) }
      drawLine(now)
    }

    const layout = () => {
      if (!img) return
      const rect = canvas.getBoundingClientRect()
      W = rect.width; H = rect.height
      if (W < 20 || H < 20) return
      dpr = Math.min(window.devicePixelRatio || 1, 2)
      canvas.width = Math.round(W * dpr)
      canvas.height = Math.round(H * dpr)
      const lw = Math.min(W, H * LOGO_ASPECT)
      const cols = Math.max(40, Math.min(100, Math.round(lw / 5)))
      cw = lw / cols
      rows = Math.round(lw / LOGO_ASPECT / (cw * 1.85))
      ch = lw / LOGO_ASPECT / rows
      ox = (W - cols * cw) / 2; oy = (H - rows * ch) / 2
      fontPx = Math.min(ch, cw / 0.6) * 1.12
      let sampled
      try { sampled = sampleLogo(img, cols, rows) } catch { failRef.current?.(); return }
      if (!sampled.length) { failRef.current?.(); return }
      // Intro paths: S from scattered points on the left, H from the right
      cells = sampled.filter((c) => c.region !== "line").map((c) => {
        const tx = ox + (c.q + 0.5) * cw, ty = oy + (c.r + 0.5) * ch
        const from = c.region === "s" ? [rand(-0.35, 0.25) * W, rand(-0.1, 1.1) * H] : [rand(0.75, 1.35) * W, rand(-0.1, 1.1) * H]
        const mx = (from[0] + tx) / 2, my = (from[1] + ty) / 2
        const bend = rand(-0.3, 0.3) * Math.hypot(tx - from[0], ty - from[1])
        const len = Math.hypot(tx - from[0], ty - from[1]) || 1
        const [a0, a1] = T.assemble, [f0, f1] = T.fly
        const dur = rand(f0, f1)
        return { ...c, from, ctrl: [mx - ((ty - from[1]) / len) * bend, my + ((tx - from[0]) / len) * bend], dur, delay: a0 + Math.random() * (a1 - a0 - dur) }
      })
      lineCells = sampled.filter((c) => c.region === "line")
      heat.clear()
      renderBitmaps()
      if (d.anim) return
      if (!waitingRef.current && (reduced || !driverRef.current?.visible)) drawRest(performance.now(), 0)
      ticker.wake()
    }

    ticker.add(d)
    if (!reduced) d.nextGlitch = performance.now() + rand(6000, 10000)

    const onMove = (e) => {
      if (e.pointerType !== "mouse" || reduced || d.anim || waitingRef.current) return
      const r = canvas.getBoundingClientRect()
      mouse = [e.clientX - r.left, e.clientY - r.top]
      ticker.wake()
    }
    const onLeave = () => { mouse = null }
    const onClick = () => {
      if (reduced || d.anim || waitingRef.current || !cells.length) return
      const now = performance.now()
      fx.wave = now; fx.push = now
      ticker.wake()
    }
    canvas.addEventListener("pointermove", onMove)
    canvas.addEventListener("pointerleave", onLeave)
    canvas.addEventListener("click", onClick)

    const io = new IntersectionObserver(([en]) => { d.visible = en.isIntersecting; ticker.wake() }, { threshold: 0.1 })
    io.observe(canvas)
    const ro = new ResizeObserver(layout)
    ro.observe(canvas)
    Promise.all([loadImage(SRC), document.fonts?.load?.(`700 10px 'JetBrains Mono'`).catch(() => {})])
      .then(([im]) => { img = im; layout() })
      .catch(() => failRef.current?.())

    return () => {
      ticker.remove(d)
      io.disconnect()
      ro.disconnect()
      canvas.removeEventListener("pointermove", onMove)
      canvas.removeEventListener("pointerleave", onLeave)
      canvas.removeEventListener("click", onClick)
      driverRef.current = null
    }
  }, [reduced, introScale])

  // Start the intro (the parent sets startAt once the first-visit splash has handed over)
  useEffect(() => {
    const d = driverRef.current
    if (!d || startAt == null) return
    d.anim = { start: startAt }
    ticker.wake()
  }, [startAt])

  return <canvas ref={canvasRef} role="img" aria-label="StackHacks logo" className={`block ${className}`} style={style} />
}
