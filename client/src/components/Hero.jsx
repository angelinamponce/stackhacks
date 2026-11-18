import { useState, useEffect, useMemo, useRef } from 'react'
import { Link } from 'react-router-dom'
import { motion, useReducedMotion } from 'framer-motion'
import { ArrowRight, ArrowUpRight, ChevronDown } from 'lucide-react'
import { fetchCompanies } from '../lib/companies'
import HeroSky from './HeroSky'
import { useMagnetic } from '../lib/pointer'
import { HeroShLogo } from './ShLogo'
import LoadError from './LoadError'
import { useIntroDone } from '../lib/intro'
import AsciiShLogo from './AsciiShLogo'
import { heroIntroMode, heroPower } from '../lib/heroIntro'
import { ticker } from '../lib/asciiArt'

function LogoMarquee({ items, duration = 80 }) {
  // Render the list twice so translating by 50% loops seamlessly; it drifts slowly left to right.
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
        className="marquee-track marquee-track--ltr flex w-max items-center gap-[clamp(40px,4vw,64px)] pr-[clamp(40px,4vw,64px)]"
        style={{ '--marquee-duration': `${duration}s` }}
      >
        {loop.map((company, i) => (
          <li key={`${company._id}-${i}`} aria-hidden={i >= items.length} className="strip-item flex shrink-0 items-center justify-center">
            <img
              className="strip-logo"
              src={company.image}
              alt={i < items.length ? `${company.title} logo` : ''}
              // Eager: lazy logos would change the track width mid-scroll and make the loop jump
              loading="eager"
              decoding="async"
            />
          </li>
        ))}
      </ul>
    </div>
  )
}

const BRAND = 'StackHacks.'
const SHINE_EVENT = 'sh:logo-shine' // the nav mark's one-time shine (components/ShLogo NavLogoShine)
const SHINE_KEY = 'sh-logo-shine-played'
// Heading boot-up timeline (ms from the intro start; mobile runs at 0.7x)
const BOOT = { h1: [0, 400], typeAt: 350, charMs: 65, blink: 170, para: [1250, 1750], actions: [1400, 1900] }

/**
 * "Power on" for the hero text (play mode only): the heading fades in, "StackHacks." types in with a
 * blinking gold block cursor that blinks twice and fades, then the paragraph and buttons fade up.
 * The text is in the DOM throughout (the brand name also has a screen-reader copy).
 */
function useHeroBoot(rootRef, startAt, scale, onDone) {
  useEffect(() => {
    const root = rootRef.current
    if (!root || startAt == null) return
    const h1 = root.querySelector('h1')
    const chars = [...root.querySelectorAll('[data-hero-char]')]
    const cursor = root.querySelector('[data-hero-cursor]')
    const para = root.querySelector('[data-hero-para]')
    const actions = root.querySelector('[data-hero-actions]')
    const typeEnd = BOOT.typeAt + chars.length * BOOT.charMs
    const end = Math.max(typeEnd + BOOT.blink * 4 + 220, BOOT.actions[1])
    const ease = (t) => 1 - (1 - Math.min(1, Math.max(0, t))) ** 3
    const rise = (el, [a, b], e) => { const p = ease((e - a) / (b - a)); el.style.opacity = String(p); el.style.transform = p < 1 ? `translateY(${(1 - p) * 18}px)` : '' }
    const d = {
      visible: true, static: false, idle: false, introDone: false, nextFlickerAt: Infinity,
      anim: { start: startAt },
      tick(now) {
        if (!this.anim) return
        const e = (now - this.anim.start) / scale
        rise(h1, BOOT.h1, e)
        const shown = e < BOOT.typeAt ? 0 : Math.min(chars.length, Math.floor((e - BOOT.typeAt) / BOOT.charMs) + 1)
        chars.forEach((c, i) => { c.style.opacity = i < shown ? '1' : '0' })
        if (cursor) {
          const last = chars[shown - 1]
          cursor.style.left = last ? `${last.offsetLeft + last.offsetWidth + 4}px` : '0px'
          const p = e - typeEnd
          cursor.style.opacity = String(e < BOOT.typeAt - 150 ? 0 : p < 0 ? 1 : p < BOOT.blink * 4 ? Math.floor(p / BOOT.blink) % 2 : Math.max(0, 1 - (p - BOOT.blink * 4) / 200))
        }
        rise(para, BOOT.para, e)
        rise(actions, BOOT.actions, e)
        if (e >= end) {
          this.anim = null
          root.removeAttribute('data-hero-boot')
          ;[h1, ...chars, cursor, para, actions].forEach((el) => { if (el) { el.style.opacity = ''; el.style.transform = '' } })
          onDone?.()
        }
      },
      needsFrames() { return !!this.anim },
    }
    ticker.add(d)
    ticker.wake()
    return () => ticker.remove(d)
  }, [rootRef, startAt, scale, onDone])
}

