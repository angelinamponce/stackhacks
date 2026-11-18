// "Power on" landing for the About page's Our Story section.
//
// One small store shared by the About page (heading typing, paragraph, carousel, stats) and the
// page-level CircuitBoard (pulses + lit nodes). Everything runs off one pausable clock driven by a
// single requestAnimationFrame loop, which stops while the tab is hidden or the section is off
// screen, so all parts stay in step and resume where they paused.

export const SESSION_KEY = 'sh:about-power-on'

/** Timeline in ms from the start of the landing sequence. */
export function timeline(mobile) {
  return mobile
    ? { typeAt: 150, charMs: 35, textGap: 40, lineStagger: 60, lineMs: 360, mediaGap: 80, mediaMs: 420 }
    : { typeAt: 850, charMs: 45, textGap: 50, lineStagger: 80, lineMs: 440, mediaGap: 150, mediaMs: 560 }
}
// Pulses: ~200ms apart, all finished by ~1.2s
export const PULSE = { travel: 600, maxStagger: 220, window: 600, dash: 34 }
export const COUNT = { ms: 1200, mobileMs: 800, stagger: 150 }

let state = { mode: null, section: null, startAt: null, mobile: false }
const listeners = new Set()
const frames = new Set()

// Pausable clock
let base = 0
let since = null // performance.now() when the clock last resumed
let raf = 0
let offscreen = false
let io = null
export const now = () => base + (since != null ? performance.now() - since : 0)

const loop = () => {
  raf = 0
  if (since == null) return
  const t = now()
  frames.forEach((fn) => fn(t))
  if (frames.size) raf = requestAnimationFrame(loop)
}

function syncRunning() {
  const run = !!state.section && !document.hidden && !offscreen
  if (run && since == null) {
    since = performance.now()
  } else if (!run && since != null) {
    base += performance.now() - since
    since = null
    cancelAnimationFrame(raf)
    raf = 0
  }
  if (run && frames.size && !raf) raf = requestAnimationFrame(loop)
}

function set(patch) {
  state = { ...state, ...patch }
  listeners.forEach((fn) => fn())
}

export const powerOn = {
  getState: () => state,
  subscribe(fn) {
    listeners.add(fn)
    return () => listeners.delete(fn)
  },

  /** mode: 'play' (landing sequence pending) | 'final' (idle only) | 'reduced' (static) */
  activate(section, mode, mobile) {
    io?.disconnect()
    offscreen = false
    io = new IntersectionObserver(([e]) => { offscreen = !e.isIntersecting; syncRunning() })
    io.observe(section)
    set({ section, mode, mobile, startAt: null })
    syncRunning()
  },
  deactivate(section) {
    if (state.section !== section) return
    io?.disconnect()
    io = null
    set({ section: null, mode: null, startAt: null })
    syncRunning()
  },
  /** Starts the landing sequence now (clock time). */
  start() {
    try { sessionStorage.setItem(SESSION_KEY, '1') } catch { /* private mode */ }
    set({ startAt: now() })
  },
  /** Runs fn(clockMs) every frame while the section is visible; returns an unsubscribe. */
  onFrame(fn) {
    frames.add(fn)
    syncRunning()
    return () => frames.delete(fn)
  },
}

if (typeof document !== 'undefined') document.addEventListener('visibilitychange', syncRunning)

export const easeOut = (t) => 1 - (1 - t) ** 3
export const clamp01 = (t) => (t < 0 ? 0 : t > 1 ? 1 : t)
