// Date helpers for E-Board involvement timelines. Dates are stored as "YYYY-MM" (end null = present);
// ranges, durations and "Involved since" are computed at render time.

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

const parse = (ym) => {
  if (!ym) return null
  const [y, m] = ym.split('-').map(Number)
  return { y, m }
}

export const formatMonth = (ym) => {
  const d = parse(ym)
  return d ? `${MONTHS[d.m - 1]} ${d.y}` : null
}

/** Current = still running (no end date), or explicitly flagged current without dates. */
export const isCurrent = (entry) => entry.current === true || (!!entry.start && !entry.end)

/** "Aug 2026 – Present", or null when the entry has no dates. */
export function dateRange(entry) {
  if (!entry.start) return null
  if (entry.end && entry.end === entry.start) return formatMonth(entry.start) // single-month role
  return `${formatMonth(entry.start)} – ${entry.end ? formatMonth(entry.end) : 'Present'}`
}

/** LinkedIn-style inclusive duration, e.g. "1 yr 3 mos", up to `now` for present roles. */
export function duration(entry, now = new Date()) {
  const s = parse(entry.start)
  if (!s) return null
  const e = parse(entry.end) || { y: now.getFullYear(), m: now.getMonth() + 1 }
  const months = Math.max(1, (e.y - s.y) * 12 + (e.m - s.m) + 1)
  const yrs = Math.floor(months / 12)
  const mos = months % 12
  return [yrs && `${yrs} yr${yrs > 1 ? 's' : ''}`, mos && `${mos} mo${mos > 1 ? 's' : ''}`].filter(Boolean).join(' ')
}

/** Earliest start across a member's involvement entries, e.g. "Jan 2024". */
export function involvedSince(entries = []) {
  const starts = entries.map((e) => e.start).filter(Boolean).sort()
  return starts.length ? formatMonth(starts[0]) : null
}
