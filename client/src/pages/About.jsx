import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, useInView, useReducedMotion } from 'framer-motion'
import { client } from '../sanityClient'
import { CircularDisplay } from '../components/CircularDisplay'
import FoundersCarousel from '../components/FoundersCarousel'
import AsciiBrain from '../components/AsciiBrain'
import CircuitEmblem from '../components/CircuitEmblem'
import { Reveal, Hairline, STAGGER } from '../components/Interactive'
import { COUNT, SESSION_KEY, clamp01, easeOut, now, powerOn, timeline } from '../lib/powerOn'
import { useIntroDone } from '../lib/intro'
import { spotlightHandlers } from '../lib/pointer'
import { Bell, FileText, Calendar, Globe } from 'lucide-react'
// A closer crop of her headshot, so her face fills the card like the others
import angelinaHeadshot from '../assets/events/angelina-ponce-headshot-close.jpg'
import davidHeadshot from '../assets/events/david-ponce-headshot.jpg'
import LoadError from '../components/LoadError'

// Founders hidden from the carousel (matched case-insensitively on name).
const EXCLUDED_FOUNDERS = ['shahida chowdhury']
// Founders are ordered by creation date in Sanity (there's no order field), so the display order
// is set here (three on the top row, four on the bottom, see breakAfter below); anyone not listed
// follows in Sanity order.
const FOUNDER_ORDER = ['david ponce', 'jack hunter', 'angelina ponce', 'hilary rojas rosales', 'aditya kapoor', 'ryan gallego', 'erika nelson']
// Title overrides until the Sanity founder "Position" field is updated (then these can be removed)
const FOUNDER_TITLES = { 'jack hunter': 'Chief Technology Officer & Co-Founder' }
// Local headshot replacements, until the photo is replaced in the Studio
const FOUNDER_IMAGES = { 'angelina ponce': angelinaHeadshot, 'david ponce': davidHeadshot }
const founderKey = (f) => f.name?.trim().toLowerCase()
const rank = (f) => { const i = FOUNDER_ORDER.indexOf(founderKey(f)); return i === -1 ? FOUNDER_ORDER.length : i }

const SECTIONS = [
  { id: 'story', label: 'Our Story' },
  { id: 'founders', label: 'Founders' },
  { id: 'origins', label: 'Origins' },
  { id: 'get-involved', label: 'Get Involved' },
]

const getInvolvedSteps = [
  {
    step: "01",
    icon: Bell,
    title: "Monitor Announcements",
    description: "StackHacks regularly posts updates via LinkedIn and Instagram when applications open for general membership, project teams, and executive internships."
  },
  {
    step: "02",
    icon: FileText,
    title: "Apply Online",
    description: "When applications open at the start of each semester, a simple online interest form is sent to students to match your interests with our active tracks."
  },
  {
    step: "03",
    icon: Calendar,
    title: "Attend Events",
    description: "Participate in hands-on workshops, tech talks, and open project demo days to meet current team leads and experience our development culture."
  },
  {
    step: "04",
    icon: Globe,
    title: "Check Campus Portal",
    description: "Watson College bulletins and Binghamton University student organization portals provide additional ways to connect with active e-board officers."
  }
]

const fallbackAbout = [
  {
    _id: "about-1",
    title: "About Us",
    subtitle: "Who We Are",
    text: "StackHacks is a project-driven computer science club at Binghamton University's Thomas J. Watson College of Engineering and Applied Science. We welcome members of all backgrounds and experience levels, creating an collaborative space where everyone learns, builds, and grows together.",
    image: `${import.meta.env.BASE_URL}SH.png`
  }
]

// Events hosted to date, including ones never posted to Sanity; the live count can only raise it
const EVENTS_HOSTED_MIN = 15

/* ─────────────────────────── Our Story "power on" landing ─────────────────────────── */

const MOBILE_QUERY = '(max-width: 767px)'

