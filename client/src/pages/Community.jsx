import { useCallback, useEffect, useRef, useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import { Check } from 'lucide-react'
import { client } from '../sanityClient'
import { Reveal, Hairline } from '../components/Interactive'
import PageHero from '../components/PageHero'
import AsciiClimb from '../components/AsciiClimb'
import PhotoSlot from '../components/PhotoSlot'
import PhotoGallery from '../components/PhotoGallery'
import SpeakerPanel from '../components/SpeakerPanel'
import { communityIntro, ceremony, generalBody, hackMadness } from '../data/community'

// Short gold accent bar under every heading on this page, so sections share one look
const AccentBar = () => <span aria-hidden="true" className="block h-[3px] w-12 rounded-full bg-accent" />

function SectionHeading({ id, title, intro }) {
  return (
    <Reveal className="max-w-3xl space-y-4">
      <h2 id={id} className="text-[2.25rem] sm:text-5xl font-semibold tracking-tight text-primary">{title}</h2>
      <AccentBar />
      {intro && <p className="pt-1 text-secondary text-base sm:text-lg leading-relaxed">{intro}</p>}
    </Reveal>
  )
}

// Thin gold hairline between groups of photos; draws in as it scrolls into view
const Divider = () => <Hairline />

/** Sub-section title (Speakers, Project Teams, Gallery): serif display, white, with the gold accent bar. */
function SubsectionTitle({ children }) {
  return (
    <Reveal className="space-y-3">
      <h3 className="font-display-heading text-[2rem] leading-tight text-primary sm:text-[2.375rem] lg:text-[2.75rem]">{children}</h3>
      <AccentBar />
    </Reveal>
  )
}

// Small label inside the Hack Madness card (Qualifications, Tournament blueprint)
function CardLabel({ children }) {
  return <h3 className="text-base font-semibold text-secondary">{children}</h3>
}

/** Staggered grid of photo slots; each slot reveals a beat after the previous one. */
function PhotoGrid({ photos, aspect, className }) {
  return (
    <div className={`grid grid-cols-1 gap-6 ${className}`}>
      {photos.map((photo, i) => (
        <Reveal key={photo.caption || i} delay={i * 0.08}>
          <PhotoSlot photo={photo} aspect={aspect} />
        </Reveal>
      ))}
    </div>
  )
}

/**
 * Speaker cards (event photo, gold role, name). A card opens that speaker's profile panel.
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

  // One unified rectangle: the three photos touch, divided only by thin, faint gold lines
  return (
    <Reveal>
      <ul className="grid grid-cols-1 overflow-hidden rounded-md border border-accent/30 sm:grid-cols-3">
        {speakers.map((s, i) => (
          <li key={s.name} className={i > 0 ? 'border-t border-accent/30 sm:border-l sm:border-t-0' : ''}>
            <button
              ref={(el) => { cardRefs.current[i] = el }}
              type="button"
              onClick={() => { returnRef.current = cardRefs.current[i]; setOpen(i) }}
              aria-label={`Open profile: ${s.name}, ${s.role}`}
              className="group relative block aspect-[3/2] w-full overflow-hidden bg-card cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent/70"
            >
              <img src={s.src} alt={s.alt} loading="lazy" className="h-full w-full object-cover transition-transform duration-700 ease-out motion-safe:group-hover:scale-[1.04]" />
              <span aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/85 via-black/40 to-transparent" />
              <span className="absolute inset-x-0 bottom-0 p-4 text-left sm:p-5">
                <span className="block text-sm font-semibold text-accent">{s.role}</span>
                <span className="mt-1 block text-lg font-semibold text-white">{s.name}</span>
              </span>
            </button>
          </li>
        ))}
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
        <section id="ceremony" aria-labelledby="ceremony-title" className="screen-section justify-start! pt-10! sm:pt-12! space-y-10">
          <SectionHeading id="ceremony-title" title="End of Year Ceremony" intro={ceremony.intro} />

          <Reveal>
            <PhotoSlot photo={ceremony.groupPhoto} aspect="aspect-[16/9] lg:aspect-[21/9]" />
          </Reveal>

          <Divider />
          <div className="space-y-8 pt-6 sm:pt-10">
            <SubsectionTitle>Speakers</SubsectionTitle>
            <SpeakerRow speakers={ceremony.speakers} />
          </div>

          <Divider />
          <div className="space-y-8 pt-6 sm:pt-10">
            <SubsectionTitle>Project Teams</SubsectionTitle>
            <PhotoGrid photos={ceremony.teams} aspect="aspect-[3/2]" className="md:grid-cols-2" />
          </div>
        </section>

        {/* ── B. General Body Events & Workshops ── */}
        <section id="general-body" aria-labelledby="general-body-title" className="screen-section space-y-10">
          <SectionHeading id="general-body-title" title="General Body Events & Workshops" intro={generalBody.intro} />
          <PhotoGrid photos={generalBody.photos} aspect="aspect-[3/2]" className="sm:grid-cols-3" />
        </section>

        {/* ── C. Hack Madness ── */}
        <section id="hack-madness" aria-labelledby="hack-madness-title" className="screen-section space-y-10">
          <SectionHeading id="hack-madness-title" title={hackMadness.title} />

          <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] lg:gap-12">
            <Reveal>
              <PhotoSlot photo={hackMadness.flyer} aspect="aspect-square" />
            </Reveal>

            <Reveal delay={0.1} className="glass-card p-6 sm:p-8 space-y-7">
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
            </Reveal>
          </div>

          <Divider />
          <div className="space-y-8 pt-6 sm:pt-10">
            <SubsectionTitle>Gallery</SubsectionTitle>
            <PhotoGallery photos={hackMadness.photos} aspect="aspect-[3/2]" />
          </div>
        </section>
      </div>
    </div>
  )
}

export default Community
