import { useEffect, useRef } from "react"

/*
 * Gold circuit-line emblem: two circuit-board hands cradling a wireframe globe, with a sprout
 * growing from the top. Decorative backdrop for the About page's "About Us" copy (aria-hidden,
 * pointer-events: none; the parent sets its size, position and opacity).
 *
 * - First time in view: the traces draw upward (hands -> fingers -> globe -> sprout) and
 *   their nodes fade in.
 * - Then: small glowing dots travel up a random finger trace into the globe every few seconds, and
 *   the leaf nodes shimmer. Paused off screen and while the tab is hidden; reduced motion
 *   shows the finished emblem.
 */

const GOLD = "#E59A38"
const NODE_GOLD = "#F5A623"
const LIGHT = "#FFE2A8"
const GC = [100, 100] // globe centre
const R = 40

const f1 = (n) => +n.toFixed(1)

// Point on a circle around the globe centre, angle in degrees (y down: 90 = bottom, 180 = left)
const polar = (r, t) => [f1(GC[0] + r * Math.cos((t * Math.PI) / 180)), f1(GC[1] + r * Math.sin((t * Math.PI) / 180))]
const pt = ([x, y]) => `${x} ${y}`

/*
 * One circuit hand cupping the globe from below. Fingers are concentric traces that curl up
 * around the globe's side and end in nodes; the palm/wrist runs down to the bottom edge, with a
 * thumb crossing the front of the globe. `side` = 1 for the left hand, -1 for the right (mirrored).
 */
function hand(side) {
  const ang = (t) => (side === 1 ? t : 180 - t) // mirror angles for the right hand
  const sweep = side === 1 ? 1 : 0
  const mx = (x) => f1(side === 1 ? x : 200 - x)
  const P = (x, y) => `${mx(x)} ${y}`
  const FINGERS = [[47, 198], [52, 189], [57, 178], [62, 165]] // [radius, fingertip angle]
  const BASE = 128 // where the fingers leave the palm
  const fingers = FINGERS.map(([r, tip]) => {
    const a = polar(r, ang(BASE)), b = polar(r, ang(tip))
    return { d: `M${pt(a)} A${r} ${r} 0 0 ${sweep} ${pt(b)}`, start: a, end: b }
  })
  const inner = fingers[0].start, outer = fingers[3].start
  return {
    fingers,
    outline: [
      // Palm heel -> inner wrist
      `M${pt(inner)} C${P(76, 148)} ${P(80, 162)} ${P(80, 178)} L${P(80, 232)}`,
      // Outer edge of the hand -> outer wrist
      `M${pt(outer)} C${P(54, 160)} ${P(44, 174)} ${P(44, 196)} L${P(44, 232)}`,
      // Palm line joining the finger bases
      `M${pt(inner)} L${pt(outer)}`,
    ],
    thumb: `M${P(80, 170)} C${P(82, 154)} ${P(88, 142)} ${P(96, 134)}`,
    thumbTip: [mx(96), 134],
    trace: `M${P(62, 232)} L${P(62, 204)} L${P(56, 196)}`,
    nodes: [[mx(80), 232], [mx(44), 232], [mx(62), 232], [mx(56), 196]],
  }
}
const HANDS = [hand(1), hand(-1)]

// Wireframe globe: outline, latitudes (flattened ellipses) and longitudes
const LATS = [-22, 0, 22].map((dy) => {
  const rx = Math.sqrt(R * R - dy * dy)
  return { cx: GC[0], cy: GC[1] + dy, rx: f1(rx), ry: f1(rx * 0.28) }
})
const LONGS = [14, 28].map((rx) => ({ cx: GC[0], cy: GC[1], rx, ry: R }))

const STEM = "M100 60 C100 50 98 42 100 28"
const LEAF_L = "M100 46 C88 45 80 37 77 26 C89 28 97 35 100 46"
const LEAF_R = "M100 37 C110 33 118 24 121 13 C109 16 101 25 100 37"

// Draw-in groups: [delay ms, duration ms]
const T = { hands: [0, 700], fingers: [450, 600], globe: [900, 900], sprout: [1650, 700] }

const NODES = {
  hands: HANDS.flatMap((h) => [...h.nodes, h.thumbTip]),
  fingers: HANDS.flatMap((h) => h.fingers.map((f) => f.end)),
  globe: [[100, 60], [100, 140], [60, 100], [140, 100]],
  sprout: [[100, 60], [77, 26], [121, 13]],
}

function Trace({ d, group, ...rest }) {
  return <path data-draw={group} d={d} pathLength="1" fill="none" {...rest} />
}

