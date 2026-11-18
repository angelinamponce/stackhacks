import { useLayoutEffect, useMemo, useRef } from 'react'
import { ticker } from '../../lib/asciiArt'
import { measureRoutes, routeControls, routesFor } from '../../lib/pulseRoutes'
import { PULSE, easeOut } from '../../lib/powerOn'
import { RouteMarkup } from './PowerOnLayer'
import { heroIntroMode, heroPower } from '../../lib/heroIntro'

/**
 * Margin circuits that react to scroll: for each element marked `data-circuit-pulse` (measured by
 * CircuitBoard into board.pulseZones), the branches nearest it carry one glowing pulse the first
 * time it scrolls into view, and their nodes flash, then settle at ~60%. A zone marked
 * data-circuit-pulse="hero" (the home hero) instead fires when the hero intro starts (lib/heroIntro),
 * then carries one faint pulse along a random trace every 4-8s while it's on screen. Same pulse routes and
 * markup as the About "power on" layer (lib/pulseRoutes). Runs on the shared animation loop;
 * reduced motion shows the nodes lit, with no pulses. Desktop only (the margins are bare on mobile).
 */
export default function ScrollPulseLayer({ board }) {
  const groupRef = useRef(null)
  // Zones that already pulsed stay lit across board rebuilds (keyed by element)
  const firedRef = useRef(new WeakSet())

  // Each branch belongs to the zone it overlaps most, so no branch pulses twice
  const zones = useMemo(() => {
    const list = board?.pulseZones || []
    if (!list.length || !board.branches.length) return []
    const owner = new Map()
    list.forEach((z, zi) => routesFor(board, z.top, z.bottom).forEach((r) => {
      const b = board.branches[r.key]
      const overlap = Math.min(b.y1, z.bottom) - Math.max(b.y0, z.top)
      if (!owner.has(r.key) || owner.get(r.key).overlap < overlap) owner.set(r.key, { zi, overlap, route: r })
    }))
    return list.map((z, zi) => ({ el: z.el, routes: [...owner.values()].filter((o) => o.zi === zi).map((o) => o.route) }))
  }, [board])
  const all = useMemo(() => zones.flatMap((z, zi) => z.routes.map((r) => ({ ...r, zi }))), [zones])

  useLayoutEffect(() => {
    const g = groupRef.current
    if (!g || !all.length) return
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    const { setPulse, setNode, nodeLevel, LIT } = routeControls
    const items = measureRoutes(g, all).map((it, k) => ({ ...it, zi: all[k].zi }))
    const fired = firedRef.current
    const isHero = (zi) => zones[zi].el.dataset.circuitPulse === 'hero'
    const heroZi = zones.findIndex((z, zi) => isHero(zi) && z.routes.length)
    // The hero's nodes stay dark only while its intro is still to come
    const heroPending = heroIntroMode() === 'play' && heroPower.at == null
    items.forEach((it) => {
      setPulse(it, null)
      const dark = !reduced && (isHero(it.zi) ? heroPending : !fired.has(zones[it.zi].el))
      it.nodes.forEach((n) => setNode(n, dark ? 0 : LIT))
    })
    if (reduced) return

    const started = new Map() // zone index -> start time
    const done = new Set()
    const rand = (a, b) => a + Math.random() * (b - a)
    const IDLE_TRAVEL = 1100, IDLE_OPACITY = 0.45
    let idlePulse = null // { it, at }
    const d = {
      // The idle-pulse fields follow the shared loop's contract: it wakes us at nextFlickerAt
      visible: false, static: false, idle: heroZi >= 0, introDone: true, nextFlickerAt: Infinity,
      anim: null,
      tick(now) {
        // Idle: one faint pulse along a random hero trace, its nodes flickering as it passes
        if (heroZi >= 0 && this.visible && !idlePulse && done.has(heroZi) && now >= this.nextFlickerAt) {
          const heroItems = items.filter((it) => it.zi === heroZi)
          idlePulse = { it: heroItems[Math.floor(Math.random() * heroItems.length)], at: now }
          this.anim = this.anim || { start: now }
        }
        if (idlePulse) {
          const p = (now - idlePulse.at) / IDLE_TRAVEL
          if (p >= 1) {
            setPulse(idlePulse.it, null)
            idlePulse.it.nodes.forEach((nd) => setNode(nd, LIT))
            idlePulse = null
            this.nextFlickerAt = now + rand(4000, 8000)
          } else {
            const pos = easeOut(p)
            setPulse(idlePulse.it, pos, IDLE_OPACITY)
            idlePulse.it.nodes.forEach((nd) => {
              const dist = Math.abs(pos - nd.at) * IDLE_TRAVEL
              setNode(nd, dist < 160 ? LIT + (0.95 - LIT) * (1 - dist / 160) : LIT)
            })
          }
        }
        if (!this.anim) return
        let busy = !!idlePulse
        for (const [zi, t0] of started) {
          if (done.has(zi)) continue
          const zoneItems = items.filter((it) => it.zi === zi)
          const n = zoneItems.length
          const stagger = n > 1 ? Math.min(PULSE.maxStagger, PULSE.window / (n - 1)) : 0
          const e = now - t0
          zoneItems.forEach((it, k) => {
            const p = (e - k * stagger) / PULSE.travel
            setPulse(it, p > 0 && p < 1 ? easeOut(p) : null)
            // Time since the (eased) pulse passed each node, so every node settles at the lit level
            it.nodes.forEach((nd) => {
              const passAt = k * stagger + (1 - Math.cbrt(1 - nd.at)) * PULSE.travel
              setNode(nd, nodeLevel(e - passAt))
            })
          })
          if (e > (n - 1) * stagger + PULSE.travel + 600) {
            done.add(zi)
            if (zi === heroZi) this.nextFlickerAt = now + rand(4000, 8000)
          } else busy = true
        }
        if (!busy) this.anim = null
      },
      needsFrames() { return !!this.anim },
    }
    ticker.add(d)

    // Hero zone: fire with the hero intro (also if it began just before this layer mounted);
    // with no intro to come, it is lit and goes straight to idle pulses
    let unsubscribe = () => {}
    if (heroZi >= 0) {
      const fire = (at) => { started.set(heroZi, at); d.anim = d.anim || { start: at }; ticker.wake() }
      if (heroPower.at != null && performance.now() - heroPower.at < 1500) fire(heroPower.at)
      else if (!heroPending) { done.add(heroZi); d.nextFlickerAt = performance.now() + rand(2500, 5000) }
      unsubscribe = heroPower.subscribe(fire)
    }

    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        const zi = zones.findIndex((z) => z.el === en.target)
        if (zi === heroZi) { d.visible = en.isIntersecting; ticker.wake(); return }
        if (!en.isIntersecting) return
        if (zi < 0 || started.has(zi)) return
        fired.add(en.target)
        started.set(zi, performance.now())
        d.anim = d.anim || { start: performance.now() }
        io.unobserve(en.target)
        ticker.wake()
      })
    }, { threshold: 0.25 })
    zones.forEach((z, zi) => { if (z.routes.length && z.el.isConnected && (zi === heroZi || !fired.has(z.el))) io.observe(z.el) })
    return () => { io.disconnect(); unsubscribe(); ticker.remove(d) }
  }, [all, zones])

  if (!all.length) return null
  return (
    <g ref={groupRef} className="scroll-pulse" aria-hidden="true">
      <RouteMarkup targets={all} filterId="scroll-pulse-glow" />
    </g>
  )
}