// 'play' runs the landing sequence (first visit this session, or ?replay=1); 'final' shows the end
// state with idle pulses only; 'reduced' (prefers-reduced-motion) shows the end state, nothing moves.
function initialBootMode() {
  if (typeof window === 'undefined') return 'final'
  if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return 'reduced'
  if (new URLSearchParams(window.location.search).get('replay') === '1') return 'play'
  // Deep links to a later section skip the landing
  if (window.location.hash && window.location.hash !== '#story') return 'final'
  try { if (sessionStorage.getItem(SESSION_KEY)) return 'final' } catch { /* storage blocked */ }
  return 'play'
}

/**
 * Registers the Our Story section with lib/powerOn (circuit pulses + lit nodes on the page-level
 * board) and, in 'play' mode, drives the heading typing, the paragraph rising in line by line and
 * the carousel fading in, all on the shared pausable clock.
 */
function useStoryPowerOn(sectionRef, ready) {
  const [mode] = useState(initialBootMode)
  const [mobile] = useState(() => typeof window !== 'undefined' && !!window.matchMedia?.(MOBILE_QUERY).matches)
  const [done, setDone] = useState(mode !== 'play')
  const introDone = useIntroDone()

  useEffect(() => {
    const el = sectionRef.current
    if (!el) return
    powerOn.activate(el, mode, mobile)
    return () => powerOn.deactivate(el)
  }, [sectionRef, mode, mobile])

  useEffect(() => {
    if (done || !ready || !introDone) return
    const el = sectionRef.current
    const chars = [...el.querySelectorAll('[data-boot-char]')]
    const cursor = el.querySelector('[data-boot-cursor]')
    const words = [...el.querySelectorAll('[data-boot-text] [data-w]')]
    const media = el.querySelector('[data-boot-media]')
    const controls = el.querySelector('[data-boot-controls]')

    // Group the paragraph's words into its rendered lines
    const lines = []
    let lineTop = null
    words.forEach((w) => {
      if (w.offsetTop !== lineTop) { lines.push([]); lineTop = w.offsetTop }
      lines[lines.length - 1].push(w)
    })

    const T = timeline(mobile)
    const typeEnd = T.typeAt + chars.length * T.charMs
    const textAt = typeEnd + T.textGap
    const mediaAt = typeEnd + T.mediaGap
    const BLINK = 180
    const cursorEnd = typeEnd + BLINK * 4 + 200
    const end = Math.max(textAt + Math.max(0, lines.length - 1) * T.lineStagger + T.lineMs, mediaAt + 100 + T.mediaMs, cursorEnd)

    const show = (els, p, dy = 0) => els.forEach((x) => {
      x.style.opacity = String(p)
      x.style.transform = dy && p < 1 ? `translateY(${((1 - p) * dy).toFixed(2)}px)` : ''
    })
    const finish = () => {
      el.removeAttribute('data-boot') // before clearing inline styles, so nothing flashes hidden
      ;[...chars, ...words, cursor, media, controls].forEach((x) => { if (x) { x.style.opacity = ''; x.style.transform = '' } })
      setDone(true)
    }

    powerOn.start()
    const startAt = powerOn.getState().startAt
    let off = powerOn.onFrame((t) => {
      const e = t - startAt
      const shown = e < T.typeAt ? 0 : Math.min(chars.length, Math.floor((e - T.typeAt) / T.charMs) + 1)
      chars.forEach((c, i) => { c.style.opacity = i < shown ? '1' : '0' })
      if (cursor) {
        const last = chars[shown - 1]
        cursor.style.left = last ? `${last.offsetLeft + last.offsetWidth + 4}px` : '0px'
        const p = e - typeEnd
        // Solid while typing, then two blinks and a fade
        cursor.style.opacity = String(
          e < T.typeAt - 250 ? 0 : p < 0 ? 1 : p < BLINK * 4 ? Math.floor(p / BLINK) % 2 : clamp01(1 - (p - BLINK * 4) / 200)
        )
      }
      lines.forEach((ws, k) => show(ws, easeOut(clamp01((e - textAt - k * T.lineStagger) / T.lineMs)), 14))
      if (media) show([media], easeOut(clamp01((e - mediaAt) / T.mediaMs)))
      if (controls) show([controls], easeOut(clamp01((e - mediaAt - 100) / T.mediaMs)), 8)
      if (e >= end) { off?.(); off = null; finish() }
    })
    return () => off?.()
  }, [sectionRef, ready, introDone, done, mobile])

  return { mode, mobile, done }
}

