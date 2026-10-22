// Geometry for the page-level circuit board (see components/os/CircuitBoard.jsx).
// Everything is in page pixels relative to the app root, so traces flow continuously
// across section boundaries instead of being stamped per section.

// Elements traces must never touch: text, media, controls, cards and graphic blocks.
const AVOID_SELECTOR = [
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'a', 'button', 'img', 'input', 'textarea', 'select',
  'label', 'li', 'dt', 'dd', 'dl', 'article', 'form', 'figure', 'video', 'table',
  'canvas:not(#constellation-canvas)', '.tech-card', '.glass-card', '.line-frame',
  '[role=listbox]', '[aria-roledescription=carousel]', '[data-circuit-avoid]',
].join(',')

const SECTION_SELECTOR = 'main section, [data-circuit-section], footer'
const AVOID_PAD = 18 // clear gutter between any trace and content
const NAV_H = 64

// Deterministic PRNG so a page always gets the same (but varied) board.
function rng(seed) {
  let s = (seed * 2654435761) >>> 0 || 1
  return () => {
    s ^= s << 13; s >>>= 0
    s ^= s >>> 17
    s ^= s << 5; s >>>= 0
    return (s % 10000) / 10000
  }
}

/** Reads content rects, section tops and headings from the live DOM. */
export function measurePage(root, origin) {
  const o = origin.getBoundingClientRect()
  const W = origin.clientWidth
  const H = root.scrollHeight
  const rel = (r) => ({ left: r.left - o.left, top: r.top - o.top, right: r.right - o.left, bottom: r.bottom - o.top })
  const scopes = root.querySelectorAll('main, footer')

  // Only the visible part of each element counts (e.g. the marquee track is mostly clipped)
  const clipCache = new Map()
  const clipOf = (el) => {
    if (!el || el === root) return null
    if (clipCache.has(el)) return clipCache.get(el)
    const parentClip = clipOf(el.parentElement)
    const cs = getComputedStyle(el)
    let clip = parentClip
    if (cs.overflowX !== 'visible' || cs.overflowY !== 'visible') {
      const b = el.getBoundingClientRect()
      clip = parentClip
        ? { left: Math.max(b.left, parentClip.left), top: Math.max(b.top, parentClip.top), right: Math.min(b.right, parentClip.right), bottom: Math.min(b.bottom, parentClip.bottom) }
        : { left: b.left, top: b.top, right: b.right, bottom: b.bottom }
    }
    clipCache.set(el, clip)
    return clip
  }

  const avoid = []
  scopes.forEach((scope) =>
    scope.querySelectorAll(AVOID_SELECTOR).forEach((el) => {
      const r = el.getBoundingClientRect()
      if (!(r.width > 0 && r.height > 0)) return
      const c = clipOf(el.parentElement)
      const v = c ? { left: Math.max(r.left, c.left), top: Math.max(r.top, c.top), right: Math.min(r.right, c.right), bottom: Math.min(r.bottom, c.bottom) } : r
      if (v.right - v.left > 1 && v.bottom - v.top > 1) avoid.push(rel(v))
    })
  )

  const tops = [...root.querySelectorAll(SECTION_SELECTOR)]
    .map((el) => rel(el.getBoundingClientRect()))
    .filter((r) => r.bottom - r.top > 120 && r.top > NAV_H + 40)
    .map((r) => Math.round(r.top))
    .sort((a, b) => a - b)
  const boundaries = tops.filter((y, i) => i === 0 || y - tops[i - 1] > 80)

  const headings = [...root.querySelectorAll('main h1, main h2')]
    .map((el) => rel(el.getBoundingClientRect()))
    .filter((r) => r.bottom - r.top > 0)
    .map((r) => ({ y: Math.round((r.top + r.bottom) / 2), cx: (r.left + r.right) / 2 }))

  // The landing hero keeps its original (sparser) circuits
  const heroEl = root.querySelector('[data-circuit-hero]')
  const heroZone = heroEl ? (({ top, bottom }) => ({ top, bottom }))(rel(heroEl.getBoundingClientRect())) : null

  return { W, H, avoid, boundaries, headings, heroZone }
}

