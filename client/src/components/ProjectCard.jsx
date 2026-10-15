import { useId, useRef } from "react"
import { createPortal } from "react-dom"
import { motion } from "framer-motion"
import { ArrowUpRight, Code2, ExternalLink, Github, X } from "lucide-react"
import { spotlightHandlers } from "../lib/pointer"
import { useDialog } from "../lib/dialog"
import { projectTrack } from "../lib/projects"

const splitSections = (sections = []) => ({
  about: sections.find((s) => /about/i.test(s.heading || ""))?.body,
  team: sections.filter((s) => /team/i.test(s.heading || "")),
  other: sections.filter((s) => !/about|team/i.test(s.heading || "")),
})

// Logos and screenshots vary in shape, so images are contained (never cropped) on a dark stage.
function Cover({ project, className = "" }) {
  return project.image ? (
    <img
      src={project.image}
      alt=""
      loading="lazy"
      decoding="async"
      className={`h-full w-full object-contain ${className}`}
    />
  ) : (
    <div className="flex h-full w-full items-center justify-center">
      <Code2 className="h-12 w-12 text-accent/50" />
    </div>
  )
}

function Tags({ project, details }) {
  const track = projectTrack(project)
  const tags = [track, ...(details?.techStack || [])].filter(Boolean)
  if (!tags.length) return null
  return (
    <ul className="flex flex-wrap gap-1.5">
      {tags.map((tag, i) => (
        <li
          key={tag}
          className={`rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${
            i === 0 && track ? "border-accent/40 text-accent" : "border-white/15 text-secondary"
          }`}
        >
          {tag}
        </li>
      ))}
    </ul>
  )
}

function Links({ details, size = "sm" }) {
  if (!details?.liveUrl && !details?.githubUrl) return null
  const cls =
    size === "sm"
      ? "inline-flex items-center gap-1.5 rounded-lg border border-white/15 px-3 py-1.5 text-xs font-medium text-primary transition-colors hover:border-accent/60 hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50"
      : null
  return (
    <div className="flex flex-wrap items-center gap-2">
      {details.liveUrl && (
        <a href={details.liveUrl} target="_blank" rel="noopener noreferrer" className={cls || "btn-primary"}>
          <ExternalLink className="h-3.5 w-3.5" /> Live
        </a>
      )}
      {details.githubUrl && (
        <a href={details.githubUrl} target="_blank" rel="noopener noreferrer" className={cls || "btn-secondary"}>
          <Github className="h-3.5 w-3.5" /> GitHub
        </a>
      )}
    </div>
  )
}

/* ─────────────────────────── Modal ─────────────────────────── */

export function ProjectModal({ project, details = {}, onClose }) {
  const dialogRef = useRef(null)
  const closeRef = useRef(null)
  const titleId = useId()
  useDialog(dialogRef, onClose, closeRef)

  const { about, team, other } = splitSections(project.sections)

  return createPortal(
    <motion.div
      className="fixed inset-0 z-[600] flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      onClick={onClose}
    >
      <motion.div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(e) => e.stopPropagation()}
        initial={{ opacity: 0, scale: 0.96, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.97, y: 12 }}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        className="relative w-full max-w-3xl max-h-[88vh] overflow-y-auto overscroll-contain rounded-3xl border border-white/10 bg-gradient-to-b from-[#18181b] to-[#111113] shadow-[0_40px_100px_-30px_rgba(0,0,0,0.9),0_0_60px_-30px_rgba(254,178,58,0.5)]"
      >
        <div className="pointer-events-none absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-accent/70 to-transparent" />

        <div className="m-4 sm:m-6 aspect-[16/9] overflow-hidden rounded-2xl border border-white/10 bg-black p-6">
          <Cover project={project} />
        </div>

        <div className="space-y-6 px-5 pb-8 sm:px-8 sm:pb-10">
          <div className="space-y-2">
            {project.date && (
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">{project.date}</p>
            )}
            <h2 id={titleId} className="text-2xl sm:text-3xl font-semibold tracking-tight text-primary">
              {project.title}
            </h2>
          </div>

          <Tags project={project} details={details} />

          {about && <p className="text-base leading-relaxed text-secondary">{about}</p>}

          {other.map((s, i) => (
            <div key={i} className="space-y-1.5">
              <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">{s.heading}</h3>
              <p className="text-sm leading-relaxed text-secondary">{s.body}</p>
            </div>
          ))}

          {team.length > 0 && (
            <dl className="grid gap-5 border-t border-white/[0.08] pt-6 sm:grid-cols-2">
              {team.map((s, i) => (
                <div key={i} className="space-y-1.5">
                  <dt className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">{s.heading}</dt>
                  <dd className="text-sm leading-relaxed text-primary">{s.body?.trim()}</dd>
                </div>
              ))}
            </dl>
          )}

          <Links details={details} size="lg" />
        </div>

        <button
          ref={closeRef}
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute top-6 right-6 sm:top-8 sm:right-8 w-9 h-9 flex items-center justify-center rounded-full border border-white/15 bg-black/60 backdrop-blur text-secondary hover:text-white hover:border-accent/50 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50"
        >
          <X className="w-4 h-4" />
        </button>
      </motion.div>
    </motion.div>,
    document.body
  )
}

