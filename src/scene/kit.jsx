// Shared building blocks for the diorama: fonts, neon text, pop-in animation,
// clickable "spots", night-only lights and a few procedural textures.
import * as THREE from 'three'
import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Text } from '@react-three/drei'
import markerFont from '@fontsource/sedgwick-ave-display/files/sedgwick-ave-display-latin-400-normal.woff?url'
import bebasFont from '@fontsource/bebas-neue/files/bebas-neue-latin-400-normal.woff?url'
import { env, useStore } from '../store.js'

// marker = graffiti handstyle (tags), bebas = signs, wild = the big wall piece.
// The wall uses Ghosthey (blackletter), which lives in /public/fonts. It is free for PERSONAL use
// only — see public/fonts/1001fonts-ghosthey-eula.txt. To try another font, drop the file in
// /public/fonts and change the file name below.
const wildFont = `${import.meta.env.BASE_URL}fonts/ghosthey-Italic.ttf`
export const FONTS = { marker: markerFont, wild: wildFont, bebas: bebasFont }

/** Height of the sidewalk above the slab. Road sits at 0.1. */
export const SW = 0.25

/**
 * Spread these onto any HTML element that floats over the 3D scene (labels, the boombox bubble).
 *
 * Pointer events on such an element bubble up into the 3D canvas's own event handling,
 * which works out the pointer position relative to the element instead of the canvas.
 * The scene then thinks you clicked or hovered somewhere near its top-left corner and
 * reacts to whatever building is there. Stopping the events here keeps them out of the scene.
 */
const keepOut = (e) => e.stopPropagation()
export const overlayEvents = {
  onPointerDown: keepOut,
  onPointerUp: keepOut,
  onPointerMove: keepOut,
  onDoubleClick: keepOut,
  onContextMenu: keepOut,
}

/** Sideways camera offset on phones, written by the drag handler and read by the camera. */
export const view = { pan: 0 }

export const damp = (a, b, lambda, dt) => a + (b - a) * (1 - Math.exp(-lambda * dt))
export const lerp = (a, b, t) => a + (b - a) * t
export const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v))

/* ───────────────────────── text ───────────────────────── */

/** Flat printed text (signs, posters, graffiti). */
export function Label({ font = 'bebas', size = 0.4, color = '#ffffff', children, ...props }) {
  return (
    <Text font={FONTS[font]} fontSize={size} color={color} anchorX="center" anchorY="middle" {...props}>
      {children}
    </Text>
  )
}

/** Glowing neon text. Pushed past 1.0 so the bloom pass picks it up. */
export function Neon({ children, color = '#ff2d95', size = 0.5, font = 'bebas', boost = 2.4, flicker = false, ...props }) {
  const mat = useRef()
  const base = useMemo(() => new THREE.Color(color), [color])
  const seed = useMemo(() => Math.random() * 100, [])
  useFrame(({ clock }) => {
    if (!mat.current) return
    let k = boost
    if (flicker) {
      const t = clock.elapsedTime + seed
      const n = Math.sin(t * 21) + Math.sin(t * 6.7 + 1.7) + Math.sin(t * 2.3)
      if (n > 2.2) k *= 0.22
    }
    k *= 0.45 + 0.55 * env.mix // calmer in daylight
    mat.current.color.copy(base).multiplyScalar(k)
  })
  return (
    <Text font={FONTS[font]} fontSize={size} anchorX="center" anchorY="middle" {...props}>
      {children}
      <meshBasicMaterial ref={mat} toneMapped={false} />
    </Text>
  )
}

/* ───────────────────────── lights & glow ───────────────────────── */

/** A point light that only switches on at night. */
export function NightLight({ intensity = 20, ...props }) {
  const ref = useRef()
  useFrame(() => {
    if (ref.current) ref.current.intensity = intensity * env.mix
  })
  return <pointLight ref={ref} decay={2} intensity={intensity} {...props} />
}

/** Emissive material (lit windows, screens, bulbs) that dims during the day. */
export function GlowMat({ color = '#ffd27a', intensity = 2, dayIntensity = 0.3, base = '#111111', ...props }) {
  const ref = useRef()
  useFrame(() => {
    if (ref.current) ref.current.emissiveIntensity = lerp(dayIntensity, intensity, env.mix)
  })
  return <meshStandardMaterial ref={ref} color={base} emissive={color} emissiveIntensity={intensity} roughness={0.4} {...props} />
}

