// ASCII-art renderer for project thumbnails (used by <AsciiThumb />).
//
// An image is sampled on an offscreen canvas into a character grid. Each cell gets a glyph from
// RAMP (by how far it stands out from the image's background) and the average colour of its
// foreground pixels. Every thumbnail shares ONE requestAnimationFrame loop (see `ticker` below),
// which only runs while some visible thumbnail has something to animate, and stops while the tab
// is hidden.

export const RAMP = ' .:-=+*#%@'
const SCRAMBLE = '!<>-_\\/[]{}=+*^?#%@$&01'
export const EFFECTS = ['default', 'glitch', 'draw', 'fill', 'assemble']

const DURATION = { intro: 800, default: 500, glitch: 650, draw: 1200, fill: 900, assemble: 1100 }
const EMPTY_BELOW = 0.09 // foreground strength under which a cell is empty space
const FONT_FAMILY = "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace"
const FONT_WEIGHT = 700
const GLOW_PX = 4 // blur radius of the glow layer (~ shadowBlur 8)
const GLOW_ALPHA = 0.35
const FILTERS = typeof document !== 'undefined' && 'filter' in document.createElement('canvas').getContext('2d')

const clamp = (v, lo, hi) => (v < lo ? lo : v > hi ? hi : v)
const easeOutCubic = (t) => 1 - (1 - t) ** 3
const easeOutBack = (t) => 1 + 2.4 * (t - 1) ** 3 + 1.4 * (t - 1) ** 2
// Small deterministic hash -> [0, 1)
const hash = (a, b = 0) => {
  let h = Math.imul(a ^ 0x9e3779b9, 0x85ebca6b) ^ Math.imul(b + 0x632be5ab, 0xc2b2ae35)
  h = Math.imul(h ^ (h >>> 15), 0x2c1b3c6d)
  return ((h ^ (h >>> 13)) >>> 0) / 4294967296
}
const scrambleGlyph = (i, now) => SCRAMBLE[Math.floor(hash(i, Math.floor(now / 55)) * SCRAMBLE.length)]
const mixToWhite = (rgb, k) =>
  `rgb(${rgb[0] + (255 - rgb[0]) * k | 0},${rgb[1] + (255 - rgb[1]) * k | 0},${rgb[2] + (255 - rgb[2]) * k | 0})`

/* ─────────────────────────── Image loading + sampling ─────────────────────────── */

const imageCache = new Map() // src -> Promise<HTMLImageElement>
export function loadImage(src) {
  if (!imageCache.has(src)) {
    imageCache.set(
      src,
      new Promise((resolve, reject) => {
        const img = new Image()
        img.crossOrigin = 'anonymous'
        img.decoding = 'async'
        img.onload = () => resolve(img)
        img.onerror = () => reject(new Error(`ASCII: failed to load ${src}`))
        img.src = src
      })
    )
    imageCache.get(src).catch(() => imageCache.delete(src))
  }
  return imageCache.get(src)
}

const SUB = 4 // sub-samples per cell side
const STRENGTH_SCALE = 160 // channel distance from the background that counts as fully inked

// Foreground strength of one (premultiplied) pixel against the background, 0..1
const inkStrength = (r, g, b, bg) =>
  clamp(Math.max(Math.abs(r - bg[0]), Math.abs(g - bg[1]), Math.abs(b - bg[2])) / STRENGTH_SCALE, 0, 1)

// Vivid version of a sampled colour: saturation x1.5, lightness at least 55% (hue kept).
// Saturated tints are also capped at 68% lightness so pastels read as rich pigments.
function vivid(r, g, b) {
  r /= 255; g /= 255; b /= 255
  const max = Math.max(r, g, b), min = Math.min(r, g, b)
  let h = 0, s = 0
  let l = (max + min) / 2
  const d = max - min
  if (d > 1e-6) {
    s = d / (1 - Math.abs(2 * l - 1))
    h = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4
    h /= 6
    if (h < 0) h += 1
  }
  s = Math.min(1, s * 1.5)
  l = Math.max(0.55, s > 0.25 ? Math.min(l, 0.68) : l)
  const c = (1 - Math.abs(2 * l - 1)) * s
  const x = c * (1 - Math.abs(((h * 6) % 2) - 1))
  const m = l - c / 2
  const [R, G, B] = [[c, x, 0], [x, c, 0], [0, c, x], [0, x, c], [x, 0, c], [c, 0, x]][Math.floor(h * 6) % 6]
  return [(R + m) * 255, (G + m) * 255, (B + m) * 255]
}

