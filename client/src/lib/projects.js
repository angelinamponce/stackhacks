// "StackHacks' Official Site" -> "stackhacks-official-site.app"
export const projectFileName = (title = 'project') =>
  `${title.toLowerCase().replace(/['’]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}.app`

// Sanity stores the track in `description`, e.g. "Cyber Security Track" -> "Cyber Security"
export const projectTrack = (project) => project.description?.replace(/\s*track$/i, '').trim() || null

// "Binghamton Tier List Maker" -> "binghamton-tier-list-maker" (anchor id on the Projects page)
export const projectSlug = (title = '') => title.toLowerCase().replace(/['’]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
