import { useEffect, useRef, useState } from 'react'
import { animate, useInView, useReducedMotion, useScroll, useSpring, motion } from 'framer-motion'

/**
 * Animates a number from 0 when it scrolls into view. Falls back to the final
 * value after `fallbackMs` so a stat can never be stuck at 0 or blank.
 */
export function CountUp({ to, duration = 1.6, suffix = '', fallbackMs = 2000 }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, amount: 0.2 })
  const reduce = useReducedMotion()
  const [value, setValue] = useState(null)
  const [settled, setSettled] = useState(false)

  useEffect(() => {
    if (!inView || to == null || reduce) return
    const controls = animate(0, to, {
      duration,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => setValue(Math.round(v)),
      onComplete: () => setSettled(true),
    })
    return () => controls.stop()
  }, [inView, to, duration, reduce])

  useEffect(() => {
    const id = setTimeout(() => setSettled(true), fallbackMs + duration * 1000)
    return () => clearTimeout(id)
  }, [fallbackMs, duration])

  const display = reduce || settled ? to : (value ?? 0)
  return <span ref={ref} className="tabular-nums">{display}{suffix}</span>
}

/** Thin gold bar pinned under the navbar showing page scroll progress. */
export function ScrollProgress() {
  const { scrollYProgress } = useScroll()
  const scaleX = useSpring(scrollYProgress, { stiffness: 160, damping: 30, restDelta: 0.001 })

  return (
    <motion.div
      aria-hidden="true"
      style={{ scaleX }}
      className="fixed top-16 left-0 right-0 z-[499] h-[2px] origin-left bg-gradient-to-r from-accent/0 via-accent to-[#ffd38a] shadow-[0_0_10px_rgba(254,178,58,0.6)]"
    />
  )
}


/**
 * Fade-up on scroll that can never leave content hidden. Uses a CSS transition
 * (not a JS animation loop), reveals after `fallbackMs` even if the
 * IntersectionObserver never fires, and is a no-op for reduced motion.
 */
export function Reveal({ as = 'div', delay = 0, fallbackMs = 1200, className = '', style, children, ...rest }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, amount: 0.05 })
  const reduce = useReducedMotion()
  const [forced, setForced] = useState(false)

  useEffect(() => {
    const id = setTimeout(() => setForced(true), fallbackMs)
    return () => clearTimeout(id)
  }, [fallbackMs])

  const shown = reduce || inView || forced
  const Tag = as
  return (
    <Tag
      ref={ref}
      className={`transition-[opacity,translate] duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] ${shown ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'} ${className}`}
      style={{ transitionDelay: shown && inView ? `${delay}s` : '0s', ...style }}
      {...rest}
    >
      {children}
    </Tag>
  )
}
