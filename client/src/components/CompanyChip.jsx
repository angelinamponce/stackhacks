import { logoFor } from '../lib/companies'

// Same look as the "Our Professional Experience" strip cards (Hero.jsx LogoMarquee)
const chipBase =
  'flex items-center justify-center rounded-xl border border-white/[0.08] bg-gradient-to-b from-white/[0.05] to-white/[0.015] px-2.5 transition-colors duration-300'

/**
 * Company chip: the real logo when there is one, otherwise a clean text chip. The logo is the
 * entry's own `logoSrc` (a local file) or the strip company named by `logo`. `logoTone: 'light'`
 * puts dark logos on a light plate so they stay legible on the dark site.
 * Entries with no company named (role only) render the role as the chip text.
 */
export default function CompanyChip({ entry, logos, size = 'sm', glow = false, className = '' }) {
  const src = entry.logoSrc || logoFor(entry, logos)
  const plate = src && entry.logoTone === 'light' ? '!bg-white/95 !from-white/95 !to-white/90' : ''
  // Long names can carry a short chipLabel (e.g. "MIST", "Watson College")
  const label = entry.chipLabel || entry.company || entry.role
  // lg: the detail card's large chips, with the strip's gold border glow
  const box = {
    sm: 'min-h-10 py-1.5',
    md: 'min-h-12 py-2',
    lg: 'min-h-16 py-2.5 px-4 !border-accent/30 shadow-[0_0_20px_-6px_rgba(254,178,58,0.5),0_10px_24px_-16px_rgba(0,0,0,0.9)]',
  }[size]
  const logoSize = { sm: 'max-h-7', md: 'max-h-8', lg: 'max-h-10' }[size]
  return (
    <span className={`${chipBase} ${box} ${plate} ${glow ? '!border-accent/25 shadow-[0_0_16px_-6px_rgba(254,178,58,0.5)]' : ''} ${className}`} title={entry.company || label}>
      {src ? (
        <img src={src} alt={entry.company} loading="lazy" className={`${logoSize} max-w-full object-contain opacity-90`} />
      ) : (
        <span className={`text-center font-semibold leading-tight text-primary/90 ${size === 'lg' ? 'text-sm' : 'text-[11px]'}`}>{label}</span>
      )}
    </span>
  )
}
