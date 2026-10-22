import { useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { useReducedMotion } from 'framer-motion'
import { GlowNode, RingNode, SoftPulse, TRACE_GOLD } from './CircuitParts'
import { buildBoard, measurePage } from '../../lib/circuitLayout'

const modeFor = (w) => (w < 768 ? 'minimal' : w < 1024 ? 'medium' : 'full')
const LINE = 1 // one thin stroke weight everywhere
// Base opacities: a sparse, faint accent. The spine is never brighter than the branches.
const BRANCH_OPACITY = 0.16
const HERO_BRANCH_OPACITY = 0.1
const SPINE_OPACITY = 0.08
const SPINE_LIT_OPACITY = 0.15
const RING_OPACITY = 0.25
const SPINE_FADE = 90 // px of fade at each end of a spine run

/**
 * Gradient for one branch line: faint where it leaves the spine, full in the middle, fading out
 * completely at its outer end so it tapers into the background before reaching content.
 */
function BranchGradient({ id, span: [[x1, y1], [x2, y2]] }) {
  return (
    <linearGradient id={id} gradientUnits="userSpaceOnUse" x1={x1} y1={y1} x2={x2} y2={y2}>
      <stop offset="0" stopColor={TRACE_GOLD} stopOpacity="0.35" />
      <stop offset="0.25" stopColor={TRACE_GOLD} stopOpacity="1" />
      <stop offset="0.7" stopColor={TRACE_GOLD} stopOpacity="1" />
      <stop offset="1" stopColor={TRACE_GOLD} stopOpacity="0" />
    </linearGradient>
  )
}

/** White-in-the-middle vertical mask for each spine run, so the spine fades at every run end. */
function SpineMask({ id, spine, W }) {
  return (
    <mask id={id} maskUnits="userSpaceOnUse" x="0" y="0" width={W} height="100%">
      {spine.fades.map(({ y0, y1 }, k) => {
        const h = Math.max(1, y1 - y0)
        const f = Math.min(0.45, SPINE_FADE / h)
        return (
          <g key={k}>
            <linearGradient id={`${id}-g${k}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#fff" stopOpacity="0" />
              <stop offset={f} stopColor="#fff" stopOpacity="1" />
              <stop offset={1 - f} stopColor="#fff" stopOpacity="1" />
              <stop offset="1" stopColor="#fff" stopOpacity="0" />
            </linearGradient>
            <rect x="0" y={y0} width={W} height={h} fill={`url(#${id}-g${k})`} />
          </g>
        )
      })}
    </mask>
  )
}

/**
 * One continuous, page-level circuit board behind all content (mounted once in App).
 * A single faint spine runs down each margin; sparse branches fork toward the content and fade
 * out before reaching it (see lib/circuitLayout). Scroll draws the spine in with eased, damped
 * motion; a few branches carry one slow, soft pulse each.
 */
export default function CircuitBoard() {
  const wrapRef = useRef(null)
  const litRefs = useRef([])
  const [board, setBoard] = useState(null)
  const reduce = useReducedMotion()
  const { pathname } = useLocation()

  // (Re)build the board whenever the page's size or content layout changes
  useEffect(() => {
    const wrap = wrapRef.current
    const root = wrap?.parentElement
    if (!wrap || !root) return
    let timer = 0
    const rebuild = () => {
      clearTimeout(timer)
      timer = setTimeout(() => setBoard(buildBoard(measurePage(root, wrap), modeFor(window.innerWidth))), 180)
    }
    const ro = new ResizeObserver(rebuild)
    ro.observe(root)
    window.addEventListener('resize', rebuild)
    document.fonts?.ready.then(rebuild)
    // Content (CMS data, images) can shift layout without changing the root's size
    const late = setTimeout(rebuild, 1500)
    return () => {
      clearTimeout(timer)
      clearTimeout(late)
      ro.disconnect()
      window.removeEventListener('resize', rebuild)
    }
  }, [pathname])

  // Scroll-linked spine draw (eased and damped, never snapping), in-view anchors, offscreen pause
  useEffect(() => {
    const wrap = wrapRef.current
    if (!wrap || !board) return

    // y -> length lookup for each spine, so the drawn portion follows the scroll position
    const tables = litRefs.current.map((path) => {
      if (!path) return null
      const total = path.getTotalLength()
      path.style.strokeDasharray = `${total} ${total}`
      const rows = []
      for (let l = 0; l <= total; l += 16) rows.push([path.getPointAtLength(l).y, l])
      rows.push([path.getPointAtLength(total).y, total])
      return { path, total, rows, cur: 0 }
    })
    const lengthAtY = ({ rows }, y) => {
      let lo = 0, hi = rows.length - 1
      while (lo < hi) { const mid = (lo + hi) >> 1; if (rows[mid][0] < y) lo = mid + 1; else hi = mid }
      return rows[lo][1]
    }

    const branches = [...wrap.querySelectorAll('svg.board-base [data-branch]')]
    let frame = 0

    // Visibility state (which branches animate, which anchors breathe) follows the scroll directly
    const updateVisibility = () => {
      const top = wrap.getBoundingClientRect().top
      const vh = window.innerHeight
      const viewTop = -top - 200, viewBottom = -top + vh + 200
      branches.forEach((g) => {
        const b = board.branches[Number(g.dataset.branch)]
        const onScreen = b.y1 > viewTop && b.y0 < viewBottom
        g.toggleAttribute('data-paused', !onScreen)
        if (b.anchor) g.toggleAttribute('data-inview', b.y0 > -top && b.y1 < -top + vh)
      })
    }

    // The drawn spine eases toward its target length each frame (damped), then stops
    const tick = () => {
      frame = 0
      const top = wrap.getBoundingClientRect().top
      const head = window.innerHeight * 0.6 - top // scroll head in board coordinates
      let moving = false
      tables.forEach((t) => {
        if (!t) return
        const target = reduce ? t.total : lengthAtY(t, head)
        const delta = target - t.cur
        t.cur = reduce || Math.abs(delta) < 0.5 ? target : t.cur + delta * 0.08
        if (t.cur !== target) moving = true
        t.path.style.strokeDashoffset = String(t.total - t.cur)
      })
      if (moving) frame = requestAnimationFrame(tick)
    }
    const onScroll = () => {
      updateVisibility()
      if (!frame) frame = requestAnimationFrame(tick)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [board, reduce])

  return (
    <div ref={wrapRef} aria-hidden="true" className="circuit-board pointer-events-none absolute inset-0 z-0 overflow-hidden">
      {board && (
        <svg className="board-base absolute left-0 top-0" width={board.W} height={board.H} fill="none">
          <defs>
            {/* Softens the pulses into a glow */}
            <filter id="soft-pulse-blur" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="1.2" />
            </filter>
            {board.spines.map((s) => <SpineMask key={s.side} id={`spine-fade-${s.side}`} spine={s} W={board.W} />)}
            {board.branches.map((b, i) => b.spans.map((span, k) => <BranchGradient key={`${i}-${k}`} id={`branch-${i}-${k}`} span={span} />))}
          </defs>

          {/* Spine: one very faint line per margin, with a slightly brighter scroll-drawn copy */}
          {board.spines.map((s, i) => (
            <g key={s.side} mask={`url(#spine-fade-${s.side})`}>
              <path d={s.d} stroke={TRACE_GOLD} strokeWidth={LINE} strokeOpacity={SPINE_OPACITY} strokeLinecap="round" fill="none" />
              <path
                ref={(el) => { litRefs.current[i] = el }}
                mask={board.heroZone ? 'url(#board-calm-hero)' : undefined}
                d={s.d}
                stroke={TRACE_GOLD}
                strokeWidth={LINE}
                strokeOpacity={SPINE_LIT_OPACITY}
                strokeLinecap="round"
                fill="none"
                style={{ strokeDasharray: '100000', strokeDashoffset: '100000' }}
              />
            </g>
          ))}

          {/* Keeps the scroll-drawn spine out of the calm landing hero (home page only) */}
          {board.heroZone && (
            <mask id="board-calm-hero" maskUnits="userSpaceOnUse" x="0" y="0" width={board.W} height={board.H}>
              <rect width={board.W} height={board.H} fill="white" />
              <rect y={board.heroZone.top} width={board.W} height={board.heroZone.bottom - board.heroZone.top} fill="black" />
            </mask>
          )}

          {/* Branches: gradient-faded traces, one ring each, rare soft glows and pulses */}
          {board.branches.map((b, i) => (
            <g key={i} data-branch={i} data-anchor={b.anchor || undefined}>
              {b.lines.map((d, k) => (
                <path
                  key={k}
                  className="circuit-trace"
                  d={d}
                  pathLength="100"
                  stroke={`url(#branch-${i}-${k})`}
                  strokeWidth={LINE}
                  strokeOpacity={b.hero ? HERO_BRANCH_OPACITY : BRANCH_OPACITY}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="none"
                />
              ))}
              {b.pulse && <SoftPulse id={`sp${i}`} d={b.lines[0]} travel={b.pulse.travel} pause={b.pulse.pause} delay={b.pulse.delay} width={LINE} />}
              {b.rings.map(([x, y], k) => (
                <RingNode key={k} x={x} y={y} r={3} width={LINE} opacity={RING_OPACITY} />
              ))}
              {b.glows.map(([x, y], k) => (
                <GlowNode key={k} x={x} y={y} scale={0.75} animated={false} className={b.anchor ? 'anchor-glow' : 'board-soft-glow'} />
              ))}
            </g>
          ))}
        </svg>
      )}
    </div>
  )
}
