import { useEffect, useRef } from 'react'
import { GlowNode, RingNode, TraceLine, TracePulse } from './CircuitParts'

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

function Corner({ corner, animated, index }) {
  return (
    <svg viewBox="0 0 240 150" fill="none" className={`absolute h-auto w-[150px] sm:w-[200px] lg:w-[240px] ${PLACEMENT[corner]}`}>
      {TRACES.map((t, i) => {
        const delay = `${(index * 0.9 + i * 0.6).toFixed(2)}s`
        return (
          <g key={i} className={t.desktop ? 'hidden sm:inline' : undefined}>
            <TraceLine d={t.d} />
            {animated && <TracePulse d={t.d} delay={delay} duration={`${3.5 + (i % 3)}s`} />}
            <RingNode x={t.node[0]} y={t.node[1]} />
            {t.glow && <GlowNode x={t.node[0]} y={t.node[1]} animated={animated} delay={delay} />}
          </g>
        )
      })}
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
      {corners.map((c, i) => (
        <Corner key={c} corner={c} index={i} animated={animated} />
      ))}
    </div>
  )
}
