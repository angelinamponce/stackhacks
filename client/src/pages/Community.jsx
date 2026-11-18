import { useCallback, useEffect, useRef, useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import { Check } from 'lucide-react'
import { client } from '../sanityClient'
import { Reveal, Hairline } from '../components/Interactive'
import PageHero from '../components/PageHero'
import CircuitHeading from '../components/CircuitHeading'
import CircuitFrame from '../components/CircuitFrame'
import { Link } from 'react-router-dom'
import AsciiClimb from '../components/AsciiClimb'
import PhotoSlot from '../components/PhotoSlot'
import PhotoGallery from '../components/PhotoGallery'
import SpeakerPanel from '../components/SpeakerPanel'
import { communityIntro, ceremony, generalBody, hackMadness } from '../data/community'

// Thin gold hairline between groups of photos; draws in as it scrolls into view
const Divider = () => <Hairline />

// Speaker panel expanded by default (and whenever none is hovered or focused)
const DEFAULT_SPEAKER = 'Hamid Ajose'

const SECTION_TITLE = 'text-[2.25rem] sm:text-5xl font-semibold tracking-tight text-primary'
const SUBSECTION_TITLE = 'font-display-heading text-[2rem] leading-tight text-primary sm:text-[2.375rem] lg:text-[2.75rem]'

// Small label inside the Hack Madness card (Qualifications, Tournament blueprint)
function CardLabel({ children }) {
  return <h3 className="text-base font-semibold text-secondary">{children}</h3>
}

/** Project team photos, each team name linking to that track on the Projects page. */
function TeamGrid({ teams }) {
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
      {teams.map((team, i) => (
        <Reveal key={team.caption} delay={i * 0.08}>
          <PhotoSlot
            photo={team}
            aspect="aspect-[3/2]"
            captionContent={
              <Link
                to={`/projects?filter=${team.track}`}
                className="text-sm font-medium text-primary/90 underline-offset-4 transition-colors hover:text-accent hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60 rounded-sm"
              >
                {team.caption}
              </Link>
            }
          />
        </Reveal>
      ))}
    </div>
  )
}

/**
 * Speakers as a horizontal accordion of equal-height panels (event photo, gold role, name, one-line
 * description). Hover/focus expands a panel to ~60% of the row (the others ~20% each, showing only
 * their role, set vertically); the guest speaker is expanded by default and whenever none is hovered
 * or focused. Clicking (or Enter on) the expanded
 * panel opens that speaker's profile; on touch the first tap expands. Arrow keys move between
 * panels. Mobile: stacked, all expanded. The description line is optional (omitted when not set).
 * Headshots marked `sanityFounder` are loaded from the matching Sanity founder document.
 */
