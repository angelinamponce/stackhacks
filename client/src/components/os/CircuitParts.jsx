// Shared circuit-trace primitives: the one source of the trace style used by the
// "Join the Community" corners (CircuitTraces) and the page-level CircuitBoard.
// Thin gold line, ring nodes, glowing nodes with a soft halo, travelling pulses.

export const TRACE_GOLD = 'var(--color-gold)'
export const TRACE_LIGHT = '#ffe2a8'

/** A trace segment. `pathLength=100` normalises the travelling-pulse dash (see .circuit-pulse). */
export function TraceLine({ d, width = 2, opacity = 0.55, color = TRACE_GOLD, className = 'circuit-trace' }) {
  return (
    <path
      className={className}
      d={d}
      pathLength="100"
      stroke={color}
      strokeWidth={width}
      strokeOpacity={opacity}
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
  )
}

/** A small bright dash of light travelling along a trace. */
export function TracePulse({ d, width = 2.5, delay = '0s', duration = '4s' }) {
  return (
    <path
      className="circuit-pulse"
      d={d}
      pathLength="100"
      stroke={TRACE_LIGHT}
      strokeWidth={width}
      strokeLinecap="round"
      fill="none"
      style={{ '--pulse-delay': delay, '--pulse-duration': duration }}
    />
  )
}

/** Ring node at the end of a trace. */
export function RingNode({ x, y, r = 5, width = 2, opacity = 0.8, color = TRACE_GOLD }) {
  return (
    <circle className="circuit-trace" cx={x} cy={y} r={r} pathLength="100" stroke={color} strokeWidth={width} strokeOpacity={opacity} fill="none" />
  )
}

/** Filled glowing node with a soft halo. `animated` pulses its glow. */
export function GlowNode({ x, y, scale = 1, animated = true, delay = '0s', className = '' }) {
  return (
    <g className={`${animated ? 'circuit-node-glow' : ''} ${className}`} style={{ '--pulse-delay': delay }}>
      <circle cx={x} cy={y} r={10 * scale} fill={TRACE_GOLD} fillOpacity="0.18" />
      <circle cx={x} cy={y} r={2.5 * scale} fill={TRACE_LIGHT} />
    </g>
  )
}

/**
 * Several pulses chasing each other along one trace: `count` copies staggered evenly over
 * `duration` seconds, each a bright head with a short fading tail (unless `tail` is false).
 * Uses the normalised pathLength=100 dash (see .circuit-pulse / .circuit-pulse-tail).
 */
export function PulseTrain({ d, count = 2, duration = 3, offset = 0, tail = true, width = 2 }) {
  return Array.from({ length: count }, (_, i) => {
    const delay = `${(-(offset + (i * duration) / count)).toFixed(2)}s`
    const dur = `${duration.toFixed(2)}s`
    return (
      <g key={i}>
        {tail && (
          <path
            className="circuit-pulse-tail"
            d={d}
            pathLength="100"
            stroke={TRACE_GOLD}
            strokeWidth={width}
            strokeLinecap="round"
            fill="none"
            style={{ '--pulse-delay': delay, '--pulse-duration': dur }}
          />
        )}
        <TracePulse d={d} width={width + 0.5} delay={delay} duration={dur} />
      </g>
    )
  })
}

/**
 * Continuous pulses down a long trace measured in real pixels (the page spines),
 * so heads stay short regardless of the trace's length.
 */
export function SpinePulses({ d, length, speed = 420, every = 1.6, tail = true, width = 2 }) {
  if (!length) return null
  const head = 16
  const tailLen = 70
  const duration = (length + tailLen + head) / speed
  const count = Math.max(2, Math.round(duration / every))
  return Array.from({ length: count }, (_, i) => {
    const delay = `${(-(i * duration) / count).toFixed(2)}s`
    const base = { '--spine-duration': `${duration.toFixed(2)}s`, '--pulse-delay': delay }
    return (
      <g key={i}>
        {tail && (
          <path
            className="spine-pulse"
            d={d}
            stroke={TRACE_GOLD}
            strokeWidth={width}
            strokeOpacity="0.35"
            strokeLinecap="round"
            fill="none"
            style={{ ...base, '--dash': `${tailLen}px`, '--gap': `${length + 400}px`, '--from': `${tailLen + head}px`, '--to': `${-length + head}px` }}
          />
        )}
        <path
          className="spine-pulse"
          d={d}
          stroke={TRACE_LIGHT}
          strokeWidth={width + 0.5}
          strokeLinecap="round"
          fill="none"
          style={{ ...base, '--dash': `${head}px`, '--gap': `${length + 400}px`, '--from': `${head}px`, '--to': `${-length - tailLen}px` }}
        />
      </g>
    )
  })
}

/**
 * One slow, soft pulse along a trace (pathLength=100): a short blurred glow with a long fading
 * tail. It eases along the line over `travel` seconds, then rests for `pause` seconds, so pulses
 * stay rare and never sync up. Per-pulse keyframes let the travel/pause split differ per trace;
 * the .soft-pulse class pauses offscreen / in hidden tabs and is hidden for reduced motion.
 */
export function SoftPulse({ id, d, travel = 10, pause = 15, delay = 0, width = 1, blurId = 'soft-pulse-blur' }) {
  const total = travel + pause
  const pct = (sec) => `${((sec / total) * 100).toFixed(2)}%`
  const frames = (from, to) =>
    `0%{stroke-dashoffset:${from};opacity:0;animation-timing-function:cubic-bezier(0.45,0,0.55,1)}` +
    `${pct(travel * 0.2)}{opacity:1}${pct(travel * 0.75)}{opacity:1}` +
    `${pct(travel)}{stroke-dashoffset:${to};opacity:0}100%{stroke-dashoffset:${to};opacity:0}`
  const css = `@keyframes ${id}-h{${frames(6, -100)}}@keyframes ${id}-t{${frames(34, -72)}}`
  const anim = (k) => ({ animation: `${id}-${k} ${total.toFixed(2)}s linear ${delay.toFixed(2)}s infinite both` })
  return (
    <g filter={`url(#${blurId})`}>
      <style>{css}</style>
      <path className="soft-pulse" d={d} pathLength="100" stroke={TRACE_GOLD} strokeWidth={width + 0.6} strokeOpacity="0.3" strokeLinecap="round" fill="none" strokeDasharray="34 300" style={anim('t')} />
      <path className="soft-pulse soft-pulse-head" d={d} pathLength="100" stroke={TRACE_LIGHT} strokeWidth={width + 1} strokeOpacity="0.6" strokeLinecap="round" fill="none" strokeDasharray="6 300" style={anim('h')} />
    </g>
  )
}
