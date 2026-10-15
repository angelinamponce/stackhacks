import { client } from '../sanityClient'
import citiLogo from '../assets/logos/citi.svg'
import SHTrans from '/SHTrans.png'

// Partner logo overrides applied on top of the Sanity "company" documents.
// Nordstrom was replaced by Citigroup; update the CMS entry to make this permanent.
const COMPANY_OVERRIDES = {
  nordstrom: { title: 'Citigroup', image: citiLogo },
}

const applyOverrides = (companies) =>
  companies.map((c) => {
    const override = COMPANY_OVERRIDES[c.title?.trim().toLowerCase()]
    return override ? { ...c, ...override } : c
  })

let pending = null

/**
 * The "Our Professional Experience" companies (title + logo URL), shared by the logo strip
 * and the E-Board experience chips. Fetched once per page load.
 */
export function fetchCompanies() {
  if (!pending) {
    pending = client
      .fetch(`*[_type == "company"] | order(_createdAt asc) { _id, title, "image": image.asset->url }`)
      .then((data) => applyOverrides(data || []))
      .catch((e) => { pending = null; throw e })
  }
  return pending
}

/** title (lowercase) -> logo URL, for matching experience entries to strip logos. */
export const logoMap = (companies) => Object.fromEntries(companies.filter((c) => c.image).map((c) => [c.title.toLowerCase(), c.image]))

/** Resolves an experience entry's logo: a strip company by title, or the club's own logo. */
export function logoFor(entry, logos) {
  if (!entry?.logo) return null
  if (entry.logo === 'stackhacks') return SHTrans
  return logos?.[entry.logo.toLowerCase()] || null
}
