import { useEffect, useState } from "react"
import { client } from "../sanityClient"
import { OG_PAGES, OG_SIZE, OG_TAGLINE } from "../../og.config"
import AsciiShLogo from "../components/AsciiShLogo"
import AsciiThumb from "../components/AsciiThumb"
import AsciiBrain from "../components/AsciiBrain"
import AsciiTeamGear from "../components/AsciiTeamGear"
import AsciiClimb from "../components/AsciiClimb"

/*
 * One 1200x630 social-share preview (see og.config.js and scripts/generate-og.js).
 * Left: eyebrow, title and tagline; right: the page's ASCII art (the site's own components, in their
 * static reduced-motion state). Shared background: near-black, a soft gold glow behind the art, a
 * sparse starfield, faint film grain, and gold circuit traces converging on the art.
 * Everything important sits inside the central 1100x560 safe area.
 */

const { width: W, height: H } = OG_SIZE
const GOLD = "#F5A623"
const ART = { x: 660, y: 35, w: 500, h: 560 } // right-hand art area
const ART_CX = ART.x + ART.w / 2, ART_CY = 315

function rng(seed) {
  return () => { seed |= 0; seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296 }
}
const STARS = (() => { const r = rng(630); return Array.from({ length: 70 }, () => ({ x: r() * W, y: r() * H, s: 1.4 + r() * 1.4, o: 0.12 + r() * 0.4, gold: r() < 0.18 })) })()

// Circuit traces: in from the left and bottom edges, right-angle bends, converging below the art.
// Each fades in from its edge (faint) to its inner end (bright).
const TRACES = [
  { d: "M0 588 H300 L318 570 H560 V548 H700", from: [0, 588], to: [700, 548], nodes: [[300, 588], [560, 570], [560, 548]], ring: [706, 548] },
  { d: "M0 612 H460 L478 594 H620", from: [0, 612], to: [620, 594], nodes: [[460, 612]], end: [620, 594] },
  { d: "M760 630 V598 H860 V556", from: [760, 630], to: [860, 556], nodes: [[760, 598], [860, 598]], ring: [860, 550] },
  { d: "M1040 630 V604 H1110 V520", from: [1040, 630], to: [1110, 520], nodes: [[1040, 604], [1110, 604]], end: [1110, 520] },
]
// About: bright pulses travelling along the traces, toward the brain
const PULSES = [[540, 570], [830, 598], [1110, 560]]

function Background({ variant }) {
  return (
    <>
      {/* Soft gold glow behind the art */}
      <div className="absolute" style={{ left: ART_CX - 330, top: ART_CY - 300, width: 660, height: 600, background: "radial-gradient(closest-side, rgba(245,166,35,0.17), rgba(245,166,35,0.06) 55%, transparent)" }} />
      <svg className="absolute inset-0" width={W} height={H} viewBox={`0 0 ${W} ${H}`} fill="none">
        <defs>
          {TRACES.map((t, i) => (
            <linearGradient key={i} id={`og-tr${i}`} gradientUnits="userSpaceOnUse" x1={t.from[0]} y1={t.from[1]} x2={t.to[0]} y2={t.to[1]}>
              <stop offset="0" stopColor={GOLD} stopOpacity="0.12" />
              <stop offset="1" stopColor={GOLD} stopOpacity="0.85" />
            </linearGradient>
          ))}
          <radialGradient id="og-pulse"><stop offset="0" stopColor="#FFF3D6" /><stop offset="0.35" stopColor="#FFD58A" stopOpacity="0.8" /><stop offset="1" stopColor={GOLD} stopOpacity="0" /></radialGradient>
          {/* Film grain */}
          <filter id="og-grain" x="0" y="0" width="100%" height="100%">
            <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed="7" stitchTiles="stitch" />
            <feColorMatrix values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 0.5 0" />
          </filter>
        </defs>
        {STARS.map((s, i) => <circle key={i} cx={s.x} cy={s.y} r={s.s / 2} fill={s.gold ? "#ffd88a" : "#f4f1ea"} opacity={s.o} />)}
        {TRACES.map((t, i) => (
          <g key={i}>
            <path d={t.d} stroke={`url(#og-tr${i})`} strokeWidth="2" strokeLinejoin="round" />
            {t.nodes.map(([x, y], k) => <circle key={k} cx={x} cy={y} r="3.5" fill={GOLD} opacity={0.35 + 0.55 * (x / 1100)} />)}
            {t.ring && <circle cx={t.ring[0]} cy={t.ring[1]} r="6" stroke={GOLD} strokeWidth="2" />}
            {t.end && <circle cx={t.end[0]} cy={t.end[1]} r="4.5" fill={GOLD} />}
          </g>
        ))}
        {variant === "about" && PULSES.map(([x, y], i) => (
          <g key={i}><circle cx={x} cy={y} r="16" fill="url(#og-pulse)" /><circle cx={x} cy={y} r="3.5" fill="#FFF3D6" /></g>
        ))}
        <rect width={W} height={H} filter="url(#og-grain)" opacity="0.05" />
      </svg>
    </>
  )
}

