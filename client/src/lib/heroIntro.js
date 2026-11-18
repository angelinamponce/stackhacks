// Home hero "power on" intro, shared by the hero (heading boot-up), the ASCII SH logo and the
// margin-circuit pulses (components/os/ScrollPulseLayer), so all three start from one moment.

export const HERO_SESSION_KEY = 'sh:home-hero'

/** 'play' (intro pending: first visit this session, or ?replay=1), 'final', or 'reduced'. */
export function heroIntroMode() {
  if (typeof window === 'undefined') return 'final'
  if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return 'reduced'
  if (new URLSearchParams(window.location.search).get('replay') === '1') return 'play'
  try { if (sessionStorage.getItem(HERO_SESSION_KEY)) return 'final' } catch { /* storage blocked */ }
  return 'play'
}

const listeners = new Set()
let startedAt = null

export const heroPower = {
  /** performance.now() when the intro started, or null. */
  get at() { return startedAt },
  start() {
    startedAt = performance.now()
    try { sessionStorage.setItem(HERO_SESSION_KEY, '1') } catch { /* storage blocked */ }
    listeners.forEach((fn) => fn(startedAt))
  },
  subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn) },
}
