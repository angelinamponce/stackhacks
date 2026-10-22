import { useCallback, useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import { Reveal } from './Interactive'
import PhotoSlot from './PhotoSlot'
import Lightbox from './Lightbox'

/**
 * Photos-only gallery. The first photo is a featured hero (wide, centred, gold-framed); the rest
 * fill a grid below it: 2 columns on phones and tablets, 4 on desktop; exactly three make one row of
 * three (stacked on phones). Rows wrap centred, so a short last row sits in the middle instead of
 * leaving a gap. One shared lightbox steps through
 * every photo that actually loaded, the featured one included (placeholders and failures are skipped).
 */
export default function PhotoGallery({ photos, aspect = 'aspect-[3/2]', featuredAspect = 'aspect-[16/9]' }) {
  const [broken, setBroken] = useState(() => new Set())
  const [openAt, setOpenAt] = useState(null) // index into `viewable`
  const viewable = photos.map((p, i) => i).filter((i) => photos[i].src && !broken.has(i))

  const close = useCallback(() => setOpenAt(null), [])
  const step = useCallback((dir) => setOpenAt((n) => (n === null ? n : (n + dir + viewable.length) % viewable.length)), [viewable.length])
  const prev = useCallback(() => step(-1), [step])
  const next = useCallback(() => step(1), [step])

  const current = openAt !== null ? photos[viewable[openAt]] : null
  const [featured, ...rest] = photos
  // Three photos sit as one even row of three (stacked on phones); otherwise 2 columns, 4 on desktop
  const tileWidth = rest.length === 3
    ? 'w-full sm:w-[calc((100%-3rem)/3)]'
    : 'w-[calc((100%-1rem)/2)] sm:w-[calc((100%-1.5rem)/2)] lg:w-[calc((100%-4.5rem)/4)]'
  const slotProps = (i) => ({
    onOpen: () => setOpenAt(viewable.indexOf(i)),
    onError: () => setBroken((b) => new Set(b).add(i)),
  })

  return (
    <div className="space-y-6 lg:space-y-8">
      {featured && (
        <Reveal className="mx-auto w-full lg:w-[88%] max-w-[1100px]">
          <PhotoSlot photo={featured} aspect={featuredAspect} featured eager {...slotProps(0)} />
        </Reveal>
      )}

      {rest.length > 0 && (
        <div className="flex flex-wrap justify-center gap-4 sm:gap-6">
          {rest.map((photo, j) => (
            <Reveal
              key={j + 1}
              delay={(j % 4) * 0.08}
              className={tileWidth}
            >
              <PhotoSlot photo={photo} aspect={aspect} {...slotProps(j + 1)} />
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
