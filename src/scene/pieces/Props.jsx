// Street furniture and weather: lamps, hydrant, bench, boombox, trees, steam, rain…
import * as THREE from 'three'
import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { env, useStore } from '../../store.js'
import { GlowMat, Label, NightLight, rng } from '../kit.jsx'
import { beamTex, leafSet, manholeTex, stripeTex, woodTex } from '../tex.js'
import { B, CHROME, Contact, Cy, Detail, Lathe, RB, STEEL, Sp } from './parts.jsx'
import { crownGeo } from './foliage.js'

/* ───────────── street lamp ───────────── */

/** The faint visible cone of light under a lamp (night only). */
function Beam({ radius = 1.9, height = 4.2, color = '#ffc98a', ...p }) {
  const mat = useRef()
  useFrame(() => {
    if (mat.current) mat.current.opacity = 0.075 * env.mix
  })
  return (
    <mesh {...p}>
      <coneGeometry args={[radius, height, 28, 1, true]} />
      <meshBasicMaterial
        ref={mat}
        map={beamTex()}
        color={color}
        transparent
        opacity={0.07}
        depthWrite={false}
        side={THREE.DoubleSide}
        blending={THREE.AdditiveBlending}
        toneMapped={false}
      />
    </mesh>
  )
}

const IRON = { color: '#3f5063', metalness: 0.35, roughness: 0.5 }
const v3 = (x, y, z) => new THREE.Vector3(x, y, z)

/** A paper or vinyl patch wrapped around a round post or can, facing +z. */
function Wrap({ r, h, arc = 1.1, turn = 0, color, ...p }) {
  return (
    <mesh rotation={[0, turn, 0]} {...p}>
      <cylinderGeometry args={[r, r, h, 12, 1, true, -arc / 2, arc]} />
      <meshStandardMaterial color={color} roughness={0.7} side={THREE.DoubleSide} polygonOffset polygonOffsetFactor={-2} />
    </mesh>
  )
}

/** Cast-iron street lamp. `dir` = 1 reaches toward +z, -1 toward -z. */
export function StreetLamp({ position, dir = 1 }) {
  const arm = useMemo(() => new THREE.TubeGeometry(new THREE.QuadraticBezierCurve3(v3(0, 4.15, 0), v3(0, 4.9, dir * 0.2), v3(0, 4.54, dir * 1.0)), 24, 0.045, 10), [dir])
  const brace = useMemo(() => new THREE.TubeGeometry(new THREE.QuadraticBezierCurve3(v3(0, 3.72, 0), v3(0, 4.22, dir * 0.46), v3(0, 4.62, dir * 0.58)), 16, 0.022, 8), [dir])
  const flutes = useMemo(() => Array.from({ length: 10 }, (_, i) => (i / 10) * Math.PI * 2), [])
  return (
    <group position={position}>
      {/* turned iron foot */}
      <Lathe
        pts={[
          [0.31, 0],
          [0.31, 0.07],
          [0.27, 0.11],
          [0.21, 0.15],
          [0.175, 0.2],
          [0.165, 0.5],
          [0.195, 0.55],
          [0.195, 0.6],
          [0.13, 0.66],
          [0.095, 0.82],
        ]}
        o={IRON}
      />
      <Detail>
        {flutes.map((a) => (
          <B key={a} s={[0.03, 0.28, 0.02]} position={[Math.sin(a) * 0.172, 0.35, Math.cos(a) * 0.172]} rotation={[0, a, 0]} o={IRON} ns />
        ))}
      </Detail>
      <Cy s={[0.06, 0.092, 3.45, 18]} position={[0, 2.5, 0]} o={IRON} />
      {[1.15, 3.66].map((y) => (
        <Lathe
          key={y}
          seg={20}
          position={[0, y, 0]}
          pts={[
            [0.082, 0],
            [0.122, 0.035],
            [0.122, 0.085],
            [0.082, 0.12],
          ]}
          o={IRON}
          ns
        />
      ))}
      <Sp s={[0.085, 14, 10]} position={[0, 4.22, 0]} o={IRON} ns />
      <mesh geometry={arm} castShadow>
        <meshStandardMaterial {...IRON} />
      </mesh>
      <mesh geometry={brace}>
        <meshStandardMaterial {...IRON} />
      </mesh>
      {/* lamp head */}
      <RB s={[0.34, 0.15, 0.72]} r={0.06} position={[0, 4.51, dir * 1.2]} o={IRON} />
      <RB s={[0.22, 0.07, 0.26]} r={0.03} position={[0, 4.61, dir * 1.0]} o={IRON} ns />
      <B s={[0.22, 0.03, 0.52]} position={[0, 4.43, dir * 1.2]} ns>
        <GlowMat color="#ffc37a" intensity={4} dayIntensity={0} base="#fff4dd" />
      </B>
      <Beam position={[0, 4.42 - 2.1, dir * 1.2]} />
      {/* a flyer and a sticker */}
      <Detail>
        <Wrap r={0.087} h={0.24} arc={1.5} position={[0, 1.62, 0]} turn={0.5} color="#e9e2cf" />
        <Wrap r={0.09} h={0.1} arc={1.0} position={[0, 1.34, 0]} turn={-0.3} color="#ff2d95" />
      </Detail>
      <Contact w={0.62} d={0.62} opacity={0.6} />
      <NightLight position={[0, 4.1, dir * 1.18]} color="#ffb45e" intensity={34} distance={13} />
    </group>
  )
}

