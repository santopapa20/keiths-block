// Leafy geometry built in code: arching leaf blades merged into one mesh per plant, and the
// lumpy blobs that make up a tree's crown. Both carry vertex colours (darker low down and
// inside, lighter at the tips) so they read as painted rather than flat.
import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { rng } from '../kit.jsx'

/** One leaf growing up +y from the origin and arching over toward +z. */
function blade(len, wid, bend, shade) {
  const g = new THREE.PlaneGeometry(1, 1, 4, 7)
  const p = g.attributes.position
  const colors = new Float32Array(p.count * 3)
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i) * 2 // -1 … 1 across the leaf
    const t = p.getY(i) + 0.5 // 0 at the stem, 1 at the tip
    const w = Math.pow(Math.sin(Math.PI * (0.06 + t * 0.94)), 0.75) * wid * 0.5
    const a = Math.max(0.001, bend * t)
    const k = Math.max(0.001, bend)
    const y = (len * Math.sin(a)) / k
    const z = (len * (1 - Math.cos(a))) / k
    p.setXYZ(i, x * w, y, z + Math.abs(x) * w * 0.45)
    const s = shade * (0.42 + 0.58 * t) * (0.8 + 0.2 * Math.abs(x))
    colors[i * 3] = colors[i * 3 + 1] = colors[i * 3 + 2] = s
  }
  g.setAttribute('color', new THREE.BufferAttribute(colors, 3))
  return g
}

const plants = new Map()

/**
 * A potted plant's leaves as one geometry: rings of blades, upright in the middle and
 * drooping at the outside. Grows from the origin.
 */
export function plantGeo(seed = 1) {
  if (plants.has(seed)) return plants.get(seed)
  const r = rng(seed * 17 + 3)
  const parts = []
  const m = new THREE.Matrix4()
  const q = new THREE.Quaternion()
  const e = new THREE.Euler()
  const rings = [
    [4, 0.16, 0.62, 0.5],
    [7, 0.62, 0.6, 0.95],
    [9, 1.08, 0.5, 1.3],
  ]
  rings.forEach(([count, tilt, len, bend], ring) => {
    const start = r() * Math.PI * 2
    for (let i = 0; i < count; i++) {
      const g = blade(len * (0.8 + r() * 0.4), 0.2 + r() * 0.08, bend * (0.8 + r() * 0.4), 0.72 + r() * 0.28)
      e.set(tilt + (r() - 0.5) * 0.22, start + (i / count) * Math.PI * 2 + (r() - 0.5) * 0.4, 0, 'YXZ')
      q.setFromEuler(e)
      m.compose(new THREE.Vector3(0, ring * 0.012, 0), q, new THREE.Vector3(1, 1, 1))
      g.applyMatrix4(m)
      parts.push(g)
    }
  })
  const geo = mergeGeometries(parts)
  geo.computeVertexNormals()
  plants.set(seed, geo)
  return geo
}

let crown
/** A lumpy ball for tree crowns, shaded darker underneath. */
export function crownGeo() {
  if (crown) return crown
  const g = new THREE.SphereGeometry(1, 26, 18)
  const p = g.attributes.position
  const v = new THREE.Vector3()
  const colors = new Float32Array(p.count * 3)
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i)
    const lump =
      Math.sin(v.x * 6 + 1) * Math.sin(v.y * 5 + 2) * Math.sin(v.z * 6.5) * 0.14 +
      Math.sin(v.x * 13 + v.z * 11) * Math.sin(v.y * 12) * 0.06 +
      Math.sin(v.x * 23 + v.y * 19 + v.z * 21) * 0.02
    const s = 0.5 + 0.5 * THREE.MathUtils.smoothstep(v.y, -0.9, 0.75) + lump * 1.2
    colors[i * 3] = colors[i * 3 + 1] = colors[i * 3 + 2] = THREE.MathUtils.clamp(s, 0.3, 1.1)
    v.multiplyScalar(1 + lump)
    p.setXYZ(i, v.x, v.y, v.z)
  }
  g.setAttribute('color', new THREE.BufferAttribute(colors, 3))
  g.computeVertexNormals()
  crown = g
  return g
}
