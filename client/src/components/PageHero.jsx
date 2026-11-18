import { useEffect, useRef } from "react"
import { ChevronDown } from "lucide-react"

/**
 * Landing hero shared by the E-Board and Community pages: heading, a short circuit-trace divider
 * and an intro paragraph on the left (~45%), an animated piece on the right (~55%), and a SCROLL
 * cue that fades out on scroll. Fills the first screen on desktop; stacks on smaller screens.
 *
 * `title` is the heading content, `next()` returns the element the SCROLL cue jumps to.
 */
export default function PageHero({ title, titleClassName = "text-primary", intro, art, next, scrollLabel }) {
  const cueRef = useRef(null)

  useEffect(() => {
    // The scroll cue fades out over the first ~160px of scrolling
    const onScroll = () => { if (cueRef.current) cueRef.current.style.opacity = String(Math.max(0, 1 - window.scrollY / 160)) }
    window.addEventListener("scroll", onScroll, { passive: true })
    onScroll()
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  return (
    <section className="relative grid grid-cols-1 items-center gap-8 pb-12 pt-10 lg:min-h-[calc(100svh-4rem)] lg:grid-cols-[45fr_55fr] lg:gap-6 lg:py-0">
      <div className="space-y-5 lg:pb-10">
        <h1 className={`page-title text-left ${titleClassName}`}>{title}</h1>
        {/* Short circuit-trace divider */}
        <svg aria-hidden="true" width="168" height="26" viewBox="0 0 168 26" fill="none" className="block">
          <path d="M5 6 H72 V20 H163" stroke="#F5A623" strokeOpacity="0.7" strokeWidth="1.3" strokeLinejoin="round" />
          {[[5, 6], [72, 6], [72, 20]].map(([x, y]) => <circle key={`${x}${y}`} cx={x} cy={y} r="2.6" fill="#F5A623" />)}
          <circle cx="163" cy="20" r="4" fill="none" stroke="#F5A623" strokeWidth="1.3" />
        </svg>
        {intro && <p className="max-w-md text-left text-base leading-relaxed text-secondary sm:text-lg">{intro}</p>}
      </div>

      {art}

      {/* Scroll cue (desktop: the hero fills the screen) */}
      <button
        ref={cueRef}
        type="button"
        onClick={() => next?.()?.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" })}
        aria-label={scrollLabel}
        className="absolute bottom-5 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-1 rounded-md px-2 py-1 text-secondary/60 transition-colors hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 lg:flex cursor-pointer"
      >
        <span className="font-mono text-[10px] tracking-[0.3em]">SCROLL</span>
        <ChevronDown className="scroll-cue-chevron h-4 w-4" />
      </button>
    </section>
  )
}