function Wordmark() {
  return (
    <div className="absolute flex items-center gap-3" style={{ left: 80, top: 50 }}>
      <img src="/SH.png" alt="" style={{ width: 40, height: 40, borderRadius: 6 }} />
      <span style={{ fontFamily: "var(--font-main)", fontWeight: 600, fontSize: 26, color: "#f1f0ec", letterSpacing: "-0.01em" }}>
        Stack<span style={{ color: "#feb23a" }}>Hacks</span>
      </span>
    </div>
  )
}

// Title: the last word in gold, as in the site's page titles; the main card is "Stack" + "Hacks."
function Title({ variant, title }) {
  const style = { fontFamily: "var(--font-display)", fontWeight: 500, letterSpacing: "-0.025em", lineHeight: 1.02, color: "#f1f0ec", margin: 0 }
  if (variant === "home") return <h1 style={{ ...style, fontSize: 112 }}>Stack<span style={{ color: "#feb23a" }}>Hacks.</span></h1>
  const words = title.split(" ")
  const last = words.pop()
  return (
    <h1 style={{ ...style, fontSize: 92 }}>
      {words.length ? <>{words.join(" ")} </> : null}
      <span style={{ color: "#feb23a" }}>{last}</span>
    </h1>
  )
}

function ProjectsArt() {
  const [projects, setProjects] = useState([])
  useEffect(() => {
    client.fetch(`*[_type == "project"] | order(_createdAt asc)[0...4]{ _id, title, "image": image.asset->url }`).then(setProjects).catch(() => {})
  }, [])
  return (
    <div className="grid grid-cols-2 gap-4" style={{ width: 470 }}>
      {projects.map((p) => (
        <div key={p._id} className="relative overflow-hidden rounded-md border border-[#D4AF37]/45 bg-black" style={{ height: 196 }}>
          <AsciiThumb src={p.image} alt={p.title} fill={0.78} />
        </div>
      ))}
    </div>
  )
}

function Art({ variant }) {
  switch (variant) {
    case "projects": return <ProjectsArt />
    case "about": return <AsciiBrain className="h-[400px] w-[352px]" />
    case "eboard": return <AsciiTeamGear className="h-[450px] w-[450px]" />
    // Zoomed so the two figures and the flag sit in the middle, the mountain running off the lower left
    case "community": return (
      <div className="relative h-full w-full overflow-hidden" style={{ maskImage: "radial-gradient(closest-side, #000 72%, transparent)", WebkitMaskImage: "radial-gradient(closest-side, #000 72%, transparent)" }}>
        <div className="absolute" style={{ width: 820, height: 731, left: -400, top: 60 }}>
          <AsciiClimb className="h-full w-full" />
        </div>
      </div>
    )
    default: return <AsciiShLogo reduced className="h-[420px] w-[336px]" />
  }
}

export default function OgCard({ variant = "home" }) {
  const page = OG_PAGES.find((p) => p.variant === variant) || OG_PAGES[0]

  // Tell the screenshot script when fonts and art have had time to render
  useEffect(() => {
    let cancelled = false
    document.fonts.ready.then(() => setTimeout(() => { if (!cancelled) document.body.dataset.ready = "1" }, variant === "projects" ? 3000 : 1500))
    return () => { cancelled = true }
  }, [variant])

  return (
    <div className="relative overflow-hidden" style={{ width: W, height: H, background: "#0e0e0f" }}>
      <Background variant={variant} />
      {variant !== "home" && <Wordmark />}

      {/* Text column, vertically centred in the safe area */}
      <div className="absolute flex flex-col justify-center" style={{ left: 80, top: variant === "home" ? 35 : 100, bottom: 60, width: 570 }}>
        <p style={{ fontFamily: "var(--font-mono)", fontSize: 22, fontWeight: 500, letterSpacing: "0.1em", color: "rgba(254,178,58,0.68)", margin: "0 0 22px" }}>
          // binghamton university
        </p>
        <Title variant={variant} title={page.title} />
        <p style={{ fontFamily: "var(--font-main)", fontSize: 30, lineHeight: 1.36, color: "rgba(241,240,236,0.74)", margin: "26px 0 0", maxWidth: 540 }}>
          {/* The block cursor stays on the same line as the last word */}
          {OG_TAGLINE.split(" ").slice(0, -1).join(" ")}{" "}
          <span style={{ whiteSpace: "nowrap" }}>
            {OG_TAGLINE.split(" ").pop()}
            <span style={{ display: "inline-block", width: "0.52em", height: "0.9em", marginLeft: 10, verticalAlign: "-0.1em", background: "#feb23a", boxShadow: "0 0 14px rgba(254,178,58,0.7)" }} />
          </span>
        </p>
      </div>

      {/* Art, centred in the right-hand area */}
      <div className="absolute flex items-center justify-center" style={{ left: ART.x, top: ART.y, width: ART.w, height: ART.h }}>
        <Art variant={variant} />
      </div>
    </div>
  )
}
