import { useCallback, useEffect, useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import { Reveal } from './Interactive'
import PhotoSlot from './PhotoSlot'
import Lightbox from './Lightbox'
import CircuitFrame from './CircuitFrame'

const FADE_MS = 300

/**
 * Photos-only gallery: a large featured photo with a full circuit frame, and the rest as thumbnails
 * below it with corner-node frames (three make one row of three, stacked on phones). Clicking a
 * thumbnail swaps it into the featured slot (~300ms crossfade, no fade under reduced motion) and the
 * featured frame redraws; clicking the featured photo opens the lightbox, which steps through every
 * photo that actually loaded (placeholders and failures are skipped).
 */
export default function PhotoGallery({ photos, aspect = 'aspect-[3/2]', featuredAspect = 'aspect-[16/9]' }) {
  const [broken, setBroken] = useState(() => new Set())
  const [openAt, setOpenAt] = useState(null) // index into `viewable`
  const [featuredIdx, setFeaturedIdx] = useState(0)
  const [fading, setFading] = useState(null) // the photo index fading out under the new featured one
  const viewable = photos.map((p, i) => i).filter((i) => photos[i].src && !broken.has(i))

  const close = useCallback(() => setOpenAt(null), [])
  const step = useCallback((dir) => setOpenAt((n) => (n === null ? n : (n + dir + viewable.length) % viewable.length)), [viewable.length])
  const prev = useCallback(() => step(-1), [step])
  const next = useCallback(() => step(1), [step])

  useEffect(() => {
    if (fading === null) return
    const t = setTimeout(() => setFading(null), FADE_MS)
    return () => clearTimeout(t)
  }, [fading])

  const reduced = typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  const feature = (i) => {
    if (i === featuredIdx) return
    if (!reduced) setFading(featuredIdx)
    setFeaturedIdx(i)
  }

  const current = openAt !== null ? photos[viewable[openAt]] : null
  const featured = photos[featuredIdx]
  const thumbs = photos.map((p, i) => i).filter((i) => i !== featuredIdx)
  const tileWidth = thumbs.length === 3
    ? 'w-full sm:w-[calc((100%-3rem)/3)]'
    : 'w-[calc((100%-1rem)/2)] sm:w-[calc((100%-1.5rem)/2)] lg:w-[calc((100%-4.5rem)/4)]'

  return (
    <div className="space-y-6 lg:space-y-8">
      {featured && (
        <Reveal>
          <CircuitFrame variant="full" redrawKey={featuredIdx}>
            <div className="relative">
              {/* The previous photo stays underneath while the new one fades in over it */}
              {fading !== null && (
                <div aria-hidden="true" className="pointer-events-none absolute inset-0">
                  <PhotoSlot photo={photos[fading]} aspect={featuredAspect} featured eager />
                </div>
              )}
              <div key={featuredIdx} className={fading !== null ? 'gallery-fade-in relative' : 'relative'}>
                <PhotoSlot
                  photo={featured}
                  aspect={featuredAspect}
                  featured
                  eager
                  onOpen={() => setOpenAt(viewable.indexOf(featuredIdx))}
                  onError={() => setBroken((b) => new Set(b).add(featuredIdx))}
                />
              </div>
            </div>
          </CircuitFrame>
        </Reveal>
      )}

      {thumbs.length > 0 && (
        <div className="flex flex-wrap gap-4 sm:gap-6">
          {thumbs.map((i, j) => (
            <Reveal key={i} delay={(j % 4) * 0.08} className={tileWidth}>
              <CircuitFrame variant="corners" delay={j * 100}>
                <PhotoSlot
                  photo={photos[i]}
                  aspect={aspect}
                  label={`Show in the featured spot: ${photos[i].alt}`}
                  onOpen={() => feature(i)}
                  onError={() => setBroken((b) => new Set(b).add(i))}
                />
              </CircuitFrame>
            </Reveal>
          ))}
        </div>
      )}

      <AnimatePresence>
        {current && (
          <Lightbox
            src={current.src}
            alt={current.alt}
            onClose={close}
            {...(viewable.length > 1 ? { onPrev: prev, onNext: next, position: `${openAt + 1} / ${viewable.length}` } : {})}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