/* ───────────────────────── motion ───────────────────────── */

const easeOutBack = (t) => {
  const c1 = 1.70158
  const c3 = c1 + 1
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
}

/** Pops its children up out of the ground after `delay` seconds. */
export function Pop({ delay = 0, children, ...props }) {
  const ref = useRef()
  const t0 = useRef(null)
  const done = useRef(false)
  useFrame(({ clock }) => {
    if (done.current || !ref.current) return
    if (!useStore.getState().ready) return // stay hidden until everything has loaded
    if (t0.current === null) t0.current = clock.elapsedTime
    const t = (clock.elapsedTime - t0.current - delay) / 0.75
    const s = t <= 0 ? 0.0001 : t >= 1 ? 1 : Math.max(0.0001, easeOutBack(t))
    ref.current.scale.setScalar(s)
    if (t >= 1) done.current = true
  })
  return (
    <group {...props}>
      <group ref={ref} scale={0.0001}>
        {children}
      </group>
    </group>
  )
}

/** A clickable piece of the block. Clicking flies the camera to section `id`. */
export function Spot({ id, children, lift = 0.12, ...props }) {
  const ref = useRef()
  const hovered = useStore((s) => s.hovered === id)
  const setHovered = useStore((s) => s.setHovered)
  const setSection = useStore((s) => s.setSection)
  useFrame((_, dt) => {
    if (!ref.current) return
    ref.current.position.y = damp(ref.current.position.y, hovered ? lift : 0, 10, dt)
  })
  return (
    <group {...props}>
      <group
        ref={ref}
        onClick={(e) => {
          e.stopPropagation()
          if (e.delta > 6) return // it was a drag, not a click
          setSection(id)
        }}
        onPointerOver={(e) => {
          e.stopPropagation()
          setHovered(id)
          document.body.style.cursor = 'pointer'
        }}
        onPointerOut={() => {
          setHovered(null)
          document.body.style.cursor = ''
        }}
      >
        {children}
      </group>
    </group>
  )
}

/* ───────────────────────── textures ───────────────────────── */

export function rng(seed) {
  return () => {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function finish(canvas, repeat) {
  const tex = new THREE.CanvasTexture(canvas)
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping
  tex.repeat.set(repeat[0], repeat[1])
  tex.colorSpace = THREE.SRGBColorSpace
  tex.anisotropy = 8
  return tex
}

export function brickTexture({ hue = 8, sat = 42, light = 34, mortar = '#2a1b1c', rows = 14, cols = 7, repeat = [2, 1], seed = 7 } = {}) {
  const c = document.createElement('canvas')
  c.width = c.height = 512
  const g = c.getContext('2d')
  const r = rng(seed)
  g.fillStyle = mortar
  g.fillRect(0, 0, 512, 512)
  const bh = 512 / rows
  const bw = 512 / cols
  for (let y = 0; y < rows; y++) {
    for (let x = -1; x < cols; x++) {
      const ox = y % 2 ? bw / 2 : 0
      g.fillStyle = `hsl(${hue + r() * 8 - 4} ${sat + r() * 10 - 5}% ${light + r() * 10 - 5}%)`
      g.fillRect(x * bw + ox + 2, y * bh + 2, bw - 4, bh - 4)
    }
  }
  return finish(c, repeat)
}

export function tileTexture({ base = '#7d7888', line = '#5f5a6b', repeat = [8, 8] } = {}) {
  const c = document.createElement('canvas')
  c.width = c.height = 128
  const g = c.getContext('2d')
  g.fillStyle = base
  g.fillRect(0, 0, 128, 128)
  g.strokeStyle = line
  g.lineWidth = 5
  g.strokeRect(0, 0, 128, 128)
  return finish(c, repeat)
}

export function glowTexture(color = '#ffffff') {
  const c = document.createElement('canvas')
  c.width = c.height = 128
  const g = c.getContext('2d')
  const grad = g.createRadialGradient(64, 64, 0, 64, 64, 64)
  grad.addColorStop(0, color)
  grad.addColorStop(1, 'rgba(0,0,0,0)')
  g.fillStyle = grad
  g.fillRect(0, 0, 128, 128)
  const tex = new THREE.CanvasTexture(c)
  tex.colorSpace = THREE.SRGBColorSpace
  return tex
}
