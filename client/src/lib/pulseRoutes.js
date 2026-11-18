// Pulse routes along the page-level circuit board's branches (components/os/CircuitBoard),
// shared by the About "power on" layer and the scroll-triggered pulses (components/os/*Layer).
import { PULSE } from './powerOn'

const LEAD = 200 // px of margin spine the pulse runs down before turning inward
const LIT = 0.6 // resting brightness of a lit node

/** Branches overlapping [top, bottom] (board coordinates), each as a pulse route + its nodes. */
export function routesFor(board, top, bottom, lead = LEAD) {
  return board.branches
    .map((b, i) => ({ b, i }))
    .filter(({ b }) => b.y0 < bottom && b.y1 > top - 40)
    .sort((a, z) => a.b.y0 - z.b.y0)
    .map(({ b, i }) => {
      const [x0, y0] = b.spans[0][0]
      return {
        key: i,
        d: `M${x0} ${Math.max(top, y0 - lead)} L${x0} ${y0} ${b.lines[0]}`,
        nodes: [...b.rings, ...b.glows].filter((p, k, all) => all.findIndex((q) => q[0] === p[0] && q[1] === p[1]) === k),
      }
    })
}

/** Measures each rendered route and where each of its nodes sits along it (0..1). */
export function measureRoutes(group, targets) {
  return targets.map((t, k) => {
    const el = group.querySelector(`[data-route="${k}"]`)
    const pulses = [...el.querySelectorAll('.po-pulse')]
    const total = pulses[0].getTotalLength()
    const samples = []
    for (let l = 0; l <= total; l += 4) samples.push([l, pulses[0].getPointAtLength(l)])
    const nodes = [...el.querySelectorAll('.po-node')].map((node, j) => {
      const [x, y] = t.nodes[j]
      let best = total, bestD = Infinity
      for (const [l, p] of samples) {
        const d = Math.hypot(p.x - x, p.y - y)
        if (d < bestD) { bestD = d; best = l }
      }
      return { node, at: best / total }
    })
    pulses.forEach((p) => p.setAttribute('stroke-dasharray', `${PULSE.dash} ${total + PULSE.dash}`))
    return { pulses, total, nodes }
  })
}

export const routeControls = {
  setPulse(it, progress, opacity = 1) {
    it.pulses.forEach((p) => {
      p.style.opacity = progress == null ? '0' : String(opacity)
      if (progress != null) p.setAttribute('stroke-dashoffset', String(PULSE.dash - progress * (it.total + PULSE.dash)))
    })
  },
  setNode(n, v) { n.node.style.opacity = String(v) },
  /** Node brightness `since` ms after the pulse passed it: flash, then settle at the lit level. */
  nodeLevel(since) { return since < 0 ? 0 : since < 120 ? 1 : Math.max(LIT, 1 - ((since - 120) / 400) * (1 - LIT)) },
  LIT,
}

