import { useEffect, useId, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { X, ArrowLeft, ArrowRight } from 'lucide-react'
import { useDialog } from '../lib/dialog'
import { initials } from '../lib/initials'
import { fetchCompanies, logoMap } from '../lib/companies'
import CompanyChip from './CompanyChip'
import CornerTraces from './os/CornerTraces'

// Large round headshot with a gold ring; initials stand in when there is no photo or it fails to load
function Headshot({ headshot, name }) {
  const [broken, setBroken] = useState(false)
  const ring = 'relative h-32 w-32 sm:h-44 sm:w-44 rounded-full ring-2 ring-accent/80 ring-offset-4 ring-offset-[#151517]'
  return (
    <div className="relative shrink-0">
      <div aria-hidden="true" className="absolute -inset-3 rounded-full bg-accent/20 blur-2xl" />
      {headshot?.src && !broken ? (
        <img src={headshot.src} alt={headshot.alt} onError={() => setBroken(true)} style={{ objectPosition: headshot.position }} className={`${ring} object-cover`} />
      ) : (
        <div role="img" aria-label={name} className={`${ring} flex items-center justify-center bg-accent/10 text-4xl font-semibold text-accent`}>
          {initials(name)}
        </div>
      )}
    </div>
  )
}

const currentBadge = (
  <span className="rounded-full border border-accent/50 bg-accent/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-accent">Current</span>
)

/**
 * Speaker profile: slides down from just below the fixed nav over a dimmed, blurred backdrop.
 * Escape, the X or an outside click closes it; focus is trapped and returns to the card;
 * left/right keys and the prev/next buttons move between speakers.
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

  return createPortal(
    <motion.div
      className="fixed inset-0 z-[600] flex justify-center bg-black/70 backdrop-blur-md px-3 sm:px-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: reduce ? 0.1 : 0.25 }}
      onClick={onClose}
    >
      <motion.div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(e) => e.stopPropagation()}
        initial={reduce ? { opacity: 0 } : { opacity: 0, y: -40 }}
        animate={{ opacity: 1, y: 0 }}
        exit={reduce ? { opacity: 0 } : { opacity: 0, y: -40 }}
        transition={{ duration: reduce ? 0.1 : 0.45, ease: [0.16, 1, 0.3, 1] }}
        className="relative mt-[4.5rem] flex h-fit max-h-[calc(100svh-5.5rem)] w-full max-w-4xl flex-col overflow-hidden rounded-3xl border border-accent/35 bg-gradient-to-b from-[#18181b] to-[#0f0f11] shadow-[0_40px_100px_-30px_rgba(0,0,0,0.95),0_0_70px_-24px_rgba(254,178,58,0.55)]"
      >
        <div aria-hidden="true" className="pointer-events-none absolute inset-x-10 top-0 z-20 h-px bg-gradient-to-r from-transparent via-accent to-transparent" />
        <CornerTraces show />

        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={s.name}
            initial={reduce ? false : { opacity: 0, x: 18 }}
            animate={{ opacity: 1, x: 0 }}
            exit={reduce ? undefined : { opacity: 0, x: -18 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="min-h-0 flex-1 overflow-y-auto overscroll-contain"
          >
            <div className="flex flex-col items-center gap-7 px-6 pb-7 pt-8 sm:flex-row sm:items-start sm:gap-9 sm:px-9 sm:pt-10">
              <Headshot headshot={s.headshot} name={s.name} />

              <div className="w-full min-w-0 space-y-6 text-center sm:text-left">
                <div className="space-y-2 pr-0 sm:pr-8">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-accent">{s.role}</p>
                  <h2 id={titleId} className="text-2xl sm:text-4xl font-semibold tracking-tight text-primary">{s.name}</h2>
                  {s.title && s.title !== s.role && <p className="text-sm text-secondary">{s.title}</p>}
                </div>

                <section className="space-y-3 border-t border-white/[0.08] pt-5 text-left">
                  <h3 className="text-[11px] font-semibold uppercase tracking-[0.25em] text-secondary">Achievements</h3>
                  <ul className="space-y-3">
                    {s.achievements.map((a) => (
                      <li key={a.text} className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
                        <div className="min-w-0 flex-1 space-y-1">
                          <p className="text-sm sm:text-[15px] leading-snug text-primary/90">
                            {a.text}
                            {a.current && <span className="ml-2 inline-block align-middle">{currentBadge}</span>}
                          </p>
                          {a.detail && <p className="text-xs leading-relaxed text-secondary">{a.detail}</p>}
                        </div>
                        {a.company && <CompanyChip entry={a} logos={logos} className="w-28 shrink-0 self-start sm:self-center" />}
                      </li>
                    ))}
                  </ul>
                </section>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Prev / next */}
        <div className="z-30 flex shrink-0 items-center justify-between gap-3 border-t border-white/[0.08] bg-[#0f0f11]/95 px-6 py-3 sm:px-9">
          <button type="button" onClick={() => onNavigate(-1)} className="btn-icon !h-9 !w-9" aria-label="Previous speaker"><ArrowLeft className="h-4 w-4" /></button>
          <span className="text-xs tabular-nums tracking-[0.2em] text-secondary">{String(index + 1).padStart(2, '0')} / {String(speakers.length).padStart(2, '0')}</span>
          <button type="button" onClick={() => onNavigate(1)} className="btn-icon !h-9 !w-9" aria-label="Next speaker"><ArrowRight className="h-4 w-4" /></button>
        </div>

        <button
          ref={closeRef}
          type="button"
          onClick={onClose}
          aria-label="Close profile"
          className="absolute right-4 top-4 z-30 flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border border-white/15 bg-white/5 text-secondary transition-colors duration-200 hover:border-accent/50 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50"
        >
          <X className="h-4 w-4" />
        </button>
      </motion.div>
    </motion.div>,
    document.body
  )
}
