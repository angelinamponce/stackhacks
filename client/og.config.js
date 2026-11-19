// Social-share previews (Open Graph / Twitter cards), shared by:
//   - vite.config.js: bakes each page's tags into its own HTML file at build time
//     (dist/<route>/index.html), since link crawlers don't run JavaScript
//   - og-template.html + src/og/: renders each preview image with the site's fonts and ASCII art
//   - scripts/generate-og.js (`npm run og`): screenshots the previews to public/og/*.png
//
// Pages without their own `variant` image use the main one (home.png).

export const SITE_URL = 'https://stackhacksbu.com'
export const SITE_NAME = 'StackHacks'
export const OG_SIZE = { width: 1200, height: 630 }

const TAGLINE = 'Build real-world projects with mentorship, networking, and community.'

export const OG_PAGES = [
  {
    route: '/',
    variant: 'home',
    title: 'StackHacks',
    docTitle: 'StackHacks · Binghamton University',
    description: 'StackHacks is a project-driven computer science club at Binghamton University. ' + TAGLINE,
    alt: 'StackHacks: ' + TAGLINE + ' The SH logo drawn in ASCII characters on a dark background with gold circuit traces.',
  },
  {
    route: '/projects',
    variant: 'projects',
    title: 'Member Projects',
    description: 'Real-world applications, tools, and platforms built by StackHacks project teams at Binghamton University.',
    alt: 'Member Projects at StackHacks: four project icons drawn in ASCII characters on a dark background.',
  },
  {
    route: '/about',
    variant: 'about',
    title: 'About StackHacks',
    docTitle: 'About · StackHacks',
    description: "Binghamton's project-driven computer science club: our story, founders, and how to get involved.",
    alt: 'About StackHacks: a head with a brain drawn in ASCII characters, with glowing gold circuit traces.',
  },
  {
    route: '/eboard',
    variant: 'eboard',
    title: 'Executive Board',
    description: 'Meet the student engineers and organizers leading StackHacks at Binghamton University.',
    alt: 'The StackHacks Executive Board: three people above a gear, drawn in ASCII characters.',
  },
  {
    route: '/community',
    variant: 'community',
    title: 'Community',
    description: 'Ceremonies, workshops, and Hack Madness: the StackHacks community at Binghamton University.',
    alt: 'The StackHacks community: two people celebrating beside a flag on a mountain ledge, drawn in ASCII characters.',
  },
  // No image of their own: these use the main preview
  {
    route: '/events',
    title: 'Events',
    description: 'Upcoming StackHacks workshops, tech talks, and hackathons at Binghamton University.',
  },
  {
    route: '/contact',
    title: 'Contact',
    description: 'Get in touch with StackHacks at Binghamton University.',
  },
]

export const OG_TAGLINE = TAGLINE
export const ogImageFor = (page) => `/og/${page.variant || 'home'}.png`
export const ogAltFor = (page) => page.alt || OG_PAGES[0].alt