/** Stat number that counts up from 0 once it scrolls into view (landing 'play' mode only). */
function StatCount({ to, plus, index, animate, mobile }) {
  const ref = useRef(null)
  const [value, setValue] = useState(animate ? 0 : to)
  const [finished, setFinished] = useState(!animate)

  useEffect(() => {
    if (!animate) return
    const el = ref.current
    let off = null
    const io = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return
      io.disconnect()
      const dur = mobile ? COUNT.mobileMs : COUNT.ms
      const start = now() + index * COUNT.stagger
      off = powerOn.onFrame((t) => {
        const p = clamp01((t - start) / dur)
        setValue(Math.round(to * easeOut(p)))
        if (p >= 1) { off?.(); off = null; setFinished(true) }
      })
    }, { threshold: 0.4 })
    io.observe(el)
    return () => { io.disconnect(); off?.() }
  }, [animate, to, index, mobile])

  return (
    <>
      <span className="sr-only">{to}{plus ? '+' : ''}</span>
      <span ref={ref} aria-hidden="true" className="tabular-nums">
        {value}
        {plus && <span className={`text-accent transition-opacity duration-300 ${finished ? 'opacity-100' : 'opacity-0'}`}>+</span>}
      </span>
    </>
  )
}

function SectionHeading({ title, children }) {
  return (
    <Reveal className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
      <div>
        <h2 className="text-3xl sm:text-5xl font-semibold tracking-tight text-primary">{title}</h2>
      </div>
      {children}
    </Reveal>
  )
}

