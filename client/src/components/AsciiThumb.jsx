import { useEffect, useImperativeHandle, useRef, useState } from "react"
import { AsciiRenderer, analyzeImage, loadImage, sampleGrid, ticker } from "../lib/asciiArt"
import { useIntroDone } from "../lib/intro"

const MOBILE = "(max-width: 767px)"
const REDUCED = "(prefers-reduced-motion: reduce)"
const mq = (q) => (typeof window !== "undefined" && window.matchMedia ? window.matchMedia(q) : null)

/**
 * Animated ASCII rendering of an image. Fills its parent (which should be positioned).
 *
 * Props: src, alt, color (optional single accent colour for every glyph),
 * effect ("default" | "glitch" | "draw" | "fill" | "assemble"), fill (share of the box the icon
 * spans, default 0.72), className, fallbackClassName (extra classes for the <img> fallback).
 * `ref.current.play()` runs the hover effect. Falls back to a plain <img> if the image
 * can't be sampled (e.g. no CORS).
 */
export default function AsciiThumb({ src, alt = "", color, effect = "default", fill = 0.72, className = "", fallbackClassName = "", ref }) {
  const canvasRef = useRef(null)
  const rendererRef = useRef(null)
  const [failedSrc, setFailedSrc] = useState(null)
  const failed = !!src && failedSrc === src

  useImperativeHandle(ref, () => ({ play: () => rendererRef.current?.play() }), [])

  // Hold the decode until the first-visit splash has handed the page over
  const pageReady = useIntroDone()
  const pageReadyRef = useRef(pageReady)
  useEffect(() => {
    pageReadyRef.current = pageReady
    rendererRef.current?.setReady(pageReady)
  }, [pageReady])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !src) return
    const setFailed = () => setFailedSrc(src)
    const mobile = mq(MOBILE)
    const reduced = mq(REDUCED)

    const r = new AsciiRenderer(canvas, { effect, color })
    r.ready = pageReadyRef.current
    const applyModes = () => {
      r.static = !!reduced?.matches
      r.idle = !mobile?.matches // mobile: intro decode + tap only
    }
    applyModes()
    rendererRef.current = r
    ticker.add(r)

    let img = null
    let cancelled = false

    const relayout = () => {
      if (!img || cancelled) return
      const box = canvas.parentElement.getBoundingClientRect()
      const w = box.width, h = box.height
      if (w < 10 || h < 10) return
      try {
        // Fit the icon (cropped to its own bounds) into `fill` of the box, centred
        const { crop } = analyzeImage(img)
        const aspect = crop.w / crop.h
        const fw = Math.min(w * fill, h * fill * aspect)
        const fh = fw / aspect
        const [lo, hi] = mobile?.matches ? [40, 50] : [60, 80]
        const cols = Math.round(Math.min(hi, Math.max(lo, fw / 6)))
        const cw = fw / cols
        // Slightly tighter rows than a 1:2 cell, with glyphs ~12% larger than the cell
        const rows = Math.max(1, Math.round(fh / (cw * 1.85)))
        const ch = fh / rows
        const grid = sampleGrid(img, cols, rows)
        r.layout(grid, { w, h, x: (w - fw) / 2, y: (h - fh) / 2, cw, ch, fontSize: Math.min(ch, cw / 0.6) * 1.12 })
      } catch (e) {
        console.warn("AsciiThumb: falling back to <img>", e)
        setFailed()
      }
    }

    Promise.all([loadImage(src), document.fonts?.load?.("700 12px 'JetBrains Mono'").catch(() => {})])
      .then(([loaded]) => {
        if (cancelled) return
        img = loaded
        relayout()
      })
      .catch(() => !cancelled && setFailed())

    const ro = new ResizeObserver(relayout)
    ro.observe(canvas.parentElement)

    // Only animate while on screen
    const io = new IntersectionObserver(([entry]) => r.setVisible(entry.isIntersecting), { threshold: 0.2 })
    io.observe(canvas)

    const onModeChange = () => {
      applyModes()
      relayout()
    }
    mobile?.addEventListener("change", onModeChange)
    reduced?.addEventListener("change", onModeChange)

    return () => {
      cancelled = true
      ro.disconnect()
      io.disconnect()
      mobile?.removeEventListener("change", onModeChange)
      reduced?.removeEventListener("change", onModeChange)
      r.destroy()
      rendererRef.current = null
    }
  }, [src, effect, color, fill])

  if (failed) {
    return <img src={src} alt={alt} loading="lazy" decoding="async" className={`h-full w-full object-contain ${fallbackClassName} ${className}`} />
  }
  return <canvas ref={canvasRef} role="img" aria-label={alt} className={`block h-full w-full ${className}`} />
}