// Background colour (median of the border) and the bounding box of the icon, in image pixels.
// The crop lets every icon be scaled to the same share of the card, whatever its own margins.
const infoCache = new Map() // src -> { bg, crop }
export function analyzeImage(img) {
  if (infoCache.has(img.src)) return infoCache.get(img.src)
  const scale = Math.min(1, 256 / Math.max(img.naturalWidth, img.naturalHeight))
  const W = Math.max(1, Math.round(img.naturalWidth * scale))
  const H = Math.max(1, Math.round(img.naturalHeight * scale))
  const cvs = document.createElement('canvas')
  cvs.width = W
  cvs.height = H
  const c = cvs.getContext('2d', { willReadFrequently: true })
  c.drawImage(img, 0, 0, W, H)
  const px = c.getImageData(0, 0, W, H).data // throws without CORS -> caller falls back to <img>

  const border = [[], [], []]
  const pushPx = (x, y) => {
    const o = (y * W + x) * 4
    const a = px[o + 3] / 255
    for (let k = 0; k < 3; k++) border[k].push(px[o + k] * a)
  }
  for (let x = 0; x < W; x++) { pushPx(x, 0); pushPx(x, H - 1) }
  for (let y = 1; y < H - 1; y++) { pushPx(0, y); pushPx(W - 1, y) }
  const bg = border.map((ch) => ch.sort((a, b) => a - b)[ch.length >> 1])

  let x0 = W, y0 = H, x1 = -1, y1 = -1
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const o = (y * W + x) * 4
      const a = px[o + 3] / 255
      if (inkStrength(px[o] * a, px[o + 1] * a, px[o + 2] * a, bg) < 0.3) continue
      if (x < x0) x0 = x
      if (x > x1) x1 = x
      if (y < y0) y0 = y
      if (y > y1) y1 = y
    }
  }
  let crop = { x: 0, y: 0, w: img.naturalWidth, h: img.naturalHeight }
  if (x1 >= x0 && y1 >= y0) {
    const pad = 0.03 * Math.max(x1 - x0, y1 - y0) // keep soft edges / glow just outside the shape
    const cx0 = Math.max(0, x0 - pad), cy0 = Math.max(0, y0 - pad)
    const cx1 = Math.min(W, x1 + 1 + pad), cy1 = Math.min(H, y1 + 1 + pad)
    crop = { x: cx0 / scale, y: cy0 / scale, w: (cx1 - cx0) / scale, h: (cy1 - cy0) / scale }
  }
  const info = { bg, crop }
  infoCache.set(img.src, info)
  return info
}

const gridCache = new Map() // `${src}|${cols}x${rows}` -> grid