export default function CircuitEmblem({ className = "" }) {
  const svgRef = useRef(null)

  useEffect(() => {
    const svg = svgRef.current
    if (!svg) return
    const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
    const strokes = [...svg.querySelectorAll("[data-draw]")]
    const nodes = [...svg.querySelectorAll("[data-node]")]
    const dots = [...svg.querySelectorAll("[data-dot]")]
    const routes = [...svg.querySelectorAll("[data-finger]")]

    const showFinal = () => {
      strokes.forEach((s) => { s.style.strokeDashoffset = "0" })
      nodes.forEach((n) => { n.style.opacity = "1" })
    }
    if (reduced) { showFinal(); return }

    // Hidden until the first time it scrolls into view
    strokes.forEach((s) => { s.style.strokeDasharray = "1 1"; s.style.strokeDashoffset = "1" })
    nodes.forEach((n) => { n.style.opacity = "0" })

    let drawn = false, visible = false, raf = 0, nextDot = 0
    const active = [] // { dot, path, total, at, dur }
    const animations = []

    const draw = () => {
      drawn = true
      strokes.forEach((s, i) => {
        const [delay, dur] = T[s.dataset.draw]
        animations.push(s.animate([{ strokeDashoffset: 1 }, { strokeDashoffset: 0 }], {
          delay: delay + (i % 6) * 40, duration: dur, easing: "cubic-bezier(0.65, 0, 0.35, 1)", fill: "forwards",
        }))
      })
      nodes.forEach((n) => {
        const [delay, dur] = T[n.dataset.node]
        animations.push(n.animate([{ opacity: 0 }, { opacity: 1 }], { delay: delay + dur * 0.8, duration: 350, fill: "forwards" }))
      })
      nextDot = performance.now() + 3000
    }

    // Ambient: glowing dots run up a random finger trace into the globe
    const tick = (now) => {
      raf = 0
      if (!visible || document.hidden) return
      if (now >= nextDot && active.length < dots.length) {
        const dot = dots.find((d) => !active.some((a) => a.dot === d))
        const path = routes[Math.floor(Math.random() * routes.length)]
        active.push({ dot, path, total: path.getTotalLength(), at: now, dur: 1100 })
        nextDot = now + 1400 + Math.random() * 1800
      }
      for (let i = active.length - 1; i >= 0; i--) {
        const a = active[i]
        const u = (now - a.at) / a.dur
        if (u >= 1) { a.dot.style.opacity = "0"; active.splice(i, 1); continue }
        const e = 1 - (1 - u) ** 2
        const p = a.path.getPointAtLength(e * a.total)
        a.dot.setAttribute("transform", `translate(${p.x} ${p.y})`)
        a.dot.style.opacity = String(Math.min(1, u * 6, (1 - u) * 4))
      }
      raf = requestAnimationFrame(tick)
    }
    const run = () => { if (!raf && drawn && visible && !document.hidden) raf = requestAnimationFrame(tick) }

    const setPaused = (paused) => {
      svg.toggleAttribute("data-paused", paused) // pauses the CSS shimmer
      animations.forEach((a) => (paused ? a.pause() : a.playState === "paused" && a.play()))
    }

    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting
      if (visible && !drawn) draw()
      setPaused(!visible)
      if (visible) run()
    }, { threshold: 0.25 })
    io.observe(svg)
    const onVisibility = () => { setPaused(document.hidden || !visible); run() }
    document.addEventListener("visibilitychange", onVisibility)

    return () => {
      cancelAnimationFrame(raf)
      io.disconnect()
      document.removeEventListener("visibilitychange", onVisibility)
      animations.forEach((a) => a.cancel())
    }
  }, [])

  const stroke = { stroke: GOLD, strokeWidth: 1.4, strokeLinecap: "round", strokeLinejoin: "round" }
  const node = (group, [x, y], k, shimmer = false) => (
    <circle key={`${group}${k}`} data-node={group} className={shimmer ? "emblem-shimmer" : undefined}
      style={shimmer ? { animationDelay: `${(k * 0.7) % 3}s` } : undefined}
      cx={x} cy={y} r="2.5" fill={NODE_GOLD} />
  )

  return (
    <svg ref={svgRef} viewBox="0 4 200 232" aria-hidden="true" className={`pointer-events-none overflow-visible ${className}`}>
      <defs>
        <radialGradient id="emblem-dot">
          <stop offset="0" stopColor="#FFF3D6" stopOpacity="1" />
          <stop offset="0.3" stopColor={LIGHT} stopOpacity="0.85" />
          <stop offset="1" stopColor={GOLD} stopOpacity="0" />
        </radialGradient>
        {/* Warm backlight behind the globe (~0.08 once the container's opacity applies) */}
        <radialGradient id="emblem-glow">
          <stop offset="0" stopColor="#F5A623" stopOpacity="0.2" />
          <stop offset="1" stopColor="#F5A623" stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx={GC[0]} cy={GC[1]} r="78" fill="url(#emblem-glow)" />

      {/* Hands */}
      <g {...stroke}>
        {HANDS.map((h, i) => [
          ...h.outline.map((d) => <Trace key={`${i}${d}`} d={d} group="hands" />),
          <Trace key={`${i}t`} d={h.thumb} group="hands" />,
          <Trace key={`${i}c`} d={h.trace} group="hands" />,
          ...h.fingers.map((f) => <Trace key={`${i}${f.d}`} d={f.d} group="fingers" data-finger="" />),
        ])}
      </g>

      {/* Globe */}
      <g {...stroke}>
        <Trace d={`M100 140 A${R} ${R} 0 1 1 100.1 140`} group="globe" />
        {LATS.map((e) => <ellipse key={`lat${e.cy}`} data-draw="globe" pathLength="1" fill="none" {...e} />)}
        {LONGS.map((e) => <ellipse key={`lon${e.rx}`} data-draw="globe" pathLength="1" fill="none" {...e} />)}
        <Trace d="M100 140 L100 60" group="globe" />
      </g>

      {/* Sprout */}
      <g {...stroke}>
        <Trace d={STEM} group="sprout" />
        <Trace d={LEAF_L} group="sprout" />
        <Trace d={LEAF_R} group="sprout" />
      </g>

      {/* Circuit nodes */}
      {NODES.hands.map((p, k) => node("hands", p, k))}
      {NODES.fingers.map((p, k) => node("fingers", p, k))}
      {NODES.globe.map((p, k) => node("globe", p, k))}
      {NODES.sprout.map((p, k) => node("sprout", p, k, true))}

      {/* Travelling light dots (positioned by the effect) */}
      {[0, 1, 2].map((k) => (
        <g key={k} data-dot="" style={{ opacity: 0 }}>
          <circle r="9" fill="url(#emblem-dot)" />
          <circle r="2.1" fill="#FFF3D6" />
        </g>
      ))}
    </svg>
  )
}
