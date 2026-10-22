import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { motion, useReducedMotion } from 'framer-motion'
import { X, ArrowLeft, ArrowRight } from 'lucide-react'
import { useDialog } from '../lib/dialog'

/**
 * Full-size image viewer. Closes on Escape, the close button, or a click outside the image.
 * With onPrev/onNext (a gallery), arrow keys and prev/next buttons move between photos.
 */
export default function Lightbox({ src, alt, caption, onClose, onPrev, onNext, position, onError }) {
  const dialogRef = useRef(null)
  const closeRef = useRef(null)
  const reduce = useReducedMotion()
  useDialog(dialogRef, onClose, closeRef)

  useEffect(() => {
    if (!onPrev || !onNext) return
    const onKey = (e) => {
      if (e.key === 'ArrowRight') { e.preventDefault(); onNext() }
      if (e.key === 'ArrowLeft') { e.preventDefault(); onPrev() }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onPrev, onNext])

  return createPortal(
    <motion.div
      className="fixed inset-0 z-[600] flex items-center justify-center p-4 sm:p-8 bg-black/85 backdrop-blur-md"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: reduce ? 0.1 : 0.25 }}
      onClick={onClose}
    >
      <motion.figure
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={alt}
        onClick={(e) => e.stopPropagation()}
        initial={reduce ? false : { opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.95 }}
        transition={{ duration: reduce ? 0.1 : 0.3, ease: [0.16, 1, 0.3, 1] }}
        className="relative w-fit max-w-full"
      >
        <img
          key={src}
          src={src}
          alt={alt}
          onError={onError}
          className={`block ${onPrev ? 'max-h-[72svh]' : 'max-h-[82svh]'} max-w-full w-auto rounded-2xl border border-accent/30 object-contain shadow-[0_40px_100px_-30px_rgba(0,0,0,0.95),0_0_60px_-24px_rgba(254,178,58,0.5)]`}
        />
        {caption && <figcaption className="mt-3 text-center text-sm text-secondary">{caption}</figcaption>}
        {onPrev && onNext && (
          <div className="mt-4 flex items-center justify-center gap-5">
            <button type="button" onClick={onPrev} className="btn-icon !h-9 !w-9" aria-label="Previous photo"><ArrowLeft className="h-4 w-4" /></button>
            {position && <span className="text-xs tabular-nums tracking-[0.2em] text-secondary">{position}</span>}
            <button type="button" onClick={onNext} className="btn-icon !h-9 !w-9" aria-label="Next photo"><ArrowRight className="h-4 w-4" /></button>
          </div>
        )}
        <button
          ref={closeRef}
          type="button"
          onClick={onClose}
          aria-label="Close image"
          className="absolute -top-3 -right-3 w-9 h-9 flex items-center justify-center rounded-full border border-white/20 bg-black/80 text-secondary hover:text-white hover:border-accent/50 transition-colors duration-200 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60"
        >
          <X className="w-4 h-4" />
        </button>
      </motion.figure>
    </motion.div>,
    document.body
  )
}