// Throws (SecurityError) if the image is cross-origin without CORS; callers fall back to <img>.
export function sampleGrid(img, cols, rows) {
  const key = `${img.src}|${cols}x${rows}`
  if (gridCache.has(key)) return gridCache.get(key)
  const { bg, crop } = analyzeImage(img)

  const W = cols * SUB
  const H = rows * SUB
  const cvs = document.createElement('canvas')
  cvs.width = W
  cvs.height = H
  const c = cvs.getContext('2d', { willReadFrequently: true })
  c.imageSmoothingQuality = 'high'
  c.drawImage(img, crop.x, crop.y, crop.w, crop.h, 0, 0, W, H)
  const px = c.getImageData(0, 0, W, H).data

  const n = cols * rows
  const glyph = new Uint8Array(n) // RAMP index, 0 = empty
  const strength = new Float32Array(n)
  const rgb = new Uint8Array(n * 3)
  const cells = []

  for (let cy = 0; cy < rows; cy++) {
    for (let cx = 0; cx < cols; cx++) {
      let s = 0
      let wSum = 0
      let r = 0, g = 0, b = 0
      for (let sy = 0; sy < SUB; sy++) {
        for (let sx = 0; sx < SUB; sx++) {
          const o = ((cy * SUB + sy) * W + cx * SUB + sx) * 4
          const a = px[o + 3] / 255
          const pr = px[o] * a, pg = px[o + 1] * a, pb = px[o + 2] * a
          const fs = inkStrength(pr, pg, pb, bg)
          s += fs
          // Colour comes from the foreground pixels only, so edges keep the icon's colour
          const w = fs * fs + 1e-4
          r += pr * w; g += pg * w; b += pb * w
          wSum += w
        }
      }
      s /= SUB * SUB
      const i = cy * cols + cx
      strength[i] = s
      if (s < EMPTY_BELOW) continue
      // Square-root curve: interiors land on the dense end (#%@), only true edges get . : -
      const u = (s - EMPTY_BELOW) / (1 - EMPTY_BELOW)
      glyph[i] = clamp(Math.round(Math.sqrt(u) * (RAMP.length - 1)), 1, RAMP.length - 1)
      const [R, G, B] = vivid(r / wSum, g / wSum, b / wSum)
      rgb[i * 3] = R
      rgb[i * 3 + 1] = G
      rgb[i * 3 + 2] = B
      cells.push(i)
    }
  }

  const colors = new Array(n)
  for (const i of cells) colors[i] = `rgb(${rgb[i * 3]},${rgb[i * 3 + 1]},${rgb[i * 3 + 2]})`
  const rand = new Float32Array(n)
  for (let i = 0; i < n; i++) rand[i] = hash(i, 7)

  const grid = { cols, rows, glyph, strength, rgb, colors, rand, cells: Int32Array.from(cells), analysis: {} }
  gridCache.set(key, grid)
  return grid
}

/* ─────────────────────────── Per-effect shape analysis (lazy, cached on the grid) ─────────────────────────── */

// Geodesic distance along the strokes from the leftmost ink, normalised to [0, 1] ("draw").
function strokeOrder(grid) {
  if (grid.analysis.stroke) return grid.analysis.stroke
  const { cols, rows, glyph, cells } = grid
  const dist = new Float32Array(cols * rows).fill(-1)
  const sorted = Array.from(cells).sort((a, b) => (a % cols) - (b % cols) || a - b)
  let offset = 0
  let max = 0
  for (const start of sorted) {
    if (dist[start] >= 0) continue
    // BFS one connected stroke; disconnected strokes are drawn after it
    const queue = [start]
    dist[start] = offset
    for (let q = 0; q < queue.length; q++) {
      const i = queue[q]
      const x = i % cols, y = (i / cols) | 0
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const nx = x + dx, ny = y + dy
          if ((!dx && !dy) || nx < 0 || ny < 0 || nx >= cols || ny >= rows) continue
          const j = ny * cols + nx
          if (!glyph[j] || dist[j] >= 0) continue
          dist[j] = dist[i] + 1
          if (dist[j] > max) max = dist[j]
          queue.push(j)
        }
      }
    }
    offset = max + 2
  }
  for (const i of cells) dist[i] /= Math.max(1, max)
  return (grid.analysis.stroke = dist)
}

// Horizontal bands of ink separated by sparse rows (tier rows), for "fill".
function rowBands(grid) {
  if (grid.analysis.bands) return grid.analysis.bands
  const { cols, rows, strength } = grid
  const sums = new Float32Array(rows)
  for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) sums[y] += strength[y * cols + x]
  const peak = Math.max(...sums, 1e-6)
  const bandOf = new Int16Array(rows).fill(-1)
  let n = 0
  for (let y = 0; y < rows; y++) {
    if (sums[y] >= peak * 0.6) bandOf[y] = y > 0 && bandOf[y - 1] >= 0 ? bandOf[y - 1] : n++
  }
  if (n < 2) {
    // No clear bands: every row is its own band
    for (let y = 0; y < rows; y++) bandOf[y] = y
    n = rows
  } else {
    // Sparse rows join the nearest band
    for (let y = 0; y < rows; y++) {
      if (bandOf[y] >= 0) continue
      for (let d = 1; d < rows; d++) {
        const up = y - d >= 0 ? bandOf[y - d] : -1
        const down = y + d < rows ? bandOf[y + d] : -1
        if (up >= 0 || down >= 0) { bandOf[y] = up >= 0 ? up : down; break }
      }
    }
  }
  return (grid.analysis.bands = { bandOf, count: n })
}

