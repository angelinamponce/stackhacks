import { useRef, useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import Hero from '../components/Hero'
import RadialOrbitalTimeline from '../components/Radial-orbital-timeline'
import { icons, ArrowRight, Code } from 'lucide-react'
import Constellation from '../components/Constellation'
import OSWindow from '../components/os/OSWindow'
import GradientBanner from '../components/os/GradientBanner'
import Taskbar from '../components/os/Taskbar'
import { Reveal } from '../components/Interactive'
import { client } from '../sanityClient'
import LoadError from '../components/LoadError'

// Smart dynamic icon resolver: access ANY Lucide icon by name without manual imports
const getTrackIcon = (name) => {
  if (!name) return Code
  if (name === 'Code2') return icons.CodeXml || Code
  return icons[name] || Code
}

function Home() {
  const heroRef = useRef(null)
  const [tracks, setTracks] = useState([])
  const [loadingTracks, setLoadingTracks] = useState(true)
  const [tracksError, setTracksError] = useState(false)

  useEffect(() => {
    const fetchTracks = async () => {
      try {
        const query = `*[_type == "projectTrack"] | order(order asc, _createdAt asc) {
          _id,
          title,
          orbitLabel,
          icon,
          content,
          order,
          "relatedIds": relatedTracks[]->._id
        }`
        const data = await client.fetch(query)
        if (data && data.length > 0) {
          const formatted = data.map((track, idx) => ({
            id: track._id || idx + 1,
            title: track.title,
            orbitLabel: track.orbitLabel || track.title,
            icon: getTrackIcon(track.icon),
            content: track.content || '',
            relatedIds: track.relatedIds ? track.relatedIds.filter(Boolean) : [],
          }))
          setTracks(formatted)
        } else {
          setTracks([])
        }
      } catch (err) {
        console.error('Failed to fetch project tracks from Sanity:', err)
        setTracksError(true)
      } finally {
        setLoadingTracks(false)
      }
    }

    fetchTracks()
  }, [])

  return (
    <div className="relative min-h-screen">
      <Constellation />
      
      <div className="relative z-10 text-primary">
        <div ref={heroRef}>
          <Hero />
        </div>

        {/* Get Involved Section (first section in the 2026-2027 OS design language) */}
        <section className="screen-section px-4 sm:px-6 max-w-5xl mx-auto">
          <OSWindow
            tab="StackHacks / Community"
            title="join_the_community.exe"
            footer={<Taskbar />}
            bodyClassName="px-6 py-16 sm:px-14 sm:py-20 text-center space-y-7"
          >
            <GradientBanner size="sm">2026 - 2027</GradientBanner>

            <Reveal as="h2" className="display-heading text-3xl sm:text-5xl lg:text-6xl">
              Built for creators, hackers, and leaders.
            </Reveal>

            <p className="mx-auto max-w-2xl text-base sm:text-lg text-secondary leading-relaxed">
              We are a project-oriented engineering collective where you collaborate on real production code, learn high-demand tech stacks, and network with driven peers.
            </p>

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/events" className="btn-primary">
                <span>View Upcoming Events</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link to="/projects" className="btn-secondary">
                <span>Explore Projects</span>
              </Link>
            </div>
          </OSWindow>
        </section>

        {/* Project Teams / Tracks Section */}
        <section className="screen-section px-6 border-t border-white/[0.08]">
          <div className="mx-auto max-w-5xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="mb-10 text-center space-y-2"
            >
              <p className="text-xs sm:text-sm font-semibold tracking-wider uppercase text-accent">
                Focus Tracks
              </p>
              <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight text-primary">
                Active Project Teams
              </h2>
              <p className="mx-auto max-w-lg text-sm sm:text-base text-secondary leading-relaxed">
                Explore our current tracks. Select any orbital node to inspect goals, technologies, and active projects.
              </p>
            </motion.div>

            {tracks.length > 0 ? (
              <RadialOrbitalTimeline timelineData={tracks} />
            ) : tracksError ? (
              <LoadError what="the project tracks" className="my-10" />
            ) : loadingTracks ? (
              <div className="py-24 text-center text-sm text-secondary/60">
                Loading active tracks...
              </div>
            ) : (
              <div className="py-24 text-center text-sm text-secondary/50">
                No active project tracks published yet.
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  )
}

export default Home
