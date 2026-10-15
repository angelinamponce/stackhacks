import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight, ArrowUpRight, ChevronDown } from 'lucide-react'
import { fetchCompanies } from '../lib/companies'
import LoadError from './LoadError'
import { useIntroDone } from '../lib/intro'

function LogoMarquee({ items, duration = 45 }) {
  // Render the list twice so translating by -50% loops seamlessly.
  const loop = [...items, ...items]

  return (
    <div
      className="marquee strip-marquee relative w-full min-w-0 overflow-hidden"
      style={{
        maskImage: 'linear-gradient(to right, transparent, #000 8%, #000 92%, transparent)',
        WebkitMaskImage: 'linear-gradient(to right, transparent, #000 8%, #000 92%, transparent)',
      }}
    >
      <ul
        className="marquee-track flex w-max items-center gap-[clamp(14px,1.6vw,28px)]"
        style={{ '--marquee-duration': `${duration}s` }}
      >
        {loop.map((company, i) => (
          <li
            key={`${company._id}-${i}`}
            aria-hidden={i >= items.length}
            style={{ '--breathe-delay': `${-((i * 0.7) % 4.5).toFixed(2)}s` }}
            className="strip-chip group relative flex shrink-0 items-center justify-center rounded-2xl border border-accent/20 bg-gradient-to-b from-white/[0.06] to-white/[0.015]"
          >
            <span className="pointer-events-none absolute inset-0 rounded-2xl bg-[radial-gradient(120px_circle_at_50%_0%,rgba(254,178,58,0.18),transparent_70%)] opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
            <img
              className="strip-logo relative object-contain transition-[opacity,transform] duration-500 group-hover:scale-105"
              src={company.image}
              alt={i < items.length ? `${company.title} logo` : ''}
              loading="lazy"
              decoding="async"
            />
          </li>
        ))}
      </ul>
    </div>
  )
}

export default function Hero() {
  const [companies, setCompanies] = useState([])
  // Hold the hero's entrance until the first-visit intro hands off, so its stagger is actually seen
  const introDone = useIntroDone()
  const enter = introDone ? { opacity: 1, y: 0 } : undefined
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)

  useEffect(() => {
    const loadCompanies = async () => {
      try {
        setCompanies(await fetchCompanies())
      } catch (e) {
        console.error("Failed to fetch companies from Sanity: ", e)
        setLoadError(true)
      } finally {
        setLoading(false)
      }
    }
    loadCompanies()
  }, [])

  return (
    // Landing screen: hero + logo strip fill exactly one viewport (below the nav); the hero is
    // centred in the remaining space and the strip is pinned to the bottom. Sizes scale with
    // viewport height (see .landing-* in index.css) so it fits short laptop screens too.
    <section data-landing className="landing overflow-x-hidden flex flex-col">
      {/* Hero Content Section */}
      <div data-circuit-hero className="landing-hero relative flex flex-1 min-h-0 items-center border-b border-white/[0.08]">
        <div className="relative mx-auto flex w-full max-w-6xl flex-col px-6 lg:block">
          <div className="mx-auto max-w-xl text-center lg:ml-0 lg:w-3/5 lg:text-left z-10 relative">

            {/* Clean Typographic Eyebrow */}
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={enter}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-xs sm:text-sm font-semibold tracking-wider uppercase text-accent landing-eyebrow"
            >
              Binghamton University &middot; Student Tech Collective
            </motion.p>

            <motion.h1
              initial={{ opacity: 0, y: 24 }}
              animate={enter}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="landing-title font-semibold tracking-tight text-primary leading-[1.08]"
            >
              Welcome to <br />
              <span className="text-accent font-semibold">StackHacks.</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 24 }}
              animate={enter}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="landing-copy max-w-xl text-secondary text-base sm:text-lg leading-relaxed"
            >
              Build engineering projects with real-world impact while receiving hands-on mentorship, industry networking, and collaborative development at Binghamton University.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={enter}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="landing-actions flex flex-wrap items-center justify-center lg:justify-start gap-3"
            >
              <Link to="/about" className="btn-primary group px-5 py-2.5 sm:px-6 sm:py-3">
                <span>About Our Club</span>
                <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
              </Link>

              <a
                href="https://www.instagram.com/stackhacksbu/?hl=en"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-secondary group px-5 py-2.5 sm:px-6 sm:py-3"
              >
                <span>Latest Updates</span>
                <ArrowUpRight className="w-4 h-4 opacity-70 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:opacity-100" />
              </a>
            </motion.div>
          </div>

          {/* Right Hero Visual: Ambient Glow + Logo */}
          <div className="landing-visual order-first lg:order-last lg:absolute lg:right-0 lg:top-1/2 lg:-translate-y-1/2 flex items-center justify-center pointer-events-none">
            <div className="absolute w-72 h-72 sm:w-96 sm:h-96 bg-accent/10 rounded-full blur-[100px] pointer-events-none" />
            <img
              className="landing-logo relative w-auto object-contain drop-shadow-[0_20px_50px_rgba(254,178,58,0.15)]"
              src={`${import.meta.env.BASE_URL}SHTrans.png`}
              alt="StackHacks Emblem"
            />
          </div>
        </div>

        {/* Scroll cue: smooth-scrolls to the first section after the landing screen */}
        <button
          type="button"
          onClick={(e) => {
            const landing = e.currentTarget.closest('[data-landing]')
            const next = landing?.parentElement?.nextElementSibling
            next?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' })
          }}
          aria-label="Scroll to the next section"
          className="scroll-cue group absolute left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 rounded-full px-3 py-1 text-accent/80 hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 cursor-pointer"
        >
          <span className="scroll-cue-line block h-4 sm:h-6 w-px bg-gradient-to-b from-transparent to-accent" />
          <ChevronDown className="scroll-cue-chevron h-4 w-4" />
        </button>
      </div>

      {/* Professional Experience Logos Marquee */}
      <div data-circuit-section className="landing-strip relative shrink-0">
        {/* Soft gold glow behind the strip, and gold hairlines (with a travelling light) above and below */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 inset-y-2 bg-[radial-gradient(ellipse_at_center,rgba(254,178,58,0.13),transparent_70%)] blur-2xl" />
        {['top-0', 'bottom-0'].map((pos) => (
          <span key={pos} aria-hidden="true" className={`strip-hairline pointer-events-none absolute inset-x-0 ${pos}`}>
            <span className="strip-hairline-pulse" />
          </span>
        ))}
        <div className="relative max-w-6xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center gap-[clamp(8px,1.4svh,14px)] md:gap-8">
            <div className="md:max-w-52 md:border-r border-accent/20 md:pr-8 shrink-0 text-center md:text-right">
              <span className="strip-label inline-flex items-center gap-3 text-sm sm:text-[15px] uppercase tracking-[0.3em] text-primary/90 font-semibold leading-relaxed">
                <span aria-hidden="true" className="h-px w-8 shrink-0 bg-gradient-to-r from-transparent to-accent md:hidden" />
                <span>Our Professional Experience</span>
                <span aria-hidden="true" className="h-px w-8 shrink-0 bg-gradient-to-l from-transparent to-accent md:hidden" />
              </span>
              <span aria-hidden="true" className="mt-3 ml-auto hidden h-px w-12 bg-gradient-to-l from-accent to-transparent md:block" />
            </div>

            {!loading && companies.length > 0 && <LogoMarquee items={companies} />}
            {loadError && <LoadError what="company logos" className="md:mx-0" />}
          </div>
        </div>
      </div>
    </section>
  )
}