import { useState, useEffect, useRef, useId, useCallback, useMemo } from "react"
import { createPortal } from "react-dom"
import { client } from "../sanityClient"
import { motion, AnimatePresence, useReducedMotion } from "framer-motion"
import { X, Linkedin, Instagram, Github, Mail, Globe, ArrowLeft, ArrowRight, ArrowUpRight } from "lucide-react"
import SHTrans from "/SHTrans.png"
import { Reveal } from "../components/Interactive"
import { Link } from "react-router-dom"
import PortraitCard from "../components/PortraitCard"
import LoadError from '../components/LoadError'
import CompanyChip from '../components/CompanyChip'
import CornerTraces from '../components/os/CornerTraces'
import { useDialog } from '../lib/dialog'
import { fetchCompanies, logoMap } from '../lib/companies'
import { eboardDetails } from '../data/eboardDetails'
import { expandTitle } from '../lib/titles'
import { initials } from '../lib/initials'
import { dateRange, duration, involvedSince, isCurrent } from '../lib/involvement'
import { projectSlug } from '../lib/projects'

// Resolves a member's social links, falling back to the club accounts when none are set.
function getSocialLinks(member) {
  const hasAnyCustom = Boolean(member.linkedin || member.instagram || member.github || member.email || member.website)
  const linkedinUrl = member.linkedin || (!hasAnyCustom ? "https://www.linkedin.com/company/stackhacks" : null)
  const instagramUrl = member.instagram || (!hasAnyCustom ? "https://www.instagram.com/stackhacksbu/?hl=en" : null)
  const githubUrl = member.github || (!hasAnyCustom ? "https://github.com/stackhacksbu" : null)
  const emailUrl = member.email
    ? (member.email.startsWith("mailto:") ? member.email : `mailto:${member.email}`)
    : (!hasAnyCustom ? "mailto:stackhacksbu@gmail.com" : null)
  const websiteUrl = member.website
    ? (member.website.startsWith("http") ? member.website : `https://${member.website}`)
    : null

  return [
    { href: linkedinUrl, label: "LinkedIn", Icon: Linkedin, external: true },
    { href: instagramUrl, label: "Instagram", Icon: Instagram, external: true },
    { href: githubUrl, label: "GitHub", Icon: Github, external: true },
    { href: emailUrl, label: "Email", Icon: Mail, external: false },
    { href: websiteUrl, label: "Website", Icon: Globe, external: true },
  ].filter((l) => l.href)
}

