// Procedural textures, drawn once on a canvas. Each "set" gives a colour map and a
// matching bump map so flat walls get real surface depth without any image files.
import * as THREE from 'three'

function rng(seed) {
  return () => {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const make = (w = 512, h = w) => {
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  return [c, c.getContext('2d')]
}

const toTex = (canvas, srgb = true) => {
  const t = new THREE.CanvasTexture(canvas)
  t.wrapS = t.wrapT = THREE.RepeatWrapping
  t.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace
  t.anisotropy = 8
  return t
}

function speckle(g, r, size, count, alpha, light) {
  const v = light ? 255 : 0
  for (let i = 0; i < count; i++) {
    g.fillStyle = `rgba(${v},${v},${v},${r() * alpha})`
    const s = 1 + r() * 2.4
    g.fillRect(r() * size, r() * size, s, s)
  }
}

function blotches(g, r, size, count, alpha, light) {
  const v = light ? 255 : 0
  for (let i = 0; i < count; i++) {
    const x = r() * size
    const y = r() * size
    const rad = size * (0.06 + r() * 0.16)
    const grad = g.createRadialGradient(x, y, 0, x, y, rad)
    grad.addColorStop(0, `rgba(${v},${v},${v},${alpha})`)
    grad.addColorStop(1, `rgba(${v},${v},${v},0)`)
    g.fillStyle = grad
    g.fillRect(x - rad, y - rad, rad * 2, rad * 2)
  }
}

/** Returns copies of a set with their own tiling. */
export function tile(set, x, y) {
  const out = {}
  for (const [k, t] of Object.entries(set)) {
    const c = t.clone()
    c.repeat.set(x, y)
    c.needsUpdate = true
    out[k] = c
  }
  return out
}

const cache = new Map()
const once = (key, build) => {
  if (!cache.has(key)) cache.set(key, build())
  return cache.get(key)
}

export function brickSet({ hue = 8, sat = 45, light = 33, mortar = '#2a1b1c', rows = 16, cols = 8, seed = 7 } = {}) {
  return once(`brick-${hue}-${sat}-${light}-${mortar}-${rows}-${cols}-${seed}`, () => {
    const S = 1024
    const [c, g] = make(S)
    const [cb, gb] = make(S)
    const r = rng(seed)
    g.fillStyle = mortar
    g.fillRect(0, 0, S, S)
    gb.fillStyle = '#262626'
    gb.fillRect(0, 0, S, S)
    const bh = S / rows
    const bw = S / cols
    const J = 3.5 // half the mortar joint

    // One brick, drawn from its own random sequence so the copy that wraps around matches.
    const brick = (x, y, id) => {
      const q = rng(id * 97 + seed)
      const l = light + q() * 14 - 7 - (q() > 0.86 ? 10 : 0) + (q() > 0.93 ? 9 : 0)
      const w = bw - J * 2
      const h = bh - J * 2
      const x0 = x + J
      const y0 = y + J
      g.fillStyle = `hsl(${hue + q() * 10 - 5} ${sat + q() * 12 - 6}% ${l}%)`
      g.fillRect(x0, y0, w, h)
      // a darker or paler blotch on the face
      const px = x0 + q() * w
      const py = y0 + q() * h
      const rad = h * (0.5 + q() * 0.6)
      const grad = g.createRadialGradient(px, py, 0, px, py, rad)
      grad.addColorStop(0, q() > 0.5 ? 'rgba(0,0,0,0.2)' : 'rgba(255,235,220,0.12)')
      grad.addColorStop(1, 'rgba(0,0,0,0)')
      g.save()
      g.beginPath()
      g.rect(x0, y0, w, h)
      g.clip()
      g.fillStyle = grad
      g.fillRect(px - rad, py - rad, rad * 2, rad * 2)
      g.restore()
      // lit top edge, shadowed bottom edge
      g.fillStyle = 'rgba(255,255,255,0.17)'
      g.fillRect(x0, y0, w, 3)
      g.fillStyle = 'rgba(0,0,0,0.3)'
      g.fillRect(x0, y0 + h - 4, w, 4)
      const v = 150 + q() * 80
      gb.fillStyle = `rgb(${v},${v},${v})`
      gb.fillRect(x0, y0, w, h)
      for (const [y1, y2, by] of [
        [y0, y0 + 6, y0],
        [y0 + h, y0 + h - 6, y0 + h - 6],
      ]) {
        const b = gb.createLinearGradient(0, y1, 0, y2)
        b.addColorStop(0, 'rgba(0,0,0,0.7)')
        b.addColorStop(1, 'rgba(0,0,0,0)')
        gb.fillStyle = b
        gb.fillRect(x0, by, w, 6)
      }
      // a chipped corner now and then
      if (q() > 0.86) {
        const cx = q() > 0.5 ? x0 : x0 + w
        const cy = q() > 0.5 ? y0 : y0 + h
        const sx = cx === x0 ? 1 : -1
        const sy = cy === y0 ? 1 : -1
        for (const [ctx, fill] of [
          [g, mortar],
          [gb, '#202020'],
        ]) {
          ctx.fillStyle = fill
          ctx.beginPath()
          ctx.moveTo(cx, cy)
          ctx.lineTo(cx + sx * (8 + q() * 16), cy)
          ctx.lineTo(cx, cy + sy * (6 + q() * 10))
          ctx.closePath()
          ctx.fill()
        }
      }
    }
    for (let y = 0; y < rows; y++) {
      const ox = y % 2 ? bw / 2 : 0
      for (let x = 0; x < cols; x++) {
        const id = y * cols + x + 1
        brick(x * bw + ox, y * bh, id)
        if (x * bw + ox + bw > S) brick(x * bw + ox - S, y * bh, id)
      }
    }
    // soot and weathering across the whole wall
    for (let i = 0; i < 14; i++) patch(g, S, r() * S, r() * S, S * (0.08 + r() * 0.16), '0,0,0', 0.16)
    for (let i = 0; i < 8; i++) patch(g, S, r() * S, r() * S, S * (0.06 + r() * 0.12), '255,235,220', 0.06)
    speckle(g, r, S, 9000, 0.1, true)
    speckle(g, r, S, 9000, 0.18, false)
    speckle(gb, r, S, 12000, 0.3, false)
    return { map: toTex(c), bumpMap: toTex(cb, false) }
  })
}

/** A painted sports court: rolled-on colour with darker patches, sneaker scuffs and hairline cracks. */
export function courtSet(color = '#7a1f2b') {
  return once(`court-${color}`, () => {
    const S = 1024
    const [c, g] = make(S)
    const [cb, gb] = make(S)
    const [cr, gr] = make(S)
    const r = rng(31)
    g.fillStyle = color
    g.fillRect(0, 0, S, S)
    gb.fillStyle = '#808080'
    gb.fillRect(0, 0, S, S)
    gr.fillStyle = '#c4c4c4'
    gr.fillRect(0, 0, S, S)
    // roller bands
    for (let y = 0; y < S; y += 64) {
      const v = r() > 0.5 ? 255 : 0
      g.fillStyle = `rgba(${v},${v},${v},${0.015 + r() * 0.035})`
      g.fillRect(0, y, S, 64)
    }
    for (let i = 0; i < 18; i++) patch(g, S, r() * S, r() * S, S * (0.06 + r() * 0.16), '0,0,0', 0.17)
    for (let i = 0; i < 12; i++) patch(g, S, r() * S, r() * S, S * (0.05 + r() * 0.12), '255,200,200', 0.07)
    // sneaker scuffs
    g.lineCap = 'round'
    for (let i = 0; i < 110; i++) {
      g.strokeStyle = `rgba(${r() > 0.3 ? '255,225,225' : '0,0,0'},${0.05 + r() * 0.1})`
      g.lineWidth = 1.5 + r() * 4
      g.beginPath()
      const a = r() * Math.PI * 2
      g.arc(r() * S, r() * S, 20 + r() * 90, a, a + 0.25 + r() * 0.7)
      g.stroke()
    }
    for (let i = 0; i < 6; i++) {
      crack(
        [
          [g, 'rgba(0,0,0,0.5)', 1.5],
          [gb, 'rgba(0,0,0,0.7)', 2.2],
        ],
        r,
        80 + r() * (S - 160),
        80 + r() * (S - 160),
        9,
        30,
        r() * Math.PI * 2,
      )
    }
    speckle(g, r, S, 14000, 0.08, true)
    speckle(g, r, S, 14000, 0.12, false)
    speckle(gb, r, S, 16000, 0.2, false)
    speckle(gb, r, S, 16000, 0.2, true)
    for (let i = 0; i < 10; i++) patch(gr, S, r() * S, r() * S, S * (0.06 + r() * 0.14), '0,0,0', 0.35)
    return { map: toTex(c), bumpMap: toTex(cb, false), roughnessMap: toTex(cr, false) }
  })
}

/** Painted plaster with soft stains. `streaks` adds rain marks running down from the top. */
export function plasterSet({ color = '#17334f', seed = 3, streaks = 0, dirt = 0.5 } = {}) {
  return once(`plaster-${color}-${seed}-${streaks}-${dirt}`, () => {
    const S = 512
    const [c, g] = make(S)
    const [cb, gb] = make(S)
    const r = rng(seed)
    g.fillStyle = color
    g.fillRect(0, 0, S, S)
    gb.fillStyle = '#808080'
    gb.fillRect(0, 0, S, S)
    blotches(g, r, S, 14, 0.07 * dirt * 2, false)
    blotches(g, r, S, 10, 0.05, true)
    for (let i = 0; i < streaks; i++) {
      const x = r() * S
      const len = S * (0.2 + r() * 0.6)
      const grad = g.createLinearGradient(0, 0, 0, len)
      grad.addColorStop(0, 'rgba(0,0,0,0.22)')
      grad.addColorStop(1, 'rgba(0,0,0,0)')
      g.fillStyle = grad
      g.fillRect(x, 0, 3 + r() * 9, len)
    }
    speckle(g, r, S, 3000, 0.07, true)
    speckle(g, r, S, 3000, 0.1, false)
    speckle(gb, r, S, 5000, 0.22, false)
    speckle(gb, r, S, 5000, 0.22, true)
    return { map: toTex(c), bumpMap: toTex(cb, false) }
  })
}

/** Runs `draw` at (x, y) and at every wrapped copy that reaches into the canvas, so the result tiles. */
function tiled(S, x, y, pad, draw) {
  for (const ox of [-S, 0, S]) {
    for (const oy of [-S, 0, S]) {
      const px = x + ox
      const py = y + oy
      if (px < -pad || px > S + pad || py < -pad || py > S + pad) continue
      draw(px, py)
    }
  }
}

/** Soft round patch that wraps around the canvas edges. */
function patch(g, S, x, y, rad, rgb, alpha) {
  tiled(S, x, y, rad, (px, py) => {
    const grad = g.createRadialGradient(px, py, 0, px, py, rad)
    grad.addColorStop(0, `rgba(${rgb},${alpha})`)
    grad.addColorStop(1, `rgba(${rgb},0)`)
    g.fillStyle = grad
    g.fillRect(px - rad, py - rad, rad * 2, rad * 2)
  })
}

/** A wandering crack from (x, y); returns nothing, draws on every canvas passed in. */
function crack(ctxs, r, x, y, steps, stepLen, heading) {
  const pts = [[x, y]]
  let a = heading
  for (let k = 0; k < steps; k++) {
    a += (r() - 0.5) * 1.3
    x += Math.cos(a) * stepLen * (0.5 + r())
    y += Math.sin(a) * stepLen * (0.5 + r())
    pts.push([x, y])
  }
  for (const [g, style, width] of ctxs) {
    g.strokeStyle = style
    g.lineWidth = width
    g.lineJoin = 'round'
    g.beginPath()
    pts.forEach(([px, py], i) => (i ? g.lineTo(px, py) : g.moveTo(px, py)))
    g.stroke()
  }
}

/**
 * The hand-painted look of the Tripo models, for plain coloured parts: a near-white map that the
 * part's own colour is multiplied by (mottled brushwork, grime low down, light catching the top
 * and the edges), with a matching bump map (scratches, dents, softened edges) and roughness map.
 *
 *   frame  boxes: every face gets worn edges
 *   band   cylinders: wraps around, worn top rim
 *   soft   spheres: shading only
 *   flat   tiles in both directions, for rounded boxes
 */
export function paintSet(kind = 'frame') {
  return once(`paint-${kind}`, () => {
    const S = 512
    const [c, g] = make(S)
    const [cb, gb] = make(S)
    const [cr, gr] = make(S)
    const r = rng({ frame: 11, band: 23, soft: 37, flat: 51 }[kind] || 5)
    g.fillStyle = '#eeeeee'
    g.fillRect(0, 0, S, S)
    gb.fillStyle = '#808080'
    gb.fillRect(0, 0, S, S)
    gr.fillStyle = '#ececec'
    gr.fillRect(0, 0, S, S)

    // broad tonal patches
    for (let i = 0; i < 26; i++) {
      const v = r() > 0.6 ? 255 : 0
      patch(g, S, r() * S, r() * S, S * (0.08 + r() * 0.2), `${v},${v},${v}`, 0.05 + r() * 0.09)
    }
    // brush strokes
    g.lineCap = 'round'
    for (let i = 0; i < 320; i++) {
      const ang = (r() - 0.5) * 1.2 + (r() > 0.8 ? Math.PI / 2 : 0)
      const len = 18 + r() * 80
      const w = 3 + r() * 10
      const v = r() > 0.5 ? 255 : 0
      const a = 0.025 + r() * 0.06
      const dx = (Math.cos(ang) * len) / 2
      const dy = (Math.sin(ang) * len) / 2
      tiled(S, r() * S, r() * S, len, (px, py) => {
        g.strokeStyle = `rgba(${v},${v},${v},${a})`
        g.lineWidth = w
        g.beginPath()
        g.moveTo(px - dx, py - dy)
        g.lineTo(px + dx, py + dy)
        g.stroke()
      })
    }
    speckle(g, r, S, 2200, 0.07, false)
    speckle(g, r, S, 1400, 0.08, true)

    // bump: scratches, dents and fine grain
    for (let i = 0; i < 70; i++) {
      const ang = r() * Math.PI
      const len = 14 + r() * 70
      const dx = (Math.cos(ang) * len) / 2
      const dy = (Math.sin(ang) * len) / 2
      const a = 0.2 + r() * 0.35
      const w = 0.7 + r() * 1.1
      tiled(S, r() * S, r() * S, len, (px, py) => {
        gb.strokeStyle = `rgba(0,0,0,${a})`
        gb.lineWidth = w
        gb.beginPath()
        gb.moveTo(px - dx, py - dy)
        gb.lineTo(px + dx, py + dy)
        gb.stroke()
      })
    }
    for (let i = 0; i < 14; i++) patch(gb, S, r() * S, r() * S, 10 + r() * 34, '0,0,0', 0.22)
    for (let i = 0; i < 8; i++) patch(gb, S, r() * S, r() * S, 14 + r() * 40, '255,255,255', 0.16)
    speckle(gb, r, S, 5000, 0.14, false)
    speckle(gb, r, S, 5000, 0.14, true)
    // roughness: a few patches worn smoother
    for (let i = 0; i < 10; i++) patch(gr, S, r() * S, r() * S, S * (0.06 + r() * 0.14), '0,0,0', 0.3)

    if (kind !== 'flat') {
      // grime gathers low down, light catches the top
      let grad = g.createLinearGradient(0, S, 0, S * 0.5)
      grad.addColorStop(0, 'rgba(10,6,20,0.34)')
      grad.addColorStop(1, 'rgba(10,6,20,0)')
      g.fillStyle = grad
      g.fillRect(0, 0, S, S)
      grad = g.createLinearGradient(0, 0, 0, S * 0.3)
      grad.addColorStop(0, 'rgba(255,255,255,0.14)')
      grad.addColorStop(1, 'rgba(255,255,255,0)')
      g.fillStyle = grad
      g.fillRect(0, 0, S, S)
    }
    if (kind === 'frame' || kind === 'band') {
      // worn, paler edges, broken into chips; the bump map rounds the same edges off
      const sides = kind === 'frame' ? ['top', 'left', 'right'] : ['top']
      for (const side of sides) {
        let p = 0
        while (p < S) {
          const len = 10 + r() * 60
          const th = 2 + r() * 6
          g.fillStyle = `rgba(255,255,255,${0.22 + r() * 0.4})`
          if (side === 'top') g.fillRect(p, 0, len, th)
          else g.fillRect(side === 'left' ? 0 : S - th, p, th, len)
          p += len * (0.8 + r() * 0.5)
        }
        const E = 16
        const bevel =
          side === 'top' ? gb.createLinearGradient(0, 0, 0, E) : side === 'left' ? gb.createLinearGradient(0, 0, E, 0) : gb.createLinearGradient(S, 0, S - E, 0)
        bevel.addColorStop(0, 'rgba(0,0,0,0.6)')
        bevel.addColorStop(1, 'rgba(0,0,0,0)')
        gb.fillStyle = bevel
        if (side === 'top') gb.fillRect(0, 0, S, E)
        else gb.fillRect(side === 'left' ? 0 : S - E, 0, E, S)
      }
    }
    const set = { map: toTex(c), bumpMap: toTex(cb, false), roughnessMap: toTex(cr, false) }
    if (kind === 'frame' || kind === 'soft') {
      for (const t of Object.values(set)) t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping
    } else if (kind === 'band') {
      for (const t of Object.values(set)) t.wrapT = THREE.ClampToEdgeWrapping
    }
    return set
  })
}

/** Asphalt: aggregate, tar-sealed cracks, repair patches, oil stains and worn wheel tracks. */
export function asphaltSet(seed = 5) {
  return once(`asphalt-${seed}`, () => {
    const S = 1024
    const [c, g] = make(S)
    const [cb, gb] = make(S)
    const [cr, gr] = make(S)
    const r = rng(seed)
    g.fillStyle = '#23252d'
    g.fillRect(0, 0, S, S)
    gb.fillStyle = '#808080'
    gb.fillRect(0, 0, S, S)
    // green channel = roughness. Mostly rough, with smoother (wetter) areas.
    gr.fillStyle = '#cdcdcd'
    gr.fillRect(0, 0, S, S)

    for (let i = 0; i < 16; i++) patch(g, S, r() * S, r() * S, S * (0.08 + r() * 0.16), '0,0,0', 0.18)
    for (let i = 0; i < 10; i++) patch(g, S, r() * S, r() * S, S * (0.06 + r() * 0.14), '150,150,190', 0.06)
    // wheel tracks: two paler bands running the length of the road
    for (const v of [0.27, 0.74]) {
      const grad = g.createLinearGradient(0, S * (v - 0.09), 0, S * (v + 0.09))
      grad.addColorStop(0, 'rgba(160,160,180,0)')
      grad.addColorStop(0.5, 'rgba(160,160,180,0.07)')
      grad.addColorStop(1, 'rgba(160,160,180,0)')
      g.fillStyle = grad
      g.fillRect(0, S * (v - 0.09), S, S * 0.18)
    }
    // aggregate
    for (let i = 0; i < 26000; i++) {
      const v = r() > 0.45 ? 255 : 0
      g.fillStyle = `rgba(${v},${v},${v},${r() * (v ? 0.2 : 0.32)})`
      const s = 1 + r() * 2.6
      g.fillRect(r() * S, r() * S, s, s)
    }
    for (let i = 0; i < 600; i++) {
      g.fillStyle = `rgba(${150 + r() * 80},${150 + r() * 70},${160 + r() * 80},${0.12 + r() * 0.2})`
      const s = 2 + r() * 3
      g.fillRect(r() * S, r() * S, s, s * (0.6 + r() * 0.6))
    }
    // repair patches: darker, squarer, with a sealed outline
    for (let i = 0; i < 3; i++) {
      const w = 120 + r() * 160
      const h = 70 + r() * 90
      const x = 40 + r() * (S - w - 80)
      const y = 40 + r() * (S - h - 80)
      g.fillStyle = 'rgba(8,8,12,0.34)'
      g.fillRect(x, y, w, h)
      g.strokeStyle = 'rgba(0,0,0,0.6)'
      g.lineWidth = 3
      g.strokeRect(x, y, w, h)
      gr.fillStyle = 'rgba(255,255,255,0.35)'
      gr.fillRect(x, y, w, h)
      gb.fillStyle = 'rgba(255,255,255,0.12)'
      gb.fillRect(x, y, w, h)
    }
    // cracks: hairline ones, and a few sealed with glossy tar
    for (let i = 0; i < 9; i++) {
      crack(
        [
          [g, 'rgba(0,0,0,0.55)', 1.6],
          [gb, 'rgba(0,0,0,0.6)', 2.2],
        ],
        r,
        60 + r() * (S - 120),
        60 + r() * (S - 120),
        9,
        26,
        r() * Math.PI * 2,
      )
    }
    for (let i = 0; i < 4; i++) {
      crack(
        [
          [g, 'rgba(4,4,8,0.85)', 5 + r() * 3],
          [gr, 'rgba(0,0,0,0.75)', 7],
          [gb, 'rgba(255,255,255,0.3)', 6],
        ],
        r,
        80 + r() * (S - 160),
        80 + r() * (S - 160),
        8,
        34,
        r() * Math.PI * 2,
      )
    }
    // oil stains
    for (let i = 0; i < 7; i++) {
      const x = r() * S
      const y = S * (0.2 + r() * 0.6)
      const rad = 18 + r() * 40
      patch(g, S, x, y, rad, '0,0,0', 0.4)
      patch(gr, S, x, y, rad, '0,0,0', 0.5)
    }
    // damp areas
    for (let i = 0; i < 14; i++) patch(gr, S, r() * S, r() * S, S * (0.06 + r() * 0.14), '0,0,0', 0.6)
    speckle(gb, r, S, 22000, 0.34, false)
    speckle(gb, r, S, 22000, 0.34, true)
    return { map: toTex(c), bumpMap: toTex(cb, false), roughnessMap: toTex(cr, false) }
  })
}

/** Sidewalk: staggered, bevelled paving stones in slightly different tones, with cracks, chipped corners, stains and gum. */
export function pavingSet(seed = 9) {
  return once(`paving-${seed}`, () => {
    const S = 1024
    const N = 6 // stones per tile, each way
    const [c, g] = make(S)
    const [cb, gb] = make(S)
    const [cr, gr] = make(S)
    const r = rng(seed)
    const cell = S / N
    const G = 4 // half the joint width
    g.fillStyle = '#231f2b'
    g.fillRect(0, 0, S, S)
    gb.fillStyle = '#141414'
    gb.fillRect(0, 0, S, S)
    gr.fillStyle = '#f2f2f2'
    gr.fillRect(0, 0, S, S)

    // One stone. It draws from its own random sequence, so the copy that wraps
    // around the edge of the tile comes out identical.
    const stone = (x0, y0, w, h, id) => {
      const q = rng(id * 131 + 7)
      const hue = 250 + q() * 18
      const sat = 7 + q() * 7
      const lit = 40 + q() * 19
      const tone = g.createLinearGradient(x0, y0, x0 + w, y0 + h)
      tone.addColorStop(0, `hsl(${hue} ${sat}% ${lit + 5}%)`)
      tone.addColorStop(1, `hsl(${hue} ${sat + 2}% ${lit - 6}%)`)
      g.fillStyle = tone
      g.fillRect(x0, y0, w, h)
      const v = 170 + q() * 60
      gb.fillStyle = `rgb(${v},${v},${v})`
      gb.fillRect(x0, y0, w, h)
      g.save()
      gb.save()
      for (const ctx of [g, gb]) {
        ctx.beginPath()
        ctx.rect(x0, y0, w, h)
        ctx.clip()
      }
      // mottling inside the stone
      for (let i = 0; i < 5; i++) {
        const px = x0 + q() * w
        const py = y0 + q() * h
        const rad = 20 + q() * 50
        const dark = q() > 0.45
        const grad = g.createRadialGradient(px, py, 0, px, py, rad)
        grad.addColorStop(0, dark ? 'rgba(12,8,20,0.2)' : 'rgba(255,245,255,0.1)')
        grad.addColorStop(1, 'rgba(0,0,0,0)')
        g.fillStyle = grad
        g.fillRect(px - rad, py - rad, rad * 2, rad * 2)
      }
      // bevel: pale top and left edges, dark bottom and right ones
      g.fillStyle = 'rgba(255,255,255,0.3)'
      g.fillRect(x0, y0, w, 4)
      g.fillRect(x0, y0, 4, h)
      g.fillStyle = 'rgba(0,0,0,0.42)'
      g.fillRect(x0, y0 + h - 5, w, 5)
      g.fillRect(x0 + w - 5, y0, 5, h)
      const E = 11
      for (const [x1, y1, x2, y2, bx, by, bw, bh] of [
        [0, y0, 0, y0 + E, x0, y0, w, E],
        [0, y0 + h, 0, y0 + h - E, x0, y0 + h - E, w, E],
        [x0, 0, x0 + E, 0, x0, y0, E, h],
        [x0 + w, 0, x0 + w - E, 0, x0 + w - E, y0, E, h],
      ]) {
        const b = gb.createLinearGradient(x1, y1, x2, y2)
        b.addColorStop(0, 'rgba(0,0,0,0.75)')
        b.addColorStop(1, 'rgba(0,0,0,0)')
        gb.fillStyle = b
        gb.fillRect(bx, by, bw, bh)
      }
      // some stones are cracked right across
      if (q() > 0.66) {
        const fromLeft = q() > 0.5
        crack(
          [
            [g, 'rgba(12,8,18,0.7)', 2],
            [gb, 'rgba(0,0,0,0.85)', 2.8],
          ],
          q,
          fromLeft ? x0 : x0 + q() * w,
          fromLeft ? y0 + q() * h : y0,
          10,
          26,
          fromLeft ? 0 : Math.PI / 2,
        )
      }
      // and some have lost a corner
      if (q() > 0.72) {
        const cx = q() > 0.5 ? x0 : x0 + w
        const cy = q() > 0.5 ? y0 : y0 + h
        const sx = cx === x0 ? 1 : -1
        const sy = cy === y0 ? 1 : -1
        const a = 12 + q() * 22
        const b = 12 + q() * 22
        for (const [ctx, fill] of [
          [g, '#1e1a25'],
          [gb, '#101010'],
        ]) {
          ctx.fillStyle = fill
          ctx.beginPath()
          ctx.moveTo(cx, cy)
          ctx.lineTo(cx + sx * a, cy)
          ctx.lineTo(cx, cy + sy * b)
          ctx.closePath()
          ctx.fill()
        }
      }
      g.restore()
      gb.restore()
    }

    for (let row = 0; row < N; row++) {
      const shift = row % 2 ? cell / 2 : 0
      for (let i = 0; i < N; i++) {
        const x0 = i * cell + shift + G
        const y0 = row * cell + G
        const w = cell - G * 2
        const id = row * N + i + 1
        stone(x0, y0, w, w, id)
        if (x0 + w > S) stone(x0 - S, y0, w, w, id)
      }
    }
    // stains, damp patches
    for (let i = 0; i < 16; i++) patch(g, S, r() * S, r() * S, S * (0.05 + r() * 0.12), '10,6,18', 0.2)
    for (let i = 0; i < 8; i++) patch(g, S, r() * S, r() * S, S * (0.05 + r() * 0.1), '255,240,255', 0.07)
    for (let i = 0; i < 10; i++) patch(gr, S, r() * S, r() * S, S * (0.05 + r() * 0.12), '0,0,0', 0.4)
    // old chewing gum
    for (let i = 0; i < 46; i++) {
      const x = r() * S
      const y = r() * S
      const rad = 2.5 + r() * 3.5
      g.fillStyle = `rgba(${r() > 0.5 ? '14,10,20' : '205,198,214'},${0.35 + r() * 0.3})`
      g.beginPath()
      g.ellipse(x, y, rad, rad * (0.7 + r() * 0.5), r() * 3, 0, Math.PI * 2)
      g.fill()
    }
    speckle(g, r, S, 16000, 0.1, true)
    speckle(g, r, S, 16000, 0.16, false)
    speckle(gb, r, S, 16000, 0.2, false)
    speckle(gb, r, S, 9000, 0.14, true)
    return { map: toTex(c), bumpMap: toTex(cb, false), roughnessMap: toTex(cr, false) }
  })
}

/** Kerb stones: long blocks with joints, a worn pale top edge and grime where they meet the road. */
export function kerbSet() {
  return once('kerb', () => {
    const W = 512
    const H = 64
    const [c, g] = make(W, H)
    const [cb, gb] = make(W, H)
    const r = rng(63)
    g.fillStyle = '#a7a2b3'
    g.fillRect(0, 0, W, H)
    gb.fillStyle = '#b0b0b0'
    gb.fillRect(0, 0, W, H)
    for (let i = 0; i < 4; i++) {
      const x = i * 128
      g.fillStyle = `hsl(${255 + r() * 12} ${8 + r() * 5}% ${62 + r() * 9}%)`
      g.fillRect(x + 2, 0, 124, H)
      g.fillStyle = '#2a2632'
      g.fillRect(x - 2, 0, 4, H)
      gb.fillStyle = '#101010'
      gb.fillRect(x - 3, 0, 6, H)
    }
    g.fillStyle = '#2a2632'
    g.fillRect(W - 2, 0, 2, H)
    gb.fillStyle = '#101010'
    gb.fillRect(W - 3, 0, 3, H)
    let grad = g.createLinearGradient(0, H, 0, H * 0.3)
    grad.addColorStop(0, 'rgba(10,6,20,0.5)')
    grad.addColorStop(1, 'rgba(10,6,20,0)')
    g.fillStyle = grad
    g.fillRect(0, 0, W, H)
    // chipped pale top edge
    let p = 0
    while (p < W) {
      const len = 6 + r() * 34
      g.fillStyle = `rgba(255,255,255,${0.2 + r() * 0.4})`
      g.fillRect(p, 0, len, 2 + r() * 5)
      p += len * (0.8 + r() * 0.6)
    }
    for (let i = 0; i < 26; i++) {
      g.fillStyle = `rgba(20,14,30,${0.2 + r() * 0.3})`
      g.fillRect(r() * W, r() * 10, 3 + r() * 10, 2 + r() * 6)
    }
    grad = gb.createLinearGradient(0, 0, 0, 12)
    grad.addColorStop(0, 'rgba(0,0,0,0.6)')
    grad.addColorStop(1, 'rgba(0,0,0,0)')
    gb.fillStyle = grad
    gb.fillRect(0, 0, W, 12)
    speckle(g, r, W, 1800, 0.12, false)
    speckle(g, r, W, 1200, 0.12, true)
    speckle(gb, r, W, 2400, 0.22, false)
    return { map: toTex(c), bumpMap: toTex(cb, false) }
  })
}

/** Road paint that has been driven over for years: solid colour with chips and cracks worn through. */
export function markTex(color = '#d9b75f', seed = 1) {
  return once(`mark-${color}-${seed}`, () => {
    const W = 256
    const H = 64
    const [c, g] = make(W, H)
    const r = rng(seed * 13 + 1)
    g.fillStyle = color
    g.fillRect(0, 0, W, H)
    for (let i = 0; i < 300; i++) {
      g.fillStyle = `rgba(${r() > 0.5 ? 255 : 0},${r() > 0.5 ? 255 : 0},${r() > 0.5 ? 255 : 0},${r() * 0.1})`
      g.fillRect(r() * W, r() * H, 2 + r() * 12, 1 + r() * 3)
    }
    g.globalCompositeOperation = 'destination-out'
    for (let i = 0; i < 46; i++) {
      g.beginPath()
      g.ellipse(r() * W, r() * H, 1.5 + r() * 9, 1 + r() * 4, r() * 3, 0, Math.PI * 2)
      g.fill()
    }
    // ragged ends and edges
    for (let i = 0; i < 70; i++) {
      const edge = (r() * 4) | 0
      const s = 2 + r() * 5
      const x = edge === 0 ? 0 : edge === 1 ? W - s : r() * W
      const y = edge === 2 ? 0 : edge === 3 ? H - s : r() * H
      g.fillRect(x, y, edge < 2 ? s : 4 + r() * 14, edge < 2 ? 4 + r() * 12 : s)
    }
    g.lineWidth = 1.2
    for (let i = 0; i < 5; i++) crack([[g, 'rgba(0,0,0,1)', 1.3]], r, r() * W, r() * H, 6, 12, r() * 6)
    g.globalCompositeOperation = 'source-over'
    const t = toTex(c)
    t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping
    return t
  })
}

/** Painted foliage: overlapping light and dark leaf shapes. Tiles; multiplied by the crown's own green. */
export function leafSet() {
  return once('leaf', () => {
    const S = 256
    const [c, g] = make(S)
    const [cb, gb] = make(S)
    const r = rng(88)
    g.fillStyle = '#c9c9c9'
    g.fillRect(0, 0, S, S)
    gb.fillStyle = '#707070'
    gb.fillRect(0, 0, S, S)
    for (let i = 0; i < 520; i++) {
      const light = r() > 0.42
      const rx = 7 + r() * 10
      const ry = 3 + r() * 4
      const ang = r() * Math.PI
      const fill = light ? `rgba(255,255,${(190 + r() * 65) | 0},${0.22 + r() * 0.3})` : `rgba(0,${(20 + r() * 30) | 0},${(30 + r() * 30) | 0},${0.2 + r() * 0.3})`
      const bump = light ? `rgba(255,255,255,${0.35 + r() * 0.4})` : `rgba(0,0,0,${0.3 + r() * 0.3})`
      tiled(S, r() * S, r() * S, 20, (px, py) => {
        for (const [ctx, style] of [
          [g, fill],
          [gb, bump],
        ]) {
          ctx.fillStyle = style
          ctx.beginPath()
          ctx.ellipse(px, py, rx, ry, ang, 0, Math.PI * 2)
          ctx.fill()
        }
      })
    }
    const set = { map: toTex(c), bumpMap: toTex(cb, false) }
    for (const t of Object.values(set)) t.repeat.set(5, 3)
    return set
  })
}

export function stripeTex(a = '#ff2d95', b = '#16041a', count = 8) {
  return once(`stripe-${a}-${b}-${count}`, () => {
    const [c, g] = make(256, 32)
    const w = 256 / count
    for (let i = 0; i < count; i++) {
      g.fillStyle = i % 2 ? b : a
      g.fillRect(i * w, 0, w + 1, 32)
    }
    return toTex(c)
  })
}

/** Ribbed roll-down shutter. */
export function shutterSet(color = '#6c7079') {
  return once(`shutter-${color}`, () => {
    const [c, g] = make(64, 256)
    const [cb, gb] = make(64, 256)
    const ribs = 16
    const h = 256 / ribs
    g.fillStyle = color
    g.fillRect(0, 0, 64, 256)
    for (let i = 0; i < ribs; i++) {
      const grad = g.createLinearGradient(0, i * h, 0, (i + 1) * h)
      grad.addColorStop(0, 'rgba(255,255,255,0.16)')
      grad.addColorStop(0.5, 'rgba(0,0,0,0)')
      grad.addColorStop(1, 'rgba(0,0,0,0.42)')
      g.fillStyle = grad
      g.fillRect(0, i * h, 64, h)
      const gbGrad = gb.createLinearGradient(0, i * h, 0, (i + 1) * h)
      gbGrad.addColorStop(0, '#e0e0e0')
      gbGrad.addColorStop(1, '#202020')
      gb.fillStyle = gbGrad
      gb.fillRect(0, i * h, 64, h)
    }
    return { map: toTex(c), bumpMap: toTex(cb, false) }
  })
}

export function woodTex(color = '#8a5a35', seed = 4) {
  return once(`wood-${color}-${seed}`, () => {
    const [c, g] = make(256)
    const r = rng(seed)
    g.fillStyle = color
    g.fillRect(0, 0, 256, 256)
    for (let i = 0; i < 70; i++) {
      g.strokeStyle = `rgba(${r() > 0.5 ? 255 : 0},${r() > 0.5 ? 220 : 0},${r() > 0.5 ? 180 : 0},${0.04 + r() * 0.1})`
      g.lineWidth = 0.6 + r() * 2
      const y = r() * 256
      g.beginPath()
      g.moveTo(0, y)
      g.bezierCurveTo(80, y + (r() - 0.5) * 14, 170, y + (r() - 0.5) * 14, 256, y + (r() - 0.5) * 8)
      g.stroke()
    }
    return toTex(c)
  })
}

/** Chain-link / net pattern on a transparent background. */
export function linkTex(color = '#b9bcc8') {
  return once(`link-${color}`, () => {
    const [c, g] = make(64)
    g.clearRect(0, 0, 64, 64)
    g.strokeStyle = color
    g.lineWidth = 5
    g.beginPath()
    g.moveTo(0, 32)
    g.lineTo(32, 0)
    g.lineTo(64, 32)
    g.lineTo(32, 64)
    g.closePath()
    g.stroke()
    return toTex(c)
  })
}

export function manholeTex() {
  return once('manhole', () => {
    const [c, g] = make(256)
    g.fillStyle = '#1a1b22'
    g.fillRect(0, 0, 256, 256)
    g.strokeStyle = '#3c3e4a'
    g.lineWidth = 7
    for (const rad of [118, 92, 64, 34]) {
      g.beginPath()
      g.arc(128, 128, rad, 0, Math.PI * 2)
      g.stroke()
    }
    g.lineWidth = 5
    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * Math.PI * 2
      g.beginPath()
      g.moveTo(128 + Math.cos(a) * 38, 128 + Math.sin(a) * 38)
      g.lineTo(128 + Math.cos(a) * 116, 128 + Math.sin(a) * 116)
      g.stroke()
    }
    return toTex(c)
  })
}

/** Basketball: orange leather speckle with black seams. */
export function ballTex() {
  return once('ball', () => {
    const [c, g] = make(512, 256)
    const r = rng(12)
    g.fillStyle = '#e8651a'
    g.fillRect(0, 0, 512, 256)
    for (let i = 0; i < 2600; i++) {
      g.fillStyle = `rgba(0,0,0,${r() * 0.18})`
      g.fillRect(r() * 512, r() * 256, 2, 2)
    }
    g.strokeStyle = '#17110d'
    g.lineWidth = 6
    g.beginPath()
    g.moveTo(0, 128)
    g.lineTo(512, 128)
    for (const x of [0, 256, 512]) {
      g.moveTo(x, 0)
      g.lineTo(x, 256)
    }
    for (const x of [128, 384]) {
      g.moveTo(x - 70, 0)
      g.bezierCurveTo(x - 10, 80, x - 10, 176, x - 70, 256)
      g.moveTo(x + 70, 0)
      g.bezierCurveTo(x + 10, 80, x + 10, 176, x + 70, 256)
    }
    g.stroke()
    return toTex(c)
  })
}

/** The outline of a puddle: a few overlapping soft blobs. Used as an alpha map. */
export function puddleTex(seed = 1) {
  return once(`puddle-${seed}`, () => {
    const S = 256
    const [c, g] = make(S)
    const r = rng(seed * 19 + 2)
    g.fillStyle = '#000000'
    g.fillRect(0, 0, S, S)
    g.filter = 'blur(5px)'
    g.fillStyle = '#ffffff'
    for (let i = 0; i < 9; i++) {
      g.beginPath()
      g.ellipse(S / 2 + (r() - 0.5) * S * 0.42, S / 2 + (r() - 0.5) * S * 0.3, S * (0.1 + r() * 0.15), S * (0.07 + r() * 0.1), r() * 3, 0, Math.PI * 2)
      g.fill()
    }
    const t = toTex(c, false)
    t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping
    return t
  })
}

/** Soft dark rectangle used as a fake contact shadow under buildings and props. */
export function contactTex() {
  return once('contact', () => {
    const [c, g] = make(128)
    g.clearRect(0, 0, 128, 128)
    g.filter = 'blur(12px)'
    g.fillStyle = 'rgba(0,0,0,0.85)'
    g.fillRect(26, 26, 76, 76)
    const t = toTex(c)
    t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping
    return t
  })
}

/** Vertical fade, dark at the top. Used under cornices and awnings. */
export function fadeTex() {
  return once('fade', () => {
    const [c, g] = make(8, 64)
    const grad = g.createLinearGradient(0, 0, 0, 64)
    grad.addColorStop(0, 'rgba(0,0,0,0.6)')
    grad.addColorStop(1, 'rgba(0,0,0,0)')
    g.fillStyle = grad
    g.fillRect(0, 0, 8, 64)
    const t = toTex(c)
    t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping
    return t
  })
}

/** White at the top fading to nothing: the visible beam under a street lamp. */
export function beamTex() {
  return once('beam', () => {
    const [c, g] = make(8, 64)
    const grad = g.createLinearGradient(0, 0, 0, 64)
    grad.addColorStop(0, 'rgba(255,255,255,1)')
    grad.addColorStop(0.5, 'rgba(255,255,255,0.3)')
    grad.addColorStop(1, 'rgba(255,255,255,0)')
    g.fillStyle = grad
    g.fillRect(0, 0, 8, 64)
    const t = toTex(c)
    t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping
    return t
  })
}

/**
 * What a lit window looks like from outside: brighter low down, darker at the top,
 * a couple of soft reflection streaks and vague shapes of things inside.
 * Used as an emissive map so flat glowing rectangles get depth.
 */
export function glassTex(seed = 1, shop = false) {
  return once(`glass-${seed}-${shop}`, () => {
    const S = 256
    const [c, g] = make(S)
    const r = rng(seed * 7 + 3)
    const grad = g.createLinearGradient(0, 0, 0, S)
    grad.addColorStop(0, '#5a5a5a')
    grad.addColorStop(0.55, '#c4c4c4')
    grad.addColorStop(1, '#ffffff')
    g.fillStyle = grad
    g.fillRect(0, 0, S, S)
    // things inside: shelves in a shop, furniture shapes in a flat
    g.fillStyle = 'rgba(0,0,0,0.3)'
    if (shop) {
      for (const y of [S * 0.3, S * 0.52]) g.fillRect(0, y, S, 5)
      for (let i = 0; i < 9; i++) g.fillRect(r() * S, S * 0.3 - 26 - r() * 20, 14 + r() * 22, 46)
    } else {
      g.fillRect(r() * S * 0.5, S * (0.55 + r() * 0.2), S * (0.25 + r() * 0.3), S * 0.5)
      g.beginPath()
      g.arc(S * (0.3 + r() * 0.5), S * 0.5, S * 0.08, 0, Math.PI * 2)
      g.fill()
    }
    // diagonal reflection streaks
    g.save()
    g.translate(S / 2, S / 2)
    g.rotate(-0.6)
    for (const [x, w, a] of [
      [-S * 0.25, S * 0.12, 0.2],
      [S * 0.1, S * 0.05, 0.14],
    ]) {
      g.fillStyle = `rgba(255,255,255,${a})`
      g.fillRect(x, -S, w, S * 2)
    }
    g.restore()
    const t = toTex(c)
    t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping
    return t
  })
}

/** A city seen from far above at night: street-light grids and scattered window lights. */
export function cityTex() {
  return once('city', () => {
    const S = 512
    const [c, g] = make(S)
    const r = rng(77)
    g.fillStyle = '#000000'
    g.fillRect(0, 0, S, S)
    const dot = (x, y, s, color) => {
      g.fillStyle = color
      g.fillRect(x, y, s, s)
    }
    // street grid
    for (let i = 0; i < 9; i++) {
      const p = (i / 9) * S + r() * 14
      const major = i % 3 === 0
      for (let t = 0; t < S; t += major ? 7 : 12) {
        dot(t, p, major ? 2.4 : 1.6, `rgba(255,${180 + r() * 50},${90 + r() * 60},${major ? 0.55 : 0.3})`)
        dot(p, t, major ? 2.4 : 1.6, `rgba(255,${180 + r() * 50},${90 + r() * 60},${major ? 0.55 : 0.3})`)
      }
    }
    // windows and signs
    const tints = ['255,214,150', '160,225,255', '255,90,170', '255,255,255']
    for (let i = 0; i < 3200; i++) dot(r() * S, r() * S, 1 + r() * 1.6, `rgba(${tints[(r() * tints.length) | 0]},${0.25 + r() * 0.6})`)
    return toTex(c)
  })
}

/** Soft cloud cover (white blobs on transparent). */
export function cloudTex() {
  return once('cloud', () => {
    const S = 512
    const [c, g] = make(S)
    const r = rng(41)
    g.clearRect(0, 0, S, S)
    for (let i = 0; i < 70; i++) {
      const x = r() * S
      const y = r() * S
      const rad = 30 + r() * 70
      for (const [ox, oy] of [
        [0, 0],
        [S, 0],
        [-S, 0],
        [0, S],
        [0, -S],
      ]) {
        const grad = g.createRadialGradient(x + ox, y + oy, 0, x + ox, y + oy, rad)
        grad.addColorStop(0, 'rgba(255,255,255,0.3)')
        grad.addColorStop(1, 'rgba(255,255,255,0)')
        g.fillStyle = grad
        g.fillRect(x + ox - rad, y + oy - rad, rad * 2, rad * 2)
      }
    }
    return toTex(c)
  })
}
