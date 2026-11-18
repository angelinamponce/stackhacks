import { useLayoutEffect, useMemo, useRef, useSyncExternalStore } from 'react'
import { PULSE, clamp01, easeOut, powerOn } from '../../lib/powerOn'
import { TRACE_GOLD, TRACE_LIGHT } from './CircuitParts'

const LEAD = 200 // px of margin spine the pulse runs down before turning inward
const LIT = 0.6 // resting brightness of a lit node
const IDLE_MIN = 4000, IDLE_MAX = 8000, IDLE_TRAVEL = 1100, IDLE_OPACITY = 0.45

/**
 * "Power on" pulses for the About page's Our Story section (see lib/powerOn), drawn on the
 * page-level circuit board. Each branch beside the section gets a short glowing dash that runs
 * from the outer margin inward; ring nodes light up as it passes and stay lit. Afterwards, one
 * faint pulse runs along a random branch every 4-8s.
 */
export default function PowerOnLayer({ board }) {
  const { section, mode, mobile, startAt } = useSyncExternalStore(powerOn.subscribe, powerOn.getState)
  const groupRef = useRef(null)

  // Branches beside the section, top to bottom, each with its pulse route (spine lead-in + main line)
  const targets = useMemo(() => {
    const zone = board?.powerZone
    if (!section || !zone || mobile) return []
    const { top, bottom } = zone
    return board.branches
      .map((b, i) => ({ b, i }))
      .filter(({ b }) => b.y0 < bottom && b.y1 > top - 40)
      .sort((a, z) => a.b.y0 - z.b.y0)
      .map(({ b, i }) => {
        const [x0, y0] = b.spans[0][0]
        return {
          key: i,
          d: `M${x0} ${Math.max(top, y0 - LEAD)} L${x0} ${y0} ${b.lines[0]}`,
          nodes: [...b.rings, ...b.glows].filter((p, k, all) => all.findIndex((q) => q[0] === p[0] && q[1] === p[1]) === k),
        }
      })
  }, [board, section, mobile])

  useLayoutEffect(() => {
    const g = groupRef.current
    if (!g || !targets.length) return
    const reduced = mode === 'reduced'

    // Measure each route and where each node sits along it
    const items = targets.map((t, k) => {
      const el = g.querySelector(`[data-route="${k}"]`)
      const pulses = [...el.querySelectorAll('.po-pulse')]
      const total = pulses[0].getTotalLength()
      const samples = []
      for (let l = 0; l <= total; l += 4) samples.push([l, pulses[0].getPointAtLength(l)])
      const nodes = [...el.querySelectorAll('.po-node')].map((node, j) => {
        const [x, y] = t.nodes[j]
        let best = total, bestD = Infinity
        for (const [l, p] of samples) {
          const d = Math.hypot(p.x - x, p.y - y)
          if (d < bestD) { bestD = d; best = l }
        }
        return { node, at: best / total }
      })
      pulses.forEach((p) => p.setAttribute('stroke-dasharray', `${PULSE.dash} ${total + PULSE.dash}`))
      return { pulses, total, nodes }
    })

    const setPulse = (it, progress, opacity) => {
      it.pulses.forEach((p) => {
        p.style.opacity = progress == null ? '0' : String(opacity)
        if (progress != null) p.setAttribute('stroke-dashoffset', String(PULSE.dash - progress * (it.total + PULSE.dash)))
      })
    }
    const setNode = (n, v) => { n.node.style.opacity = String(v) }

    // Static states: reduced motion -> nodes lit, no pulses
    items.forEach((it) => { setPulse(it, null); it.nodes.forEach((n) => setNode(n, mode === 'play' ? 0 : LIT)) })
    if (reduced) return

    const n = items.length
    const stagger = n > 1 ? Math.min(PULSE.maxStagger, PULSE.window / (n - 1)) : 0
    let idle = null // { it, at }
    let nextIdle = null

    const off = powerOn.onFrame((t) => {
      const playing = mode === 'play'
      if (playing && startAt == null) return // landing not started yet: dark nodes
      const e = playing ? t - startAt : Infinity
      const landingEnd = (n - 1) * stagger + PULSE.travel

      if (e < landingEnd + 400) {
        items.forEach((it, k) => {
          const p = (e - k * stagger) / PULSE.travel
          setPulse(it, p > 0 && p < 1 ? easeOut(p) : null, 1)
          const eased = easeOut(clamp01(p))
          it.nodes.forEach((nd) => {
            // Flash as the pulse passes, then settle at the lit level
            const since = (eased - nd.at) * PULSE.travel
            setNode(nd, since < 0 ? 0 : since < 120 ? 1 : Math.max(LIT, 1 - ((since - 120) / 400) * (1 - LIT)))
          })
        })
        return
      }

      // Idle: one faint pulse along a random branch every 4-8s; its nodes flicker as it passes
      if (nextIdle == null) {
        items.forEach((it) => { setPulse(it, null); it.nodes.forEach((nd) => setNode(nd, LIT)) })
        nextIdle = t + IDLE_MIN + Math.random() * (IDLE_MAX - IDLE_MIN)
      }
      if (!idle && t >= nextIdle) idle = { it: items[Math.floor(Math.random() * n)], at: t }
      if (idle) {
        const p = (t - idle.at) / IDLE_TRAVEL
        if (p >= 1) {
          setPulse(idle.it, null)
          idle.it.nodes.forEach((nd) => setNode(nd, LIT))
          idle = null
          nextIdle = t + IDLE_MIN + Math.random() * (IDLE_MAX - IDLE_MIN)
        } else {
          const pos = easeOut(p)
          setPulse(idle.it, pos, IDLE_OPACITY)
          idle.it.nodes.forEach((nd) => {
            const d = Math.abs(pos - nd.at) * IDLE_TRAVEL
            setNode(nd, d < 160 ? LIT + (0.95 - LIT) * (1 - d / 160) * (0.75 + 0.25 * Math.sin(t / 25)) : LIT)
          })
        }
      }
    })
    return off
  }, [targets, mode, startAt])

  if (!targets.length) return null
  return (
    <g ref={groupRef} className="power-on" aria-hidden="true">
      <defs>
        <filter id="power-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="2.4" />
        </filter>
      </defs>
      {targets.map((t, k) => (
        <g key={t.key} data-route={k}>
          {/* Soft glow under a bright core dash */}
          <path className="po-pulse" d={t.d} stroke={TRACE_GOLD} strokeWidth="5" strokeOpacity="0.55" strokeLinecap="round" fill="none" filter="url(#power-glow)" style={{ opacity: 0 }} />
          <path className="po-pulse" d={t.d} stroke={TRACE_LIGHT} strokeWidth="1.8" strokeLinecap="round" fill="none" style={{ opacity: 0 }} />
          {t.nodes.map(([x, y], j) => (
            <g key={j} className="po-node" style={{ opacity: 0 }}>
              <circle cx={x} cy={y} r="9" fill={TRACE_GOLD} fillOpacity="0.28" filter="url(#power-glow)" />
              <circle cx={x} cy={y} r="3" fill={TRACE_LIGHT} />
            </g>
          ))}
        </g>
      ))}
    </g>
  )
}
