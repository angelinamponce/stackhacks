import { useEffect, useId, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { X, ArrowLeft, ArrowRight, Award } from 'lucide-react'
import { useDialog } from '../lib/dialog'
import { initials } from '../lib/initials'
import { fetchCompanies, logoMap } from '../lib/companies'
import CompanyChip from './CompanyChip'
import CornerTraces from './os/CornerTraces'

const EASE = [0.16, 1, 0.3, 1]

// Tall rectangular headshot with a gold edge; initials stand in when there is no photo or it fails to load
function Headshot({ headshot, name }) {
  const [broken, setBroken] = useState(false)
  const frame = 'absolute inset-0 overflow-hidden rounded-md border border-accent/50 shadow-[0_30px_70px_-30px_rgba(0,0,0,0.95),0_0_60px_-18px_rgba(254,178,58,0.45)]'
  return headshot?.src && !broken ? (
    <div className={frame}>
      <img src={headshot.src} alt={headshot.alt} onError={() => setBroken(true)} style={{ objectPosition: headshot.position }} className="h-full w-full object-cover" />
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/50 to-transparent" />
    </div>
  ) : (
    <div role="img" aria-label={name} className={`${frame} flex items-center justify-center bg-gradient-to-b from-accent/15 to-[#0f0f11] text-6xl font-semibold text-accent`}>
      {initials(name)}
    </div>
  )
}

const currentBadge = (
  <span className="rounded-full border border-accent/50 bg-accent/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-accent">Current</span>
)

/**
 * Full-screen speaker profile: a vertical headshot on the left and the speaker's details on the
 * right (stacked on phones), each achievement led by its company logo chip (a text chip when the
 * site has no logo for it). Escape, the X or a click on the backdrop margin closes it; focus is
 * trapped and returns to the card; left/right keys and the prev/next buttons move between speakers.
 */
export default function SpeakerPanel({ speakers, index, onClose, onNavigate, returnRef }) {
  const dialogRef = useRef(null)
  const closeRef = useRef(null)
  const titleId = useId()
  const reduce = useReducedMotion()
  const [logos, setLogos] = useState({})
  useDialog(dialogRef, onClose, closeRef, returnRef)

  useEffect(() => {
    fetchCompanies().then((c) => setLogos(logoMap(c))).catch(() => {})
  }, [])

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'ArrowRight') { e.preventDefault(); onNavigate(1) }
      if (e.key === 'ArrowLeft') { e.preventDefault(); onNavigate(-1) }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onNavigate])

  const s = speakers[index]
  // Staggered entrance for the right-hand content; reduced motion shows it all at once
  const item = (i) => (reduce
    ? { initial: false }
    : { initial: { opacity: 0, y: 14 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.5, delay: 0.12 + i * 0.06, ease: EASE } })

  return createPortal(
    <motion.div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      className="fixed inset-0 z-[600] flex flex-col overflow-hidden bg-[#0b0b0c]/95 backdrop-blur-xl"
      initial={reduce ? { opacity: 0 } : { opacity: 0, y: -24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={reduce ? { opacity: 0 } : { opacity: 0, y: -24 }}
      transition={{ duration: reduce ? 0.1 : 0.45, ease: EASE }}
    >
      {/* Soft gold glow and hairline, plus circuit corners framing the screen */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_30%_40%,rgba(254,178,58,0.10),transparent_70%)]" />
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent to-transparent" />
      <CornerTraces show />

      {/* Clicking the empty margin around the content closes the view */}
      <div className="relative min-h-0 flex-1 overflow-y-auto overscroll-contain" onClick={onClose}>
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={s.name}
            initial={reduce ? false : { opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={reduce ? undefined : { opacity: 0, x: -24 }}
            transition={{ duration: 0.35, ease: EASE }}
            className="mx-auto flex min-h-full w-full max-w-6xl flex-col gap-8 px-6 pb-10 pt-20 lg:flex-row lg:items-center lg:gap-14 lg:px-10 lg:py-16"
          >
            {/* Vertical headshot */}
            <motion.div
              onClick={(e) => e.stopPropagation()}
              initial={reduce ? false : { opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, ease: EASE }}
              className="relative mx-auto aspect-[3/4] w-[min(72vw,20rem)] shrink-0 sm:w-[min(50vw,22rem)] lg:mx-0 lg:h-[min(74svh,40rem)] lg:w-auto"
            >
              <Headshot headshot={s.headshot} name={s.name} />
            </motion.div>

            {/* Details */}
            <div className="min-w-0 flex-1 space-y-7" onClick={(e) => e.stopPropagation()}>
              <div className="space-y-3 text-center lg:text-left">
                <motion.p {...item(0)} className="text-xs font-semibold uppercase tracking-[0.28em] text-accent">{s.role}</motion.p>
                <motion.h2 {...item(1)} id={titleId} className="text-[clamp(2.25rem,6vw,4.25rem)] font-semibold leading-[1.02] tracking-tight text-primary">{s.name}</motion.h2>
                {s.title && s.title !== s.role && <motion.p {...item(2)} className="text-base text-secondary">{s.title}</motion.p>}
              </div>

              <section className="space-y-4 border-t border-white/[0.08] pt-6">
                <motion.h3 {...item(3)} className="text-[11px] font-semibold uppercase tracking-[0.25em] text-secondary">Achievements</motion.h3>
                <ul className="space-y-3">
                  {s.achievements.map((a, i) => (
                    <motion.li
                      key={a.text}
                      {...item(4 + i)}
                      className="flex items-center gap-4 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-3 sm:p-3.5"
                    >
                      {a.company ? (
                        <CompanyChip entry={a} logos={logos} size="md" glow className="w-24 shrink-0 sm:w-28" />
                      ) : (
                        <span aria-hidden="true" className="flex min-h-12 w-24 shrink-0 items-center justify-center rounded-xl border border-accent/25 bg-accent/[0.06] sm:w-28">
                          <Award className="h-5 w-5 text-accent" />
                        </span>
                      )}
                      <div className="min-w-0 flex-1 space-y-1">
                        <p className="text-sm sm:text-[15px] leading-snug text-primary/90">
                          {a.text}
                          {a.current && <span className="ml-2 inline-block align-middle">{currentBadge}</span>}
                        </p>
                        {a.detail && <p className="text-xs leading-relaxed text-secondary">{a.detail}</p>}
                      </div>
                    </motion.li>
                  ))}
                </ul>
              </section>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Prev / next */}
      <div className="relative z-30 flex shrink-0 items-center justify-center gap-6 border-t border-white/[0.08] bg-[#0b0b0c]/90 px-6 py-3">
        <button type="button" onClick={() => onNavigate(-1)} className="btn-icon !h-10 !w-10" aria-label="Previous speaker"><ArrowLeft className="h-4 w-4" /></button>
        <span className="text-xs tabular-nums tracking-[0.2em] text-secondary">{String(index + 1).padStart(2, '0')} / {String(speakers.length).padStart(2, '0')}</span>
        <button type="button" onClick={() => onNavigate(1)} className="btn-icon !h-10 !w-10" aria-label="Next speaker"><ArrowRight className="h-4 w-4" /></button>
      </div>

      <button
        ref={closeRef}
        type="button"
        onClick={onClose}
        aria-label="Close profile"
        className="absolute right-4 top-4 z-30 flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border border-white/15 bg-black/60 text-secondary transition-colors duration-200 hover:border-accent/50 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 sm:right-6 sm:top-6"
      >
        <X className="h-4 w-4" />
      </button>
    </motion.div>,
    document.body
  )
}
