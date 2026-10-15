import { Link } from 'react-router-dom'
import { LayoutGrid, Folder, FileText, Wifi, BatteryFull } from 'lucide-react'

const DEFAULT_ITEMS = [
  { icon: LayoutGrid, label: 'Home', to: '/' },
  { icon: Folder, label: 'Projects', to: '/projects' },
  { icon: FileText, label: 'Events', to: '/events' },
]

const iconBox =
  'flex h-9 w-9 items-center justify-center rounded-lg border-2 border-gold/70 text-gold transition-all duration-300 hover:border-gold hover:bg-gold/10 hover:shadow-[var(--shadow-glow-sm)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/60'

/**
 * Bottom taskbar from the 2026-2027 graphic: app icons left, SH logo centred,
 * status icons right. Pass `status` to replace the default wifi/battery area.
 */
export default function Taskbar({ items = DEFAULT_ITEMS, status, className = '' }) {
  return (
    <div className={`grid grid-cols-[1fr_auto_1fr] items-center gap-3 px-3 sm:px-5 py-2.5 ${className}`}>
      <nav aria-label="Taskbar" className="flex items-center gap-2">
        {items.map((item) => (
          <Link key={item.label} to={item.to} aria-label={item.label} title={item.label} className={iconBox}>
            <item.icon className="h-4 w-4" strokeWidth={2} />
          </Link>
        ))}
      </nav>

      <Link to="/" aria-label="StackHacks home" className="group relative flex h-11 w-11 items-center justify-center rounded-full border-2 border-gold shadow-[var(--shadow-glow-sm)] transition-shadow duration-300 hover:shadow-[var(--shadow-glow)]">
        <img src="/SHTrans.png" alt="" className="h-6 w-6 object-contain" />
      </Link>

      <div className="flex items-center justify-end gap-3 text-gold">
        {status ?? (
          <>
            <Wifi className="h-4 w-4" aria-hidden="true" />
            <BatteryFull className="h-5 w-5" aria-hidden="true" />
          </>
        )}
      </div>
    </div>
  )
}
