import { useEffect, useState } from 'react'

// Fired by IntroSplash when the overlay starts dissolving into the page.
export const INTRO_DONE_EVENT = 'sh:intro-done'

const introPending = () => typeof document !== 'undefined' && document.documentElement.hasAttribute('data-intro')

/** False while the first-visit intro is covering the page; true once it hands off. */
export function useIntroDone() {
  const [done, setDone] = useState(() => !introPending())
  useEffect(() => {
    if (done) return
    const onDone = () => setDone(true)
    window.addEventListener(INTRO_DONE_EVENT, onDone)
    return () => window.removeEventListener(INTRO_DONE_EVENT, onDone)
  }, [done])
  return done
}