// Branch patterns as polylines of [dx, dy] offsets (dx is mirrored for the right spine).
// a/b/c are randomised lengths; b is always used for 45-degree runs. A mix of long, gently stepped
// runs and a few short branches, so neighbouring clusters never read as repeated blocks.
const PATTERNS = [
  // elbow: out, 45 down, out
  ({ a, b, c }) => ({ lines: [[[0, 0], [a, 0], [a + b, b], [a + b + c, b]]] }),
  // long step: a long run that steps down twice, gently
  ({ a, b, c }) => ({ lines: [[[0, 0], [a * 1.4, 0], [a * 1.4 + b, b], [a * 1.4 + b + c * 0.8, b], [a * 1.4 + b * 1.6 + c * 0.8, b * 1.6], [a * 1.4 + b * 1.6 + c * 1.5, b * 1.6]]] }),
  // fork: stem splits into an upper and a lower branch of different lengths
  ({ a, b, c }) => ({
    lines: [
      [[0, 0], [a, 0], [a + b, -b], [a + b + c, -b]],
      [[a, 0], [a + b * 0.7, b * 0.7], [a + b * 0.7 + c * 0.45, b * 0.7]],
    ],
  }),
  // drop: 45 off the spine, runs down the gutter, then out
  ({ a, b, c }) => ({ lines: [[[0, 0], [b, b], [b, b + c * 0.7], [b + 12, b + c * 0.7 + 12], [b + 12 + a, b + c * 0.7 + 12]]] }),
  // short stub: a brief run with a single bend
  ({ a, b }) => ({ lines: [[[0, 0], [a * 0.8, 0], [a * 0.8 + b * 0.8, -b * 0.8]]] }),
  // long run with a rise at the end (between sections)
  ({ a, b, c }) => ({ lines: [[[0, 0], [a * 1.6, 0], [a * 1.6 + b, b], [a * 1.6 + b + c, b], [a * 1.6 + b * 1.7 + c, b * 0.3], [a * 2.2 + b * 1.7 + c, b * 0.3]]] }),
  // hook up: rises toward the heading above
  ({ a, b, c }) => ({ lines: [[[0, 0], [a, 0], [a + b, -b], [a + b + c * 0.7, -b]]] }),
  // stair: two steps down with a long final run
  ({ a, b, c }) => ({ lines: [[[0, 0], [a, 0], [a + b, b], [2 * a + b, b], [2 * a + 2 * b, 2 * b], [2 * a + 2 * b + c, 2 * b]]] }),
]

const segBox = ([x1, y1], [x2, y2], pad) => ({
  left: Math.min(x1, x2) - pad, right: Math.max(x1, x2) + pad,
  top: Math.min(y1, y2) - pad, bottom: Math.max(y1, y2) + pad,
})
const hits = (a, b) => a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom

// Splits a mostly-vertical polyline into runs that skip the given [top, bottom] y-intervals.
function clipByY(pts, blocked) {
  const runs = []
  let run = []
  const inBlock = (y) => blocked.some(([a, b]) => y > a && y < b)
  const cuts = blocked.flat()
  for (let i = 1; i < pts.length; i++) {
    const [x1, y1] = pts[i - 1], [x2, y2] = pts[i]
    const ys = [y1, ...cuts.filter((c) => c > y1 && c < y2), y2]
    for (let k = 1; k < ys.length; k++) {
      const ya = ys[k - 1], yb = ys[k]
      const xOf = (y) => (y2 === y1 ? x2 : x1 + ((x2 - x1) * (y - y1)) / (y2 - y1))
      if (inBlock((ya + yb) / 2) || (ya === yb && y1 !== y2)) {
        if (run.length > 1) runs.push(run)
        run = []
        continue
      }
      if (!run.length) run.push([xOf(ya), ya])
      run.push([yb === ya ? x2 : xOf(yb), yb])
    }
  }
  if (run.length > 1) runs.push(run)
  return runs
}

const f1 = (n) => n.toFixed(1)
// Polyline -> path with slightly rounded corners (radius r, never more than half a segment)
const toPath = (pts, r = 5) => {
  if (pts.length < 3) return pts.map(([x, y], i) => `${i ? 'L' : 'M'}${f1(x)} ${f1(y)}`).join(' ')
  let d = `M${f1(pts[0][0])} ${f1(pts[0][1])}`
  for (let i = 1; i < pts.length - 1; i++) {
    const [px, py] = pts[i - 1], [x, y] = pts[i], [nx, ny] = pts[i + 1]
    const l1 = Math.hypot(x - px, y - py), l2 = Math.hypot(nx - x, ny - y)
    const k = Math.min(r, l1 / 2, l2 / 2)
    if (!k) { d += ` L${f1(x)} ${f1(y)}`; continue }
    d += ` L${f1(x - ((x - px) / l1) * k)} ${f1(y - ((y - py) / l1) * k)} Q${f1(x)} ${f1(y)} ${f1(x + ((nx - x) / l2) * k)} ${f1(y + ((ny - y) / l2) * k)}`
  }
  const [lx, ly] = pts[pts.length - 1]
  return `${d} L${f1(lx)} ${f1(ly)}`
}