// A thin, tall vertical line (the SH divider), for "assemble". Map cell -> 0..1 position along it.
function verticalLine(grid) {
  if (grid.analysis.line) return grid.analysis.line
  const { cols, rows, glyph } = grid
  const runs = []
  for (let x = 0; x < cols; x++) {
    let best = { len: 0, y0: 0 }
    let start = -1
    for (let y = 0; y <= rows; y++) {
      const on = y < rows && glyph[y * cols + x] >= 3
      if (on && start < 0) start = y
      if (!on && start >= 0) {
        if (y - start > best.len) best = { len: y - start, y0: start }
        start = -1
      }
    }
    runs.push(best)
  }
  const maxLen = Math.max(...runs.map((r) => r.len))
  const line = new Map()
  if (maxLen >= rows * 0.4) {
    const xs = runs.map((r, x) => x).filter((x) => runs[x].len >= maxLen * 0.9)
    // Only a thin line counts (<= 3 adjacent columns), not a solid block
    if (xs.length <= 3 && xs[xs.length - 1] - xs[0] < 3) {
      for (const x of xs) {
        const { len, y0 } = runs[x]
        for (let y = y0; y < y0 + len; y++) line.set(y * cols + x, (y - y0) / Math.max(1, len - 1))
      }
    }
  }
  return (grid.analysis.line = line)
}

// Solid filled regions (the padlock body + shackle), for "glitch" pulsing.
function solidRegions(grid) {
  if (grid.analysis.solid) return grid.analysis.solid
  const { cols, rows, glyph } = grid
  const core = new Uint8Array(cols * rows)
  const rx = Math.max(2, Math.round(cols / 30)), ry = Math.max(1, Math.round(rx / 2))
  for (let y = ry; y < rows - ry; y++) {
    for (let x = rx; x < cols - rx; x++) {
      let all = true
      for (let dy = -ry; dy <= ry && all; dy++)
        for (let dx = -rx; dx <= rx && all; dx++) if (glyph[(y + dy) * cols + x + dx] < 5) all = false
      if (all) core[y * cols + x] = 1
    }
  }
  // Grow the cores to cover the whole solid shape (connected ink within a few cells)
  const solid = new Uint8Array(cols * rows)
  const grow = rx + 2
  for (let i = 0; i < core.length; i++) {
    if (!core[i]) continue
    const x = i % cols, y = (i / cols) | 0
    for (let dy = -grow; dy <= grow; dy++)
      for (let dx = -grow * 2; dx <= grow * 2; dx++) {
        const nx = x + dx, ny = y + dy
        if (nx >= 0 && ny >= 0 && nx < cols && ny < rows && glyph[ny * cols + nx]) solid[ny * cols + nx] = 1
      }
  }
  return (grid.analysis.solid = solid)
}

/* ─────────────────────────── Effects ───────────────────────────
   Each effect sets `out` for one inked cell at progress t (0..1):
   out.g glyph ('' hides it), out.c colour, out.a alpha, out.dx / out.dy pixel offset. */

