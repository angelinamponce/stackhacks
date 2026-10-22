import { useEffect, useId, useRef } from 'react'
import { GlowNode, RingNode, SoftPulse, TraceLine } from './CircuitParts'

// Decorative circuit-board traces anchored to the corners of a container
// (used by the "Join the Community" window). Each corner is its own fixed-aspect SVG,
// mirrored with transforms, so ring nodes never stretch. aria-hidden + pointer-events none.

// One top-left corner: traces run from the edges inward, ending in ring nodes.
const TRACES = [
  { d: 'M0 28 H72 L96 52 H178', node: [184, 52], glow: true },
  { d: 'M28 0 V38 L52 62 V118', node: [52, 124] },
  { d: 'M0 84 H38 L58 104 H104', node: [110, 104], glow: true },
  // The rest are dropped on phones for a simpler corner
  { d: 'M92 0 V16 L112 36 H222', node: [228, 36], desktop: true },
  { d: 'M0 128 H18 L30 140', node: [34, 144], desktop: true },
  { d: 'M150 0 V10 L162 22 H200', node: [206, 22], desktop: true },
]

const PLACEMENT = {
  tl: 'top-0 left-0',
  tr: 'top-0 right-0 -scale-x-100',
  bl: 'bottom-0 left-0 -scale-y-100',
  br: 'bottom-0 right-0 -scale-100',
}

// Calm corners: faint 1px traces; only the top-left and bottom-right corners carry one slow, soft
// pulse and one gently breathing glow, so a framed block never has more than two of either
const ACCENT_CORNERS = { tl: { travel: 10, pause: 16, delay: 2 }, br: { travel: 12, pause: 14, delay: 13 } }

function Corner({ corner, animated, uid }) {
  const accent = ACCENT_CORNERS[corner]
  return (
    <svg viewBox="0 0 240 150" fill="none" className={`absolute h-auto w-[150px] sm:w-[200px] lg:w-[240px] ${PLACEMENT[corner]}`}>
      <defs>
        <filter id={`${uid}-${corner}-blur`} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="1.2" />
        </filter>
      </defs>
      {TRACES.map((t, i) => (
        <g key={i} className={t.desktop ? 'hidden sm:inline' : undefined}>
          <TraceLine d={t.d} width={1} opacity={0.2} />
          {animated && accent && i === 0 && (
            <SoftPulse id={`${uid}-${corner}`} d={t.d} travel={accent.travel} pause={accent.pause} delay={accent.delay} blurId={`${uid}-${corner}-blur`} />
          )}
          <RingNode x={t.node[0]} y={t.node[1]} r={4} width={1} opacity={0.3} />
          {accent && i === 0 && <GlowNode x={t.node[0]} y={t.node[1]} scale={0.8} animated={animated} delay={`${accent.delay}s`} />}
        </g>
      ))}
    </svg>
  )
}

/**
 * @param corners   which corners to decorate: any of 'tl' | 'tr' | 'bl' | 'br'
 * @param animated  travelling light pulses + glowing nodes (static for reduced motion via CSS)
 * @param drawIn    traces draw themselves in once on mount
 */
export default function CircuitTraces({ corners = ['tl', 'tr', 'bl', 'br'], animated = true, drawIn = false, className = '' }) {
  const ref = useRef(null)
  const uid = `ct${useId().replace(/[^a-zA-Z0-9]/g, '')}`

  // Pause the pulse animations while the traces are off-screen
  useEffect(() => {
    const el = ref.current
    if (!el || !animated || typeof IntersectionObserver === 'undefined') return
    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) el.removeAttribute('data-paused')
      else el.setAttribute('data-paused', '')
    })
    io.observe(el)
    return () => io.disconnect()
  }, [animated])

  return (
    <div
      ref={ref}
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit] text-gold ${drawIn ? 'circuit-draw' : ''} ${className}`}
    >
      {corners.map((c) => (
        <Corner key={c} corner={c} uid={uid} animated={animated} />
      ))}
    </div>
  )
}
