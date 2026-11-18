import { useRef } from "react"
import CircuitDivider from "./CircuitDivider"
import { drawDivider, usePlayOnce } from "../lib/playOnce"

const CHAR_MS = 30, DIVIDER_MS = 520

/**
 * Section heading in the page-hero style: a monospace "// 01 — name" eyebrow above the heading and
 * the circuit-trace divider below it. The first time it scrolls into view the eyebrow types in,
 * then the divider draws (final state immediately under reduced motion). `as` picks h2/h3;
 * `titleClassName` keeps each heading's existing type styles.
 */
export default function CircuitHeading({ as = "h2", id, eyebrow, title, titleClassName = "", intro, className = "" }) {
  const Heading = as
  const rootRef = useRef(null)
  const eyebrowRef = useRef(null)
  const dividerRef = useRef(null)
  const typeMs = eyebrow.length * CHAR_MS

  usePlayOnce(rootRef, typeMs + DIVIDER_MS, (e) => {
    const shown = e === Infinity ? eyebrow.length : Math.min(eyebrow.length, Math.floor(e / CHAR_MS))
    if (eyebrowRef.current) eyebrowRef.current.textContent = eyebrow.slice(0, shown) || " "
    drawDivider(dividerRef.current, e === Infinity ? 1 : Math.max(0, Math.min(1, (e - typeMs) / DIVIDER_MS)))
  })

  return (
    <div ref={rootRef} className={`max-w-3xl space-y-4 ${className}`}>
      <p aria-hidden="true" className="font-mono text-xs tracking-[0.12em] text-accent/60 sm:text-[13px]">
        <span ref={eyebrowRef}>{eyebrow}</span>
      </p>
      <Heading id={id} className={titleClassName}>{title}</Heading>
      <CircuitDivider svgRef={dividerRef} />
      {intro && <p className="pt-1 text-secondary text-base sm:text-lg leading-relaxed">{intro}</p>}
    </div>
  )
}
