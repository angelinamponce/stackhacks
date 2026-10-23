import { RingNode, TraceLine } from './CircuitParts'

const OFF = true

/**
 * Thin circuit-trace corner accent (top-left + mirrored bottom-right) for cards.
 * `show` lights it (e.g. the selected founder); `hover` lights it on parent `.group` hover.
 */
export default function CornerTraces({ show = false, hover = false }) {
  // Off in the editorial restyle (no circuit decorations). Delete this line to bring them back.
  if (OFF) return null
  const visibility = show ? 'opacity-100' : hover ? 'opacity-0 group-hover:opacity-100 group-focus-within:opacity-100' : 'opacity-0'
  return (
    <div aria-hidden="true" className={`pointer-events-none absolute inset-0 z-20 transition-opacity duration-500 ${visibility}`}>
      {['top-1.5 left-1.5', 'bottom-1.5 right-1.5 -scale-100'].map((pos) => (
        <svg key={pos} viewBox="0 0 60 40" fill="none" className={`absolute h-auto w-14 ${pos} ${show ? 'circuit-draw' : ''}`}>
          <TraceLine d="M2 30 V12 L10 4 H40" width={1.5} opacity={0.9} />
          <TraceLine d="M2 38 V34 M14 4 V2" width={1.5} opacity={0.6} />
          <RingNode x={44} y={4} r={2.5} width={1.5} opacity={1} />
        </svg>
      ))}
    </div>
  )
}
