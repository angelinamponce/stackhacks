import { useLayoutEffect, useMemo, useRef, useSyncExternalStore } from 'react'
import { PULSE, clamp01, easeOut, powerOn } from '../../lib/powerOn'
import { measureRoutes, routeControls, routesFor } from '../../lib/pulseRoutes'
import { TRACE_GOLD, TRACE_LIGHT } from './CircuitParts'

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
    return routesFor(board, zone.top, zone.bottom)
  }, [board, section, mobile])

  useLayoutEffect(() => {
    const g = groupRef.current
    if (!g || !targets.length) return
    const reduced = mode === 'reduced'

    const items = measureRoutes(g, targets)
    const { setPulse, setNode, LIT } = routeControls

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
            setNode(nd, routeControls.nodeLevel((eased - nd.at) * PULSE.travel))
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
      <RouteMarkup targets={targets} filterId="power-glow" />
    </g>
  )
}

/** Pulse paths and node markup for a set of routes. */
export function RouteMarkup({ targets, filterId }) {
  return (
    <>
      <defs>
        <filter id={filterId} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="2.4" />
        </filter>
      </defs>
      {targets.map((t, k) => (
        <g key={t.key} data-route={k}>
          {/* Soft glow under a bright core dash */}
          <path className="po-pulse" d={t.d} stroke={TRACE_GOLD} strokeWidth="5" strokeOpacity="0.55" strokeLinecap="round" fill="none" filter={`url(#${filterId})`} style={{ opacity: 0 }} />
          <path className="po-pulse" d={t.d} stroke={TRACE_LIGHT} strokeWidth="1.8" strokeLinecap="round" fill="none" style={{ opacity: 0 }} />
          {t.nodes.map(([x, y], j) => (
            <g key={j} className="po-node" style={{ opacity: 0 }}>
              <circle cx={x} cy={y} r="9" fill={TRACE_GOLD} fillOpacity="0.28" filter={`url(#${filterId})`} />
              <circle cx={x} cy={y} r="3" fill={TRACE_LIGHT} />
            </g>
          ))}
        </g>
      ))}
    </>
  )
}
