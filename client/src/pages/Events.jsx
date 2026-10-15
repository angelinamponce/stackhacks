import React, { useEffect, useState, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { client } from '../sanityClient'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight, Clock, MapPin, ExternalLink, Calendar as CalendarIcon, X } from 'lucide-react'
import LoadError from '../components/LoadError'

const DAYS_OF_WEEK = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
]

function EventDetailModal({ event, onClose }) {
  useEffect(() => {
    const handleKey = (e) => e.key === "Escape" && onClose()
    document.addEventListener("keydown", handleKey)
    document.body.style.overflow = "hidden"
    return () => {
      document.removeEventListener("keydown", handleKey)
      document.body.style.overflow = ""
    }
  }, [onClose])

  const eventDate = event.date ? new Date(event.date) : null

  return createPortal(
    <motion.div
      className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      onClick={onClose}
    >
      <motion.div
        className="relative bg-[#141416] border border-white/15 flex flex-col md:flex-row rounded-2xl shadow-2xl w-full max-w-4xl h-auto max-h-[90vh] md:h-[560px] overflow-y-auto md:overflow-hidden"
        initial={{ opacity: 0, scale: 0.94, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 16 }}
        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Left Column: Enlarged container displaying full image prominently on both mobile and desktop */}
        {event.image && (
          <div className="w-full md:w-1/2 shrink-0 flex items-center justify-center p-4 sm:p-6 bg-black/40 border-b md:border-b-0 md:border-r border-white/10">
            <div className="w-full h-64 sm:h-80 md:h-full flex items-center justify-center rounded-xl bg-black/50 border border-white/10 p-2 overflow-hidden shadow-inner">
              <img
                src={event.image}
                alt={event.title}
                className="w-full h-full object-contain drop-shadow-md"
              />
            </div>
          </div>
        )}

        {/* Right Column: Event Details - dynamically sized on mobile, fixed height on desktop */}
        <div className={`${event.image ? 'md:w-1/2' : 'w-full'} w-full p-5 sm:p-6 md:p-8 flex flex-col md:justify-between md:h-full md:overflow-hidden`}>
          {/* Top section: Title and Metadata */}
          <div className="shrink-0 space-y-2.5 sm:space-y-3">
            <div>
              <span className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-accent">
                Event Details
              </span>
              <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-primary mt-0.5 leading-snug">
                {event.title}
              </h2>
            </div>

            {eventDate && !isNaN(eventDate.getTime()) && (
              <div className="space-y-1.5 sm:space-y-2 py-2 sm:py-3 border-y border-white/[0.08] text-xs sm:text-sm text-secondary">
                <div className="flex items-center gap-2">
                  <CalendarIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-accent shrink-0" />
                  <span>
                    {eventDate.toLocaleDateString('en-US', {
                      weekday: 'long',
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-accent shrink-0" />
                  <span>
                    {eventDate.toLocaleTimeString('en-US', {
                      hour: 'numeric',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-accent shrink-0" />
                  <span>{event.location || "Binghamton University \u00B7 Main Campus"}</span>
                </div>
              </div>
            )}
          </div>

          {/* Middle section: Description with natural height on mobile, dedicated scrollbar on desktop */}
          <div className="my-3 sm:my-4 md:flex-1 md:min-h-0 md:overflow-y-auto md:pr-2 focus:outline-none">
            <p className="text-secondary leading-relaxed text-xs sm:text-sm whitespace-pre-line">
              {event.description || "Join StackHacks for an interactive coding and networking session."}
            </p>
          </div>

          {/* Bottom section: RSVP action with customizable link and content */}
          <div className="pt-3 sm:pt-4 border-t border-white/[0.08] shrink-0 mt-2 md:mt-0">
            <a
              href={event.rsvpLink || "https://www.instagram.com/stackhacksbu/?hl=en"}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold cursor-pointer bg-accent text-black transition-all duration-200 hover:bg-[#e09825] hover:brightness-90 active:brightness-75 w-full shadow-sm"
            >
              <span>{event.buttonText || "Learn More"}</span>
              <ExternalLink className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </a>
          </div>
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          type="button"
          aria-label="Close dialog"
          className="absolute top-3 right-3 z-30 w-8 h-8 flex items-center justify-center rounded-full border border-white/15 bg-black/60 backdrop-blur-md text-secondary hover:text-white hover:bg-black/90 hover:brightness-90 active:brightness-75 transition-all duration-150 cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </motion.div>
    </motion.div>,
    document.body
  )
}

const Events = () => {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)
  const [activeTab, setActiveTab] = useState('upcoming') // 'upcoming' | 'past'
  const [selectedDate, setSelectedDate] = useState(null)
  const [selectedEvent, setSelectedEvent] = useState(null)

  // Current calendar view month/year
  const [currentDate, setCurrentDate] = useState(() => new Date(2026, 3, 1)) // Defaults to April 2026

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const query = `*[_type == "event"] | order(date desc) {
          _id,
          title,
          date,
          location,
          rsvpLink,
          buttonText,
          "image": image.asset->url,
          description
        }`

        const data = await client.fetch(query)
        const eventList = data || []
        setEvents(eventList)

        // If there are events, auto-center calendar on the latest or upcoming event
        if (eventList.length > 0) {
          const firstValid = eventList.find(e => e.date && !isNaN(new Date(e.date).getTime()))
          if (firstValid) {
            const d = new Date(firstValid.date)
            setCurrentDate(new Date(d.getFullYear(), d.getMonth(), 1))
          }
        }
      } catch (e) {
        console.error("Failed to fetch events from Sanity: ", e)
        setLoadError(true)
      } finally {
        setLoading(false)
      }
    }

    fetchEvents()
  }, [])

  // Partition events into upcoming and past
  const now = useMemo(() => new Date(), [])
  const { upcomingEvents, pastEvents } = useMemo(() => {
    const up = []
    const past = []
    events.forEach(e => {
      if (!e.date) {
        up.push(e)
        return
      }
      const ed = new Date(e.date)
      if (isNaN(ed.getTime())) {
        up.push(e)
      } else if (ed >= now) {
        up.push(e)
      } else {
        past.push(e)
      }
    })
    return { upcomingEvents: up, pastEvents: past }
  }, [events, now])

  // Map of events by YYYY-MM-DD for fast calendar lookup
  const eventsByDate = useMemo(() => {
    const map = {}
    events.forEach(e => {
      if (!e.date) return
      const d = new Date(e.date)
      if (isNaN(d.getTime())) return
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
      if (!map[key]) map[key] = []
      map[key].push(e)
    })
    return map
  }, [events])

  // Calendar month calculations
  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()

  const firstDayOfWeek = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1))
    setSelectedDate(null)
  }

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1))
    setSelectedDate(null)
  }

  // Count events in active calendar month
  const eventsInCurrentMonth = useMemo(() => {
    return events.filter(e => {
      if (!e.date) return false
      const d = new Date(e.date)
      return d.getFullYear() === year && d.getMonth() === month
    }).length
  }, [events, year, month])

  // Auto-switch to past tab if no upcoming events exist so the user sees events immediately
  useEffect(() => {
    if (!loading && upcomingEvents.length === 0 && pastEvents.length > 0) {
      setActiveTab('past')
    }
  }, [loading, upcomingEvents.length, pastEvents.length])

  // Filtered right-column events based on active tab and optional date selection
  const displayedEvents = useMemo(() => {
    if (selectedDate) {
      return eventsByDate[selectedDate] || []
    }
    return activeTab === 'upcoming' ? upcomingEvents : pastEvents
  }, [activeTab, upcomingEvents, pastEvents, selectedDate, eventsByDate])

  return (
    <div data-circuit-section className="screen-section w-full max-w-6xl mx-auto px-6">
      {/* Page Title with Woosh-in */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-10 space-y-2"
      >
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight text-primary">
          Events Calendar
        </h1>
        <p className="text-secondary text-sm sm:text-base leading-relaxed">
          Explore upcoming hackathons, workshops, tech talks, and past ceremonies.
        </p>
      </motion.div>

      {/* Main 2-Column Responsive Layout (Matching User's Reference Picture) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* ── Left Column: Calendar Card ── */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="lg:col-span-7 tech-card p-6 sm:p-8 bg-[#141416]/95 border border-white/10 shadow-xl"
        >
          {/* Calendar Month Header & Navigation */}
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-primary">
              {MONTH_NAMES[month]} {year}
            </h2>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={prevMonth}
                aria-label="Previous month"
                className="w-9 h-9 rounded-full border border-white/15 bg-white/[0.03] text-primary flex items-center justify-center hover:bg-black/40 hover:border-white/30 hover:brightness-90 active:brightness-75 transition-all duration-200 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={nextMonth}
                aria-label="Next month"
                className="w-9 h-9 rounded-full border border-white/15 bg-white/[0.03] text-primary flex items-center justify-center hover:bg-black/40 hover:border-white/30 hover:brightness-90 active:brightness-75 transition-all duration-200 cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Days of Week Header */}
          <div className="grid grid-cols-7 gap-2 mb-3 text-center">
            {DAYS_OF_WEEK.map((day) => (
              <div
                key={day}
                className="text-[11px] sm:text-xs font-semibold text-secondary/60 tracking-wider py-1"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Days Grid */}
          <div className="grid grid-cols-7 gap-2 sm:gap-2.5">
            {/* Blank leading padding days */}
            {Array.from({ length: firstDayOfWeek }).map((_, i) => (
              <div key={`empty-${i}`} className="aspect-square" />
            ))}

            {/* Days in Month */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const dayNum = i + 1
              const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`
              const dayEvents = eventsByDate[dateKey] || []
              const hasEvents = dayEvents.length > 0
              const isSelected = selectedDate === dateKey

              const eventWithImage = dayEvents.find(e => Boolean(e.image))

              // Check if today
              const isToday =
                now.getFullYear() === year &&
                now.getMonth() === month &&
                now.getDate() === dayNum

              return (
                <button
                  key={dayNum}
                  type="button"
                  onClick={() => {
                    if (hasEvents) {
                      setSelectedDate(isSelected ? null : dateKey)
                    } else {
                      setSelectedDate(null)
                    }
                  }}
                  className={`aspect-square relative rounded-xl sm:rounded-2xl flex flex-col items-center justify-center transition-all duration-200 p-1 group cursor-pointer overflow-hidden hover:brightness-90 active:brightness-75 ${
                    isSelected
                      ? 'border-2 border-accent bg-accent/20 shadow-[0_0_20px_rgba(254,178,58,0.4)] ring-2 ring-accent/40'
                      : isToday
                      ? 'border-2 border-accent/70 bg-white/[0.04]'
                      : hasEvents
                      ? 'border border-accent/40 hover:border-accent shadow-[0_0_12px_rgba(254,178,58,0.15)]'
                      : 'bg-white/[0.02] border border-white/5 hover:border-white/20 hover:bg-white/[0.04]'
                  }`}
                >
                  {/* Full-square thumbnail when an event on this day has an image */}
                  {eventWithImage && (
                    <>
                      <img
                        src={eventWithImage.image}
                        alt=""
                        className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                      {/* Dark overlay for readability */}
                      <div
                        className={`absolute inset-0 transition-colors duration-200 ${
                          isSelected
                            ? 'bg-black/40'
                            : 'bg-black/60 group-hover:bg-black/40'
                        }`}
                      />
                    </>
                  )}

                  {/* Day Number */}
                  <span
                    className={`relative z-10 text-sm sm:text-base font-bold transition-colors ${
                      isSelected
                        ? 'text-accent drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]'
                        : hasEvents
                        ? 'text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.95)] group-hover:text-accent'
                        : isToday
                        ? 'text-primary'
                        : 'text-secondary/80 group-hover:text-primary'
                    }`}
                  >
                    {dayNum}
                  </span>

                  {/* Indicator badge */}
                  {hasEvents && (
                    <div className="relative z-10 mt-1 flex items-center justify-center">
                      <span className="w-1.5 h-1.5 rounded-full bg-accent shadow-[0_0_8px_rgba(254,178,58,0.9)]" />
                    </div>
                  )}
                </button>
              )
            })}
          </div>

          {/* Calendar Footer Info */}
          <div className="mt-8 pt-5 border-t border-white/[0.08] flex flex-col sm:flex-row items-center justify-between text-xs text-secondary gap-2">
            <span>
              {eventsInCurrentMonth} {eventsInCurrentMonth === 1 ? 'event' : 'events'} in {MONTH_NAMES[month]}
            </span>
            {selectedDate ? (
              <button
                type="button"
                onClick={() => setSelectedDate(null)}
                className="text-accent hover:underline hover:brightness-90 active:brightness-75 transition-all duration-200 cursor-pointer"
              >
                Clear date filter &times;
              </button>
            ) : (
              <span className="text-secondary/60">
                Click any highlighted date for details
              </span>
            )}
          </div>
        </motion.div>

        {/* ── Right Column: Upcoming/Past Tabs & Event Cards (Matching Image) ── */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="lg:col-span-5 space-y-6"
        >
          {/* Top Segmented Tab Switcher Matching Image */}
          <div className="flex items-center rounded-xl p-1 bg-[#141416] border border-white/10">
            <button
              type="button"
              onClick={() => setActiveTab('upcoming')}
              className={`flex-1 py-2.5 text-xs sm:text-sm font-semibold rounded-lg transition-all duration-200 cursor-pointer ${
                activeTab === 'upcoming'
                  ? 'bg-accent text-black shadow-md hover:bg-[#e09825] hover:brightness-90 active:brightness-75'
                  : 'text-secondary hover:text-white hover:bg-black/40 hover:brightness-90 active:brightness-75'
              }`}
            >
              UPCOMING ({upcomingEvents.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('past')}
              className={`flex-1 py-2.5 text-xs sm:text-sm font-semibold rounded-lg transition-all duration-200 cursor-pointer ${
                activeTab === 'past'
                  ? 'bg-accent text-black shadow-md hover:bg-[#e09825] hover:brightness-90 active:brightness-75'
                  : 'text-secondary hover:text-white hover:bg-black/40 hover:brightness-90 active:brightness-75'
              }`}
            >
              PAST ({pastEvents.length})
            </button>
          </div>

          {/* Event Cards List (Scrollable to keep page height balanced) */}
          <div className="space-y-4 max-h-[580px] overflow-y-auto pr-1.5 focus:outline-none">
            {loading ? (
              <div className="tech-card p-10 text-center text-secondary/50">
                Loading events...
              </div>
            ) : loadError ? (
              <LoadError what="events" />
            ) : displayedEvents.length > 0 ? (
              displayedEvents.map((event, index) => {
                const eventDate = event.date ? new Date(event.date) : null
                const validDate = eventDate && !isNaN(eventDate.getTime())

                return (
                  <motion.div
                    key={event._id || index}
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    className="tech-card p-5 sm:p-6 bg-[#141416] border border-white/10 hover:border-accent/50 transition-all duration-300 space-y-4 shadow-lg group"
                  >
                    <div className="flex items-start gap-4">
                      {/* Left: Date Box Matching Reference */}
                      {validDate && (
                        <div className="w-16 h-18 rounded-2xl bg-white/[0.04] border border-white/10 flex flex-col items-center justify-center shrink-0 p-2 group-hover:border-accent/50 transition-colors">
                          <span className="text-[10px] font-bold text-secondary uppercase tracking-wider">
                            {eventDate.toLocaleDateString('en-US', { month: 'short' })}
                          </span>
                          <span className="text-2xl font-bold text-primary group-hover:text-accent transition-colors leading-none mt-0.5">
                            {eventDate.getDate()}
                          </span>
                        </div>
                      )}

                      {/* Right: Content details */}
                      <div className="space-y-2 flex-grow">
                        {/* Title */}
                        <h3 className="text-lg font-semibold text-primary group-hover:text-accent transition-colors leading-snug">
                          {event.title}
                        </h3>

                        {/* Time & Location rows */}
                        {validDate && (
                          <div className="space-y-1 text-xs text-secondary/80">
                            <div className="flex items-center gap-1.5">
                              <Clock className="w-3.5 h-3.5 text-accent" />
                              <span>
                                {eventDate.toLocaleTimeString('en-US', {
                                   hour: 'numeric',
                                   minute: '2-digit',
                                 })}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <MapPin className="w-3.5 h-3.5 text-accent shrink-0" />
                              <span className="line-clamp-1">
                                {event.location || "Binghamton University \u00B7 Main Campus"}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Action Button Matching Reference */}
                    <div className="pt-2 flex items-center justify-between border-t border-white/[0.06]">
                      <button
                        type="button"
                        onClick={() => setSelectedEvent(event)}
                        className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-accent text-black font-semibold text-xs transition-all duration-200 hover:bg-[#e09825] hover:brightness-90 active:brightness-75 cursor-pointer shadow-sm"
                      >
                        <span>Details</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </motion.div>
                )
              })
            ) : (
              <div className="tech-card p-10 text-center text-secondary/50 space-y-2">
                <p>No {activeTab} events found{selectedDate ? ' for this date' : ''}.</p>
                {selectedDate && (
                  <button
                    type="button"
                    onClick={() => setSelectedDate(null)}
                    className="inline-flex items-center justify-center px-3 py-1.5 rounded-lg text-xs bg-white/[0.04] border border-white/10 text-accent hover:bg-black/40 hover:brightness-90 active:brightness-75 transition-all duration-200 mt-2 font-mono cursor-pointer"
                  >
                    View all {activeTab} events
                  </button>
                )}
              </div>
            )}
          </div>
        </motion.div>

      </div>

      {/* Modal for Event Details */}
      <AnimatePresence>
        {selectedEvent && (
          <EventDetailModal
            event={selectedEvent}
            onClose={() => setSelectedEvent(null)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

export default Events