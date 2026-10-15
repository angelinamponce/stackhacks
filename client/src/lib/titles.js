// Spell out abbreviated titles, e.g. "CEO & Co-Founder" -> "Chief Executive Officer & Co-Founder".
const TITLE_ABBREVIATIONS = {
  CEO: 'Chief Executive Officer',
  CMO: 'Chief Marketing Officer',
  CTO: 'Chief Technology Officer',
  CFO: 'Chief Financial Officer',
  COO: 'Chief Operating Officer',
  CIO: 'Chief Information Officer',
  CPO: 'Chief Product Officer',
  VP: 'Vice President',
  SVP: 'Senior Vice President',
  EVP: 'Executive Vice President',
  Dir: 'Director',
  Mgr: 'Manager',
  PR: 'Public Relations',
}
const ABBREVIATION_PATTERN = new RegExp(`\\b(${Object.keys(TITLE_ABBREVIATIONS).join('|')})\\b\\.?`, 'g')
// Non-breaking hyphen keeps "Co-Founder" from splitting across lines.
export const expandTitle = (title = '') =>
  title
    .replace(ABBREVIATION_PATTERN, (_, abbr) => TITLE_ABBREVIATIONS[abbr])
    .replace(/Co-Founder/gi, (m) => m.replace('-', '\u2011'))
