import { useEffect } from 'react'

const NAV_H = 64

/**
 * Flags .screen-section elements taller than the viewport with [data-tall], so desktop
 * scroll snapping (index.css) skips them instead of trapping the reader mid-section.
 */
export function useScreenSections(pathname) {
  useEffect(() => {
    let frame = 0
    const update = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => {
        const room = window.innerHeight - NAV_H + 2
        document.querySelectorAll('.screen-section').forEach((el) => el.toggleAttribute('data-tall', el.offsetHeight > room))
      })
    }
    const ro = new ResizeObserver(update)
    ro.observe(document.body)
    window.addEventListener('resize', update)
    update()
    return () => {
      cancelAnimationFrame(frame)
      ro.disconnect()
      window.removeEventListener('resize', update)
    }
  }, [pathname])
}