/* ───────────── small props ───────────── */

const RED = { roughness: 0.42, metalness: 0.2 }

export function Hydrant({ position }) {
  const bolts = useMemo(() => Array.from({ length: 6 }, (_, i) => (i / 6) * Math.PI * 2), [])
  return (
    <group position={position}>
      <Lathe
        seg={24}
        pts={[
          [0.215, 0],
          [0.215, 0.05],
          [0.175, 0.07],
          [0.152, 0.1],
          [0.145, 0.5],
          [0.172, 0.52],
          [0.172, 0.57],
          [0.142, 0.59],
          [0.13, 0.66],
          [0.09, 0.735],
          [0.05, 0.76],
          [0.05, 0.81],
          [0.001, 0.815],
        ]}
        c="#d8342f"
        o={RED}
      />
      <Detail>
        {bolts.map((a) => (
          <Cy key={a} s={[0.018, 0.018, 0.03, 6]} position={[Math.sin(a) * 0.19, 0.06, Math.cos(a) * 0.19]} c="#8f1f1c" o={RED} ns />
        ))}
        <mesh position={[0, 0.3, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.149, 0.012, 8, 22]} />
          <meshStandardMaterial color="#b92a26" {...RED} />
        </mesh>
      </Detail>
      {[-1, 1].map((k) => (
        <group key={k} position={[k * 0.17, 0.38, 0]} rotation={[0, 0, Math.PI / 2]}>
          <Cy s={[0.068, 0.068, 0.1, 16]} c="#d8342f" o={RED} ns />
          <Cy s={[0.036, 0.036, 0.15, 6]} c="#b92a26" o={RED} ns />
        </group>
      ))}
      <group position={[0, 0.36, 0.17]} rotation={[Math.PI / 2, 0, 0]}>
        <Cy s={[0.088, 0.088, 0.1, 18]} c="#d8342f" o={RED} ns />
        <Cy s={[0.045, 0.045, 0.14, 6]} c="#b92a26" o={RED} ns />
      </group>
      <Contact w={0.5} d={0.5} opacity={0.6} />
    </group>
  )
}

const BIN = { roughness: 0.55, metalness: 0.35 }

