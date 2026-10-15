import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { client } from '../sanityClient'
import { CircularDisplay } from '../components/CircularDisplay'
import FoundersCarousel from '../components/FoundersCarousel'
import { CountUp, Reveal } from '../components/Interactive'
import { spotlightHandlers } from '../lib/pointer'
import { Bell, FileText, Calendar, Globe } from 'lucide-react'
import LoadError from '../components/LoadError'

// Founders hidden from the carousel (matched case-insensitively on name).
const EXCLUDED_FOUNDERS = ['shahida chowdhury']

const SECTIONS = [
  { id: 'story', label: 'Our Story' },
  { id: 'founders', label: 'Founders' },
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
    image: "/SH.png"
  }
]

function SectionHeading({ eyebrow, title, children }) {
  return (
    <Reveal className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
      <div className="space-y-3">
        <span className="eyebrow">{eyebrow}</span>
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
                className={`relative isolate block rounded-full px-3.5 sm:px-4 py-1.5 text-xs sm:text-sm font-medium transition-colors duration-300 ${
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
            "partners": count(*[_type == "company"]),
          }`),
        ])
        setFounders(
          (foundersData || []).filter(
            (f) => !EXCLUDED_FOUNDERS.includes(f.name?.trim().toLowerCase())
          )
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

  const statItems = stats
    ? [
        { label: 'Active Projects', value: stats.projects },
        { label: 'Events Hosted', value: stats.events },
        { label: 'Student Leaders', value: stats.leaders },
        { label: 'Companies Represented', value: stats.partners },
      ].filter((s) => s.value > 0)
    : []

  return (
    <div className="relative">
      <div className="max-w-6xl mx-auto px-6 pt-8 sm:pt-10">
        <SectionNav />

        {/* ── Our Story ── */}
        <section id="story" className="screen-section space-y-14 sm:space-y-16">
          {loading ? (
            <div className="h-[25rem] animate-pulse rounded-3xl bg-white/[0.02]" />
          ) : (
            <CircularDisplay testimonials={about} autoplay={true} />
          )}

          {loadError && <LoadError what="the latest club stats and photos" />}

          {statItems.length > 0 && (
            <dl className="grid grid-cols-2 lg:grid-cols-4 border-y border-white/[0.08]">
              {statItems.map((stat, i) => (
                <div
                  key={stat.label}
                  className={`flex flex-col-reverse items-center justify-end gap-2 px-4 py-8 sm:py-10 text-center
                    ${i % 2 === 1 ? 'border-l border-white/[0.08]' : ''}
                    ${i >= 2 ? 'border-t border-white/[0.08] lg:border-t-0' : ''}
                    ${i === 2 ? 'lg:border-l' : ''}`}
                >
                  <dt className="text-[11px] sm:text-xs font-semibold uppercase tracking-[0.2em] text-secondary/70">
                    {stat.label}
                  </dt>
                  <dd className="text-4xl sm:text-5xl font-semibold tracking-tight bg-gradient-to-b from-[#ffe2a8] to-accent bg-clip-text text-transparent">
                    <CountUp to={stat.value} suffix={stat.suffix} />
                  </dd>
                </div>
              ))}
            </dl>
          )}
        </section>

        {/* ── Meet the Founders ── */}
        <section id="founders" className="screen-section space-y-10">
          <SectionHeading eyebrow="Origins" title="Meet the Founders" />

          {loading ? (
            <div className="h-[30rem] animate-pulse rounded-3xl bg-white/[0.02]" />
          ) : founders.length > 0 ? (
            <Reveal>
              <FoundersCarousel founders={founders} />
            </Reveal>
          ) : loadError ? (
            <LoadError what="the founders" />
          ) : (
            <div className="text-center text-secondary/50 py-12">
              No founders registered currently.
            </div>
          )}
        </section>

        {/* ── How to Get Involved ── */}
        <section id="get-involved" className="screen-section space-y-10">
          <SectionHeading eyebrow="Join the Community" title="How to Get Involved" />

          <ol
            className="relative grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5"
          >
            {/* Thin gold thread linking the steps on desktop */}
            <div className="pointer-events-none absolute left-8 right-8 top-[3.25rem] hidden h-px bg-gradient-to-r from-accent/0 via-accent/40 to-accent/0 lg:block" />
            {getInvolvedSteps.map((step, i) => (
              <Reveal as="li" key={step.step} delay={i * 0.1}>
                <StepCard step={step} />
              </Reveal>
            ))}
          </ol>
        </section>

      </div>
    </div>
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