function SpeakerRow({ speakers: data }) {
  const [speakers, setSpeakers] = useState(data)
  const [open, setOpen] = useState(null)
  const cardRefs = useRef([])
  const returnRef = useRef(null)

  useEffect(() => {
    const names = data.map((s) => s.headshot?.sanityFounder).filter(Boolean)
    if (!names.length) return
    client
      .fetch(`*[_type == "founder" && name in $names]{ name, "image": image.asset->url }`, { names })
      .then((rows) => {
        const urls = Object.fromEntries((rows || []).filter((r) => r.image).map((r) => [r.name, `${r.image}?w=600&h=800&fit=crop&auto=format`]))
        setSpeakers(data.map((s) => (urls[s.headshot?.sanityFounder] ? { ...s, headshot: { ...s.headshot, src: urls[s.headshot.sanityFounder] } } : s)))
      })
      .catch(() => {}) // the panel falls back to initials
  }, [data])

  const close = useCallback(() => setOpen(null), [])
  const navigate = useCallback((dir) => setOpen((i) => {
    if (i === null) return i
    const n = (i + dir + speakers.length) % speakers.length
    returnRef.current = cardRefs.current[n] // focus returns to the speaker last shown
    return n
  }), [speakers.length])

  // The panel shown expanded when nothing is hovered or focused: the guest speaker
  const restIndex = Math.max(0, speakers.findIndex((s) => s.name === DEFAULT_SPEAKER))
  const [expanded, setExpanded] = useState(restIndex)
  const touchRef = useRef(false)
  const listRef = useRef(null)
  const onKey = (e, i) => {
    const dir = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 0
    if (!dir) return
    e.preventDefault()
    cardRefs.current[(i + dir + speakers.length) % speakers.length]?.focus()
  }

  // One unified rectangle: the photos touch, divided only by thin, faint gold lines
  return (
    <Reveal>
      <ul
        onMouseLeave={() => { if (!listRef.current?.contains(document.activeElement)) setExpanded(restIndex) }}
        onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) setExpanded(restIndex) }}
        ref={listRef}
        className="speaker-accordion flex flex-col overflow-hidden rounded-md border border-accent/30 sm:h-[22rem] sm:flex-row lg:h-[26rem]"
      >
        {speakers.map((s, i) => {
          const isOpen = expanded === i
          return (
            <li
              key={s.name}
              data-open={isOpen || undefined}
              style={{ '--grow': isOpen ? 3 : 1 }}
              className={`speaker-panel relative min-w-0 ${i > 0 ? 'border-t border-accent/30 sm:border-l sm:border-t-0' : ''}`}
            >
              <button
                ref={(el) => { cardRefs.current[i] = el }}
                type="button"
                onMouseEnter={() => setExpanded(i)}
                onFocus={() => setExpanded(i)}
                onPointerDown={(e) => { touchRef.current = e.pointerType === 'touch' }}
                onClick={() => {
                  // Touch: the first tap expands a collapsed panel; the next opens the profile
                  if (touchRef.current && !isOpen && window.matchMedia('(min-width: 640px)').matches) { setExpanded(i); return }
                  returnRef.current = cardRefs.current[i]
                  setOpen(i)
                }}
                onKeyDown={(e) => onKey(e, i)}
                aria-label={`Open profile: ${s.name}, ${s.role}`}
                aria-expanded={isOpen}
                className="group relative block aspect-[3/2] h-full w-full overflow-hidden bg-card text-left cursor-pointer sm:aspect-auto focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent/70"
              >
                <img src={s.src} alt={s.alt} loading="lazy" className="h-full w-full object-cover transition-transform duration-700 ease-out motion-safe:group-hover:scale-[1.04]" />
                <span aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/85 via-black/40 to-transparent" />
                {/* Expanded: role, name and a one-line description (always shown on mobile) */}
                <span className={`speaker-full absolute inset-x-0 bottom-0 p-4 sm:p-6 ${isOpen ? '' : 'sm:opacity-0'}`}>
                  <span className="block text-sm font-semibold text-accent">{s.role}</span>
                  <span className="mt-1 block text-lg font-semibold text-white sm:text-xl">{s.name}</span>
                  {s.description && <span className="mt-1.5 block max-w-md text-sm leading-snug text-white/75">{s.description}</span>}
                </span>
                {/* Collapsed: only the role, set vertically */}
                <span aria-hidden="true" className={`speaker-mini absolute bottom-5 left-1/2 hidden -translate-x-1/2 whitespace-nowrap text-sm font-semibold text-accent [writing-mode:vertical-rl] rotate-180 ${isOpen ? '' : 'sm:block'}`}>
                  {s.role}
                </span>
              </button>
            </li>
          )
        })}
      </ul>

      <AnimatePresence>
        {open !== null && (
          <SpeakerPanel speakers={speakers} index={open} onClose={close} onNavigate={navigate} returnRef={returnRef} />
        )}
      </AnimatePresence>
    </Reveal>
  )
}

