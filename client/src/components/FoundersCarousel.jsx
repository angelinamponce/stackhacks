import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import PortraitCard from './PortraitCard'
import { expandTitle } from '../lib/titles'

const EASE = [0.16, 1, 0.3, 1]

/**
 * All founders visible at once: large portrait cards (4 + 3 centred on desktop, a scroll-snap row
 * with the active card centred below lg). Selecting one spotlights them in the panel underneath.
 */
export default function FoundersCarousel({ founders }) {
  const [active, setActive] = useState(0)
  const [hovered, setHovered] = useState(null)
  const reduce = useReducedMotion()
  const rowRef = useRef(null)
  const cardRefs = useRef([])
  const length = founders.length

  const go = (dir) => setActive((i) => (i + dir + length) % length)

  // Keep the selected card centred inside the mobile scroll row (horizontal only, so the page doesn't jump)
  useEffect(() => {
    const row = rowRef.current
    const card = cardRefs.current[active]
    if (!row || !card || row.scrollWidth <= row.clientWidth) return
    const left = card.offsetLeft - (row.clientWidth - card.offsetWidth) / 2
    row.scrollTo({ left, behavior: reduce ? 'auto' : 'smooth' })
  }, [active, reduce])

  const onKeyDown = (e) => {
    if (e.key === 'ArrowRight') { e.preventDefault(); go(1) }
    if (e.key === 'ArrowLeft') { e.preventDefault(); go(-1) }
  }

  if (!length) return null
  const current = founders[active]
  const slide = reduce ? { duration: 0 } : { duration: 0.5, ease: EASE }

  return (
    <div className="space-y-12">
      <div
        role="listbox"
        aria-label="Founders"
        aria-orientation="horizontal"
        aria-activedescendant={`founder-${active}`}
        tabIndex={0}
        onKeyDown={onKeyDown}
        onMouseLeave={() => setHovered(null)}
        className="rounded-3xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
      >
        <div
          ref={rowRef}
          className="-mx-6 px-[calc((100vw-min(64vw,260px))/2)] sm:px-[calc((100vw-240px)/2)] flex gap-5 overflow-x-auto snap-x snap-mandatory py-8 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden [perspective:1200px]
                     lg:mx-0 lg:px-0 lg:flex-wrap lg:justify-center lg:gap-6 lg:overflow-visible lg:snap-none lg:py-4"
        >
          {founders.map((founder, i) => (
            <PortraitCard
              key={founder._id || founder.name}
              name={founder.name}
              title={expandTitle(founder.position)}
              image={founder.image}
              isActive={i === active}
              isHovered={i === hovered}
              anyHovered={hovered !== null}
              reduce={reduce}
              onClick={() => setActive(i)}
              onHover={() => setHovered(i)}
              cardRef={(el) => { cardRefs.current[i] = el }}
              widthClass="w-[64vw] max-w-[260px] sm:w-[240px] lg:w-[calc((100%-4.5rem)/4)] lg:max-w-none"
              buttonProps={{ id: `founder-${i}`, role: 'option', 'aria-selected': i === active, tabIndex: -1 }}
            />
          ))}
        </div>
      </div>

      {/* Spotlight panel: no box, just a gold hairline above */}
      <div className="relative pt-10">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent/60 to-transparent" />
        <div className="grid grid-cols-1 items-center gap-8 text-center sm:grid-cols-[auto_1fr] sm:text-left lg:grid-cols-[auto_1fr_auto]">
          {/* Portrait with gold ring + glow; crossfades between founders */}
          <div className="relative mx-auto h-40 w-40 lg:h-48 lg:w-48 sm:mx-0">
            <div className="absolute -inset-3 rounded-full bg-accent/20 blur-2xl" />
            <div className="relative h-full w-full overflow-hidden rounded-full ring-2 ring-accent/80 ring-offset-4 ring-offset-background shadow-[0_0_40px_-6px_rgba(254,178,58,0.6)]">
              <AnimatePresence initial={false}>
                <motion.img
                  key={active}
                  src={current.image}
                  alt={current.name}
                  initial={{ opacity: 0, scale: 1.06 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={reduce ? { duration: 0 } : { duration: 0.6, ease: EASE }}
                  className="absolute inset-0 h-full w-full object-cover object-[50%_22%]"
                />
              </AnimatePresence>
            </div>
          </div>

          <div className="grid min-w-0" aria-live="polite">
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.div
                key={active}
                initial={reduce ? false : { opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reduce ? undefined : { opacity: 0, y: -10 }}
                transition={slide}
                className="[grid-area:1/1] space-y-3"
              >
                <span className="block text-[11px] font-semibold uppercase tracking-[0.3em] text-secondary/60 tabular-nums">
                  Founder {String(active + 1).padStart(2, '0')} / {String(length).padStart(2, '0')}
                </span>
                <h3 className="text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight text-primary">{current.name}</h3>
                <p className="text-xs sm:text-sm font-semibold uppercase tracking-[0.28em] leading-relaxed text-accent">
                  {expandTitle(current.position)}
                </p>
                {current.bio && <p className="pt-1 text-sm text-secondary leading-relaxed max-w-xl">{current.bio}</p>}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-center gap-5 sm:col-span-2 sm:justify-start lg:col-span-1 lg:flex-col lg:items-end lg:gap-4">
            <div className="flex items-center gap-2.5">
              <button type="button" onClick={() => go(-1)} aria-label="Previous founder" className="btn-icon">
                <ArrowLeft className="w-4 h-4" />
              </button>
              <button type="button" onClick={() => go(1)} aria-label="Next founder" className="btn-icon">
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
            <div className="flex items-center gap-2">
              {founders.map((f, i) => (
                <button
                  key={f._id || i}
                  type="button"
                  onClick={() => setActive(i)}
                  aria-label={`Show ${f.name}`}
                  aria-current={i === active}
                  className={`h-1.5 rounded-full transition-all duration-500 ease-out cursor-pointer ${
                    i === active ? 'w-7 bg-accent shadow-[0_0_10px_rgba(254,178,58,0.6)]' : 'w-1.5 bg-white/20 hover:bg-white/40'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
