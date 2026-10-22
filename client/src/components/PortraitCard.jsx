import { useState } from 'react'
import { motion } from 'framer-motion'
import { useTilt } from '../lib/pointer'
import { initials } from '../lib/initials'
import CornerTraces from './os/CornerTraces'

const SPRING = { type: 'spring', stiffness: 260, damping: 26 }

/**
 * Large portrait card shared by Founders and the Executive Board: face-focused 4:5 photo,
 * bottom gradient, name + gold title. Hover lifts/scales/brightens with a 3D tilt and a gold
 * shine sweep; the selected card gets a gold border, glow and lit circuit-trace corners.
 *
 * `buttonProps` carries section-specific semantics (listbox option vs. dialog trigger),
 * `widthClass` the section's layout widths.
 */
export default function PortraitCard({
  name,
  title,
  image,
  isActive,
  isHovered,
  anyHovered,
  reduce,
  onClick,
  onHover,
  cardRef,
  widthClass = '',
  buttonProps = {},
}) {
  const tilt = useTilt({ max: 6, scale: 1 })
  // Initials stand in when there is no photo or it fails to load
  const [broken, setBroken] = useState(false)
  const showPhoto = image && !broken
  const lifted = isActive || isHovered
  // While hovering, everything except the hovered card dims; otherwise only non-selected cards do.
  const brightness = !anyHovered ? (isActive ? 1 : 0.72) : isHovered ? 1.05 : isActive ? 0.85 : 0.55

  return (
    <button
      ref={cardRef}
      type="button"
      onClick={onClick}
      onMouseEnter={onHover}
      {...(reduce ? {} : tilt)}
      {...buttonProps}
      className={`founder-card group relative shrink-0 snap-center cursor-pointer text-left transition-transform duration-300 ease-out rounded-[1.4rem] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70 focus-visible:ring-offset-4 focus-visible:ring-offset-background ${widthClass}`}
    >
      <motion.div
        initial={false}
        animate={{ y: lifted ? -10 : 0, scale: isHovered ? 1.05 : isActive ? 1.03 : 1, filter: `brightness(${brightness})` }}
        transition={reduce ? { duration: 0 } : SPRING}
        className={`card-shine relative aspect-[4/5] overflow-hidden rounded-[1.4rem] border bg-card transition-[border-color,box-shadow] duration-500 ${
          isActive
            ? 'border-accent/80 shadow-[0_28px_56px_-24px_rgba(0,0,0,0.95),0_0_44px_-10px_rgba(254,178,58,0.55)]'
            : 'border-white/10 shadow-[0_22px_44px_-26px_rgba(0,0,0,0.95)] group-hover:border-accent/50'
        }`}
      >
        {showPhoto ? (
          <img src={image} alt="" draggable={false} loading="lazy" onError={() => setBroken(true)} className="h-full w-full object-cover object-[50%_22%]" />
        ) : (
          <div aria-hidden="true" className="flex h-full w-full items-start justify-center bg-gradient-to-b from-accent/15 to-transparent pt-[22%] text-5xl lg:text-6xl font-semibold tracking-wide text-accent/80">
            {initials(name)}
          </div>
        )}
        {/* Legibility gradient behind the name plate */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black via-black/70 to-transparent" />
        <CornerTraces show={isActive} />
        <div className="absolute inset-x-0 bottom-0 z-10 p-4 lg:p-5">
          <p className="text-base lg:text-lg font-semibold leading-tight text-white text-balance">{name}</p>
          <p className="mt-1.5 text-[11px] lg:text-xs font-medium leading-snug text-accent text-balance">{title}</p>
        </div>
      </motion.div>
    </button>
  )
}
