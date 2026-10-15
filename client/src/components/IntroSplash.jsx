import { useEffect, useRef, useState } from 'react'
import { animate } from 'framer-motion'
import SH from '/SH.png'
import { INTRO_DONE_EVENT } from '../lib/intro'

// Regions of the real logo (public/SH.png, 720x720, black background):
//   S x145-319 · divider x336-355 (y71-602) · H x368-557
// The S and H layers are the same image clipped to their region; the divider is drawn in gold.
const S_RIGHT = 54.5 // % inset from the right that isolates the S (boundary with the divider at 45.5%)
const H_LEFT = 50.2 // % inset from the left that isolates the H
const LINE_BOX = { left: '46.67%', width: '2.78%', top: '9.86%', height: '73.9%' }
const TRAVEL = 28 // % of the mark width the letters travel out of the line

const EASE_OUT = [0.22, 1, 0.36, 1]
const EASE_IN_OUT = [0.65, 0, 0.35, 1]
const wait = (ms) => new Promise((r) => setTimeout(r, ms))

/**
 * First-visit intro. main.jsx sets <html data-intro="full|reduced"> before React renders when the
 * intro hasn't played this session; CSS uses it to keep the page and nav brand hidden until handoff.
 *
 * Sequence (one ordered timeline): gold line draws → S and H slide out of the line →
 * mark glides to centre-left → "StackHacks" wipes in beside it and holds → lockup fades and lifts,
 * overlay dissolves, page fades in.
 */
