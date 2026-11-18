// One-shot scroll-in animations on the shared animation loop (lib/asciiArt ticker).
import { useEffect, useRef } from 'react'
import { ticker } from './asciiArt'

const reducedMotion = () => typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

/**
 * Calls onFrame(elapsedMs) every frame for `duration` ms, starting the first time `ref`'s element
 * scrolls into view, then onFrame(Infinity) once for the final state. onFrame(0) sets the initial
 * state on mount. Under prefers-reduced-motion it only ever calls onFrame(Infinity).
 * Pauses off screen and while the tab is hidden (the ticker shifts `anim.start` for the gap).
 * Returns `replay()` to play it again (e.g. on hover), once the first run has finished.
 */
export function usePlayOnce(ref, duration, onFrame, { threshold = 0.3 } = {}) {
  const frameRef = useRef(onFrame)
  const driverRef = useRef(null)
  useEffect(() => { frameRef.current = onFrame })

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (reducedMotion()) { frameRef.current(Infinity); return }
    frameRef.current(0)
    const d = {
      visible: false, static: false, idle: false, introDone: false, nextFlickerAt: Infinity,
      anim: null,
      played: false,
      tick(now) {
        if (!this.visible || !this.anim) return
        const e = now - this.anim.start
        if (e >= duration) { this.anim = null; this.played = true; frameRef.current(Infinity); return }
        frameRef.current(e)
      },
      needsFrames() { return this.visible && !!this.anim },
      play() { this.anim = { start: performance.now() }; ticker.wake() },
    }
    driverRef.current = d
    ticker.add(d)
    const io = new IntersectionObserver(([en]) => {
      d.visible = en.isIntersecting
      if (d.visible && !d.played && !d.anim) d.play()
      ticker.wake()
    }, { threshold })
    io.observe(el)
    return () => { io.disconnect(); ticker.remove(d); driverRef.current = null }
  }, [ref, duration, threshold])

  return () => { const d = driverRef.current; if (d && d.played && !d.anim) d.play() }
}

/** Draws a CircuitDivider to progress p (0..1): the trace, with each node appearing as it's reached. */
export function drawDivider(svg, p) {
  if (!svg) return
  const path = svg.querySelector("[data-draw]")
  path.style.strokeDasharray = "1 1"
  path.style.strokeDashoffset = String(1 - p)
  svg.querySelectorAll("[data-node]").forEach((n) => { n.style.opacity = p >= Number(n.dataset.node) ? "1" : "0" })
}