export default function Hero() {
  const [companies, setCompanies] = useState([])
  // Hold the hero's entrance until the first-visit intro hands off, so its stagger is actually seen
  const introDone = useIntroDone()
  const enter = introDone ? { opacity: 1, y: 0 } : undefined
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)
  // The night sky keeps its stars and shooting stars clear of these
  const textRef = useRef(null)
  const logoRef = useRef(null)
  const skyAvoid = useMemo(() => [textRef, logoRef], [])
  const magnetic = useMagnetic(6)
  const reduce = useReducedMotion()
  const parallaxRef = useRef(null)
  const heroRef = useRef(null)

  // Hero intro (lib/heroIntro): once per session or with ?replay=1, after the first-visit splash.
  // One start time drives the margin-circuit pulses, the ASCII logo assembly and the heading boot-up.
  const [mode] = useState(heroIntroMode)
  const [mobile] = useState(() => typeof window !== 'undefined' && window.innerWidth < 1024)
  const introScale = mobile ? 0.7 : 1
  const [startAt, setStartAt] = useState(null)
  const [booted, setBooted] = useState(mode !== 'play')
  const [asciiFailed, setAsciiFailed] = useState(false)
  useEffect(() => {
    if (mode !== 'play' || !introDone || startAt != null) return
    heroPower.start()
    setStartAt(heroPower.at)
  }, [mode, introDone, startAt])
  const onBootDone = useMemo(() => () => setBooted(true), [])
  useHeroBoot(heroRef, startAt, introScale, onBootDone)
  // The nav mark's shine follows the logo's arrival, once per session
  const onLogoIntroEnd = useMemo(() => () => {
    try { if (sessionStorage.getItem(SHINE_KEY) === '1') return; sessionStorage.setItem(SHINE_KEY, '1') } catch { /* storage blocked */ }
    window.dispatchEvent(new Event(SHINE_EVENT))
  }, [])
  // In play mode the boot-up drives the text, so framer's entrance stays out of the way
  const playing = mode === 'play'
  const entrance = (delay, dur) => (playing ? { initial: false } : { initial: { opacity: 0, y: 24 }, animate: enter, transition: { duration: dur, delay } })

  // Signature moment: the SH mark drifts very slowly against the text as the page scrolls (max 40px).
  // Desktop only (on phones the mark sits right above the text); off for reduced motion.
  useEffect(() => {
    const el = parallaxRef.current
    if (!el || reduce) return
    let frame = 0
    const update = () => {
      frame = 0
      const on = window.innerWidth >= 1024
      el.style.transform = on ? `translate3d(0, ${Math.min(window.scrollY * 0.12, 40).toFixed(1)}px, 0)` : ''
    }
    const onScroll = () => { if (!frame) frame = requestAnimationFrame(update) }
    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [reduce])

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
    // data-network-clear: the home page's background network stays out of the whole landing (the hero has its own sky)
    <section data-landing data-network-clear className="landing overflow-x-hidden flex flex-col">
      {/* Hero Content Section */}
      {/* data-circuit-pulse="hero": the margin circuits beside the hero pulse with its intro (os/ScrollPulseLayer) */}
      <div ref={heroRef} data-circuit-hero data-circuit-pulse="hero" data-hero-boot={!booted && playing ? 'pending' : undefined} className="landing-hero relative isolate flex flex-1 min-h-0 items-center border-b border-white/[0.08]">
        <HeroSky avoidRefs={skyAvoid} />
        <div className="relative mx-auto flex w-full max-w-6xl flex-col px-6 lg:block">
          <div ref={textRef} className="mx-auto max-w-xl text-center lg:ml-0 lg:w-3/5 lg:text-left z-10 relative">

            <motion.h1 {...entrance(0.2, 0.6)} className="landing-title page-title text-primary">
              Welcome to <br />
              <span className="text-accent">
                <span className="sr-only">{BRAND}</span>
                <span aria-hidden="true" className="relative inline-block">
                  {[...BRAND].map((c, i) => <span key={i} data-hero-char>{c}</span>)}
                  <span data-hero-cursor className="boot-cursor" />
                </span>
              </span>
            </motion.h1>

            <motion.p
              {...entrance(0.3, 0.5)}
              data-hero-para
              className="landing-copy mx-auto max-w-[560px] lg:mx-0 text-secondary text-base sm:text-[17px] leading-[1.7]"
            >
              Build engineering projects with real-world impact while receiving hands-on mentorship, industry networking, and collaborative development at Binghamton University.
            </motion.p>

            <motion.div
              {...entrance(0.4, 0.5)}
              data-hero-actions
              className="landing-actions flex flex-wrap items-center justify-center lg:justify-start gap-3"
            >
              <Link to="/about" {...magnetic} className="btn-primary group">
                <span>About Our Club</span>
                <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
              </Link>

              <a
                href="https://www.instagram.com/stackhacksbu/?hl=en"
                target="_blank"
                rel="noopener noreferrer"
                {...magnetic}
                className="btn-secondary group"
              >
                <span>Latest Updates</span>
                <ArrowUpRight className="w-4 h-4 opacity-70 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:opacity-100" />
              </a>
            </motion.div>
          </div>

          {/* Right Hero Visual: Ambient Glow + Logo */}
          <div className="landing-visual order-first lg:order-last lg:absolute lg:right-0 lg:top-1/2 lg:-translate-y-1/2 flex items-center justify-center pointer-events-none">
            <div ref={parallaxRef} className="relative flex items-center justify-center will-change-transform">
              {/* One very faint radial glow behind the mark (the mark adds its own tight glow) */}
              <div className="absolute w-64 h-64 sm:w-80 sm:h-80 bg-accent/[0.06] rounded-full blur-[90px] pointer-events-none" />
              {/* The SH mark as ASCII; falls back to the vector mark if the artwork can't be sampled */}
              {asciiFailed ? (
                <HeroShLogo logoRef={logoRef} className="landing-logo w-auto" />
              ) : (
                <div ref={logoRef} className="landing-ascii-logo">
                  <AsciiShLogo
                    className="pointer-events-auto h-full w-full cursor-pointer"
                    reduced={mode === 'reduced'}
                    waiting={playing && startAt == null}
                    startAt={startAt}
                    introScale={introScale}
                    onFail={() => setAsciiFailed(true)}
                    onIntroEnd={onLogoIntroEnd}
                  />
                </div>
              )}
            </div>
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
          className="scroll-cue absolute left-1/2 -translate-x-1/2 rounded-full p-1.5 text-secondary/60 transition-colors duration-300 hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 cursor-pointer"
        >
          <ChevronDown className="h-4 w-4" />
        </button>
      </div>

      {/* Professional Experience Logos Marquee */}
      {/* data-circuit-avoid keeps the page circuits out of the strip */}
      <div data-circuit-section data-circuit-avoid className="landing-strip relative shrink-0">
        {/* Static gold hairline above the strip */}
        <span aria-hidden="true" className="strip-hairline pointer-events-none absolute inset-x-0 top-0" />
        <div className="relative max-w-6xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center gap-[clamp(8px,1.4svh,14px)] md:gap-7">
            <div className="shrink-0 text-center md:border-r md:border-white/10 md:pr-7 md:text-left">
              <span className="strip-label inline-flex max-w-[16rem] items-center justify-center gap-3 text-sm font-medium leading-relaxed text-primary/85 md:max-w-none md:whitespace-nowrap">
                <span aria-hidden="true" className="h-px w-6 shrink-0 bg-gradient-to-r from-transparent to-accent/70 md:hidden" />
                <span>Our professional experience</span>
                <span aria-hidden="true" className="h-px w-6 shrink-0 bg-gradient-to-l from-transparent to-accent/70 md:hidden" />
              </span>
            </div>

            {!loading && companies.length > 0 && <LogoMarquee items={companies} />}
            {loadError && <LoadError what="company logos" className="md:mx-0" />}
          </div>
        </div>
      </div>
    </section>
  )
}