function SocialLinks({ member, size = "sm", className = "" }) {
  const box = size === "lg" ? "w-10 h-10 rounded-xl" : "w-9 h-9 rounded-lg"
  return (
    <div className={`flex items-center gap-2 ${className}`} onClick={(e) => e.stopPropagation()}>
      {getSocialLinks(member).map((link) => (
        <motion.a
          key={link.label}
          href={link.href}
          {...(link.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
          aria-label={`${member.name} ${link.label}`}
          whileHover={{ y: -3, rotate: -6, scale: 1.08 }}
          whileTap={{ scale: 0.92 }}
          transition={{ type: "spring", stiffness: 420, damping: 18 }}
          className={`${box} flex items-center justify-center border border-white/10 bg-white/[0.03] text-secondary transition-colors duration-300 hover:text-accent hover:border-accent/50 hover:bg-accent/10 hover:shadow-[0_8px_20px_-8px_rgba(254,178,58,0.7)]`}
        >
          <link.Icon className="w-4 h-4" />
        </motion.a>
      ))}
    </div>
  )
}

// Pinned members (pinFirst in the data file) lead; everyone else keeps the data-file order.
const orderMembers = (list) => [
  ...list.filter((m) => eboardDetails[m._id]?.pinFirst),
  ...list.filter((m) => !eboardDetails[m._id]?.pinFirst),
]
// Displayed title: the data file's displayTitle override, else the Sanity title (abbreviations spelled out)
const titleFor = (m) => expandTitle(eboardDetails[m._id]?.displayTitle || m.title || '')

const EMPTY = { education: null, externalExperience: [], involvement: [], highlights: [] }
// Structured details for a member, falling back to their raw bio if they have no entry yet.
const detailsFor = (m) => ({ ...EMPTY, ...(eboardDetails[m._id] || { education: m.description || null }) })
// Records flagged hidden (unconfirmed members) stay off the grid
const isHidden = (m) => eboardDetails[m._id]?.hidden === true

const pill =
  'inline-flex items-center gap-1.5 rounded-full border border-accent/40 bg-accent/[0.08] px-3 py-1 text-xs font-medium text-accent transition-colors hover:border-accent hover:bg-accent/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60'

/* ─────────────────────────── Detail card (modal / bottom sheet) ─────────────────────────── */

function InvolvementTimeline({ entries, onClose }) {
  return (
    <ol className="relative space-y-6 border-l border-accent/25 pl-6">
      {entries.map((e, i) => {
        const current = isCurrent(e)
        const range = dateRange(e)
        const length = duration(e)
        return (
          <li key={i} className="relative">
            <span
              aria-hidden="true"
              className={`absolute -left-[1.85rem] top-1.5 h-3 w-3 rounded-full border-2 ${
                current ? 'border-accent bg-accent shadow-[0_0_12px_rgba(254,178,58,0.9)]' : 'border-accent/60 bg-background'
              }`}
            />
            <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
              <h4 className="text-[15px] font-semibold leading-snug text-primary">{expandTitle(e.title)}</h4>
              {current && currentBadge}
            </div>
            {range && (
              <p className="mt-0.5 text-xs text-secondary">
                {range}
                {length && <span className="text-secondary/60"> · {length}</span>}
              </p>
            )}
            {Array.isArray(e.description) ? (
              <ul className="mt-2 list-disc space-y-1.5 pl-4 text-sm leading-relaxed text-secondary marker:text-accent/60">
                {e.description.map((line, k) => <li key={k}>{line}</li>)}
              </ul>
            ) : e.description ? (
              <p className="mt-2 text-sm leading-relaxed text-secondary">{e.description}</p>
            ) : null}
            {(e.skills?.length > 0 || e.project) && (
              <div className="mt-2.5 flex flex-wrap gap-1.5">
                {e.project && (
                  <Link to={`/projects#${projectSlug(e.project)}`} onClick={onClose} className={pill}>
                    {e.project} <ArrowUpRight className="h-3 w-3" />
                  </Link>
                )}
                {e.skills?.map((sk) => (
                  <span key={sk} className="rounded-full border border-accent/30 px-2.5 py-0.5 text-[11px] font-medium text-accent/90">{sk}</span>
                ))}
              </div>
            )}
          </li>
        )
      })}
    </ol>
  )
}

const currentBadge = (
  <span className="rounded-full border border-accent/50 bg-accent/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-accent">
    Current
  </span>
)

const byStartDesc = (a, b) => (b.start || '').localeCompare(a.start || '')

// Grouped roles share a title before the first comma ("Course Assistant, CS 110 …" -> "Course Assistant")
const groupRole = (roles) => {
  const heads = [...new Set(roles.map((r) => (r.role || '').split(',')[0].trim()))]
  return heads.length === 1 ? heads[0] : roles.map((r) => r.role).join(' · ')
}

/**
 * Previous / external experience, compact: one row per company with only the logo chip and the
 * role, newest first. Dates, location, descriptions and skills stay in the data file (hidden here).
 */
function PreviousExperience({ entries, logos }) {
  const groups = []
  entries.forEach((e) => {
    const g = e.parent && groups.find((x) => x.parent === e.parent)
    if (g) g.roles.push(e)
    else groups.push({ parent: e.parent || null, roles: [e] })
  })
  groups.forEach((g) => g.roles.sort(byStartDesc))
  groups.sort((a, b) => byStartDesc(a.roles[0], b.roles[0]))

  return (
    <section className="space-y-3 border-t border-white/[0.08] pt-6">
      <h3 className="text-[11px] font-semibold uppercase tracking-[0.25em] text-secondary">Previous Experience</h3>
      <ul className="space-y-2">
        {groups.map((g, i) => {
          const first = g.roles[0]
          const role = g.parent ? groupRole(g.roles) : first.role || first.company
          return (
            <li key={i} className="flex items-center gap-3">
              <CompanyChip entry={first} logos={logos} glow className="w-28 shrink-0" />
              <p className="min-w-0 text-sm leading-snug text-primary/90">{role}</p>
            </li>
          )
        })}
      </ul>
    </section>
  )
}

// Round header photo; initials stand in when there is no photo or it fails to load
function MemberAvatar({ member }) {
  const [broken, setBroken] = useState(false)
  const ring = "relative h-20 w-20 sm:h-28 sm:w-28 rounded-full ring-2 ring-accent/80 ring-offset-4 ring-offset-[#18181b]"
  return member.image && !broken ? (
    <img src={member.image} alt={member.name} onError={() => setBroken(true)} className={`${ring} object-cover object-[50%_25%]`} />
  ) : (
    <div role="img" aria-label={member.name} className={`${ring} flex items-center justify-center bg-accent/10 text-2xl sm:text-3xl font-semibold text-accent`}>
      {initials(member.name)}
    </div>
  )
}

function MemberDetail({ members, index, logos, origin, returnRef, onClose, onNavigate }) {
  const dialogRef = useRef(null)
  const closeRef = useRef(null)
  const titleId = useId()
  const reduce = useReducedMotion()
  const [sheet] = useState(() => window.matchMedia('(max-width: 639px)').matches)
  useDialog(dialogRef, onClose, closeRef, returnRef)

  const member = members[index]
  const d = detailsFor(member)
  const since = involvedSince(d.involvement)

  // Left/right arrows move between members (Escape and focus trapping come from useDialog)
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'ArrowRight') { e.preventDefault(); onNavigate(1) }
      if (e.key === 'ArrowLeft') { e.preventDefault(); onNavigate(-1) }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onNavigate])

  // Desktop: grows out of the clicked card. Phones: slides up as a bottom sheet.
  const enter = reduce
    ? { opacity: 0 }
    : sheet
      ? { y: '100%' }
      : { opacity: 0, scale: 0.35, x: origin?.x || 0, y: origin?.y || 0 }

  return createPortal(
    <motion.div
      className="fixed inset-0 z-[600] flex items-end sm:items-center justify-center sm:p-6 bg-black/70 backdrop-blur-md"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      onClick={onClose}
    >
      <motion.div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(e) => e.stopPropagation()}
        initial={enter}
        animate={{ opacity: 1, scale: 1, x: 0, y: 0 }}
        exit={enter}
        transition={{ duration: reduce ? 0.15 : 0.45, ease: [0.16, 1, 0.3, 1] }}
        className="relative flex w-full sm:max-w-2xl max-h-[88svh] flex-col overflow-hidden rounded-t-3xl sm:rounded-3xl border border-accent/30 bg-gradient-to-b from-[#18181b] to-[#0f0f11] shadow-[0_40px_100px_-30px_rgba(0,0,0,0.95),0_0_70px_-24px_rgba(254,178,58,0.55)]"
      >
        <div className="pointer-events-none absolute inset-x-10 top-0 z-20 h-px bg-gradient-to-r from-transparent via-accent to-transparent" />
        <CornerTraces show />

        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={member._id}
            initial={reduce ? false : { opacity: 0, x: 18 }}
            animate={{ opacity: 1, x: 0 }}
            exit={reduce ? undefined : { opacity: 0, x: -18 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="flex min-h-0 flex-1 flex-col"
          >
            {/* Header stays visible; the body below scrolls */}
            <header className="shrink-0 border-b border-white/[0.08] px-6 pb-5 pt-6 sm:px-9 sm:pt-8">
              {sheet && <div className="mx-auto -mt-2 mb-4 h-1 w-10 rounded-full bg-white/20" aria-hidden="true" />}
              <div className="flex items-center gap-4 sm:gap-5 pr-10">
                <div className="relative shrink-0">
                  <div className="absolute -inset-2 rounded-full bg-accent/25 blur-xl" />
                  <MemberAvatar member={member} />
                </div>
                <div className="min-w-0 space-y-1.5">
                  <h2 id={titleId} className="text-xl sm:text-3xl font-semibold text-primary">{member.name}</h2>
                  <p className="text-[11px] sm:text-xs font-semibold uppercase tracking-[0.2em] text-accent leading-relaxed">{titleFor(member)}</p>
                  {d.highlights.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {d.highlights.map((h) => <span key={h} className="rounded-full border border-white/15 px-2 py-0.5 text-[10px] font-medium text-secondary">{h}</span>)}
                    </div>
                  )}
                  <SocialLinks member={member} className="pt-1" />
                </div>
              </div>
            </header>

            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 py-7 sm:px-9 space-y-8">
              {/* Involvement at StackHacks: the main section */}
              <section className="space-y-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h3 className="text-xs font-semibold uppercase tracking-[0.28em] text-accent">Involvement at StackHacks</h3>
                  {since && (
                    <span className="inline-flex items-center gap-2 rounded-full border border-accent/35 bg-accent/[0.06] py-1 pl-1.5 pr-3 text-xs font-medium text-primary shadow-[0_0_16px_-6px_rgba(254,178,58,0.6)]">
                      <img src={SHTrans} alt="" className="h-5 w-5 object-contain" />
                      Involved since {since}
                    </span>
                  )}
                </div>
                {d.involvement.length ? (
                  <InvolvementTimeline entries={d.involvement} onClose={onClose} />
                ) : (
                  <p className="rounded-xl border border-dashed border-white/15 px-4 py-3 text-sm text-secondary/80">
                    Involvement details coming soon.
                  </p>
                )}
              </section>

              {/* Previous experience below involvement; hidden when there is none */}
              {d.externalExperience.length > 0 && <PreviousExperience entries={d.externalExperience} logos={logos} />}

              {d.education && <p className="text-sm text-secondary/70">{d.education}</p>}
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Prev / next */}
        <div className="shrink-0 z-30 flex items-center justify-between gap-3 border-t border-white/[0.08] bg-[#0f0f11]/95 px-6 py-3 sm:px-9">
          <button type="button" onClick={() => onNavigate(-1)} className="btn-icon !h-9 !w-9" aria-label="Previous member"><ArrowLeft className="h-4 w-4" /></button>
          <span className="text-xs tabular-nums tracking-[0.2em] text-secondary/70">{String(index + 1).padStart(2, '0')} / {String(members.length).padStart(2, '0')}</span>
          <button type="button" onClick={() => onNavigate(1)} className="btn-icon !h-9 !w-9" aria-label="Next member"><ArrowRight className="h-4 w-4" /></button>
        </div>

        <button
          ref={closeRef}
          onClick={onClose}
          type="button"
          aria-label="Close"
          className="absolute top-4 right-4 z-30 w-9 h-9 flex items-center justify-center rounded-full border border-white/15 bg-white/5 text-secondary hover:text-white hover:border-accent/50 transition-colors duration-200 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50"
        >
          <X className="w-4 h-4" />
        </button>
      </motion.div>
    </motion.div>,
    document.body
  )
}

