import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import {
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
} from "framer-motion";

const SPRING = { type: "spring", stiffness: 120, damping: 24, mass: 1 };
const AUTOPLAY_MS = 6000;

// Position of each photo in the stack relative to the active one.
function slotFor(index, active, length) {
  if (index === active) return "active";
  if ((active - 1 + length) % length === index) return "left";
  if ((active + 1) % length === index) return "right";
  return "hidden";
}

const SLOT_STYLES = {
  active: { x: "0%", y: 0, scale: 1, rotateY: 0, rotateZ: 0, opacity: 1, zIndex: 3, filter: "blur(0px) brightness(1)" },
  left:   { x: "-30%", y: -10, scale: 0.86, rotateY: 12, rotateZ: -2, opacity: 0.5, zIndex: 2, filter: "blur(1px) brightness(0.6)" },
  right:  { x: "30%", y: -10, scale: 0.86, rotateY: -12, rotateZ: 2, opacity: 0.5, zIndex: 2, filter: "blur(1px) brightness(0.6)" },
  hidden: { x: "0%", y: 8, scale: 0.75, rotateY: 0, rotateZ: 0, opacity: 0, zIndex: 1, filter: "blur(3px) brightness(0.5)" },
};

export const CircularDisplay = ({ testimonials = [], autoplay = true }) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const reduce = useReducedMotion();
  const length = testimonials.length;

  // Mouse parallax on the photo stack
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const rotX = useSpring(useTransform(my, [-0.5, 0.5], [4, -4]), { stiffness: 120, damping: 18 });
  const rotY = useSpring(useTransform(mx, [-0.5, 0.5], [-5, 5]), { stiffness: 120, damping: 18 });

  const go = (dir) => length > 1 && setActiveIndex((i) => (i + dir + length) % length);

  useEffect(() => {
    if (!autoplay || paused || reduce || length <= 1) return;
    const id = setTimeout(() => setActiveIndex((i) => (i + 1) % length), AUTOPLAY_MS);
    return () => clearTimeout(id);
  }, [autoplay, paused, reduce, length, activeIndex]);

  if (!length) return null;

  const handlePointerMove = (e) => {
    if (reduce || e.pointerType !== "mouse") return;
    const r = e.currentTarget.getBoundingClientRect();
    mx.set((e.clientX - r.left) / r.width - 0.5);
    my.set((e.clientY - r.top) / r.height - 0.5);
  };

  const handleKeyDown = (e) => {
    if (e.key === "ArrowRight") { e.preventDefault(); go(1); }
    if (e.key === "ArrowLeft") { e.preventDefault(); go(-1); }
  };

  return (
    <div
      className="grid grid-cols-1 md:grid-cols-[1.15fr_1fr] gap-10 md:gap-10 lg:gap-14 items-center"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => { setPaused(false); mx.set(0); my.set(0); }}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      {/* Photo stack with depth + parallax */}
      <div>
        <motion.div
          role="region"
          aria-roledescription="carousel"
          aria-label="About StackHacks photos"
          tabIndex={0}
          onKeyDown={handleKeyDown}
          onPointerMove={handlePointerMove}
          style={{ rotateX: rotX, rotateY: rotY, transformPerspective: 1100 }}
          className="relative mx-auto h-[22rem] sm:h-[28rem] md:h-[26rem] lg:h-[32rem] xl:h-[34rem] w-full max-w-2xl [transform-style:preserve-3d] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 rounded-md"
        >
          {/* Ambient gold halo behind the stack */}
          <div className="pointer-events-none absolute left-1/2 top-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent/15 blur-[90px]" />

          {testimonials.map((item, index) => {
            const slot = slotFor(index, activeIndex, length);
            return (
              <motion.button
                key={item._id || index}
                type="button"
                tabIndex={-1}
                aria-hidden={slot !== "active"}
                onClick={() => slot === "left" ? go(-1) : slot === "right" ? go(1) : null}
                drag={slot === "active" && length > 1 ? "x" : false}
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.25}
                onDragEnd={(_, info) => {
                  if (info.offset.x < -60 || info.velocity.x < -400) go(1);
                  else if (info.offset.x > 60 || info.velocity.x > 400) go(-1);
                }}
                initial={false}
                animate={SLOT_STYLES[slot]}
                transition={reduce ? { duration: 0 } : SPRING}
                style={{ pointerEvents: slot === "hidden" ? "none" : "auto" }}
                className="absolute inset-x-0 mx-auto top-3 h-[20rem] sm:h-[26rem] md:h-[24rem] lg:h-[30rem] xl:h-[32rem] w-64 sm:w-[20rem] md:w-[19rem] lg:w-[24rem] xl:w-[26rem] overflow-hidden rounded-md border border-white/15 bg-card shadow-[0_40px_80px_-30px_rgba(0,0,0,0.9)] cursor-grab active:cursor-grabbing"
              >
                <img
                  src={item.image}
                  alt={slot === "active" ? (item.subtitle || item.title) : ""}
                  draggable={false}
                  className="h-full w-full object-cover select-none"
                />
                <span className="pointer-events-none absolute inset-0 rounded-md ring-1 ring-inset ring-white/10" />
                <span className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-white/[0.06]" />
              </motion.button>
            );
          })}
        </motion.div>
      </div>

      {/* Story copy: every slide shares one grid cell, so the block keeps the
          height of the longest slide and nothing below it jumps. */}
      <div className="flex flex-col gap-8">
        <div className="grid" aria-live="polite">
          {testimonials.map((item, index) => {
            const isActive = index === activeIndex;
            return (
              <div
                key={item._id || index}
                aria-hidden={!isActive}
                className={`[grid-area:1/1] space-y-5 transition-[opacity,translate] duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                  isActive ? "opacity-100 translate-y-0" : "pointer-events-none invisible opacity-0 translate-y-3"
                }`}
              >
                <span className="eyebrow">{item.subtitle || "Who We Are"}</span>
                <h2 className="page-title text-primary">
                  {item.title}
                </h2>
                <p className="text-secondary text-base sm:text-lg leading-relaxed max-w-xl">{item.text}</p>
              </div>
            );
          })}
        </div>

        {length > 1 && (
          <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
            <div className="flex items-center gap-2.5">
              <button type="button" onClick={() => go(-1)} aria-label="Previous slide" className="btn-icon">
                <ArrowLeft className="w-4 h-4" />
              </button>
              <button type="button" onClick={() => go(1)} aria-label="Next slide" className="btn-icon">
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {/* Progress dots: the active one fills over the autoplay interval */}
            <div className="flex items-center gap-2">
              {testimonials.map((_, idx) => {
                const isActive = idx === activeIndex;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setActiveIndex(idx)}
                    aria-label={`Go to slide ${idx + 1}`}
                    aria-current={isActive}
                    className={`relative h-1.5 overflow-hidden rounded-full bg-white/15 transition-all duration-500 ease-out hover:bg-white/30 cursor-pointer ${isActive ? "w-10" : "w-1.5"}`}
                  >
                    {isActive && (
                      <motion.span
                        key={`${activeIndex}-${paused}`}
                        className="absolute inset-y-0 left-0 rounded-full bg-accent"
                        initial={{ width: autoplay && !paused && !reduce ? "0%" : "100%" }}
                        animate={{ width: "100%" }}
                        transition={{ duration: autoplay && !paused && !reduce ? AUTOPLAY_MS / 1000 : 0, ease: "linear" }}
                      />
                    )}
                  </button>
                );
              })}
            </div>

            <span className="text-xs font-medium tabular-nums tracking-[0.2em] text-secondary/60">
              {String(activeIndex + 1).padStart(2, "0")} / {String(length).padStart(2, "0")}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default CircularDisplay;
