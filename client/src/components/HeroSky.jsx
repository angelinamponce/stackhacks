import { useEffect, useRef, useState } from 'react'

// Deterministic PRNG so the starfield is identical on every render, resize and visit
function mulberry32(seed) {
  return () => {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// 90 stars generated once (positions in % of the hero). Phones show the first 36.
const STARS = (() => {
  const r = mulberry32(20261022)
  return Array.from({ length: 90 }, () => {
    const twinkle = r() < 0.25
    return {
      x: r() * 100,
      y: r() * 100,
      size: 1 + r() * 1.5, // 1-2.5px
      opacity: 0.15 + r() * 0.45, // 15-60%
      gold: r() < 0.17,
      twinkle: twinkle ? { duration: 4 + r() * 5, delay: -r() * 9 } : null,
    }
  })
})()
const MOBILE_STARS = 36

// Distance from a point to a rectangle (0 when inside)
const distTo = (x, y, r) => Math.hypot(Math.max(r.left - x, 0, x - r.right), Math.max(r.top - y, 0, y - r.bottom))

/**
 * Night-sky backdrop for the landing hero: a static, seeded starfield (a few stars twinkle very
 * slowly). Shooting stars come from the site-wide layer.
 * Stars fade out around the text column (`avoidRefs[0]`).
 */
export default function HeroSky({ avoidRefs = [] }) {
  const skyRef = useRef(null)
  const [fade, setFade] = useState(() => STARS.map(() => 1))
  const [mobile, setMobile] = useState(() => typeof window !== 'undefined' && window.innerWidth < 640)

  // Per-star fade near the text column (positions never change, only this visibility factor)
  useEffect(() => {
    const sky = skyRef.current
    if (!sky) return
    const measure = () => {
      const box = sky.getBoundingClientRect()
      setMobile(window.innerWidth < 640)
      const text = avoidRefs[0]?.current?.getBoundingClientRect()
      if (!text || !box.width) return
      const t = { left: text.left - box.left, top: text.top - box.top, right: text.right - box.left, bottom: text.bottom - box.top }
      setFade(STARS.map((s) => {
        const d = distTo((s.x / 100) * box.width, (s.y / 100) * box.height, t)
        return Math.min(1, Math.max(0, (d - 16) / 90)) // hidden over the text, full strength ~100px away
      }))
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(sky)
    return () => ro.disconnect()
  }, [avoidRefs])

  // Shooting stars come from the site-wide layer (components/ShootingStars), so the hero only draws stars

  const stars = mobile ? STARS.slice(0, MOBILE_STARS) : STARS
  return (
    <div ref={skyRef} aria-hidden="true" className="hero-sky pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      {stars.map((s, i) => (
        <span
          key={i}
          className={`hero-star ${s.twinkle ? 'hero-star-twinkle' : ''}`}
          style={{
            left: `${s.x}%`,
            top: `${s.y}%`,
            width: `${s.size}px`,
            height: `${s.size}px`,
            background: s.gold ? '#ffd88a' : '#f4f1ea',
            '--star-o': s.opacity * fade[i],
            '--star-dim': s.opacity * fade[i] * 0.72,
            ...(s.twinkle ? { animationDuration: `${s.twinkle.duration.toFixed(2)}s`, animationDelay: `${s.twinkle.delay.toFixed(2)}s` } : {}),
          }}
        />
      ))}
    </div>
  )
}