export function TrashCan({ position }) {
  const ribs = useMemo(() => Array.from({ length: 16 }, (_, i) => (i / 16) * Math.PI * 2), [])
  return (
    <group position={position}>
      <Lathe
        pts={[
          [0.24, 0],
          [0.262, 0.02],
          [0.275, 0.1],
          [0.29, 0.72],
          [0.305, 0.76],
          [0.316, 0.78],
          [0.316, 0.82],
          [0.285, 0.83],
        ]}
        c="#2f5a44"
        o={BIN}
      />
      <Detail>
        {ribs.map((a) => (
          <B key={a} s={[0.034, 0.5, 0.02]} position={[Math.sin(a) * 0.286, 0.42, Math.cos(a) * 0.286]} rotation={[0, a, 0]} c="#27503c" o={BIN} ns />
        ))}
        {[
          [0.13, 0.281],
          [0.7, 0.293],
        ].map(([y, r]) => (
          <mesh key={y} position={[0, y, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[r, 0.014, 8, 28]} />
            <meshStandardMaterial color="#21412f" metalness={0.4} roughness={0.5} />
          </mesh>
        ))}
        {/* side handles */}
        {[-1, 1].map((k) => (
          <mesh key={k} position={[k * 0.3, 0.58, 0]} rotation={[0, 0, (-k * Math.PI) / 2]}>
            <torusGeometry args={[0.055, 0.012, 8, 14, Math.PI]} />
            <meshStandardMaterial {...STEEL} />
          </mesh>
        ))}
        <Wrap r={0.296} h={0.15} arc={0.62} position={[0, 0.47, 0]} turn={0.5} color="#ff2d95" />
        <Wrap r={0.296} h={0.09} arc={0.4} position={[0, 0.3, 0]} turn={-0.35} color="#e9e2cf" />
      </Detail>
      {/* lid, knocked slightly askew */}
      <group position={[0.012, 0.83, 0]} rotation={[0.06, 0, -0.05]}>
        <Lathe
          pts={[
            [0.33, 0],
            [0.336, 0.025],
            [0.31, 0.06],
            [0.22, 0.115],
            [0.1, 0.15],
            [0.001, 0.157],
          ]}
          c="#274b39"
          o={BIN}
        />
        <mesh position={[0, 0.145, 0]} rotation={[0, 0.5, 0]}>
          <torusGeometry args={[0.07, 0.014, 8, 14, Math.PI]} />
          <meshStandardMaterial {...STEEL} />
        </mesh>
      </group>
      <Contact w={0.7} d={0.7} opacity={0.65} />
    </group>
  )
}

export function Bench({ position, rotation }) {
  const wood = woodTex('#8a5a35', 4)
  return (
    <group position={position} rotation={rotation}>
      {[-0.19, -0.065, 0.06, 0.185].map((z) => (
        <mesh key={z} position={[0, 0.46, z]} castShadow receiveShadow>
          <boxGeometry args={[1.9, 0.04, 0.11]} />
          <meshStandardMaterial map={wood} roughness={0.7} />
        </mesh>
      ))}
      {[0.62, 0.78, 0.94].map((y, i) => (
        <mesh key={y} position={[0, y, -0.27 - i * 0.03]} rotation={[-0.18, 0, 0]} castShadow>
          <boxGeometry args={[1.9, 0.12, 0.035]} />
          <meshStandardMaterial map={wood} roughness={0.7} />
        </mesh>
      ))}
      {[-0.82, 0.82].map((x) => (
        <group key={x} position={[x, 0, 0]}>
          <B s={[0.06, 0.46, 0.06]} position={[0, 0.23, 0.2]} o={STEEL} />
          <B s={[0.06, 1.02, 0.06]} position={[0, 0.5, -0.27]} rotation={[-0.14, 0, 0]} o={STEEL} />
          <B s={[0.06, 0.05, 0.56]} position={[0, 0.42, -0.02]} o={STEEL} ns />
          <RB s={[0.07, 0.05, 0.5]} r={0.02} position={[0, 0.68, 0]} o={STEEL} ns />
          <B s={[0.05, 0.24, 0.05]} position={[0, 0.56, 0.22]} o={STEEL} ns />
        </group>
      ))}
      <Contact w={2} d={0.75} opacity={0.65} />
    </group>
  )
}

/* ───────────── tree ───────────── */

const CANOPY = [
  [0, 2.6, 0, 0.86, '#2f9a5a'],
  [0.55, 2.25, 0.3, 0.58, '#43b56c'],
  [-0.5, 2.32, -0.2, 0.56, '#268048'],
  [0.1, 2.25, -0.55, 0.52, '#2a8a50'],
  [-0.2, 2.15, 0.55, 0.52, '#3aa862'],
  [0.28, 3.12, 0.1, 0.54, '#55c078'],
  [-0.38, 2.98, 0.15, 0.46, '#3aa862'],
  [0.05, 3.42, -0.1, 0.34, '#66cc85'],
]

export function Tree({ position, s = 1 }) {
  const leaf = leafSet()
  return (
    <group position={position} scale={s}>
      {/* stone planter with a lip, filled with soil */}
      <RB s={[1.08, 0.4, 1.08]} r={0.07} position={[0, 0.2, 0]} c="#6c6777" o={{ roughness: 0.9 }} />
      <RB s={[1.18, 0.1, 1.18]} r={0.04} position={[0, 0.39, 0]} c="#837e8e" o={{ roughness: 0.85 }} />
      <Cy s={[0.46, 0.46, 0.02, 22]} position={[0, 0.445, 0]} c="#2a1d17" ns />
      {/* trunk with a root flare */}
      <Lathe
        seg={14}
        position={[0, 0.44, 0]}
        rotation={[0, 0, -0.03]}
        pts={[
          [0.21, 0],
          [0.15, 0.06],
          [0.115, 0.2],
          [0.1, 0.6],
          [0.09, 1.2],
          [0.075, 1.75],
          [0.07, 1.9],
        ]}
        c="#5a3d2b"
        o={{ roughness: 0.95, bumpScale: 1.6 }}
      />
      <Detail>
        <Cy s={[0.03, 0.055, 0.8, 8]} position={[0.26, 2.05, 0.1]} rotation={[0.2, 0, -0.7]} c="#5a3d2b" ns />
        <Cy s={[0.03, 0.05, 0.7, 8]} position={[-0.22, 2.1, -0.05]} rotation={[-0.1, 0, 0.65]} c="#5a3d2b" ns />
      </Detail>
      {CANOPY.map(([x, y, z, r, c], i) => (
        <mesh key={i} geometry={crownGeo()} position={[x, y, z]} scale={r} rotation={[i, i * 2.1, 0]} castShadow={i < 3}>
          <meshStandardMaterial vertexColors color={c} map={leaf.map} bumpMap={leaf.bumpMap} bumpScale={1.4} roughness={0.85} />
        </mesh>
      ))}
      <Contact w={1.3} d={1.3} opacity={0.6} />
    </group>
  )
}

export function Cone({ position }) {
  return (
    <group position={position}>
      <RB s={[0.36, 0.05, 0.36]} r={0.02} position={[0, 0.025, 0]} c="#e55a12" ns />
      <Cy s={[0.03, 0.15, 0.6, 22]} position={[0, 0.35, 0]} c="#ff6a1a" o={{ roughness: 0.5 }} />
      <Cy s={[0.071, 0.093, 0.1, 22]} position={[0, 0.38, 0]} c="#f4f1ff" o={{ roughness: 0.3 }} ns />
      <Cy s={[0.046, 0.058, 0.06, 22]} position={[0, 0.53, 0]} c="#f4f1ff" o={{ roughness: 0.3 }} ns />
    </group>
  )
}

/** Striped construction barrier with a blinking warning light. */
export function Barrier({ position, rotation }) {
  const stripes = stripeTex('#ff6a1a', '#f4f1ff', 8)
  const light = useRef()
  useFrame(({ clock }) => {
    if (light.current) light.current.emissiveIntensity = Math.sin(clock.elapsedTime * 5) > 0.2 ? 3.5 : 0.2
  })
  return (
    <group position={position} rotation={rotation}>
      {[-0.74, 0.74].map((x) => (
        <group key={x} position={[x, 0, 0]}>
          <B s={[0.06, 0.92, 0.06]} position={[0, 0.44, 0.17]} rotation={[0.36, 0, 0]} c="#d9d6e0" />
          <B s={[0.06, 0.92, 0.06]} position={[0, 0.44, -0.17]} rotation={[-0.36, 0, 0]} c="#d9d6e0" />
        </group>
      ))}
      {[0.74, 0.42].map((y) => (
        <mesh key={y} position={[0, y, 0.03]} castShadow>
          <boxGeometry args={[1.8, 0.2, 0.04]} />
          <meshStandardMaterial map={stripes} roughness={0.6} />
        </mesh>
      ))}
      <Cy s={[0.05, 0.06, 0.08, 12]} position={[0.74, 0.9, 0]} c="#22232b" ns />
      <mesh position={[0.74, 0.99, 0]}>
        <sphereGeometry args={[0.07, 14, 10]} />
        <meshStandardMaterial ref={light} color="#5a3200" emissive="#ffae1a" emissiveIntensity={3} />
      </mesh>
    </group>
  )
}

export function StreetSign({ position }) {
  return (
    <group position={position}>
      <Lathe
        seg={16}
        pts={[
          [0.12, 0],
          [0.12, 0.04],
          [0.065, 0.1],
          [0.045, 0.2],
        ]}
        c="#9a9eaa"
        o={{ metalness: 0.6, roughness: 0.4 }}
        ns
      />
      <Cy s={[0.035, 0.035, 3.1, 12]} position={[0, 1.55, 0]} c="#9a9eaa" o={{ metalness: 0.7, roughness: 0.35 }} />
      <Sp s={[0.05, 12, 8]} position={[0, 3.12, 0]} c="#9a9eaa" o={{ metalness: 0.7, roughness: 0.35 }} ns />
      <group position={[0, 2.9, 0]}>
        <RB s={[1.56, 0.36, 0.02]} r={0.008} c="#eef0f5" o={{ roughness: 0.5 }} ns />
        <RB s={[1.5, 0.3, 0.03]} r={0.012} c="#1f7a4d" o={{ roughness: 0.4 }} />
        <Label position={[0, 0, 0.02]} size={0.19}>
          KEITH ST
        </Label>
        <Label position={[0, 0, -0.02]} rotation={[0, Math.PI, 0]} size={0.19}>
          KEITH ST
        </Label>
      </group>
      <group position={[0, 2.56, 0]} rotation={[0, Math.PI / 2, 0]}>
        <RB s={[1.56, 0.36, 0.02]} r={0.008} c="#eef0f5" o={{ roughness: 0.5 }} ns />
        <RB s={[1.5, 0.3, 0.03]} r={0.012} c="#1f7a4d" o={{ roughness: 0.4 }} />
        <Label position={[0, 0, 0.02]} size={0.19}>
          FULL-STACK AVE
        </Label>
        <Label position={[0, 0, -0.02]} rotation={[0, Math.PI, 0]} size={0.19}>
          FULL-STACK AVE
        </Label>
      </group>
    </group>
  )
}

/** Manhole with rising steam. */
export function Manhole({ position }) {
  const puffs = useRef()
  const N = 6
  useFrame(({ clock }) => {
    if (!puffs.current) return
    puffs.current.children.forEach((p, i) => {
      const u = (clock.elapsedTime * 0.22 + i / N) % 1
      p.position.set(Math.sin(u * 5 + i) * 0.25, 0.15 + u * 2.6, Math.cos(u * 4 + i * 2) * 0.2)
      p.scale.setScalar(0.22 + u * 0.75)
      p.material.opacity = Math.sin(u * Math.PI) * 0.2
    })
  })
  return (
    <group position={position}>
      <Cy s={[0.5, 0.5, 0.016, 28]} position={[0, 0.008, 0]} c="#2c2e38" o={{ metalness: 0.6, roughness: 0.45 }} ns />
      <mesh position={[0, 0.018, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.44, 28]} />
        <meshStandardMaterial map={manholeTex()} metalness={0.6} roughness={0.5} />
      </mesh>
      <group ref={puffs}>
        {Array.from({ length: N }, (_, i) => (
          <mesh key={i}>
            <sphereGeometry args={[0.5, 14, 10]} />
            <meshStandardMaterial color="#dcdcff" transparent opacity={0} depthWrite={false} roughness={1} />
          </mesh>
        ))}
      </group>
    </group>
  )
}

/** Rain you can toggle from the top bar. */
export function Rain({ count = 1100 }) {
  const on = useStore((s) => s.rain)
  const ref = useRef()
  const { positions, drops } = useMemo(() => {
    const r = rng(99)
    const drops = Array.from({ length: count }, () => ({
      x: (r() - 0.5) * 38,
      y: r() * 24,
      z: (r() - 0.5) * 26,
      v: 16 + r() * 10,
    }))
    return { positions: new Float32Array(count * 6), drops }
  }, [count])

  useFrame((_, dt) => {
    if (!on || !ref.current) return
    const step = Math.min(dt, 0.05)
    for (let i = 0; i < count; i++) {
      const d = drops[i]
      d.y -= d.v * step
      if (d.y < 0) d.y += 24
      const o = i * 6
      positions[o] = d.x
      positions[o + 1] = d.y
      positions[o + 2] = d.z
      positions[o + 3] = d.x + 0.06
      positions[o + 4] = d.y - 0.55
      positions[o + 5] = d.z
    }
    ref.current.geometry.attributes.position.needsUpdate = true
    ref.current.material.opacity = 0.22 + 0.2 * env.mix
  })

  return (
    <lineSegments ref={ref} visible={on} frustumCulled={false}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <lineBasicMaterial color="#a9bcff" transparent opacity={0.4} depthWrite={false} />
    </lineSegments>
  )
}
