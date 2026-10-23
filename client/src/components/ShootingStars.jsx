import { useEffect, useRef } from 'react'

/**
 * Site-wide shooting stars: one soft streak at a time, anywhere in the viewport, behind all
 * content (fixed layer under <main>). Each starts in a different cell of a 3x3 grid than the last,
 * at a 15-60 degree angle in any direction. Every 14-26s (30-40s on phones), 1.2-1.8s long,
 * peak opacity 50%. Off for reduced motion; skipped while the tab is hidden.
 */
export default function ShootingStars() {
  const streakRef = useRef(null)

  useEffect(() => {
    const streak = streakRef.current
    if (!streak || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    let timer = 0
    let anim = null
    let lastZone = -1

    const pickPath = (W, H, isPhone) => {
      const zones = [...Array(9).keys()].filter((z) => z !== lastZone)
      for (let tries = 0; tries < 60; tries++) {
        const zone = zones[Math.floor(Math.random() * zones.length)]
        const x0 = (((zone % 3) + Math.random()) / 3) * W
        const y0 = 64 + ((Math.floor(zone / 3) + Math.random()) / 3) * (H - 64) // below the nav
        const len = isPhone ? 70 + Math.random() * 50 : 100 + Math.random() * 70
        const travel = isPhone ? 120 + Math.random() * 80 : 220 + Math.random() * 180
        const angle = ((15 + Math.random() * 45) * Math.PI) / 180
        const dx = Math.cos(angle) * (Math.random() < 0.5 ? 1 : -1)
        const dy = Math.sin(angle) * (Math.random() < 0.5 ? 1 : -1)
        let ok = true
        for (let s = -len; s <= travel; s += 16) {
          const x = x0 + dx * s, y = y0 + dy * s
          if (x < 4 || x > W - 4 || y < 68 || y > H - 6) { ok = false; break }
        }
        if (ok) { lastZone = zone; return { x0, y0, dx, dy, len, travel, deg: (Math.atan2(dy, dx) * 180) / Math.PI } }
      }
      return null
    }

    const launch = () => {
      const isPhone = window.innerWidth < 640
      timer = setTimeout(launch, isPhone ? 30000 + Math.random() * 10000 : 14000 + Math.random() * 12000)
      if (document.hidden) return
      const p = pickPath(window.innerWidth, window.innerHeight, isPhone)
      if (!p) return
      streak.style.width = `${p.len}px`
      const at = (s) => `translate(${p.x0 + p.dx * s - p.len}px, ${p.y0 + p.dy * s}px) rotate(${p.deg}deg)`
      anim?.cancel()
      anim = streak.animate(
        [
          { transform: at(0), opacity: 0 },
          { opacity: 0.5, offset: 0.15 },
          { opacity: 0.5, offset: 0.7 },
          { transform: at(p.travel), opacity: 0 },
        ],
        { duration: 1200 + Math.random() * 600, easing: 'cubic-bezier(0.4, 0, 0.6, 1)', fill: 'both' },
      )
    }
    timer = setTimeout(launch, 5000 + Math.random() * 6000)
    return () => { clearTimeout(timer); anim?.cancel() }
  }, [])

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      <span ref={streakRef} className="hero-streak site-streak" />
    </div>
  )
}
