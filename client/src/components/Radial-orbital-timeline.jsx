'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowRight, Link2 } from 'lucide-react'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from './Card'

const ORBIT_RADIUS_PX = 165
const ROTATION_ANIM_MS = 520

function shortestDeltaDeg(from, toDeg) {
  const a = ((from % 360) + 360) % 360
  const b = ((toDeg % 360) + 360) % 360
  let d = b - a
  if (d > 180) d -= 360
  if (d < -180) d += 360
  return d
}

export default function RadialOrbitalTimeline({ timelineData }) {
  const [expandedItems, setExpandedItems] = useState({})
  const [rotationAngle, setRotationAngle] = useState(0)
  const [autoRotate, setAutoRotate] = useState(true)
  const [pulseEffect, setPulseEffect] = useState({})
  const [activeNodeId, setActiveNodeId] = useState(null)

  const containerRef = useRef(null)
  const orbitRef = useRef(null)
  const nodeRefs = useRef({})
  const rotationAngleRef = useRef(0)
  const rotationAnimFrameRef = useRef(null)

  useEffect(() => {
    rotationAngleRef.current = rotationAngle
  }, [rotationAngle])

  const cancelRotationAnimation = useCallback(() => {
    if (rotationAnimFrameRef.current != null) {
      cancelAnimationFrame(rotationAnimFrameRef.current)
      rotationAnimFrameRef.current = null
    }
  }, [])

  const animateRotationTo = useCallback(
    (goalDeg) => {
      cancelRotationAnimation()
      const start = rotationAngleRef.current
      const delta = shortestDeltaDeg(start, goalDeg)
      const duration = ROTATION_ANIM_MS
      let t0 = null

      const tick = (now) => {
        if (t0 == null) t0 = now
        const u = Math.min(1, (now - t0) / duration)
        const eased = 1 - (1 - u) ** 3
        const next = start + delta * eased
        setRotationAngle(next)
        if (u < 1) {
          rotationAnimFrameRef.current = requestAnimationFrame(tick)
        } else {
          rotationAnimFrameRef.current = null
          setRotationAngle(start + delta)
        }
      }
      rotationAnimFrameRef.current = requestAnimationFrame(tick)
    },
    [cancelRotationAnimation]
  )

  const handleContainerClick = (e) => {
    if (e.target === containerRef.current || e.target === orbitRef.current) {
      cancelRotationAnimation()
      setExpandedItems({})
      setActiveNodeId(null)
      setPulseEffect({})
      setAutoRotate(true)
    }
  }

  const getRelatedItems = (itemId) => {
    const currentItem = timelineData.find((item) => item.id === itemId)
    return currentItem ? currentItem.relatedIds : []
  }

  const centerViewOnNode = useCallback(
    (nodeId) => {
      if (!nodeRefs.current[nodeId]) return

      const nodeIndex = timelineData.findIndex((item) => item.id === nodeId)
      const totalNodes = timelineData.length
      const targetAngle = (nodeIndex / totalNodes) * 360
      const goal = 270 - targetAngle
      animateRotationTo(goal)
    },
    [timelineData, animateRotationTo]
  )

  const toggleItem = (id) => {
    setExpandedItems((prev) => {
      const newState = { ...prev }

      Object.keys(newState).forEach((key) => {
        if (key !== String(id)) {
          newState[key] = false
        }
      })

      newState[id] = !prev[id]

      if (!prev[id]) {
        setActiveNodeId(id)
        setAutoRotate(false)

        const relatedItems = getRelatedItems(id)
        const newPulse = {}
        relatedItems.forEach((relId) => {
          newPulse[relId] = true
        })
        setPulseEffect(newPulse)

        centerViewOnNode(id)
      } else {
        setActiveNodeId(null)
        setAutoRotate(true)
        setPulseEffect({})
      }

      return newState
    })
  }

  useEffect(() => {
    let rotationTimer

    if (autoRotate) {
      rotationTimer = setInterval(() => {
        setRotationAngle((prev) => (prev + 0.25) % 360)
      }, 50)
    }

    return () => {
      clearInterval(rotationTimer)
    }
  }, [autoRotate])

  useEffect(() => () => cancelRotationAnimation(), [cancelRotationAnimation])

  const calculateNodePosition = (index, total) => {
    const angle = ((index / total) * 360 + rotationAngle) % 360
    const radian = (angle * Math.PI) / 180

    const x = ORBIT_RADIUS_PX * Math.cos(radian)
    const y = ORBIT_RADIUS_PX * Math.sin(radian)

    const zIndex = Math.round(100 + 50 * Math.cos(radian))
    const depth = (1 + Math.sin(radian)) / 2
    const opacity = 0.65 + 0.35 * depth

    return { x, y, zIndex, opacity }
  }

  const isRelatedToActive = (itemId) => {
    if (!activeNodeId) return false
    return getRelatedItems(activeNodeId).includes(itemId)
  }

  const openItem =
    activeNodeId != null && expandedItems[activeNodeId]
      ? timelineData.find((i) => i.id === activeNodeId)
      : null

  const orbitDiameter = ORBIT_RADIUS_PX * 2

  return (
    <div
      data-circuit-avoid
      className="flex min-h-[450px] w-full items-center justify-center overflow-visible bg-background py-6 sm:py-8"
      ref={containerRef}
      onClick={handleContainerClick}
    >
      <div className="relative h-[410px] w-full max-w-2xl overflow-visible sm:h-[430px]">
        <div
          className="absolute inset-0 flex items-center justify-center overflow-visible"
          ref={orbitRef}
        >
          {/* Faint concentric rings (center depth) */}
          <div
            className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-accent/[0.07]"
            style={{ width: orbitDiameter + 120, height: orbitDiameter + 120 }}
          />
          <div
            className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-accent/[0.11]"
            style={{ width: orbitDiameter + 56, height: orbitDiameter + 56 }}
          />
          <div
            className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-accent/[0.16]"
            style={{ width: orbitDiameter + 8, height: orbitDiameter + 8 }}
          />

          {/* Orbit path */}
          <div
            className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-accent/45 shadow-[0_0_28px_rgba(254,178,58,0.08)]"
            style={{ width: orbitDiameter, height: orbitDiameter }}
          />

          {timelineData.map((item, index) => {
            const position = calculateNodePosition(index, timelineData.length)
            const isExpanded = expandedItems[item.id]
            const isRelated = isRelatedToActive(item.id)
            const isPulsing = Boolean(pulseEffect[item.id])
            const Icon = item.icon
            const caption = item.orbitLabel ?? item.title

            return (
              <div
                key={item.id}
                ref={(el) => {
                  nodeRefs.current[item.id] = el
                }}
                className="absolute flex flex-col items-center transition-opacity duration-300 ease-out"
                style={{
                  left: `calc(50% + ${position.x}px)`,
                  top: `calc(50% + ${position.y}px)`,
                  transform: 'translate(-50%, -50%)',
                  zIndex: isExpanded ? 200 : position.zIndex,
                  opacity: isExpanded ? 1 : position.opacity,
                }}
              >
                <button
                  type="button"
                  className="group flex cursor-pointer flex-col items-center gap-2 border-0 bg-transparent p-0 text-left transition-transform duration-300 ease-out focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/70 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                  onClick={(e) => {
                    e.stopPropagation()
                    toggleItem(item.id)
                  }}
                >
                  <div
                    className={`flex h-14 w-14 sm:h-15 sm:w-15 items-center justify-center rounded-full border-2 border-accent/60 bg-background/70 text-accent shadow-[0_0_24px_rgba(254,178,58,0.32)] backdrop-blur-md transition-[box-shadow,border-color,transform] duration-300 ease-out group-hover:scale-110 group-hover:border-accent group-hover:shadow-[0_0_36px_rgba(254,178,58,0.5)] ${
                      isPulsing ? 'animate-pulse ring-2 ring-accent/60' : ''
                    } ${isRelated && !isExpanded ? 'ring-2 ring-accent/50' : ''} ${isExpanded ? 'scale-110 border-accent shadow-[0_0_40px_rgba(254,178,58,0.55)]' : ''}`}
                  >
                    <Icon className="text-accent" size={22} strokeWidth={1.5} />
                  </div>
                  <span className="max-w-[7.5rem] text-center text-xs sm:text-[13px] font-semibold tracking-wide text-accent/90">
                    {caption}
                  </span>
                </button>
              </div>
            )
          })}

          {/* Detail card: fixed in the middle of the orbit (does not follow the picked node). */}
          {openItem ? (
            <div
              role="dialog"
              aria-label={openItem.title}
              className="pointer-events-auto absolute left-1/2 top-1/2 z-[300] w-64 max-w-[85vw] sm:w-72"
              style={{ transform: 'translate(-50%, calc(-50% + 4.5rem))' }}
              onClick={(e) => e.stopPropagation()}
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={openItem.id}
                  className="w-full"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                >
                  <Card className="w-full rounded-xl border border-accent/35 bg-black text-primary shadow-[0_12px_48px_rgba(0,0,0,0.55),0_0_0_1px_rgba(254,178,58,0.06)]">
                  <CardHeader className="space-y-1 pb-0">
                    <CardTitle className="text-xl font-bold tracking-tight text-white">{openItem.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-0 pt-4">
                    <p className="text-sm leading-relaxed text-secondary">{openItem.content}</p>
                  </CardContent>
                  <CardFooter className="mt-0 flex flex-col items-stretch gap-3 border-t border-white/10 pt-4">
                    {openItem.relatedIds?.length ? (
                      <>
                        <div className="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-secondary">
                          <Link2 className="h-3 w-3 shrink-0 opacity-70" aria-hidden />
                          Connected nodes
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {openItem.relatedIds.map((relatedId) => {
                            const related = timelineData.find((n) => n.id === relatedId)
                            if (!related) return null
                            const label = related.orbitLabel ?? related.title
                            return (
                              <button
                                key={relatedId}
                                type="button"
                                className="inline-flex items-center gap-1 rounded border border-accent/35 bg-transparent px-2.5 py-1.5 text-xs font-medium text-accent/95 transition hover:border-accent/55 hover:bg-accent/5"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  toggleItem(relatedId)
                                }}
                              >
                                {label}
                                <ArrowRight className="h-3 w-3 opacity-60" aria-hidden />
                              </button>
                            )
                          })}
                        </div>
                      </>
                    ) : null}
                    <Link
                      to="/projects"
                      className="inline-flex items-center gap-1 text-sm font-medium text-accent transition hover:brightness-125"
                      onClick={(e) => e.stopPropagation()}
                    >
                      View all projects
                      <ArrowRight className="h-3.5 w-3.5 opacity-80" aria-hidden />
                    </Link>
                  </CardFooter>
                  </Card>
                </motion.div>
              </AnimatePresence>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}