/* ─────────────────────────── Board (Founders-style portrait cards) ─────────────────────────── */

function BoardCards({ members, onOpen, openIndex }) {
  // The first (pinned) member starts selected
  const [active, setActive] = useState(0)
  const [hovered, setHovered] = useState(null)
  const reduce = useReducedMotion()
  const rowRef = useRef(null)
  const cardRefs = useRef([])
  const selected = openIndex ?? active

  // Phones: keep the selected card centred in the scroll row (horizontal only)
  useEffect(() => {
    const row = rowRef.current
    const card = cardRefs.current[selected]
    if (!row || !card || row.scrollWidth <= row.clientWidth) return
    row.scrollTo({ left: card.offsetLeft - (row.clientWidth - card.offsetWidth) / 2, behavior: reduce ? 'auto' : 'smooth' })
  }, [selected, reduce])

  const focusCard = (i) => {
    const n = (i + members.length) % members.length
    setActive(n)
    cardRefs.current[n]?.focus()
  }

  return (
    <div
      ref={rowRef}
      onMouseLeave={() => setHovered(null)}
      className="-mx-6 px-[calc((100vw-min(64vw,260px))/2)] flex gap-5 overflow-x-auto snap-x snap-mandatory py-8 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden [perspective:1200px]
                 sm:mx-0 sm:px-0 sm:flex-wrap sm:justify-center sm:overflow-visible sm:snap-none sm:py-4 lg:gap-6"
    >
      {members.map((m, i) => (
        <PortraitCard
          key={m._id}
          name={m.name}
          title={titleFor(m)}
          image={m.image}
          isActive={i === selected}
          isHovered={i === hovered}
          anyHovered={hovered !== null}
          reduce={reduce}
          onClick={(e) => { setActive(i); onOpen(i, e.currentTarget, cardRefs) }}
          onHover={() => setHovered(i)}
          cardRef={(el) => { cardRefs.current[i] = el }}
          widthClass="w-[64vw] max-w-[260px] sm:w-[calc((100%-2.5rem)/3)] sm:max-w-none lg:w-[calc((100%-4.5rem)/4)]"
          buttonProps={{
            'aria-label': `${m.name}, ${titleFor(m)}. Open experience and involvement`,
            'aria-haspopup': 'dialog',
            onFocus: () => setActive(i),
            onKeyDown: (e) => {
              if (e.key === 'ArrowRight') { e.preventDefault(); focusCard(i + 1) }
              if (e.key === 'ArrowLeft') { e.preventDefault(); focusCard(i - 1) }
            },
          }}
        />
      ))}
    </div>
  )
}