/**
 * Builds the board for a measured page.
 * mode: 'full' (>=1024px), 'medium' (768-1023px, fewer/shorter branches), 'minimal' (<768px, one spine).
 */
export function buildBoard({ W, H, avoid, boundaries, headings, heroZone }, mode) {
  const padded = avoid.map((r) => ({ left: r.left - AVOID_PAD, right: r.right + AVOID_PAD, top: r.top - AVOID_PAD, bottom: r.bottom + AVOID_PAD }))
  const contentLeft = W >= 1200 ? (W - 1152) / 2 + 24 : 24
  const sx = mode === 'minimal' ? 8 : Math.round(Math.min(56, Math.max(10, contentLeft * 0.3)))
  const jog = contentLeft > 90 ? Math.round(Math.min(18, contentLeft * 0.12)) : 0

  // Spines: mostly vertical, with a small 45-degree jog at alternating section boundaries
  const sides = mode === 'minimal' ? ['L'] : ['L', 'R']
  const spines = sides.map((side) => {
    const inward = side === 'L' ? 1 : -1
    const x0 = side === 'L' ? sx : W - sx
    const pts = [[x0, NAV_H]]
    let cur = x0
    boundaries.forEach((yb, k) => {
      const nx = x0 + inward * (k % 2 === 0 ? jog : 0)
      if (nx === cur || yb < NAV_H + 80 || yb > H - 80) return
      const d = Math.abs(nx - cur)
      pts.push([cur, yb - 40 - d], [nx, yb - 40])
      cur = nx
    })
    pts.push([cur, H])
    const xAtRaw = (y) => {
      for (let i = 1; i < pts.length; i++) {
        const [x1, y1] = pts[i - 1], [x2, y2] = pts[i]
        if (y <= y2) return y2 === y1 ? x2 : x1 + ((x2 - x1) * (y - y1)) / (y2 - y1)
      }
      return cur
    }
    const xAt = xAtRaw
    // Never run behind content: skip stretches where a content box covers the spine (e.g. full-bleed rows)
    const blocked = avoid
      .filter((r) => { const x = xAt((r.top + r.bottom) / 2); return x > r.left - 8 && x < r.right + 8 })
      .map((r) => [r.top - 10, r.bottom + 10])
      .sort((a, b) => a[0] - b[0])
      .reduce((acc, iv) => {
        const last = acc[acc.length - 1]
        if (last && iv[0] <= last[1]) last[1] = Math.max(last[1], iv[1])
        else acc.push([...iv])
        return acc
      }, [])
    const runs = clipByY(pts, blocked)
    // Each continuous run fades in and out at its ends (see CircuitBoard spine mask)
    const fades = runs.map((run) => ({ y0: Math.min(...run.map(([, y]) => y)), y1: Math.max(...run.map(([, y]) => y)) }))
    const length = runs.reduce((sum, run) => sum + run.slice(1).reduce((l, [x, y], i) => l + Math.hypot(x - run[i][0], y - run[i][1]), 0), 0)
    const isBlocked = (y) => blocked.some(([a, b]) => y > a - 12 && y < b + 12)
    const jogZones = pts.slice(1, -1).map(([, y]) => y)
    return { side, inward, d: runs.map((run) => toPath(run, 10)).join(' '), length, xAt, jogZones, isBlocked, fades }
  })

  // Section nodes on the spines (light up as the scroll head reaches them)
  const spineNodes = []
  spines.forEach((s) => boundaries.forEach((yb) => { if (!s.isBlocked(yb)) spineNodes.push({ x: s.xAt(yb), y: yb }) }))

  if (mode === 'minimal') return { W, H, spines, spineNodes, branches: [], heroZone }

  // Branch roots: section boundaries, headings (quiet anchors), and fillers in long stretches
  const roots = []
  const inHero = (y) => heroZone && y >= heroZone.top - 20 && y <= heroZone.bottom
  boundaries.forEach((yb, i) => roots.push({ y: yb + 28, side: i % 2 ? 'R' : 'L', kind: 'boundary', seed: i + 1 }))
  if (mode === 'full') {
    headings.forEach((h, i) => {
      const side = Math.abs(h.cx - W / 2) < 120 ? (i % 2 ? 'L' : 'R') : h.cx < W / 2 ? 'L' : 'R'
      roots.push({ y: h.y, side, kind: 'anchor', seed: 100 + i })
    })
    ;['L', 'R'].forEach((side, si) => {
      // Sparse, jittered fillers down each gutter (offset per side so the two margins never mirror)
      const r = rng(1200 + si)
      for (let y = 300 + si * 190; y < H - 200; y += 280 + r() * 100) roots.push({ y: Math.round(y), side, kind: 'filler', seed: 300 + si * 50 + Math.round(y / 10) })
    })
  }

  const maxReach = mode === 'full' ? Math.min(W * 0.24, 340) : 170
  // Landing hero (home page only): branches stay in the far gutters, well clear of the content
  const heroReach = Math.max(0, contentLeft - sx - 28)
  const heroGlows = { L: 0, R: 0 }
  const HERO_MAX_GLOWS = 2
  const lastY = { L: -Infinity, R: -Infinity }
  const minGap = (y) => (inHero(y) ? 220 : 160)
  // Page-wide spacing so glows and pulses stay rare: about one of each per screen height at most
  let lastGlowY = -Infinity
  let lastPulseY = -Infinity
  const GLOW_GAP = 700
  const PULSE_GAP = 820
  const branches = []
  let patternIdx = 0

  roots.sort((a, b) => a.y - b.y).forEach((root) => {
    const spine = spines.find((s) => s.side === root.side)
    if (!spine || root.y < NAV_H + 30 || root.y > H - 40) return
    const hero = inHero(root.y)
    if (hero && heroReach < 30) return
    if (root.y - lastY[root.side] < minGap(root.y)) return
    if (spine.jogZones.some((jy) => Math.abs(jy - root.y) < 60) || spine.isBlocked(root.y)) return

    const rand = rng(root.seed * 7 + (root.side === 'R' ? 3 : 0))
    // Cycle through patterns with a random offset so neighbours never repeat
    patternIdx = (patternIdx + 1 + Math.floor(rand() * 3)) % PATTERNS.length
    // Wide random ranges so lengths and step heights vary from cluster to cluster
    const base = { a: 20 + rand() * 60, b: 10 + rand() * 22, c: 30 + rand() * 130 }
    const x0 = spine.xAt(root.y)

    for (let scale = 1; scale > 0.3; scale *= 0.7) {
      const p = PATTERNS[patternIdx]({ a: base.a * scale, b: base.b * Math.max(scale, 0.6), c: base.c * scale })
      const lines = p.lines.map((pl) => pl.map(([dx, dy]) => [x0 + spine.inward * dx, root.y + dy]))
      const reach = Math.max(...lines.flat().map(([x]) => Math.abs(x - x0)))
      if (reach > (hero ? heroReach : maxReach)) continue
      const inBounds = lines.flat().every(([x, y]) => x > 4 && x < W - 4 && y > NAV_H && y < H - 4)
      const clear = lines.every((pl) => pl.every((pt, i) => i === 0 || !padded.some((r) => hits(segBox(pl[i - 1], pt, 7), r))))
      if (!inBounds || !clear) continue

      // One ring per trace, on the last bend of the main line (the line itself fades out past it)
      const main = lines[0]
      const ring = main.length > 2 ? main[main.length - 2] : null
      const glowAllowed = ring && root.y - lastGlowY > GLOW_GAP && (!hero || heroGlows[root.side] < HERO_MAX_GLOWS)
      const glow = glowAllowed && (root.kind === 'anchor' || rand() < 0.5)
      if (glow) { lastGlowY = root.y; if (hero) heroGlows[root.side]++ }
      // A single soft pulse on the main line, only on well-spaced branches; slow travel, long random pause
      const pulse = root.y - lastPulseY > PULSE_GAP && rand() < 0.8
      if (pulse) lastPulseY = root.y
      branches.push({
        lines: lines.map((pl) => toPath(pl)),
        // Start and end points of each line, for the fade-out gradients
        spans: lines.map((pl) => [pl[0], pl[pl.length - 1]]),
        rings: ring ? [ring] : [],
        glows: glow ? [ring] : [],
        hero,
        pulse: pulse ? { travel: 8 + rand() * 6, pause: 10 + rand() * 10, delay: rand() * 18 } : null,
        anchor: root.kind === 'anchor',
        y0: Math.min(...lines.flat().map(([, y]) => y)),
        y1: Math.max(...lines.flat().map(([, y]) => y)),
      })
      lastY[root.side] = root.y
      break
    }
  })

  return { W, H, spines, spineNodes, branches, heroZone }
}
