import { useCallback, useEffect, useId, useRef } from 'react'
import { useIntroDone } from '../lib/intro'

const BASE = import.meta.env.BASE_URL
// public/SHTrans.png is 498x501 with a transparent background. Its letters separate cleanly:
//   S x101-222 · centre line x234-246 · H x256-387 (all y49-419)
// There is no vector version of the mark, so the artwork's own alpha is used as the shape mask
// and each region is filled with an SVG gradient: the fills follow the real logo edges exactly.
const W = 498, H = 501
const REGIONS = { s: [95, 228], line: [228, 251], h: [251, 394] }
const TOP = 44, HEIGHT = 380

const SHINE_EVENT = 'sh:logo-shine'
const SHINE_KEY = 'sh-logo-shine-played'
const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

/** Sweeps a light band (an SVG <g> holding a skewed gradient rect) across the mark once. */
function sweep(band, from, to, duration) {
  if (!band || reducedMotion()) return null
  return band.animate(
    [
      { transform: `translateX(${from}px)`, opacity: 0 },
      { opacity: 1, offset: 0.15 },
      { opacity: 1, offset: 0.85 },
      { transform: `translateX(${to}px)`, opacity: 0 },
    ],
    { duration, easing: 'cubic-bezier(0.45, 0, 0.55, 1)' },
  )
}

/**
 * The hero SH mark: crisp, high-contrast solid fills (pure white S, rich gold H, bright white-gold
 * centre line), one tight gold glow that breathes very slowly, and a one-time shine sweep on first
 * arrival (replayed on hover, with a cooldown).
 */
export function HeroShLogo({ logoRef, className = '' }) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '')
  const id = (name) => `${uid}-${name}`
  const bandRef = useRef(null)
  const running = useRef(null)
  const lastPlay = useRef(0)
  const introDone = useIntroDone()

  const play = useCallback(() => {
    if (running.current) return
    running.current = sweep(bandRef.current, -140, W + 60, 1350)
    if (running.current) {
      lastPlay.current = Date.now()
      running.current.onfinish = running.current.oncancel = () => { running.current = null }
    }
  }, [])

  // First arrival: once the intro overlay has gone (or right away if it isn't playing), once per session
  useEffect(() => {
    if (!introDone) return
    let played = false
    try { played = sessionStorage.getItem(SHINE_KEY) === '1' } catch { /* storage unavailable: shine may replay */ }
    if (played) return
    const t1 = setTimeout(() => {
      play()
      try { sessionStorage.setItem(SHINE_KEY, '1') } catch { /* ignore */ }
    }, 900)
    // The nav mark follows a moment later
    const t2 = setTimeout(() => window.dispatchEvent(new Event(SHINE_EVENT)), 1500)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [introDone, play])

  useEffect(() => () => running.current?.cancel(), [])

  const onHover = () => { if (Date.now() - lastPlay.current > 4000) play() }

  const regionRect = (key, fill, extra = {}) => {
    const [x0, x1] = REGIONS[key]
    return <rect x={x0} y={TOP} width={x1 - x0} height={HEIGHT} fill={fill} {...extra} />
  }

  return (
    <svg
      ref={logoRef}
      viewBox={`0 0 ${W} ${H}`}
      role="img"
      aria-label="StackHacks Emblem"
      onMouseEnter={onHover}
      className={`sh-mark relative ${className}`}
      style={{ aspectRatio: `${W} / ${H}` }}
    >
      <defs>
        <mask id={id('shape')} maskUnits="userSpaceOnUse" x="0" y="0" width={W} height={H} style={{ maskType: 'alpha' }}>
          <image href={`${BASE}SHTrans.png`} width={W} height={H} />
        </mask>
        {/* H: a rich, saturated gold, slightly deeper at the bottom */}
        <linearGradient id={id('h')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#F5B748" />
          <stop offset="1" stopColor="#E89A2C" />
        </linearGradient>
        {/* S: pure white, with only a hint of warm silver at the bottom edge */}
        <linearGradient id={id('s')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="0.85" stopColor="#ffffff" />
          <stop offset="1" stopColor="#efebe4" />
        </linearGradient>
        {/* Centre line: bright white-gold */}
        <linearGradient id={id('line')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fffaf0" />
          <stop offset="0.6" stopColor="#ffffff" />
          <stop offset="1" stopColor="#ffe4a8" />
        </linearGradient>
        {/* Shine band: a soft white-gold light, ~18% of the mark's width */}
        <linearGradient id={id('shine')} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#fff8e6" stopOpacity="0" />
          <stop offset="0.5" stopColor="#fff8e6" stopOpacity="0.75" />
          <stop offset="1" stopColor="#fff8e6" stopOpacity="0" />
        </linearGradient>
        <filter id={id('glow-tight')} x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="3" /></filter>
      </defs>

      {/* One tight, subtle gold glow hugging the shapes (no wide halo, so edges stay sharp) */}
      <g className="sh-mark-glow" aria-hidden="true">
        <g filter={`url(#${id('glow-tight')})`} opacity="0.3">
          <rect width={W} height={H} fill="#f5b748" mask={`url(#${id('shape')})`} />
        </g>
      </g>

      {/* The mark itself: each letter filled with its gradient, clipped to the real shapes */}
      <g mask={`url(#${id('shape')})`}>
        {regionRect('s', `url(#${id('s')})`)}
        {regionRect('line', `url(#${id('line')})`)}
        {regionRect('h', `url(#${id('h')})`)}
        {/* One-time shine: a ~25 degree band travelling left to right, visible only on the letters */}
        <g ref={bandRef} className="sh-shine-band" opacity="0">
          <rect x="0" y="-60" width="54" height={H + 120} fill={`url(#${id('shine')})`} transform="skewX(-25)" />
        </g>
      </g>
    </svg>
  )
}

/**
 * Shine overlay for the small nav mark (public/SH.png: white S and gold H on black). The band is
 * masked by the image's luminance, so it only lights the letters, more softly on the gold H.
 * Plays when the hero logo signals its first-arrival shine.
 */
export function NavLogoShine() {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '')
  const bandRef = useRef(null)
  useEffect(() => {
    let anim = null
    const onShine = () => { anim = sweep(bandRef.current, -40, 100, 1100) }
    window.addEventListener(SHINE_EVENT, onShine)
    return () => { window.removeEventListener(SHINE_EVENT, onShine); anim?.cancel() }
  }, [])
  return (
    <svg aria-hidden="true" viewBox="0 0 100 100" className="pointer-events-none absolute inset-0 h-full w-full">
      <defs>
        <mask id={`${uid}-m`} maskUnits="userSpaceOnUse" x="0" y="0" width="100" height="100">
          <image href={`${BASE}SH.png`} width="100" height="100" />
        </mask>
        <linearGradient id={`${uid}-g`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#fff8e6" stopOpacity="0" />
          <stop offset="0.5" stopColor="#fff8e6" stopOpacity="0.55" />
          <stop offset="1" stopColor="#fff8e6" stopOpacity="0" />
        </linearGradient>
      </defs>
      <g mask={`url(#${uid}-m)`}>
        <g ref={bandRef} opacity="0">
          <rect x="0" y="-20" width="16" height="140" fill={`url(#${uid}-g)`} transform="skewX(-25)" />
        </g>
      </g>
    </svg>
  )
}