const Eboard = () => {
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)
  const [logos, setLogos] = useState({})
  const [open, setOpen] = useState(null) // { index, origin }
  const cardRefsRef = useRef(null)
  const returnRef = useRef(null)
  const ordered = useMemo(() => orderMembers(members.filter((m) => !isHidden(m))), [members])

  const close = useCallback(() => setOpen(null), [])
  const navigate = useCallback((dir) => setOpen((o) => {
    if (!o) return o
    const index = (o.index + dir + ordered.length) % ordered.length
    returnRef.current = cardRefsRef.current?.current[index] || returnRef.current // focus returns to this member's card
    return { ...o, index }
  }), [ordered.length])

  const openMember = useCallback((index, cardEl, cardRefs) => {
    cardRefsRef.current = cardRefs
    returnRef.current = cardEl
    const r = cardEl.getBoundingClientRect()
    setOpen({ index, origin: { x: r.left + r.width / 2 - window.innerWidth / 2, y: r.top + r.height / 2 - window.innerHeight / 2 } })
  }, [])

  useEffect(() => {
    const fetchMembers = async () => {
      try {
        const data = await client.fetch(`*[_type == "eboard"] | order(defined(position) desc, position asc, _createdAt asc) {
          _id, name, title, description, position,
          linkedin, instagram, github, email, website,
          "image": image.asset->url,
        }`)
        setMembers(data || [])
      } catch (e) {
        console.error("Failed to fetch eboard from Sanity: ", e)
        setLoadError(true)
      } finally {
        setLoading(false)
      }
    }
    fetchMembers()
    // Logos come from the same company list as the "Our Professional Experience" strip
    fetchCompanies().then((c) => setLogos(logoMap(c))).catch(() => {})
  }, [])

  return (
    <div
      data-circuit-section
      className="headings-bold screen-section w-full max-w-6xl mx-auto px-6"
      style={{ paddingTop: 'clamp(56px, 10svh, 120px)' }}
    >
      <Reveal className="text-center max-w-2xl mx-auto mb-10 space-y-3">
        <span className="eyebrow">Leadership Team</span>
        <h1 className="page-title text-primary">
          Meet the <span className="bg-gradient-to-b from-[#ffe2a8] to-accent bg-clip-text text-transparent">Executive Board</span>
        </h1>
        <p className="text-secondary text-base leading-relaxed">
          Meet the student engineers and organizers driving technical tracks, hackathon initiatives, and community mentorship at Binghamton University.
        </p>
      </Reveal>

      {loading ? (
        <div className="text-center text-secondary/50 py-20">Loading Executive Board...</div>
      ) : ordered.length > 0 ? (
        <Reveal>
          <BoardCards members={ordered} onOpen={openMember} openIndex={open?.index ?? null} />
        </Reveal>
      ) : loadError ? (
        <LoadError what="the Executive Board" className="my-10" />
      ) : (
        <div className="text-center text-secondary/50 py-20">No eboard members found.</div>
      )}

      <AnimatePresence>
        {open && ordered[open.index] && (
          <MemberDetail
            members={ordered}
            index={open.index}
            logos={logos}
            origin={open.origin}
            returnRef={returnRef}
            onClose={close}
            onNavigate={navigate}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

export default Eboard
