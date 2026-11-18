import { useCallback, useLayoutEffect, useRef, useState } from "react"
import { usePlayOnce } from "../lib/playOnce"

const DRAW_MS = 800, BRANCH_MS = 300
const GOLD = "#F5A623"

/**
 * Thin circuit-trace frame around a photo or card (wrap it in this). The first time it scrolls into
 * view a 1px gold trace draws clockwise around the edge from the top-left corner (~800ms) and solder
 * nodes light up as it passes. Decorative; clicks pass through.
 *
 *   variant  "full": corner nodes, a few edge nodes and a short branch off the top-left corner ending
 *            in a hollow ring; "corners": corner nodes only (for grids and cards)
 *   delay    ms to wait after scrolling into view (stagger frames in a grid, or follow another frame)
 *   radius   the framed element's corner radius in px (rounded-md = 6, rounded-3xl = 24)
 *   redrawKey  change it to draw the frame again (e.g. when a featured photo swaps)
 */
export default function CircuitFrame({ children, className = "", variant = "full", delay = 0, radius = 6, redrawKey }) {
  const wrapRef = useRef(null)
  const svgRef = useRef(null)
  const lastRef = useRef(0) // last elapsed time applied, so a freshly rendered frame shows the right state
  const [size, setSize] = useState(null)
  const full = variant === "full"
  const total = delay + DRAW_MS + (full ? BRANCH_MS : 0) + 100

  // Measure the framed element: a photo slot's button, otherwise the first child
  useLayoutEffect(() => {
    const wrap = wrapRef.current
    const el = wrap?.querySelector(":scope > figure > button, :scope > figure > div") || wrap?.firstElementChild
    if (!el) return
    const ro = new ResizeObserver(() => { const r = el.getBoundingClientRect(); setSize({ w: Math.round(r.width), h: Math.round(r.height) }) })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const apply = useCallback((e) => {
    lastRef.current = e
    const svg = svgRef.current
    if (!svg) return
    const t = e === Infinity ? Infinity : e - delay
    const p = t === Infinity ? 1 : Math.max(0, Math.min(1, t / DRAW_MS))
    const b = t === Infinity ? 1 : Math.max(0, Math.min(1, (t - DRAW_MS) / BRANCH_MS))
    const set = (el, v) => { if (el) { el.style.strokeDasharray = "1 1"; el.style.strokeDashoffset = String(1 - v) } }
    set(svg.querySelector("[data-frame]"), p)
    set(svg.querySelector("[data-branch]"), b)
    svg.querySelectorAll("[data-at]").forEach((n) => {
      const at = Number(n.dataset.at)
      const lit = at <= 1 ? p >= at : b >= at - 1
      n.style.opacity = lit ? "1" : "0"
      n.style.transform = lit && t !== Infinity && (at <= 1 ? p - at : b - (at - 1)) < 0.06 ? "scale(1.8)" : ""
    })
  }, [delay])
  const replay = usePlayOnce(wrapRef, total, apply)

  // A frame rendered after measuring picks up the current state (hidden before it plays)
  useLayoutEffect(() => { if (size) apply(lastRef.current) })

  // Redraw on request (after the first run; the first run plays on scroll-in as usual)
  const firstKey = useRef(redrawKey)
  useLayoutEffect(() => {
    if (redrawKey === firstKey.current) return
    firstKey.current = redrawKey
    const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
    if (!reduced && lastRef.current === Infinity) { apply(0); replay() }
  }, [redrawKey, replay, apply])

  let frame = null
  if (size) {
    const { w, h } = size
    const R = Math.min(radius, w / 2, h / 2)
    const x0 = 0.5, y0 = 0.5, x1 = w - 0.5, y1 = h - 0.5
    const straight = [x1 - x0 - 2 * R, y1 - y0 - 2 * R]
    const arc = (Math.PI / 2) * R
    const perim = 2 * straight[0] + 2 * straight[1] + 4 * arc
    const along = (d) => d / perim
    const k = R * 0.29 // mid-arc offset from the corner
    const corners = [
      [x1 - k, y0 + k, along(straight[0] + arc / 2)],
      [x1 - k, y1 - k, along(straight[0] + straight[1] + arc * 1.5)],
      [x0 + k, y1 - k, along(2 * straight[0] + straight[1] + arc * 2.5)],
      [x0 + k, y0 + k, 1],
    ]
    const edges = full ? [
      [x0 + R + straight[0] * 0.38, y0, along(straight[0] * 0.38)],
      [x1, y0 + R + straight[1] * 0.55, along(straight[0] + arc + straight[1] * 0.55)],
      [x1 - R - straight[0] * 0.7, y1, along(straight[0] + straight[1] + 2 * arc + straight[0] * 0.7)],
    ] : []
    frame = {
      d: `M${x0 + R} ${y0} H${x1 - R} A${R} ${R} 0 0 1 ${x1} ${y0 + R} V${y1 - R} A${R} ${R} 0 0 1 ${x1 - R} ${y1} H${x0 + R} A${R} ${R} 0 0 1 ${x0} ${y1 - R} V${y0 + R} A${R} ${R} 0 0 1 ${x0 + R} ${y0}`,
      nodes: [...corners, ...edges],
      // Branch: up from the top-left corner into the gap above, then right to a ring
      branch: full ? `M${x0 + R + 10} ${y0} V${y0 - 20} H${x0 + R + 48}` : null,
      ring: [x0 + R + 53, y0 - 20],
    }
  }

  return (
    <div ref={wrapRef} className={`relative ${className}`}>
      {children}
      {frame && (
        <svg ref={svgRef} aria-hidden="true" width={size.w} height={size.h} className="pointer-events-none absolute left-0 top-0 z-10 overflow-visible" fill="none">
          <path data-frame="" pathLength="1" d={frame.d} stroke={GOLD} strokeWidth="1" />
          {frame.branch && <path data-branch="" pathLength="1" d={frame.branch} stroke={GOLD} strokeOpacity="0.7" strokeWidth="1" strokeLinejoin="round" />}
          {frame.nodes.map(([x, y, at], i) => (
            <circle key={i} data-at={at} cx={x} cy={y} r="2.6" fill={GOLD} style={{ transformBox: "fill-box", transformOrigin: "center", transition: "transform 0.25s ease" }} />
          ))}
          {frame.branch && <circle data-at="2" cx={frame.ring[0]} cy={frame.ring[1]} r="4" stroke={GOLD} strokeWidth="1.2" />}
        </svg>
      )}
    </div>
  )
}
