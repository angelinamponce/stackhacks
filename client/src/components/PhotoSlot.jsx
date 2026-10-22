import { useCallback, useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import { Camera, Images } from 'lucide-react'
import Lightbox from './Lightbox'

/**
 * One photo slot: { src, alt, caption, placeholder, position, more }. With a real `src` it renders a
 * lazy-loaded photo that zooms gently on hover and opens in a lightbox; with no `src` (or if the
 * image fails to load) it shows a "coming soon" placeholder, so there is never a broken image.
 * Extra photos in `more` open with the main one as a set (prev/next). The lightbox shows photos only, no captions.
 */
export default function PhotoSlot({ photo, aspect = 'aspect-[4/3]', className = '', onOpen, onError, featured = false, eager = false, label, captionContent, buttonRef }) {
  const [openAt, setOpenAt] = useState(null)
  const [broken, setBroken] = useState(false)
  const [brokenMore, setBrokenMore] = useState(() => new Set())
  const hasPhoto = Boolean(photo.src) && !broken
  const frame = `relative ${aspect} w-full overflow-hidden rounded-2xl border`
  // Featured (lead) photos get a stronger gold edge and a soft glow
  const edge = featured
    ? 'border-accent/70 shadow-[0_30px_70px_-30px_rgba(0,0,0,0.9),0_0_48px_-12px_rgba(254,178,58,0.45)]'
    : 'border-accent/30'

  // The lightbox set: the main photo plus any extras that have a src and haven't failed to load
  const set = [photo, ...(photo.more || []).filter((p, i) => p.src && !brokenMore.has(i))]
  const isSet = set.length > 1
  // A gallery passes onOpen to drive one shared lightbox; a standalone slot opens its own
  const handleOpen = onOpen || (() => setOpenAt(0))
  const close = useCallback(() => setOpenAt(null), [])
  const prev = useCallback(() => setOpenAt((n) => (n - 1 + set.length) % set.length), [set.length])
  const next = useCallback(() => setOpenAt((n) => (n + 1) % set.length), [set.length])
  const current = openAt !== null ? set[openAt] : null

  const dropBroken = (src) => {
    const i = (photo.more || []).findIndex((p) => p.src === src)
    if (i >= 0) { setBrokenMore((b) => new Set(b).add(i)); setOpenAt(0) }
  }

  return (
    <figure className={`space-y-3 ${className}`}>
      {hasPhoto ? (
        <button
          ref={buttonRef}
          type="button"
          onClick={handleOpen}
          aria-label={label || `View larger${isSet ? ` (${set.length} photos)` : ''}: ${photo.alt}`}
          className={`${frame} ${edge} group block bg-card cursor-zoom-in focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70 focus-visible:ring-offset-4 focus-visible:ring-offset-background`}
        >
          <img
            src={photo.src}
            alt={photo.alt}
            loading={eager ? 'eager' : 'lazy'}
            decoding="async"
            onError={() => { setBroken(true); onError?.() }}
            style={photo.position ? { objectPosition: photo.position } : undefined}
            className="h-full w-full object-cover transition-transform duration-700 ease-out motion-safe:group-hover:scale-[1.04]"
          />
          {isSet && (
            <span aria-hidden="true" className="absolute right-3 top-3 inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-black/70 px-2.5 py-1 text-[11px] font-medium text-white backdrop-blur-sm">
              <Images className="h-3.5 w-3.5" /> {set.length}
            </span>
          )}
        </button>
      ) : (
        <div className={`${frame} ${edge} flex flex-col items-center justify-center gap-3 bg-gradient-to-b from-[#18181b] to-[#0f0f11] text-center`}>
          <Camera aria-hidden="true" className="h-7 w-7 text-accent/60" strokeWidth={1.5} />
          <span className="px-4 text-xs font-medium uppercase tracking-[0.2em] text-secondary">{photo.placeholder || 'Photo coming soon'}</span>
        </div>
      )}
      {captionContent ? (
        <figcaption className="text-center">{captionContent}</figcaption>
      ) : photo.caption && (
        <figcaption className="text-center text-sm font-medium text-primary/90">{photo.caption}</figcaption>
      )}

      <AnimatePresence>
        {current && !onOpen && (
          <Lightbox
            src={current.src}
            alt={current.alt}
            onClose={close}
            onError={isSet ? () => dropBroken(current.src) : undefined}
            {...(isSet ? { onPrev: prev, onNext: next, position: `${openAt + 1} / ${set.length}` } : {})}
          />
        )}
      </AnimatePresence>
    </figure>
  )
}
