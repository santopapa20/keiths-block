// The floating slab: textured road and sidewalks, kerbs, markings, puddles,
// and the smooth rock mass underneath.
import * as THREE from 'three'
import { useMemo } from 'react'
import { SW } from '../kit.jsx'
import { asphaltSet, kerbSet, markTex, paintSet, pavingSet, puddleTex, tile } from '../tex.js'
import { B, Detail, Tex } from './parts.jsx'

export const W = 30
export const D = 20

/** A sphere pushed in and out by a few sine waves: smooth, lumpy rock. */
let rockGeo
function rock() {
  if (!rockGeo) {
    const g = new THREE.SphereGeometry(1, 48, 28)
    const p = g.attributes.position
    const v = new THREE.Vector3()
    for (let i = 0; i < p.count; i++) {
      v.fromBufferAttribute(p, i)
      const n =
        Math.sin(v.x * 3.1 + 1.3) * Math.sin(v.y * 2.7 + 0.4) * Math.sin(v.z * 3.3 + 2.1) * 0.16 +
        Math.sin(v.x * 7.3 + v.z * 5.1) * Math.sin(v.y * 6.3 + 1) * 0.07 +
        Math.sin(v.x * 13 + v.y * 11 + v.z * 9) * 0.025
      v.multiplyScalar(1 + n)
      p.setXYZ(i, v.x, v.y, v.z)
    }
    g.computeVertexNormals()
    rockGeo = g
  }
  return rockGeo
}

const ROCKS = [
  [[0, -4.3, 0], [11.5, 3.3, 7.4]],
  [[-8.6, -3.2, 1.5], [5.4, 2.1, 6]],
  [[8.8, -3.3, -1], [5.2, 2.2, 6.4]],
  [[2, -6, 1], [5.5, 2.6, 4.2]],
  [[-3, -5.4, -2], [5, 2.3, 4]],
]
const PUDDLES = [
  [5.6, 2.9, 1.5, 0.7, 0.3],
  [-10.6, 0.3, 1.1, 0.6, -0.4],
  [10.2, -0.2, 0.9, 0.5, 0.8],
]

export function Ground() {
  const dashes = useMemo(() => Array.from({ length: 10 }, (_, i) => -13.5 + i * 3), [])
  const zebra = useMemo(() => Array.from({ length: 6 }, (_, i) => -0.55 + i * 0.82), [])
  const asphalt = asphaltSet()
  const paving = pavingSet()
  const kerb = kerbSet()
  const stone = useMemo(() => tile(paintSet('flat'), 5, 3), [])

  return (
    <group>
      {/* slab: concrete lip over packed earth */}
      <B s={[W + 0.06, 0.24, D + 0.06]} position={[0, -0.12, 0]} c="#57525f" ns />
      <B s={[W, 1.0, D]} position={[0, -0.72, 0]} c="#33282a" o={{ roughness: 1 }} ns />
      {ROCKS.map(([pos, scale], i) => (
        <mesh key={i} geometry={rock()} position={pos} scale={scale}>
          <meshStandardMaterial color="#3a3045" roughness={1} bumpScale={2.5} {...stone} />
        </mesh>
      ))}

      {/* road */}
      <mesh position={[0, 0.05, 1.5]} receiveShadow>
        <boxGeometry args={[W, 0.1, 5]} />
        <Tex set={asphalt} repeat={[6, 1]} bump={1.6} o={{ roughness: 1, metalness: 0.05 }} />
      </mesh>
      {/* lane dashes and the crossing: worn road paint */}
      {dashes.map((x, i) => (
        <mesh key={x} position={[x, 0.104, 1.5]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[1.4, 0.15]} />
          <meshStandardMaterial map={markTex('#d9b75f', (i % 4) + 1)} alphaTest={0.5} roughness={0.8} polygonOffset polygonOffsetFactor={-1} />
        </mesh>
      ))}
      {zebra.map((z, i) => (
        <mesh key={z} position={[-6.4, 0.104, z]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[1.7, 0.42]} />
          <meshStandardMaterial map={markTex('#d6d2de', (i % 4) + 5)} alphaTest={0.5} roughness={0.8} polygonOffset polygonOffsetFactor={-1} />
        </mesh>
      ))}
      {/* puddles: mirror-smooth patches that pick up the neon */}
      {PUDDLES.map(([x, z, sx, sz, rot], i) => (
        <mesh key={x} position={[x, 0.103, z]} rotation={[-Math.PI / 2, 0, rot]} scale={[sx, sz, 1]}>
          <planeGeometry args={[2.6, 2.6]} />
          <meshStandardMaterial color="#0c0e1a" alphaMap={puddleTex(i + 1)} roughness={0.03} metalness={0.75} transparent opacity={0.85} depthWrite={false} />
        </mesh>
      ))}
      {/* storm drains */}
      {[3.2, -11.4].map((x) => (
        <group key={x} position={[x, 0.106, -0.8]}>
          <B s={[0.9, 0.012, 0.3]} c="#08080b" ns />
          <Detail>
            {[-0.3, -0.15, 0, 0.15, 0.3].map((dx) => (
              <B key={dx} s={[0.05, 0.02, 0.3]} position={[dx, 0.004, 0]} c="#3a3c46" o={{ metalness: 0.6, roughness: 0.4 }} ns />
            ))}
          </Detail>
        </group>
      ))}

      {/* sidewalks */}
      <mesh position={[0, SW / 2, -5.5]} receiveShadow>
        <boxGeometry args={[W, SW, 9]} />
        <Tex set={paving} repeat={[5, 1.5]} bump={1.8} o={{ roughness: 1 }} />
      </mesh>
      <mesh position={[0, SW / 2, 7]} receiveShadow>
        <boxGeometry args={[W, SW, 6]} />
        <Tex set={paving} repeat={[5, 1]} bump={1.8} o={{ roughness: 1 }} />
      </mesh>
      {/* kerbs */}
      {[-1.08, 4.08].map((z) => (
        <mesh key={z} position={[0, SW / 2 + 0.015, z]} receiveShadow>
          <boxGeometry args={[W, SW + 0.03, 0.2]} />
          <Tex set={kerb} repeat={[5, 1]} bump={1.4} o={{ roughness: 0.8 }} />
        </mesh>
      ))}
    </group>
  )
}