/* ─────────────────────────── Card ─────────────────────────── */

export default function ProjectCard({ project, details, featured = false, onOpen }) {
  const { about } = splitSections(project.sections)

  return (
    <article
      {...spotlightHandlers}
      className={`group spotlight spotlight-border relative flex h-full overflow-hidden rounded-3xl border border-white/[0.08] bg-gradient-to-b from-[#18181b] to-[#111113]
        shadow-[0_1px_0_rgba(255,255,255,0.06)_inset,0_30px_60px_-30px_rgba(0,0,0,0.8)]
        transition-[translate,box-shadow,border-color] duration-500 ease-out hover:-translate-y-1 hover:border-white/15
        hover:shadow-[0_1px_0_rgba(255,255,255,0.06)_inset,0_30px_60px_-24px_rgba(0,0,0,0.9),0_0_40px_-16px_rgba(254,178,58,0.45)]
        ${featured ? "flex-col md:flex-row" : "flex-col"}`}
    >
      {/* Image */}
      <div
        className={`relative shrink-0 overflow-hidden bg-black ${
          featured ? "aspect-[16/10] md:aspect-auto md:w-1/2 md:min-h-80 border-b md:border-b-0 md:border-r" : "aspect-[16/10] border-b"
        } border-white/[0.06]`}
      >
        <div className="absolute inset-0 p-6 sm:p-8">
          <Cover project={project} className="transition-transform duration-700 ease-out group-hover:scale-[1.04]" />
        </div>
      </div>

      {/* Body */}
      <div className={`flex flex-1 flex-col gap-3 p-6 sm:p-7 ${featured ? "md:justify-center" : ""}`}>
        {project.date && (
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-accent">{project.date}</p>
        )}
        <h3 className={`font-semibold leading-snug text-primary ${featured ? "text-2xl" : "text-xl"}`}>{project.title}</h3>
        {about && (
          <p className={`text-sm leading-relaxed text-secondary ${featured ? "line-clamp-2" : "line-clamp-1"}`}>{about}</p>
        )}
        <div className="pt-1">
          <Tags project={project} details={details} />
        </div>

        {/* Links + details affordance, pinned to the bottom */}
        <div className="relative z-10 mt-auto flex items-center justify-between gap-3 pt-4">
          <Links details={details} />
          <span className="pointer-events-none ml-auto inline-flex items-center gap-1 text-xs font-medium text-secondary transition-colors group-hover:text-accent">
            Details <ArrowUpRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
          </span>
        </div>
      </div>

      {/* Whole card opens the details modal; links above stay clickable */}
      <button
        type="button"
        onClick={onOpen}
        aria-label={`Open ${project.title} details`}
        className="absolute inset-0 z-0 cursor-pointer rounded-3xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent/60"
      />
    </article>
  )
}
