import { useMemo } from 'react'
import { useReducedMotion } from 'framer-motion'

const setSpot = (el, e) => {
  const rect = el.getBoundingClientRect()
  el.style.setProperty('--mx', `${e.clientX - rect.left}px`)
  el.style.setProperty('--my', `${e.clientY - rect.top}px`)
  el.style.setProperty('--spot-opacity', '1')
  return rect
}

/**
 * Pointer handlers that expose the cursor position as --mx / --my CSS vars,
 * which the .spotlight and .spotlight-border utilities read. Spread onto an element.
 */
export const spotlightHandlers = {
  onPointerMove: (e) => {
    if (e.pointerType === 'mouse') setSpot(e.currentTarget, e)
  },
  onPointerLeave: (e) => {
    e.currentTarget.style.setProperty('--spot-opacity', '0')
  },
}

/**
 * Subtle 3D tilt toward the cursor plus the spotlight vars.
 * Tilt is skipped for touch input and reduced motion.
 */
export function useTilt({ max = 8, scale = 1.02 } = {}) {
  const reduce = useReducedMotion()

  return useMemo(() => ({
    onPointerMove: (e) => {
      if (e.pointerType !== 'mouse') return
      const el = e.currentTarget
      const rect = setSpot(el, e)
      if (reduce) return
      const px = (e.clientX - rect.left) / rect.width - 0.5
      const py = (e.clientY - rect.top) / rect.height - 0.5
      el.style.transform = `perspective(900px) rotateX(${(-py * max).toFixed(2)}deg) rotateY(${(px * max).toFixed(2)}deg) scale(${scale})`
    },
    onPointerLeave: (e) => {
      e.currentTarget.style.setProperty('--spot-opacity', '0')
      e.currentTarget.style.transform = ''
    },
  }), [reduce, max, scale])
}
