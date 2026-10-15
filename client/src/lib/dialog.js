import { useEffect } from 'react'

const FOCUSABLE = 'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])'

/**
 * Modal dialog behaviour: moves focus into the dialog (to `initialFocusRef` if given),
 * traps Tab inside it, closes on Escape, locks page scroll, and restores focus on close
 * (to `returnFocusRef.current` if given, else to whatever was focused when it opened).
 */
export function useDialog(dialogRef, onClose, initialFocusRef, returnFocusRef) {
  useEffect(() => {
    const previouslyFocused = document.activeElement
    const dialog = dialogRef.current
    ;(initialFocusRef?.current || dialog?.querySelector(FOCUSABLE))?.focus()
    document.body.style.overflow = 'hidden'

    const onKeyDown = (e) => {
      if (e.key === 'Escape') { onClose(); return }
      if (e.key !== 'Tab' || !dialog) return
      const focusables = [...dialog.querySelectorAll(FOCUSABLE)]
      if (!focusables.length) return
      const first = focusables[0]
      const last = focusables[focusables.length - 1]
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus() }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus() }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = ''
      // Read the ref at close time on purpose: it tracks the item currently shown (e.g. after prev/next)
      // eslint-disable-next-line react-hooks/exhaustive-deps
      ;(returnFocusRef?.current || previouslyFocused)?.focus?.()
    }
  }, [dialogRef, onClose, initialFocusRef, returnFocusRef])
}
