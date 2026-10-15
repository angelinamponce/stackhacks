import { useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { useReducedMotion } from 'framer-motion'
import { GlowNode, PulseTrain, RingNode, SpinePulses, TraceLine, TracePulse, TRACE_GOLD, TRACE_LIGHT } from './CircuitParts'
import { buildBoard, measurePage } from '../../lib/circuitLayout'

const modeFor = (w) => (w < 768 ? 'minimal' : w < 1024 ? 'medium' : 'full')
const LINE = 1.5 // matches the rendered stroke of the reference corners (2px at 180/240 scale)

function BoardShapes({ board, mode, highlight = false }) {
  const color = highlight ? TRACE_LIGHT : TRACE_GOLD
  return (
    <>
      {board.spines.map((s) => (
        <TraceLine key={s.side} d={s.d} width={LINE} opacity={highlight ? 0.9 : 0.22} color={color} />
      ))}
      {board.branches.map((b, i) => (
        <g key={i} data-branch={i} data-anchor={b.anchor || undefined}>
          {b.lines.map((d, k) => (
            <TraceLine key={k} d={d} width={LINE} opacity={highlight ? 0.95 : 0.45} color={color} />
          ))}
          {!highlight && b.hero && b.pulse && <TracePulse d={b.lines[0]} width={2} delay={b.pulseDelay} duration={b.pulseDuration} />}
          {!highlight && b.trains && b.lines.map((d, k) => (
            // Medium screens get a lighter version: one pulse per line, no tails
            <PulseTrain
              key={`p${k}`}
              d={d}
              width={1.5}
              count={mode === 'full' ? b.trains[k].count : 1}
              duration={b.trains[k].dur}
              offset={b.trains[k].offset}
              tail={mode === 'full'}
            />
          ))}
          {b.rings.map(([x, y], k) => (
            <RingNode key={k} x={x} y={y} r={4} width={LINE} opacity={highlight ? 1 : 0.7} color={color} />
          ))}
          {b.glows.map(([x, y], k) => (
            <GlowNode key={k} x={x} y={y} scale={0.9} animated={false} className={b.anchor ? 'anchor-glow' : 'board-soft-glow'} />
          ))}
          {highlight && b.rings.map(([x, y], k) => <GlowNode key={`h${k}`} x={x} y={y} scale={1.1} animated={false} />)}
        </g>
      ))}
    </>
  )
}

/**
 * One continuous, page-level circuit board behind all content (mounted once in App).
 * Spines run down both margins through every section, branches fork toward the content
 * and stop short of it (see lib/circuitLayout). Scroll lights the spine progressively,
 * section nodes light as they're reached, and nodes near the cursor brighten.
 */
export default function CircuitBoard() {
  const wrapRef = useRef(null)
  const litRefs = useRef([])
  const headRefs = useRef([])
  const [board, setBoard] = useState(null)
  const [mode, setMode] = useState(() => (typeof window === 'undefined' ? 'full' : modeFor(window.innerWidth)))
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
      timer = setTimeout(() => {
        const m = modeFor(window.innerWidth)
        setMode(m)
        setBoard(buildBoard(measurePage(root, wrap), m))
      }, 180)
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

  // Scroll-linked lighting: lit spine, travelling head pulse, section nodes, in-view anchors, offscreen pause
  useEffect(() => {
    const wrap = wrapRef.current
    if (!wrap || !board) return

    // y -> length lookup for each spine, so the lit portion follows the scroll position
    const tables = litRefs.current.map((path) => {
      if (!path) return null
      const total = path.getTotalLength()
      path.style.strokeDasharray = `${total} ${total}`
      const rows = []
      for (let l = 0; l <= total; l += 16) rows.push([path.getPointAtLength(l).y, l])
      rows.push([path.getPointAtLength(total).y, total])
      return { path, total, rows }
    })
    const lengthAtY = ({ rows }, y) => {
      let lo = 0, hi = rows.length - 1
      while (lo < hi) { const mid = (lo + hi) >> 1; if (rows[mid][0] < y) lo = mid + 1; else hi = mid }
      return rows[lo][1]
    }

    const nodes = [...wrap.querySelectorAll('[data-node-y]')]
    const branches = [...wrap.querySelectorAll('svg.board-base [data-branch]')]
    let frame = 0

    const update = () => {
      frame = 0
      const top = wrap.getBoundingClientRect().top
      const vh = window.innerHeight
      const head = vh * 0.6 - top // scroll head in board coordinates
      const viewTop = -top - 200, viewBottom = -top + vh + 200

      tables.forEach((t, i) => {
        if (!t) return
        const len = reduce ? t.total : lengthAtY(t, head)
        t.path.style.strokeDashoffset = String(t.total - len)
        const h = headRefs.current[i]
        if (h) {
          const pt = t.path.getPointAtLength(len)
          h.style.transform = `translate(${pt.x}px, ${pt.y}px)`
          h.style.opacity = reduce || len >= t.total - 1 ? '0' : '1'
        }
      })
      nodes.forEach((n) => n.toggleAttribute('data-lit', reduce || Number(n.dataset.nodeY) <= head))
      branches.forEach((g) => {
        const b = board.branches[Number(g.dataset.branch)]
        const onScreen = b.y1 > viewTop && b.y0 < viewBottom
        g.toggleAttribute('data-paused', !onScreen)
        if (b.anchor) g.toggleAttribute('data-inview', b.y0 > -top && b.y1 < -top + vh)
      })
    }
    const onScroll = () => { if (!frame) frame = requestAnimationFrame(update) }
    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [board, reduce])

  // Cursor proximity glow (mouse only, not on the minimal phone layout)
  const cursor = mode !== 'minimal'
  useEffect(() => {
    const wrap = wrapRef.current
    if (!wrap || !cursor || !window.matchMedia('(hover: hover) and (pointer: fine)').matches) return
    let frame = 0
    const onMove = (e) => {
      if (e.pointerType !== 'mouse') return
      const { clientX, clientY } = e
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => {
        const r = wrap.getBoundingClientRect()
        wrap.style.setProperty('--cx', `${clientX - r.left}px`)
        wrap.style.setProperty('--cy', `${clientY - r.top}px`)
        wrap.style.setProperty('--glow-on', '1')
      })
    }
    const onLeave = () => wrap.style.setProperty('--glow-on', '0')
    window.addEventListener('pointermove', onMove, { passive: true })
    document.documentElement.addEventListener('pointerleave', onLeave)
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('pointermove', onMove)
      document.documentElement.removeEventListener('pointerleave', onLeave)
    }
  }, [cursor])

  return (
    <div ref={wrapRef} aria-hidden="true" className="circuit-board pointer-events-none absolute inset-0 z-0 overflow-hidden">
      {board && (
        <>
          <svg className="board-base absolute left-0 top-0" width={board.W} height={board.H} fill="none">
            <BoardShapes board={board} mode={mode} />

            {/* Lit spine: drawn progressively with scroll, with a soft wide glow underneath */}
            {board.spines.map((s, i) => (
              <g key={s.side}>
                <path d={s.d} stroke={TRACE_GOLD} strokeWidth="5" strokeOpacity="0.08" strokeLinecap="round" fill="none" />
                <path
                  ref={(el) => { litRefs.current[i] = el }}
                  className="board-lit"
                  d={s.d}
                  stroke={TRACE_GOLD}
                  strokeWidth={LINE}
                  strokeOpacity="0.8"
                  strokeLinecap="round"
                  fill="none"
                  style={{ strokeDasharray: '100000', strokeDashoffset: '100000' }}
                />
                {/* Continuous pulses running down the spine */}
                <SpinePulses d={s.d} length={s.length} width={1.5} tail={mode !== 'minimal'} every={mode === 'minimal' ? 2.4 : 1.6} />
                <g ref={(el) => { headRefs.current[i] = el }} className="board-head">
                  <circle r="9" fill={TRACE_GOLD} fillOpacity="0.22" />
                  <circle r="2.5" fill={TRACE_LIGHT} />
                </g>
              </g>
            ))}

            {/* Section nodes on the spines */}
            {board.spineNodes.map((n, i) => (
              <g key={i} data-node-y={n.y} className="board-node">
                <RingNode x={n.x} y={n.y} r={4.5} width={LINE} opacity={0.75} />
                <g className="board-node-glow">
                  <GlowNode x={n.x} y={n.y} scale={0.9} animated={false} />
                </g>
              </g>
            ))}
          </svg>

          {cursor && (
            <svg className="circuit-board-glow absolute left-0 top-0" width={board.W} height={board.H} fill="none">
              <BoardShapes board={board} mode={mode} highlight />
              {board.spineNodes.map((n, i) => (
                <GlowNode key={i} x={n.x} y={n.y} scale={1.1} animated={false} />
              ))}
            </svg>
          )}
        </>
      )}
    </div>
  )
}