const effects = {
  intro(r, i, t, now, out) {
    const { cols, rand } = r.grid
    if (t < (i % cols) / cols * 0.75 + rand[i] * 0.25) {
      out.g = scrambleGlyph(i, now)
      out.a = 0.55
    }
  },

  default(r, i, t, now, out) {
    const { cols, rand } = r.grid
    const band = 0.28
    const d = t * (1 + band + 0.06) - (i % cols) / cols - rand[i] * 0.06
    if (d >= 0 && d < band) {
      out.g = scrambleGlyph(i, now)
      out.c = mixToWhite(r.rgbOf(i), 0.35 * (1 - d / band))
    }
  },

  glitch(r, i, t, now, out) {
    const { cols, glyph } = r.grid
    const y = (i / cols) | 0
    const on = t < 0.82
    if (on) {
      // Horizontal slices: random row bands shift sideways, re-rolled every ~70ms
      const seed = Math.floor(now / 70)
      const bandH = 2 + Math.floor(hash(seed, 3) * 4)
      const band = Math.floor((y + Math.floor(hash(seed, 5) * bandH)) / bandH)
      const roll = hash(band, seed)
      if (roll > 0.45) out.dx = (hash(band, seed + 1) - 0.5) * 2 * r.cw * 6 * (1 - t / 0.82)
      if (hash(i, seed) > 0.93) out.g = scrambleGlyph(i, now)
    }
    if (r.solid()[i]) {
      // Padlock pulse: two beats that settle by the end
      const p = Math.max(0, Math.sin(t * Math.PI * 4)) * (1 - t)
      if (p > 0.05) {
        out.g = RAMP[Math.min(RAMP.length - 1, glyph[i] + 2)]
        out.c = mixToWhite(r.rgbOf(i), p * 0.7)
      }
    }
  },

  draw(r, i, t, now, out) {
    if (t < 0.18) {
      // Erase: characters dissolve
      if (r.grid.rand[i] < t / 0.18) out.g = ''
      return
    }
    const u = (t - 0.18) / 0.82
    const d = r.stroke()[i]
    if (d > u) out.g = ''
    else if (u - d < 0.05 && u < 1) {
      // The pen tip
      out.g = '@'
      out.c = mixToWhite(r.rgbOf(i), 0.6)
    }
  },

  fill(r, i, t, now, out) {
    const { cols } = r.grid
    const { bandOf, count } = r.bands()
    const at = (bandOf[(i / cols) | 0] + ((i % cols) / cols) * 0.85) / count
    if (t < at) {
      out.g = '·'
      out.a = 0.28
    } else if (t - at < 0.06 && t < 1) {
      out.c = mixToWhite(r.rgbOf(i), 0.55)
    }
  },

  assemble(r, i, t, now, out) {
    const line = r.line()
    if (line.has(i)) {
      // The divider draws last, top to bottom
      const u = (t - 0.68) / 0.3
      const pos = line.get(i)
      if (u < pos) out.g = ''
      else if (u - pos < 0.12 && u < 1) out.c = '#fff'
      return
    }
    const { rand } = r.grid
    const ang = rand[i] * Math.PI * 2
    const rad = (0.25 + 0.75 * hash(i, 11)) * Math.max(r.w, r.h) * 0.4
    let k
    if (t < 0.25) k = easeOutCubic(t / 0.25)
    else k = 1 - easeOutBack(clamp((t - 0.25) / 0.5, 0, 1))
    out.dx = Math.cos(ang) * rad * k
    out.dy = Math.sin(ang) * rad * k
    if (Math.abs(k) > 0.15) out.a = 0.85
  },
}

/* ─────────────────────────── Renderer (one per thumbnail) ─────────────────────────── */

const out = { g: '', c: '', a: 1, dx: 0, dy: 0 }

export class AsciiRenderer {
  constructor(canvas, { effect = 'default', color = null, interactive = true, idle = true } = {}) {
    this.canvas = canvas
    this.ctx = canvas.getContext('2d')
    this.effect = EFFECTS.includes(effect) ? effect : 'default'
    this.color = color
    this.interactive = interactive // hover/focus/tap effects
    this.idle = idle // idle flicker
    this.static = false // reduced motion: final frame only
    this.ready = true // false while the site's first-visit splash covers the page
    this.grid = null
    this.visible = false
    this.introDone = false
    this.anim = null // { kind, start, dur }
    this.flicker = [] // [{ i, g, until }]
    this.nextFlickerAt = 0
    this.dirty = false
    this.w = this.h = 0
  }

