import { Check } from 'lucide-react'
import { Reveal } from '../components/Interactive'
import PhotoSlot from '../components/PhotoSlot'
import PhotoGallery from '../components/PhotoGallery'
import { ceremony, generalBody, hackMadness } from '../data/pastEvents'

function SectionHeading({ id, eyebrow, title, intro }) {
  return (
    <Reveal className="max-w-3xl space-y-3">
      <span className="eyebrow">{eyebrow}</span>
      <h2 id={id} className="text-3xl sm:text-5xl font-semibold tracking-tight text-primary">{title}</h2>
      {intro && <p className="pt-1 text-secondary text-base sm:text-lg leading-relaxed">{intro}</p>}
    </Reveal>
  )
}

// Thin gold hairline between groups of photos
const Divider = () => (
  <div aria-hidden="true" className="h-px w-full bg-gradient-to-r from-transparent via-accent/50 to-transparent" />
)

function SubHeading({ children }) {
  return <h3 className="text-[11px] font-semibold uppercase tracking-[0.25em] text-secondary">{children}</h3>
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

const PastEvents = () => {
  return (
    <div className="relative">
      <div className="max-w-6xl mx-auto px-6" style={{ paddingTop: 'clamp(56px, 10svh, 120px)' }}>
        <Reveal className="text-center max-w-2xl mx-auto mb-4 space-y-4">
          <span className="eyebrow">Archive</span>
          <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight text-primary">Past Events</h1>
          <p className="text-secondary text-base sm:text-lg leading-relaxed">
            Highlights from our End of Year Ceremony, general body events and workshops, and Hack Madness.
          </p>
        </Reveal>

        {/* ── A. End of Year Ceremony ── */}
        <section id="ceremony" aria-labelledby="ceremony-title" className="screen-section space-y-10">
          <SectionHeading eyebrow="Celebration" id="ceremony-title" title="End of Year Ceremony" intro={ceremony.intro} />

          <Reveal>
            <PhotoSlot photo={ceremony.groupPhoto} aspect="aspect-[16/9] lg:aspect-[21/9]" />
          </Reveal>

          <Divider />
          <div className="space-y-5">
            <SubHeading>Speakers</SubHeading>
            <PhotoGrid photos={ceremony.speakers} aspect="aspect-[3/2]" className="sm:grid-cols-3" />
          </div>

          <Divider />
          <div className="space-y-5">
            <SubHeading>Project Teams</SubHeading>
            <PhotoGrid photos={ceremony.teams} aspect="aspect-[3/2]" className="md:grid-cols-2" />
          </div>
        </section>

        {/* ── B. General Body Events & Workshops ── */}
        <section id="general-body" aria-labelledby="general-body-title" className="screen-section space-y-10">
          <SectionHeading eyebrow="Community" id="general-body-title" title="General Body Events & Workshops" intro={generalBody.intro} />
          <PhotoGrid photos={generalBody.photos} aspect="aspect-[3/2]" className="sm:grid-cols-3" />
        </section>

        {/* ── C. Hack Madness ── */}
        <section id="hack-madness" aria-labelledby="hack-madness-title" className="screen-section space-y-10">
          <SectionHeading eyebrow="Tournament" id="hack-madness-title" title={hackMadness.title} />

          <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] lg:gap-12">
            <Reveal>
              <PhotoSlot photo={hackMadness.flyer} aspect="aspect-square" />
            </Reveal>

            <Reveal delay={0.1} className="glass-card p-6 sm:p-8 space-y-7">
              <div className="space-y-3">
                <span className="inline-flex rounded-full border border-white/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-secondary">
                  Past event
                </span>
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-accent">{hackMadness.presenter}</p>
                <p className="text-2xl sm:text-3xl font-semibold tracking-tight text-primary">
                  {hackMadness.title}, {hackMadness.tagline}
                </p>
              </div>

              <div className="space-y-3">
                <SubHeading>Qualifications</SubHeading>
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
                <SubHeading>Tournament Blueprint</SubHeading>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {hackMadness.blueprint.map((b) => (
                    <div key={b.title} className="space-y-1.5 rounded-2xl border border-accent/25 bg-white/[0.02] p-4">
                      <h4 className="text-sm font-semibold uppercase tracking-[0.12em] text-accent">{b.title}</h4>
                      <p className="text-sm font-medium text-primary">{b.lead}</p>
                      <p className="text-sm leading-relaxed text-secondary">{b.text}</p>
                    </div>
                  ))}
                </div>
              </div>

              <dl className="grid grid-cols-1 gap-x-6 gap-y-4 border-t border-white/[0.08] pt-6 sm:grid-cols-2">
                {hackMadness.details.map((d) => (
                  <div key={d.label} className="space-y-1">
                    <dt className="text-[11px] font-semibold uppercase tracking-[0.2em] text-secondary">{d.label}</dt>
                    <dd className="text-base font-medium text-primary">{d.value}</dd>
                  </div>
                ))}
              </dl>
            </Reveal>
          </div>

          <Divider />
          <PhotoGallery photos={hackMadness.photos} aspect="aspect-[3/2]" />
        </section>
      </div>
    </div>
  )
}

export default PastEvents
