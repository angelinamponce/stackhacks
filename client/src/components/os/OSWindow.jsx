import { useId, useState } from 'react'
import { Minus, Square, X } from 'lucide-react'
import CircuitTraces from './CircuitTraces'

const btnBase =
  'flex h-7 w-7 items-center justify-center rounded-md border-2 border-gold/80 text-gold transition-all duration-200'
const btnLive =
  `${btnBase} cursor-pointer hover:border-gold hover:bg-gold/15 hover:shadow-[var(--shadow-glow-sm)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/60`

// A window button is only interactive when it has something real to do;
// otherwise it renders as matching decoration that isn't announced or focusable.
function WindowButton({ icon, label, onClick, ...aria }) {
  const Icon = icon
  if (!onClick) {
    return (
      <span className={`${btnBase} opacity-70`} aria-hidden="true">
        <Icon className="h-3.5 w-3.5" strokeWidth={2.5} />
      </span>
    )
  }
  return (
    <button type="button" onClick={onClick} aria-label={label} className={btnLive} {...aria}>
      <Icon className="h-3.5 w-3.5" strokeWidth={2.5} />
    </button>
  )
}

/**
 * Retro desktop-OS window: monospace folder tab, title bar with
 * minimize / maximize / close, thin gold line frame and optional circuit traces.
 *
 * - Minimize collapses the body (on by default; `minimizable={false}` to disable).
 * - Maximize / close are live only when `onMaximize` / `onClose` are passed.
 */
export default function OSWindow({
  tab,
  title,
  children,
  footer,
  onClose,
  onMaximize,
  maximized = false,
  minimizable = true,
  defaultMinimized = false,
  traces = true,
  tracesAnimated = true,
  className = '',
  bodyClassName = '',
  as = 'section',
  ...rest
}) {
  const Tag = as
  const [minimized, setMinimized] = useState(defaultMinimized)
  const bodyId = useId()

  return (
    <Tag className={`relative ${tab ? 'pt-9' : ''} ${className}`} {...rest}>
      {/* Folder tab sits on the frame's top edge; its black fill hides the frame line beneath it */}
      {tab && (
        <div className="absolute left-5 sm:left-8 top-0 z-10 flex h-[calc(2.25rem+2px)] max-w-[calc(100%-2.5rem)] items-center rounded-t-xl border-2 border-b-0 border-gold bg-void px-4 sm:px-5">
          <span className="mono-label truncate">{tab}</span>
        </div>
      )}

      <div className="line-frame relative isolate bg-void/60">
        {/* Title bar */}
        <div className="relative z-10 flex items-center justify-between gap-4 border-b-2 border-gold h-12 px-4 sm:px-5">
          <span className="truncate font-mono text-xs text-gold/80">{title}</span>
          <div className="flex shrink-0 items-center gap-2">
            <WindowButton
              icon={Minus}
              label={minimized ? 'Restore window' : 'Minimize window'}
              onClick={minimizable ? () => setMinimized((m) => !m) : undefined}
              aria-expanded={!minimized}
              aria-controls={bodyId}
            />
            <WindowButton
              icon={Square}
              label={maximized ? 'Restore size' : 'Maximize window'}
              onClick={onMaximize}
              aria-pressed={maximized}
            />
            <WindowButton icon={X} label="Close window" onClick={onClose} />
          </div>
        </div>

        {/* Body collapses via grid-rows 1fr -> 0fr, so no height measuring is needed */}
        <div
          id={bodyId}
          className={`grid flex-1 transition-[grid-template-rows] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${minimized ? 'grid-rows-[0fr]' : 'grid-rows-[1fr]'}`}
        >
          <div className="relative min-h-0 overflow-hidden" inert={minimized || undefined}>
            {traces && <CircuitTraces animated={tracesAnimated} />}
            <div className={`relative ${bodyClassName}`}>{children}</div>
          </div>
        </div>

        {footer && <div className="relative z-10 border-t-2 border-gold">{footer}</div>}
      </div>
    </Tag>
  )
}
