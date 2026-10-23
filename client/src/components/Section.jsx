/**
 * Themed page section for the editorial look. `theme` is 'dark' (charcoal) or 'light' (warm
 * off-white); switching a section's palette is a one-word change. Token-based utilities inside
 * (text-primary, text-secondary, bg-background, accent text) follow the theme automatically.
 * `fade` adds a soft charcoal hand-off at the top and/or bottom edge of a light section
 * ('top' | 'bottom' | 'both'), instead of a hard line between dark and light.
 */
export default function Section({ as = 'section', theme = 'dark', fade, className = '', children, ...rest }) {
  const Tag = as
  const fades = theme === 'light' && fade
    ? [fade === 'top' || fade === 'both' ? 'section-fade-top' : '', fade === 'bottom' || fade === 'both' ? 'section-fade-bottom' : ''].join(' ')
    : ''
  return (
    <Tag data-theme={theme} className={`relative ${fades} ${className}`} {...rest}>
      {children}
    </Tag>
  )
}