export default function IntroSplash() {
  const [mode] = useState(() => document.documentElement.getAttribute('data-intro'))
  const [done, setDone] = useState(!mode)
  const overlayRef = useRef(null)
  const bgRef = useRef(null)
  const lockupRef = useRef(null)
  const markRef = useRef(null)
  const sRef = useRef(null)
  const hRef = useRef(null)
  const lineRef = useRef(null)
  const wordRef = useRef(null)
  const skipRef = useRef(null)

  useEffect(() => {
    if (!mode) return
    const html = document.documentElement
    const prevOverflow = html.style.overflow
    html.style.overflow = 'hidden'
    try { sessionStorage.setItem('sh-intro-played', '1') } catch { /* storage unavailable: intro may replay */ }

    const [overlay, bg, lockup, mark, s, h, line, word] = [overlayRef, bgRef, lockupRef, markRef, sRef, hRef, lineRef, wordRef].map((r) => r.current)
    let cancelled = false
    let ended = false
    const running = []
    const run = (...args) => { const c = animate(...args); running.push(c); return c }
    const alive = () => !cancelled && !ended

    // Letter reveal at progress p (0..1): each letter translates out of the line while its clip
    // keeps only the part that has already crossed the line, so it emerges from the line itself.
    const setLetters = (p) => {
      const t = TRAVEL * (1 - p) // remaining offset, % of the mark width
      s.style.transform = `translateX(${t}%)`
      s.style.clipPath = `inset(0 ${S_RIGHT + t}% 0 0)`
      h.style.transform = `translateX(${-t}%)`
      h.style.clipPath = `inset(0 0 0 ${H_LEFT + t}%)`
      const o = Math.min(1, p * 2.5)
      s.style.opacity = h.style.opacity = String(o)
    }

    // Step 5: lockup fades and lifts, then the overlay dissolves and the page fades in.
    const reveal = async (quick) => {
      if (ended) return
      ended = true
      running.forEach((c) => c.stop())
      try {
        await lockup.animate([{ opacity: 1, transform: 'translateY(0)' }, { opacity: 0, transform: 'translateY(-14px)' }],
          { duration: quick ? 220 : 450, easing: 'ease-in', fill: 'forwards' }).finished
      } catch { /* interrupted */ }
      html.removeAttribute('data-intro') // nav brand + page fade in (CSS), hero stagger starts
      html.style.overflow = prevOverflow
      window.dispatchEvent(new Event(INTRO_DONE_EVENT))
      try {
        await bg.animate([{ opacity: 1 }, { opacity: 0 }], { duration: quick ? 300 : 600, easing: 'ease-out', fill: 'forwards' }).finished
      } catch { /* interrupted */ }
      overlay.style.pointerEvents = 'none'
      if (!cancelled) setDone(true)
    }
    skipRef.current = () => reveal(true)

    // The final lockup is laid out as [mark][word], centred. Until step 3 the mark is shifted
    // so its line sits at the exact screen centre.
    let centerShift = 0
    const sequence = async () => {
      if (mode === 'reduced') {
        // No sliding: show the finished lockup, hold, then fade into the page
        setLetters(1)
        line.style.transform = 'scaleY(1)'
        word.style.clipPath = 'inset(0 0 0 0)'
        await lockup.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 300, fill: 'forwards' }).finished
        await wait(700)
        return alive() && reveal(false)
      }

      // 1. Gold line draws top to bottom at the screen centre
      await run(line, { scaleY: [0, 1] }, { duration: 0.65, ease: [0.65, 0, 0.35, 1] })
      if (!alive()) return

      // 2. S and H slide out of the line together (no pop, no overshoot)
      await run(0, 1, { duration: 1.0, ease: EASE_OUT, onUpdate: setLetters })
      if (!alive()) return
      await wait(300)
      if (!alive()) return

      // 3. Mark glides to centre-left (fixed size); 4. the word wipes in as it settles
      const move = run(mark, { x: [centerShift, 0] }, { duration: 0.9, ease: EASE_IN_OUT })
      await wait(500)
      if (!alive()) return
      const wipe = run(word, { clipPath: ['inset(0 100% 0 0)', 'inset(0 0% 0 0)'], x: [-18, 0], opacity: [0, 1] }, { duration: 0.8, ease: EASE_OUT })
      await Promise.all([move, wipe])
      if (!alive()) return
      await wait(650) // hold the finished lockup
      if (alive()) reveal(false)
    }

    // Measure after fonts load so the wordmark width (and lockup centring) is exact
    Promise.race([document.fonts?.ready, wait(400)]).then(() => {
      if (cancelled) return
      if (mode !== 'reduced') {
        const r = mark.getBoundingClientRect()
        centerShift = window.innerWidth / 2 - (r.left + r.width * 0.48) // 0.48 = divider centre in the logo
        mark.style.transform = `translateX(${centerShift}px)`
      }
      sequence().catch(() => reveal(true))
    })

    const onKey = (e) => { if (e.key === 'Escape') reveal(true) }
    window.addEventListener('keydown', onKey)
    const safety = setTimeout(() => reveal(true), 8000) // the overlay always goes away

    return () => {
      cancelled = true
      clearTimeout(safety)
      window.removeEventListener('keydown', onKey)
      running.forEach((c) => c.stop())
      html.style.overflow = prevOverflow
    }
  }, [mode])

  if (done) return null

  // Mark size scales with the viewport so mark + wordmark always fit on one line
  const markSize = 'min(24vw, 170px)'
  const layer = 'absolute inset-0 h-full w-full select-none'
  return (
    <div ref={overlayRef} className="fixed inset-0 z-[1000] cursor-pointer" onClick={() => skipRef.current?.()}>
      <div ref={bgRef} className="absolute inset-0 bg-black" />

      <div className="absolute inset-0 flex items-center justify-center overflow-hidden" aria-hidden="true">
        <div ref={lockupRef} className="flex items-center" style={{ gap: `calc(${markSize} * 0.05)`, opacity: mode === 'reduced' ? 0 : 1 }}>
          {/* Negative margins trim the logo image's empty black border (S starts at 20%, H ends at 77%),
              so the lockup is spaced and centred by what is actually visible */}
          <div
            ref={markRef}
            className="relative aspect-square shrink-0"
            style={{ width: markSize, marginLeft: `calc(${markSize} * -0.2)`, marginRight: `calc(${markSize} * -0.12)` }}
          >
            <img src={SH} alt="" draggable={false} ref={sRef} className={layer} style={{ clipPath: 'inset(0 100% 0 0)', opacity: 0 }} />
            <img src={SH} alt="" draggable={false} ref={hRef} className={layer} style={{ clipPath: 'inset(0 0 0 100%)', opacity: 0 }} />
            <div
              ref={lineRef}
              className="absolute origin-top rounded-full bg-[image:linear-gradient(180deg,#ffd27a,#feb23a)] shadow-[0_0_10px_rgba(254,178,58,0.85),0_0_26px_rgba(254,178,58,0.45)]"
              style={{ ...LINE_BOX, transform: 'scaleY(0)' }}
            />
          </div>
          <span
            ref={wordRef}
            className="whitespace-nowrap font-medium tracking-tight text-primary leading-none"
            style={{ fontSize: `calc(${markSize} * 0.42)`, clipPath: 'inset(0 100% 0 0)', opacity: 0 }}
          >
            Stack<span className="text-accent">Hacks</span>
          </span>
        </div>
      </div>

      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); skipRef.current?.() }}
        className="absolute bottom-6 right-6 rounded-full border border-white/20 px-4 py-1.5 text-xs font-medium text-secondary transition-colors hover:border-accent/60 hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60"
      >
        Skip intro
      </button>
    </div>
  )
}
