import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { OG_PAGES, OG_SIZE, SITE_NAME, SITE_URL, ogAltFor, ogImageFor } from './og.config.js'

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;')
const pageUrl = (route) => `${SITE_URL}${route === '/' ? '/' : `${route}/`}`
const docTitle = (p) => p.docTitle || (p.route === '/' ? SITE_NAME : `${p.title} · ${SITE_NAME}`)

/** <title>, description, Open Graph and Twitter card tags for one page (see og.config.js). */
function socialTags(p) {
  const image = `${SITE_URL}${ogImageFor(p)}`
  const title = docTitle(p)
  const tags = [
    `<title>${esc(docTitle(p))}</title>`,
    `<meta name="description" content="${esc(p.description)}" />`,
    `<link rel="canonical" href="${pageUrl(p.route)}" />`,
    `<meta property="og:type" content="website" />`,
    `<meta property="og:site_name" content="${SITE_NAME}" />`,
    `<meta property="og:url" content="${pageUrl(p.route)}" />`,
    `<meta property="og:title" content="${esc(title)}" />`,
    `<meta property="og:description" content="${esc(p.description)}" />`,
    `<meta property="og:image" content="${image}" />`,
    `<meta property="og:image:type" content="image/png" />`,
    `<meta property="og:image:width" content="${OG_SIZE.width}" />`,
    `<meta property="og:image:height" content="${OG_SIZE.height}" />`,
    `<meta property="og:image:alt" content="${esc(ogAltFor(p))}" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${esc(title)}" />`,
    `<meta name="twitter:description" content="${esc(p.description)}" />`,
    `<meta name="twitter:image" content="${image}" />`,
    `<meta name="twitter:image:alt" content="${esc(ogAltFor(p))}" />`,
  ]
  return `<!-- social:start -->\n    ${tags.join('\n    ')}\n    <!-- social:end -->`
}
const SOCIAL_BLOCK = /<!-- social:start -->[\s\S]*?<!-- social:end -->/

/**
 * Link previews: crawlers don't run JavaScript and GitHub Pages serves deep links from 404.html
 * (with a 404 status), so each page in og.config.js gets its own built HTML file with its own tags,
 * served with a 200: dist/projects/index.html for /projects/, and so on. index.html (and the
 * 404.html fallback copied from it) carry the main page's tags.
 */
function socialMeta() {
  let outDir = 'dist'
  return {
    name: 'social-meta',
    configResolved(config) { outDir = path.resolve(config.root, config.build.outDir) },
    transformIndexHtml: { order: 'post', handler: (html) => html.replace(SOCIAL_BLOCK, socialTags(OG_PAGES[0])) },
    async closeBundle() {
      const html = await readFile(path.join(outDir, 'index.html'), 'utf8').catch(() => null)
      if (!html) return
      for (const p of OG_PAGES.filter((pg) => pg.route !== '/')) {
        const dir = path.join(outDir, p.route.slice(1))
        await mkdir(dir, { recursive: true })
        await writeFile(path.join(dir, 'index.html'), html.replace(SOCIAL_BLOCK, socialTags(p)))
      }
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), socialMeta()],
  // The site is served from the root of the custom domain (stackhacksbu.com)
  base: '/',
})