const Community = () => {
  return (
    <div className="relative">
      <div className="max-w-6xl mx-auto px-6">
        {/* Landing hero (same structure as the E-Board page): heading, divider and intro on the left,
            ASCII scene of one member helping another climb on the right; the ceremony starts below the fold */}
        <PageHero
          title="Community"
          titleClassName="text-accent"
          intro={communityIntro}
          art={<AsciiClimb className="mx-auto h-[280px] w-full max-w-[420px] lg:h-[clamp(480px,64svh,560px)] lg:max-w-none" />}
          next={() => document.getElementById('ceremony')}
          scrollLabel="Scroll to the End of Year Ceremony"
        />

        {/* ── A. End of Year Ceremony ── (starts right under the title: no screen-height centering or full top padding) */}
        {/* Headings carry a "// 0n — name" eyebrow and the hero's circuit divider; data-circuit-pulse
            lights the nearest margin circuits as each block scrolls into view (os/ScrollPulseLayer) */}
        <section id="ceremony" aria-labelledby="ceremony-title" className="screen-section justify-start! pt-10! sm:pt-12! space-y-10">
          <div data-circuit-pulse className="space-y-10">
            <CircuitHeading
              id="ceremony-title"
              eyebrow="// 01 — ceremony"
              title="End of Year Ceremony"
              titleClassName={SECTION_TITLE}
              intro={ceremony.intro}
            />
            <CircuitFrame>
              <PhotoSlot photo={ceremony.groupPhoto} aspect="aspect-[16/9] lg:aspect-[21/9]" />
            </CircuitFrame>
          </div>

          <Divider />
          <div data-circuit-pulse className="space-y-8 pt-6 sm:pt-10">
            <CircuitHeading as="h3" eyebrow="// 02 — speakers" title="Speakers" titleClassName={SUBSECTION_TITLE} />
            <SpeakerRow speakers={ceremony.speakers} />
          </div>

          <Divider />
          <div data-circuit-pulse className="space-y-8 pt-6 sm:pt-10">
            <CircuitHeading as="h3" eyebrow="// 03 — teams" title="Project Teams" titleClassName={SUBSECTION_TITLE} />
            <TeamGrid teams={ceremony.teams} />
          </div>
        </section>

        {/* ── B. General Body Events & Workshops ── (same rhythm as the ceremony blocks above) */}
        <section id="general-body" aria-labelledby="general-body-title" className="screen-section justify-start! pt-6! sm:pt-10! space-y-10">
          <Divider />
          <div data-circuit-pulse className="space-y-8 pt-6 sm:pt-10">
            <CircuitHeading
              id="general-body-title"
              eyebrow="// 04 — workshops"
              title="General Body Events & Workshops"
              titleClassName={SECTION_TITLE}
              intro={generalBody.intro}
            />
            {/* Corner-node frames, staggered ~100ms per photo in reading order */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
              {generalBody.photos.map((photo, i) => (
                <Reveal key={photo.caption || i} delay={i * 0.08}>
                  <CircuitFrame variant="corners" delay={i * 100}>
                    <PhotoSlot photo={photo} aspect="aspect-[3/2]" />
                  </CircuitFrame>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ── C. Hack Madness ── */}
        <section id="hack-madness" aria-labelledby="hack-madness-title" className="screen-section justify-start! pt-6! sm:pt-10! space-y-10">
          <Divider />
          <div data-circuit-pulse className="space-y-8 pt-6 sm:pt-10">
            <CircuitHeading id="hack-madness-title" eyebrow="// 05 — hack madness" title={hackMadness.title} titleClassName={SECTION_TITLE} />

            <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] lg:gap-12">
              <Reveal>
                <CircuitFrame variant="full">
                  <PhotoSlot photo={hackMadness.flyer} aspect="aspect-square" />
                </CircuitFrame>
              </Reveal>

              {/* The details card's circuit border draws in after the flyer's frame */}
              <Reveal delay={0.1}>
                <CircuitFrame variant="corners" radius={24} delay={1150}>
                  <div className="glass-card p-6 sm:p-8 space-y-7">
                  <div className="space-y-3">
                    <span className="inline-flex rounded-full border border-white/15 px-3 py-1 text-xs font-medium text-secondary">
                      Past event
                    </span>
                    <p className="text-sm font-semibold text-accent">{hackMadness.presenter}</p>
                    <p className="text-2xl sm:text-3xl font-semibold tracking-tight text-primary">
                      {hackMadness.title}, {hackMadness.tagline}
                    </p>
                  </div>

                  <div className="space-y-3">
                    <CardLabel>Qualifications</CardLabel>
                    <ul className="space-y-2">
                      {hackMadness.qualifications.map((q) => (
                        <li key={q} className="flex items-center gap-3 text-sm sm:text-base text-primary/90">
                          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md border border-accent/50 text-accent">
                            <Check className="h-3.5 w-3.5" aria-hidden="true" />
                          </span>
                          {q}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="space-y-3">
                    <CardLabel>Tournament blueprint</CardLabel>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      {hackMadness.blueprint.map((b) => (
                        <div key={b.title} className="space-y-1.5 rounded-2xl border border-accent/25 bg-white/[0.02] p-4">
                          <h4 className="text-sm font-semibold text-accent">{b.title}</h4>
                          <p className="text-sm font-medium text-primary">{b.lead}</p>
                          <p className="text-sm leading-relaxed text-secondary">{b.text}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <dl className="grid grid-cols-1 gap-x-6 gap-y-4 border-t border-white/[0.08] pt-6 sm:grid-cols-2">
                    {hackMadness.details.map((d) => (
                      <div key={d.label} className="space-y-1">
                        <dt className="text-sm text-secondary">{d.label}</dt>
                        <dd className="text-base font-medium text-primary">{d.value}</dd>
                      </div>
                    ))}
                  </dl>
                  </div>
                </CircuitFrame>
              </Reveal>
            </div>

            {/* Event photos: part of Hack Madness, with a small label instead of a separate section */}
            <div className="space-y-8 pt-4">
              <h3 aria-label="Event photos" className="font-mono text-xs tracking-[0.12em] text-accent/60 sm:text-[13px]">// event photos</h3>
              <PhotoGallery photos={hackMadness.photos} aspect="aspect-[3/2]" featuredAspect="aspect-[16/9] lg:aspect-[21/9]" />
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}

export default Community
