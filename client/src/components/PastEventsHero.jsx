import { useReducedMotion } from 'framer-motion'
import { ArrowDown, ChevronDown } from 'lucide-react'
import { Reveal } from './Interactive'
import CircuitTraces from './os/CircuitTraces'
import eoyGroupBg from '../assets/events/backdrop/eoy-group-bg.jpg'
import workshopBg from '../assets/events/backdrop/workshop-1-bg.jpg'
import hackMadnessBg from '../assets/events/backdrop/hack-madness-group-bg.jpg'

// Tiny (640px, ~40 KB) copies of real event photos, shown very dim and blurred. CSS background
// images rather than <img>, so the page circuit board doesn't treat the backdrop as content.
const BACKDROPS = [eoyGroupBg, workshopBg, hackMadnessBg]

/**
 * Full-screen landing for the Past Events tab: one screen tall (below the fixed nav), a slow
 * crossfading photo backdrop, framed by circuit corners, with jump chips to each section and
 * a scroll cue. `sections` is [{ id, label }]; `facts` is [{ value, label }] derived from data.
 */
export default function PastEventsHero({ sections, facts = [] }) {
  const reduce = useReducedMotion()
  const jump = (e, id) => {
    const target = document.getElementById(id)
    if (!target) return
    e.preventDefault()
    target.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' })
  }

  return (
    <section aria-labelledby="past-events-title" className="pe-hero relative isolate flex items-center justify-center overflow-hidden border-b border-white/[0.08]">
      {/* Backdrop: dim, blurred, slowly drifting and crossfading event photos */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        {BACKDROPS.map((src, i) => (
          <div key={src} className="pe-backdrop" style={{ backgroundImage: `url(${src})`, '--pe-delay': `${i * 9 - 2}s` }} />
        ))}
        {/* Soft gold glow, then edges fading into the page background */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_55%_45%_at_50%_45%,rgba(254,178,58,0.14),transparent_70%)]" />
        <div className="absolute inset-0 bg-gradient-to-b from-background via-background/20 to-background" />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-transparent to-background" />
      </div>

      <CircuitTraces drawIn className="-z-10" />

      <div className="relative mx-auto flex w-full max-w-4xl flex-col items-center px-6 pb-16 pt-10 text-center">
        <Reveal>
          <span className="eyebrow">Archive</span>
        </Reveal>

        <Reveal delay={0.1} className="relative mt-5">
          <div aria-hidden="true" className="pointer-events-none absolute -inset-x-10 -inset-y-6 -z-10 rounded-full bg-accent/15 blur-3xl" />
          <h1 id="past-events-title" className="text-[clamp(2.75rem,10vw,7.5rem)] font-semibold leading-[0.95] tracking-tight text-primary">
            Past <span className="bg-gradient-to-b from-[#ffe2a8] to-accent bg-clip-text text-transparent">Events</span>
          </h1>
        </Reveal>

        <Reveal delay={0.2} className="mt-6 max-w-xl">
          <p className="text-base sm:text-lg leading-relaxed text-secondary">
            Highlights from our End of Year Ceremony, general body events and workshops, and Hack Madness.
          </p>
        </Reveal>

        <Reveal delay={0.3} className="mt-8 sm:mt-10">
          <nav aria-label="Jump to a section">
            <ul className="flex flex-wrap justify-center gap-2.5 sm:gap-3">
              {sections.map(({ id, label }) => (
                <li key={id}>
                  <a
                    href={`#${id}`}
                    onClick={(e) => jump(e, id)}
                    className="group inline-flex items-center gap-2 rounded-full border border-accent/40 bg-black/40 px-4 py-2 text-sm font-medium text-primary backdrop-blur-sm transition-[transform,box-shadow] duration-300 hover:-translate-y-0.5 hover:shadow-[0_0_26px_-4px_rgba(254,178,58,0.65)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                  >
                    {label}
                    <ArrowDown aria-hidden="true" className="h-3.5 w-3.5 text-accent transition-transform duration-300 group-hover:translate-y-0.5" />
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </Reveal>

        {facts.length > 0 && (
          <Reveal delay={0.4} className="mt-7">
            <dl className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs uppercase tracking-[0.2em] text-secondary">
              {facts.map((f, i) => (
                <div key={f.label} className="flex items-center gap-5">
                  {i > 0 && <span aria-hidden="true" className="hidden sm:block h-1 w-1 rounded-full bg-accent/60" />}
                  <div className="flex items-baseline gap-1.5">
                    <dt className="sr-only">{f.label}</dt>
                    <dd className="text-sm font-semibold tabular-nums text-accent">{f.value}</dd>
                    <span aria-hidden="true">{f.label}</span>
                  </div>
                </div>
              ))}
            </dl>
          </Reveal>
        )}
      </div>

      {/* Scroll cue (same style as the landing page): smooth-scrolls to the first section */}
      <Reveal delay={0.5} className="scroll-cue absolute left-1/2 -translate-x-1/2">
        <a
          href={`#${sections[0].id}`}
          onClick={(e) => jump(e, sections[0].id)}
          aria-label={`Scroll to ${sections[0].label}`}
          className="flex flex-col items-center gap-1 rounded-full px-3 py-1 text-accent/80 hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50"
        >
          <span className="scroll-cue-line block h-6 w-px bg-gradient-to-b from-transparent to-accent" />
          <ChevronDown className="scroll-cue-chevron h-4 w-4" />
        </a>
      </Reveal>
    </section>
  )
}
