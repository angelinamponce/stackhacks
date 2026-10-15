import { useCallback, useEffect, useMemo, useState } from 'react'
import { AnimatePresence, LayoutGroup, motion, useReducedMotion } from 'framer-motion'
import ProjectCard, { ProjectModal } from '../components/ProjectCard'
import { Reveal } from '../components/Interactive'
import { client } from '../sanityClient'
import { projectDetails } from '../data/projectDetails'
import { projectSlug, projectTrack } from '../lib/projects'
import { useLocation } from 'react-router-dom'
import LoadError from '../components/LoadError'

const ALL = 'All'

function FilterPills({ options, active, onSelect }) {
  return (
    <div role="group" aria-label="Filter projects by track" className="flex flex-wrap justify-center gap-2">
      {options.map((name) => {
        const isActive = name === active
        return (
          <button
            key={name}
            type="button"
            onClick={() => onSelect(name)}
            aria-pressed={isActive}
            className={`relative isolate rounded-full px-4 py-2 text-sm font-medium transition-colors duration-300 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60 ${
              isActive ? 'text-black' : 'border border-white/15 text-secondary hover:border-white/30 hover:text-primary'
            }`}
          >
            {isActive && (
              <motion.span
                layoutId="project-filter-pill"
                className="absolute inset-0 -z-10 rounded-full bg-accent shadow-[0_0_20px_-4px_rgba(254,178,58,0.7)]"
                transition={{ type: 'spring', stiffness: 400, damping: 34 }}
              />
            )}
            {name}
          </button>
        )
      })}
    </div>
  )
}

const Projects = () => {
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)
  const [selectedProject, setSelectedProject] = useState(null)
  const [filter, setFilter] = useState(ALL)
  const reduce = useReducedMotion()
  const closeModal = useCallback(() => setSelectedProject(null), [])
  const { hash } = useLocation()

  // Deep links (e.g. from an E-Board involvement pill): scroll to that project card and highlight it
  useEffect(() => {
    if (loading || !hash) return
    const el = document.getElementById(hash.slice(1))
    if (!el) return
    const t = setTimeout(() => {
      el.scrollIntoView({ block: 'center', behavior: reduce ? 'auto' : 'smooth' })
      el.setAttribute('data-highlight', '')
      setTimeout(() => el.removeAttribute('data-highlight'), 2400)
    }, 300)
    return () => clearTimeout(t)
  }, [loading, hash, reduce])

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const query = `*[_type == "project"] | order(_createdAt asc) {
          _id,
          title,
          date,
          description,
          "image": image.asset->url,
          sections
        }`

        const data = await client.fetch(query)
        setProjects(data || [])
      } catch (e) {
        console.error("Failed to fetch projects from Sanity: ", e)
        setLoadError(true)
      } finally {
        setLoading(false)
      }
    }

    fetchProjects()
  }, [])

  const filters = useMemo(
    () => [ALL, ...new Set(projects.map(projectTrack).filter(Boolean))],
    [projects]
  )

  const visible = filter === ALL ? projects : projects.filter((p) => projectTrack(p) === filter)
  // 2-column grid; an odd count makes the first card full width, so no card is left alone on a row
  const featureFirst = visible.length % 2 === 1

  return (
    <div data-circuit-section className="screen-section w-full max-w-6xl mx-auto px-6">
      <Reveal className="text-center max-w-2xl mx-auto mb-10 space-y-4">
        <span className="eyebrow">Showcase</span>
        <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight text-primary">Member Projects</h1>
        <p className="text-secondary text-base sm:text-lg leading-relaxed">
          Real-world applications, tools, and platforms engineered by StackHacks project teams throughout the academic year.
        </p>
      </Reveal>

      {loading ? (
        <div className="py-16 text-center text-secondary/50">Loading projects...</div>
      ) : projects.length > 0 ? (
        <div className="space-y-10">
          {filters.length > 2 && <FilterPills options={filters} active={filter} onSelect={setFilter} />}

          <LayoutGroup>
            <motion.ul layout={!reduce} className="grid grid-cols-1 md:grid-cols-2 md:auto-rows-fr gap-6 lg:gap-8">
              <AnimatePresence mode="popLayout" initial={false}>
                {visible.map((project, i) => {
                  const featured = featureFirst && i === 0
                  return (
                    <motion.li
                      key={project._id}
                      id={projectSlug(project.title)}
                      layout={!reduce}
                      initial={{ opacity: 0, scale: 0.97 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.97 }}
                      transition={reduce ? { duration: 0 } : { duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                      className={featured ? 'md:col-span-2' : ''}
                    >
                      <Reveal delay={(i % 2) * 0.1} className="h-full">
                        <ProjectCard
                          project={project}
                          details={projectDetails[project._id]}
                          featured={featured}
                          onOpen={() => setSelectedProject(project)}
                        />
                      </Reveal>
                    </motion.li>
                  )
                })}
              </AnimatePresence>
            </motion.ul>
          </LayoutGroup>
        </div>
      ) : loadError ? (
        <LoadError what="the projects" className="my-10" />
      ) : (
        <div className="py-16 text-center text-secondary/50">
          No projects found. Check back soon for new project releases!
        </div>
      )}

      <AnimatePresence>
        {selectedProject && (
          <ProjectModal
            project={selectedProject}
            details={projectDetails[selectedProject._id]}
            onClose={closeModal}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

export default Projects
