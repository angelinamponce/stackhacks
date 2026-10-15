const SIZES = {
  sm: 'px-3 py-1 text-[11px] tracking-[0.25em]',
  md: 'px-5 py-1.5 text-sm tracking-[0.3em]',
  lg: 'px-7 py-2 text-base sm:text-xl tracking-[0.35em]',
}

/** Solid gold-to-orange bar with black text, e.g. "2026 - 2027". */
export default function GradientBanner({ children, size = 'md', as = 'span', className = '' }) {
  const Tag = as
  return (
    <Tag
      className={`inline-flex items-center justify-center rounded-md bg-[image:var(--gradient-gold)] font-mono font-bold uppercase text-black shadow-[var(--shadow-glow-sm)] ${SIZES[size]} ${className}`}
    >
      {children}
    </Tag>
  )
}