  rgbOf(i) {
    const { rgb } = this.grid
    return [rgb[i * 3], rgb[i * 3 + 1], rgb[i * 3 + 2]]
  }
  stroke() { return strokeOrder(this.grid) }
  bands() { return rowBands(this.grid) }
  line() { return verticalLine(this.grid) }
  solid() { return solidRegions(this.grid) }

  // Box size in CSS px, the fitted image rect inside it, and the grid for that rect.
  layout(grid, { w, h, x, y, cw, ch, fontSize }) {
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    this.canvas.width = Math.round(w * dpr)
    this.canvas.height = Math.round(h * dpr)
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    // Glyphs are drawn to an offscreen layer, then composited twice: blurred (glow) and sharp
    this.layer ??= document.createElement('canvas')
    this.layer.width = this.canvas.width
    this.layer.height = this.canvas.height
    this.lctx = this.layer.getContext('2d')
    this.lctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    Object.assign(this, { grid, w, h, ox: x, oy: y, cw, ch, fontSize, dpr })
    if (grid.cells.length === 0) this.introDone = true
    // Resizing clears the canvas: repaint now if the intro has already played (even off-screen)
    if (this.introDone && !this.anim) this.draw(performance.now())
    this.maybeIntro()
  }

  setVisible(v) {
    this.visible = v
    this.maybeIntro()
  }

  setReady(v) {
    this.ready = v
    this.maybeIntro()
  }

  // The intro decode runs once, as soon as the card is both on screen and sampled.
  maybeIntro() {
    if (this.visible && this.ready && this.grid && !this.introDone && !this.anim) {
      if (this.static) this.introDone = true
      else this.start('intro')
    }
    this.dirty = true
    ticker.wake()
  }

  start(kind) {
    this.anim = { kind, start: performance.now(), dur: DURATION[kind] }
    this.flicker = []
    ticker.wake()
  }

  // Hover / focus / tap. Ignored while something is already playing.
  play() {
    if (this.static || !this.interactive || !this.grid || !this.introDone || this.anim) return
    this.start(this.effect)
  }

  needsFrames() {
    return this.visible && this.grid && (this.anim || (this.dirty && this.introDone) || this.flicker.length > 0)
  }

  tick(now) {
    if (!this.visible || !this.grid || (!this.introDone && !this.anim)) return
    let t = 1
    if (this.anim) {
      t = Math.min(1, (now - this.anim.start) / this.anim.dur)
      if (t >= 1) {
        if (this.anim.kind === 'intro') this.introDone = true
        this.anim = null
        this.nextFlickerAt = now + 2500 + Math.random() * 2500
      }
      this.dirty = true
    }

    // Idle flicker: a handful of glyphs step to a neighbouring ramp glyph for ~100ms
    if (this.idle && !this.static && this.introDone && !this.anim) {
      const before = this.flicker.length
      this.flicker = this.flicker.filter((f) => f.until > now)
      if (this.flicker.length !== before) this.dirty = true
      if (now >= this.nextFlickerAt && this.grid.cells.length) {
        const { cells, glyph } = this.grid
        const count = 3 + Math.floor(Math.random() * 6)
        for (let k = 0; k < count; k++) {
          const i = cells[Math.floor(Math.random() * cells.length)]
          const g = clamp(glyph[i] + (Math.random() < 0.5 ? -1 : 1), 1, RAMP.length - 1)
          this.flicker.push({ i, g: RAMP[g], until: now + 100 })
        }
        this.nextFlickerAt = now + 2500 + Math.random() * 2500
        this.dirty = true
      }
    }

    if (!this.dirty) return
    this.dirty = false
    this.draw(now, this.anim ? this.anim.kind : null, this.anim ? t : 1)
  }

