// Regenerates the social-share preview images and the favicons:  npm run og
//
//   public/og/<variant>.png    1200x630 previews, one per variant in og.config.js (palette PNGs, < 300 KB)
//   public/favicon-32.png, public/favicon-48.png, public/apple-touch-icon.png (180x180)
//
// Uses the Vite dev server on port 5173 (starting one if needed), opens og-template.html?variant=... in your installed Chrome (via
// playwright-core, no browser download) with reduced motion on, so every ASCII piece renders in its
// final static state, and screenshots it at exactly 1200x630. Needs Google Chrome installed (or set
// CHROME_PATH to a Chromium/Chrome executable).
import { createServer } from 'vite'
import { chromium } from 'playwright-core'
import sharp from 'sharp'
import { mkdir, writeFile, stat } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import process from 'node:process'
import { OG_PAGES, OG_SIZE } from '../og.config.js'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const outDir = path.join(root, 'public/og')
const MAX_BYTES = 300 * 1024

async function launch() {
  if (process.env.CHROME_PATH) return chromium.launch({ executablePath: process.env.CHROME_PATH })
  try {
    return await chromium.launch({ channel: 'chrome' })
  } catch {
    throw new Error('Could not find Google Chrome. Install it, or set CHROME_PATH to a Chrome/Chromium executable.')
  }
}

/** Palette PNG (quantized + dithered): stepping colours down until it fits the size budget. */
async function optimize(png) {
  let out = null
  for (const colors of [256, 192, 128]) {
    out = await sharp(png).png({ palette: true, colors, dither: 0.6, effort: 10, compressionLevel: 9 }).toBuffer()
    if (out.length <= MAX_BYTES) break
  }
  return out
}

/** Solid SH logo (not ASCII) centred on a dark square, for favicons and the iOS home-screen icon. */
async function icon(size, file) {
  const logo = await sharp(path.join(root, 'public/SHTrans.png'))
    .extract({ left: 95, top: 44, width: 300, height: 380 }) // the letters (see components/ShLogo.jsx)
    .resize({ height: Math.round(size * 0.8), fit: 'inside', kernel: 'lanczos3' })
    .toBuffer()
  const png = await sharp({ create: { width: size, height: size, channels: 4, background: '#0e0e0f' } })
    .composite([{ input: logo, gravity: 'centre' }])
    .png({ compressionLevel: 9 })
    .toBuffer()
  await writeFile(path.join(root, 'public', file), png)
  console.log(`  ${file}  ${size}x${size}`)
}

// Port 5173: the Sanity project only allows that localhost origin (CORS) for its data API and images,
// which the Projects preview needs. Reuse a dev server already running there, else start one.
const PORT = 5173
let server = null
let base = `http://localhost:${PORT}/`
const running = await fetch(`${base}og-template.html`).then((r) => r.ok && r.text()).catch(() => null)
if (!running?.includes('social preview template')) {
  server = await createServer({ root, server: { port: PORT, strictPort: true }, logLevel: 'error' })
  await server.listen()
  base = server.resolvedUrls.local[0]
}
const browser = await launch()
try {
  await mkdir(outDir, { recursive: true })
  const page = await browser.newPage({ viewport: OG_SIZE, deviceScaleFactor: 1, reducedMotion: 'reduce' })
  page.on('pageerror', (e) => console.error('  page error:', e.message))
  for (const { variant } of OG_PAGES.filter((p) => p.variant)) {
    await page.goto(`${base}og-template.html?variant=${variant}`, { waitUntil: 'networkidle' })
    await page.waitForFunction(() => document.body.dataset.ready === '1', null, { timeout: 30000 })
    const raw = await page.screenshot({ clip: { x: 0, y: 0, ...OG_SIZE } })
    const file = path.join(outDir, `${variant}.png`)
    await writeFile(file, await optimize(raw))
    const kb = Math.round((await stat(file)).size / 1024)
    console.log(`  og/${variant}.png  ${OG_SIZE.width}x${OG_SIZE.height}  ${kb} KB${kb * 1024 > MAX_BYTES ? '  (over the 300 KB target)' : ''}`)
  }
  await icon(32, 'favicon-32.png')
  await icon(48, 'favicon-48.png')
  await icon(180, 'apple-touch-icon.png')
} finally {
  await browser.close()
  await server?.close()
}
