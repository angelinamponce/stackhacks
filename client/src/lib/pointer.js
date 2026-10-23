import { useMemo } from 'react'
import { useReducedMotion } from 'framer-motion'

// Editorial restyle: cursor-driven movement is retired
const TILT_OFF = true
const MAGNETIC_OFF = true

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
      // 3D tilt is off in the editorial restyle; remove `|| TILT_OFF` to bring it back
      if (reduce || TILT_OFF) return
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

/**
 * Magnetic pull toward the cursor (max `strength` px), for a few primary buttons only.
 * Mouse only; does nothing for touch input or reduced motion. Moves via transform, eased by the
 * element's own CSS transition.
 */
export function useMagnetic(strength = 6) {
  const reduce = useReducedMotion()
  return useMemo(() => ({
    onPointerMove: (e) => {
      // Magnetic pull is off in the editorial restyle; remove `MAGNETIC_OFF ||` to bring it back
      if (MAGNETIC_OFF || reduce || e.pointerType !== 'mouse') return
      const el = e.currentTarget
      const r = el.getBoundingClientRect()
      const px = (e.clientX - r.left) / r.width - 0.5
      const py = (e.clientY - r.top) / r.height - 0.5
      el.style.transform = `translate(${(px * 2 * strength).toFixed(1)}px, ${(py * 2 * strength).toFixed(1)}px)`
    },
    onPointerLeave: (e) => { e.currentTarget.style.transform = '' },
  }), [reduce, strength])
}