  draw(now, kind = null, t = 1) {
    const { lctx: ctx, grid, cw, ch, ox, oy } = this
    const { cols, cells, glyph, colors } = grid
    const fx = kind && effects[kind]
    // Without canvas filters (older Safari) the glow falls back to a per-glyph shadow
    const shadowGlow = !FILTERS
    ctx.clearRect(0, 0, this.w, this.h)
    ctx.font = `${FONT_WEIGHT} ${this.fontSize}px ${FONT_FAMILY}`
    ctx.shadowBlur = shadowGlow ? GLOW_PX * 2 * this.dpr : 0
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'

    const flick = this.flicker.length ? new Map(this.flicker.map((f) => [f.i, f.g])) : null
    const split = kind === 'glitch' && t < 0.45 ? cw * 1.6 * (1 - t / 0.45) : 0
    const passes = split ? [['', 0], ['rgba(255,40,70,0.75)', -split], ['rgba(40,230,255,0.75)', split]] : [['', 0]]

    for (const [tint, shift] of passes) {
      ctx.globalCompositeOperation = tint ? 'lighter' : 'source-over'
      for (let k = 0; k < cells.length; k++) {
        const i = cells[k]
        out.g = flick?.get(i) ?? RAMP[glyph[i]]
        out.c = this.color || colors[i]
        out.a = 1
        out.dx = out.dy = 0
        if (fx) fx(this, i, t, now, out)
        if (!out.g || out.g === ' ') continue
        if (tint && out.dx === 0 && hash(i, Math.floor(now / 70)) > 0.5) continue
        ctx.globalAlpha = tint ? out.a * 0.6 : out.a
        ctx.fillStyle = tint || out.c
        if (shadowGlow) ctx.shadowColor = tint || out.c
        ctx.fillText(out.g, ox + ((i % cols) + 0.5) * cw + out.dx + shift, oy + (((i / cols) | 0) + 0.5) * ch + out.dy)
      }
    }
    ctx.globalAlpha = 1
    ctx.globalCompositeOperation = 'source-over'

    const main = this.ctx
    main.save()
    main.setTransform(1, 0, 0, 1, 0, 0)
    main.clearRect(0, 0, this.canvas.width, this.canvas.height)
    if (!shadowGlow) {
      // Glow in each glyph's own colour: the same layer, blurred, at ~35% opacity underneath
      main.filter = `blur(${GLOW_PX * this.dpr}px)`
      main.globalAlpha = GLOW_ALPHA
      main.drawImage(this.layer, 0, 0)
      main.filter = 'none'
      main.globalAlpha = 1
    }
    main.drawImage(this.layer, 0, 0)
    main.restore()
  }

  destroy() {
    ticker.remove(this)
  }
}

/* ─────────────────────────── Shared animation loop ─────────────────────────── */

export const ticker = {
  items: new Set(),
  raf: 0,
  timer: 0,
  hiddenAt: 0,

  add(r) {
    this.items.add(r)
    this.wake()
  },
  remove(r) {
    this.items.delete(r)
  },

  wake() {
    if (this.raf || document.hidden) return
    clearTimeout(this.timer)
    this.timer = 0
    this.raf = requestAnimationFrame(this.frame)
  },

  frame(now) {
    const self = ticker
    self.raf = 0
    let busy = false
    let nextIdle = Infinity
    for (const r of self.items) {
      r.tick(now)
      if (r.needsFrames()) busy = true
      else if (r.visible && r.idle && !r.static && r.introDone) nextIdle = Math.min(nextIdle, r.nextFlickerAt)
    }
    if (busy) self.raf = requestAnimationFrame(self.frame)
    else if (nextIdle < Infinity) self.timer = setTimeout(() => self.wake(), Math.max(16, nextIdle - performance.now()))
  },

  onVisibility() {
    const self = ticker
    if (document.hidden) {
      cancelAnimationFrame(self.raf)
      clearTimeout(self.timer)
      self.raf = self.timer = 0
      self.hiddenAt = performance.now()
    } else {
      // Resume animations where they paused
      const gap = self.hiddenAt ? performance.now() - self.hiddenAt : 0
      for (const r of self.items) {
        if (r.anim) r.anim.start += gap
        r.nextFlickerAt += gap
      }
      self.hiddenAt = 0
      self.wake()
    }
  },
}
if (typeof document !== 'undefined') document.addEventListener('visibilitychange', ticker.onVisibility)