/** Sticky pill nav that highlights whichever section is in view. */
function SectionNav() {
  const [activeId, setActiveId] = useState(SECTIONS[0].id)

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting)
        if (visible.length) setActiveId(visible[0].target.id)
      },
      { rootMargin: '-45% 0px -50% 0px' }
    )
    SECTIONS.forEach(({ id }) => {
      const el = document.getElementById(id)
      if (el) observer.observe(el)
    })
    return () => observer.disconnect()
  }, [])

  return (
    <nav aria-label="On this page" className="flex justify-center">
      <ul className="flex items-center gap-1 rounded-full border border-white/10 bg-background/70 p-1 backdrop-blur-xl shadow-[0_10px_30px_-12px_rgba(0,0,0,0.8)]">
        {SECTIONS.map(({ id, label }) => {
          const isActive = activeId === id
          return (
            <li key={id}>
              <a
                href={`#${id}`}
                aria-current={isActive ? 'location' : undefined}
                className={`relative isolate block whitespace-nowrap rounded-full px-2.5 sm:px-4 py-1.5 text-[11px] sm:text-sm font-medium transition-colors duration-300 ${
                  isActive ? 'text-black' : 'text-secondary hover:text-primary'
                }`}
              >
                {isActive && (
                  <motion.span
                    layoutId="about-section-pill"
                    className="absolute inset-0 -z-10 rounded-full bg-accent shadow-[0_0_20px_-4px_rgba(254,178,58,0.7)]"
                    transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                  />
                )}
                <span className="relative">{label}</span>
              </a>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}

const About = () => {
  const [founders, setFounders] = useState([])
  const [about, setAbout] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)
  const storyRef = useRef(null)
  const brainRef = useRef(null)
  const pulseBrain = useCallback(() => brainRef.current?.pulse(), [])
  const boot = useStoryPowerOn(storyRef, !loading)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [foundersData, aboutData, counts] = await Promise.all([
          client.fetch(`*[_type == "founder"] | order(_createdAt asc) {
            _id,
            name,
            position,
            bio,
            "image": image.asset->url,
          }`),
          client.fetch(`*[_type == "about"] | order(_createdAt asc) {
            _id,
            title,
            subtitle,
            text,
            "image": image.asset->url,
          }`),
          client.fetch(`{
            "projects": count(*[_type == "project"]),
            "events": count(*[_type == "event"]),
            "leaders": count(*[_type == "eboard"]),
          }`),
        ])
        setFounders(
          (foundersData || [])
            .filter((f) => !EXCLUDED_FOUNDERS.includes(founderKey(f)))
            .map((f, i) => ({ ...f, position: FOUNDER_TITLES[founderKey(f)] || f.position, image: FOUNDER_IMAGES[founderKey(f)] || f.image, _i: i }))
            .sort((a, b) => rank(a) - rank(b) || a._i - b._i)
        )
        setAbout(aboutData?.length ? aboutData : fallbackAbout)
        setStats(counts)
      } catch (e) {
        console.error("Failed to fetch data from Sanity: ", e)
        setLoadError(true)
        setAbout(fallbackAbout)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  // Live Sanity counts; any count that's zero is left out. Sanity only holds the events posted on
  // the site, so the events figure never shows fewer than EVENTS_HOSTED_MIN and always reads "N+".
  const statItems = stats
    ? [
        { label: 'Active projects', value: stats.projects },
        { label: 'Events hosted', value: Math.max(stats.events, EVENTS_HOSTED_MIN), plus: true },
        { label: 'Student leaders', value: stats.leaders },
      ].filter((s) => s.value > 0)
    : []

  return (
    <div className="relative">
      <div className="max-w-6xl mx-auto px-6 pt-8 sm:pt-10">
        <SectionNav />

        {/* ── Our Story ── */}
        <section
          id="story"
          ref={storyRef}
          data-boot={boot.done ? undefined : 'pending'}
          className="screen-section space-y-14 sm:space-y-16"
        >
          {loading ? (
            <div className="h-[25rem] animate-pulse rounded-3xl bg-white/[0.02]" />
          ) : (
            // Autoplay waits for the landing so the first slide is the one that boots up
            <CircularDisplay
              testimonials={about}
              autoplay={boot.done}
              boot={boot.mode === 'play'}
              backdrop={
                // Hands-globe-sprout emblem behind the copy. Desktop: the globe and sprout sit in the open
                // space right of the "About Us" heading, reaching into the right margin, with the hands
                // dimmed by a mask where they pass behind the paragraph. Stacked layout: small, 12%.
                <CircuitEmblem className="circuit-emblem absolute -top-14 right-0 z-0 h-[232px] w-[200px] opacity-[0.12] md:-top-28 md:-right-4 md:h-[348px] md:w-[300px] md:opacity-[0.42] lg:-top-32 lg:-right-8 lg:h-[400px] lg:w-[345px] xl:-top-40 xl:-right-28 xl:h-[480px] xl:w-[414px]" />
              }
            />
          )}

          {loadError && <LoadError what="the latest club stats and photos" />}

          {statItems.length > 0 && (
            <dl className="grid grid-cols-1 border-t border-white/10 py-8 sm:grid-cols-3 sm:py-16">
              {statItems.map((stat, i) => (
                <Reveal
                  key={stat.label}
                  delay={i * STAGGER}
                  className={`flex flex-col-reverse gap-3 py-8 sm:py-2 sm:px-8 lg:px-12 sm:first:pl-0 ${i > 0 ? 'border-t border-white/10 sm:border-t-0 sm:border-l' : ''}`}
                >
                  {/* Label first in the markup (dt before dd); flex-col-reverse shows the number on top */}
                  <dt className="text-[0.95rem] leading-snug text-secondary sm:text-base">{stat.label}</dt>
                  <dd className="font-display-heading text-[3.25rem] leading-none text-primary sm:text-[3.75rem] lg:text-[4.5rem]">
                    <StatCount to={stat.value} plus={stat.plus} index={i} animate={boot.mode === 'play'} mobile={boot.mobile} />
                  </dd>
                </Reveal>
              ))}
            </dl>
          )}
        </section>

        {/* ── Meet the Founders ── */}
        <section id="founders" className="screen-section relative space-y-10">
          {/* Centered title with the ASCII head-and-brain: top-right beside it on wide screens (nudged
              into the margin so the face clears the top row of cards), stacked compactly above it below xl */}
          <div className="relative z-10 flex flex-col items-center gap-3 xl:block">
            <AsciiBrain
              ref={brainRef}
              className="relative h-[176px] w-[146px] xl:absolute xl:-right-14 xl:-top-16 xl:h-[262px] xl:w-[205px]"
            />
            <Reveal>
              <h2 className="founders-title">Meet the Founders</h2>
            </Reveal>
          </div>

          {loading ? (
            <div className="h-[30rem] animate-pulse rounded-3xl bg-white/[0.02]" />
          ) : founders.length > 0 ? (
            <Reveal className="relative z-10">
              <FoundersCarousel founders={founders} breakAfter={3} onActiveChange={pulseBrain} />
            </Reveal>
          ) : loadError ? (
            <LoadError what="the founders" />
          ) : (
            <div className="text-center text-secondary/50 py-12">
              No founders registered currently.
            </div>
          )}
        </section>

        {/* ── Our Origins ── */}
        <section id="origins" className="screen-section space-y-10">
          <Hairline />
          <SectionHeading title="Where StackHacks Began" />
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-[minmax(0,760px)_minmax(0,1fr)] lg:items-center lg:gap-16">
            {/* Copy can move to Sanity later (see report); hardcoded for now */}
            {/* Sizes sit on each paragraph: the base p rule in index.css would override inherited sizes */}
            <div className="max-w-[760px] space-y-5">
              <Reveal as="p" className="text-[1.25rem] sm:text-[1.35rem] leading-[1.65] text-primary/90">
                StackHacks originated in 2023 as an idea conceived by <span className="hl">David Ponce</span> during his tenure as Project Manager for <span className="hl">ColorStack</span>. As interest rapidly grew, the initiative expanded into an independent organization. With key contributions from <span className="hl">ColorStack</span>’s Founding President <span className="hl">Julian Ortiz</span>, alongside <span className="hl">Jack Hunter</span>, <span className="hl">Angelina Ponce</span>, and a dedicated founding E-Board, StackHacks quickly emerged as the fastest-growing and largest Computer Science organization at Binghamton University.
              </Reveal>
              <Reveal as="p" delay={STAGGER * 2} className="text-[1.25rem] sm:text-[1.35rem] leading-[1.65] text-primary/90">
                We welcome a wide spectrum of ambitious students, from driven first-years with zero coding experience to master’s students looking to collaborate on high-level builds. Today, we empower underrepresented students and allies with hands-on, real-world technical experience through our selective Project Division (averaging <span className="hl">over 60 applicants</span> per cycle with a <span className="hl">35% acceptance rate</span>) and foster leadership growth through our Spring Internship Program. Beyond technical work, community is at our core: we regularly organize group trips to nationally recognized hackathons, including HackMIT, HackHarvard, YHack, and HackPrinceton.
              </Reveal>
              <Reveal as="p" delay={STAGGER * 4} className="text-[1.25rem] sm:text-[1.35rem] leading-[1.65] text-primary/90">
                What began as a simple idea shared between four passionate visionaries has grown into a vibrant, supportive, and close-knit family. Together, we continue to empower driven students to learn, build, and succeed side-by-side.
              </Reveal>
            </div>
            <OriginsSteps />
          </div>
        </section>

        {/* ── How to Get Involved ── */}
        <section id="get-involved" className="screen-section space-y-10">
          <SectionHeading title="How to Get Involved" />

          <ol
            className="relative grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5"
          >
            {/* Thin gold thread linking the steps on desktop */}
            <div className="pointer-events-none absolute left-8 right-8 top-[3.25rem] hidden h-px bg-gradient-to-r from-accent/0 via-accent/40 to-accent/0 lg:block" />
            {getInvolvedSteps.map((step, i) => (
              <Reveal as="li" key={step.step} delay={i * STAGGER}>
                <StepCard step={step} />
              </Reveal>
            ))}
          </ol>
        </section>

      </div>
    </div>
  )
}

const ORIGIN_STEPS = [
  { label: 'Began in 2023', title: 'An idea within ColorStack' },
  { label: 'Grew into', title: 'An independent organization' },
  { label: 'Today', title: "Binghamton's largest Computer Science organization" },
]

/** Two-step origin visual: ring nodes joined by a thin gold line that draws in on scroll. */
function OriginsSteps() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, amount: 0.5 })
  const reduce = useReducedMotion()
  const [forced, setForced] = useState(false)
  useEffect(() => {
    const id = setTimeout(() => setForced(true), 1600)
    return () => clearTimeout(id)
  }, [])
  const drawn = reduce || inView || forced
  return (
    <ol ref={ref} className="relative space-y-12 pl-11">
      {/* Track and the gold line drawing down it */}
      <span aria-hidden="true" className="absolute left-[11px] top-3 bottom-8 w-px bg-white/10" />
      <span
        aria-hidden="true"
        className={`absolute left-[11px] top-3 bottom-8 w-px origin-top bg-gradient-to-b from-accent to-accent/50 transition-transform duration-[1400ms] ease-[cubic-bezier(0.16,1,0.3,1)] ${drawn ? 'scale-y-100' : 'scale-y-0'}`}
      />
      {ORIGIN_STEPS.map((step, i) => (
        <Reveal as="li" key={step.title} delay={0.2 + i * 0.35} className="relative">
          <span aria-hidden="true" className="absolute -left-11 top-0.5 flex h-6 w-6 items-center justify-center rounded-full border border-accent/60 bg-background shadow-[0_0_14px_-4px_rgba(254,178,58,0.6)]">
            <span className="h-1.5 w-1.5 rounded-full bg-accent" />
          </span>
          <p className="text-sm font-medium text-secondary">{step.label}</p>
          <p className="mt-1.5 text-lg sm:text-xl font-semibold tracking-tight text-primary">{step.title}</p>
        </Reveal>
      ))}
    </ol>
  )
}

function StepCard({ step }) {
  const Icon = step.icon
  return (
    <div
      {...spotlightHandlers}
      className="glass-card spotlight spotlight-border group h-full p-7 flex flex-col gap-6 transition-transform duration-500 hover:-translate-y-1"
    >
      <div className="flex items-center justify-between">
        <div className="relative w-11 h-11 rounded-2xl bg-gradient-to-b from-accent/20 to-accent/5 border border-accent/25 flex items-center justify-center text-accent transition-all duration-500 group-hover:shadow-[0_0_24px_-4px_rgba(254,178,58,0.6)] group-hover:scale-105">
          <Icon className="w-5 h-5" />
        </div>
        <span className="text-sm font-medium tabular-nums tracking-widest text-secondary/40 group-hover:text-accent/80 transition-colors duration-500">
          {step.step}
        </span>
      </div>
      <div className="space-y-2.5">
        <h3 className="text-lg font-semibold text-primary">{step.title}</h3>
        <p className="text-sm text-secondary leading-relaxed">{step.description}</p>
      </div>
    </div>
  )
}

export default About
