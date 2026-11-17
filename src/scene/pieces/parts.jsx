// Shared building parts: shorthand meshes, textured walls, windows, doors, awnings,
// roof clutter and fake contact shadows. Everything a facade is assembled from.
import * as THREE from 'three'
import { useMemo } from 'react'
import { RoundedBox } from '@react-three/drei'
import { useStore } from '../../store.js'
import { GlowMat } from '../kit.jsx'
import { contactTex, fadeTex, glassTex, paintSet, stripeTex, tile } from '../tex.js'

export const CHROME = { color: '#e9ebf2', metalness: 0.95, roughness: 0.16 }
export const STEEL = { color: '#2a2c35', metalness: 0.6, roughness: 0.45 }
export const GLASS = { color: '#0a0e1a', metalness: 0.4, roughness: 0.05 }
// Kept fairly matte on purpose: a mirror-like gold throws pin-sharp highlights that
// sparkle and bloom on small objects every time the camera drifts.
export const GOLD = { color: '#ffc233', emissive: '#a86b00', emissiveIntensity: 0.22, metalness: 0.55, roughness: 0.45 }

/** Fine detail that is skipped on slower devices (auto quality). */
export function Detail({ children }) {
  const low = useStore((s) => s.low)
  return low ? null : children
}

// Every plain coloured part gets the hand-painted treatment (see paintSet): brushwork, grime low
// down, worn edges. `kind` picks the version that suits the shape's texture layout.
const M = ({ c = '#888888', o, kind = 'frame' }) => <meshStandardMaterial color={c} roughness={0.8} bumpScale={0.6} {...paintSet(kind)} {...o} />

/* shorthand meshes: s = geometry args, c = colour, o = extra material props, ns = no shadow */
export function B({ s, c, o, ns, children, ...p }) {
  return (
    <mesh castShadow={!ns} receiveShadow {...p}>
      <boxGeometry args={s} />
      {children ?? <M c={c} o={o} />}
    </mesh>
  )
}
export function RB({ s, r = 0.05, c, o, ns, children, ...p }) {
  return (
    <RoundedBox args={s} radius={r} smoothness={3} castShadow={!ns} receiveShadow {...p}>
      {children ?? <M c={c} o={o} kind="flat" />}
    </RoundedBox>
  )
}
export function Cy({ s, c, o, ns, children, ...p }) {
  return (
    <mesh castShadow={!ns} receiveShadow {...p}>
      <cylinderGeometry args={s} />
      {children ?? <M c={c} o={o} kind="band" />}
    </mesh>
  )
}
export function Sp({ s, c, o, ns, children, ...p }) {
  return (
    <mesh castShadow={!ns} receiveShadow {...p}>
      <sphereGeometry args={s} />
      {children ?? <M c={c} o={o} kind="soft" />}
    </mesh>
  )
}
/** A turned shape (pot, post foot, bin): `pts` is the outline as [radius, height] pairs, bottom to top. */
export function Lathe({ pts, seg = 28, c, o, ns, children, ...p }) {
  const key = pts.flat().join(',')
  const geo = useMemo(() => new THREE.LatheGeometry(pts.map(([x, y]) => new THREE.Vector2(Math.max(x, 0.001), y)), seg), [key, seg])
  return (
    <mesh geometry={geo} castShadow={!ns} receiveShadow {...p}>
      {children ?? <M c={c} o={o} kind="band" />}
    </mesh>
  )
}

/** Material with a tiled texture set (colour + bump, optionally roughness). */
export function Tex({ set, repeat = [1, 1], color = '#ffffff', bump = 1.2, o }) {
  const maps = useMemo(() => tile(set, repeat[0], repeat[1]), [set, repeat[0], repeat[1]])
  return <meshStandardMaterial color={color} roughness={0.9} bumpScale={bump} {...maps} {...o} />
}

/** Soft dark patch on the ground under a w × d footprint. */
export function Contact({ w, d, opacity = 0.75, y = 0.012, ...p }) {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, y, 0]} {...p}>
      <planeGeometry args={[w * 1.6, d * 1.6]} />
      <meshBasicMaterial map={contactTex()} transparent opacity={opacity} depthWrite={false} polygonOffset polygonOffsetFactor={-1} />
    </mesh>
  )
}

/** Shadow band that fades downward (under cornices, signs and awnings). */
export function Fade({ w, h = 0.6, opacity = 1, ...p }) {
  return (
    <mesh {...p}>
      <planeGeometry args={[w, h]} />
      <meshBasicMaterial map={fadeTex()} transparent opacity={opacity} depthWrite={false} />
    </mesh>
  )
}

/** A building shell: textured walls, stone plinth, stepped cornice, parapet and roof. */
export function Shell({ w, h, d, set, repeat = [1, 1], color, plinth = '#17151d', trim = '#0d1f33', parapet = 0.38, roof = '#16161c', bump }) {
  const py = h + parapet / 2 - 0.08
  return (
    <group>
      <mesh castShadow receiveShadow position={[0, h / 2, 0]}>
        <boxGeometry args={[w, h, d]} />
        <Tex set={set} repeat={repeat} color={color} bump={bump} />
      </mesh>
      <B s={[w + 0.1, 0.34, d + 0.1]} position={[0, 0.17, 0]} c={plinth} o={{ roughness: 0.55 }} ns />
      <B s={[w + 0.18, 0.12, d + 0.18]} position={[0, h - 0.3, 0]} c={trim} ns />
      <B s={[w + 0.34, 0.16, d + 0.34]} position={[0, h - 0.16, 0]} c={trim} />
      <B s={[w + 0.1, parapet, 0.16]} position={[0, py, d / 2 - 0.03]} c={trim} />
      <B s={[w + 0.1, parapet, 0.16]} position={[0, py, -d / 2 + 0.03]} c={trim} ns />
      <B s={[0.16, parapet, d - 0.1]} position={[w / 2 - 0.03, py, 0]} c={trim} ns />
      <B s={[0.16, parapet, d - 0.1]} position={[-w / 2 + 0.03, py, 0]} c={trim} ns />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, h + 0.006, 0]} receiveShadow>
        <planeGeometry args={[w - 0.1, d - 0.1]} />
        <meshStandardMaterial color={roof} roughness={1} />
      </mesh>
      <Contact w={w} d={d} />
      <Fade w={w} h={0.7} position={[0, h - 0.71, d / 2 + 0.012]} />
    </group>
  )
}

/** Window on a wall face. `position` is the centre of the opening on the wall surface. */
export function Win({ w = 1, h = 1.2, lit = false, color = '#ffd27a', frame = '#20202a', sill = '#8d8898', bars = true, intensity = 1.4, blind = 0, seed = 1, ...p }) {
  return (
    <group {...p}>
      <B s={[w + 0.14, h + 0.14, 0.1]} c={frame} ns />
      <mesh position={[0, 0, 0.052]}>
        <planeGeometry args={[w, h]} />
        {lit ? <GlowMat color={color} intensity={intensity * 1.25} dayIntensity={0.08} base="#141420" emissiveMap={glassTex(seed)} /> : <meshStandardMaterial {...GLASS} />}
      </mesh>
      {blind > 0 && (
        <mesh position={[0, h / 2 - (h * blind) / 2, 0.056]}>
          <planeGeometry args={[w, h * blind]} />
          <meshStandardMaterial color="#cfc8b6" roughness={0.9} />
        </mesh>
      )}
      <Detail>
        {bars && (
          <>
            <B s={[0.045, h, 0.03]} position={[0, 0, 0.062]} c={frame} ns />
            <B s={[w, 0.045, 0.03]} position={[0, h * 0.1, 0.062]} c={frame} ns />
          </>
        )}
      </Detail>
      <B s={[w + 0.3, 0.07, 0.2]} position={[0, -h / 2 - 0.09, 0.08]} c={sill} ns />
    </group>
  )
}

/** Door with a glazed upper panel, a lit transom above and a stone step. `position` is the bottom centre on the wall surface. */
export function Door({ w = 1.1, h = 2.3, c = '#08121e', frame = '#0d0d14', glow = '#69e6ff', step = '#6d6878', ...p }) {
  const gw = w * 0.62
  const gh = h * 0.46
  return (
    <group {...p}>
      <B s={[w + 0.18, h + 0.44, 0.12]} position={[0, (h + 0.44) / 2, 0]} c={frame} ns />
      {/* transom light */}
      <mesh position={[0, h + 0.2, 0.065]}>
        <planeGeometry args={[w, 0.26]} />
        <GlowMat color={glow} intensity={0.6} dayIntensity={0.1} base="#0a1622" emissiveMap={glassTex(5)} />
      </mesh>
      <B s={[w + 0.04, 0.05, 0.04]} position={[0, h + 0.045, 0.07]} c={frame} ns />
      {/* leaf */}
      <B s={[w, h, 0.06]} position={[0, h / 2, 0.05]} c={c} o={{ roughness: 0.45 }} ns />
      <mesh position={[0, h * 0.65, 0.085]}>
        <planeGeometry args={[gw, gh]} />
        <GlowMat color={glow} intensity={0.55} dayIntensity={0.12} base="#0a1622" emissiveMap={glassTex(6)} />
      </mesh>
      <Detail>
        <B s={[0.035, gh, 0.02]} position={[0, h * 0.65, 0.09]} c={c} ns />
        <B s={[gw, 0.035, 0.02]} position={[0, h * 0.65, 0.09]} c={c} ns />
        <B s={[gw, h * 0.2, 0.015]} position={[0, h * 0.27, 0.085]} c={frame} ns />
        <Cy s={[0.022, 0.022, 0.36, 10]} position={[w * 0.4, h * 0.46, 0.14]} o={CHROME} ns />
        <B s={[0.03, 0.03, 0.08]} position={[w * 0.4, h * 0.52, 0.1]} o={CHROME} ns />
        <B s={[0.03, 0.03, 0.08]} position={[w * 0.4, h * 0.4, 0.1]} o={CHROME} ns />
      </Detail>
      <B s={[w * 0.9, 0.18, 0.02]} position={[0, 0.14, 0.085]} o={STEEL} ns />
      <B s={[w + 0.5, 0.1, 0.46]} position={[0, 0.05, 0.26]} c={step} ns />
    </group>
  )
}

/** Striped fabric awning. `position` is the centre of the line where it meets the wall. */
export function Awning({ w, len = 1.15, c1 = '#ff2d95', c2 = '#16041a', stripes = 8, slope = 0.32, ...p }) {
  const map = stripeTex(c1, c2, stripes)
  const cz = Math.cos(slope) * len
  const cy = -Math.sin(slope) * len
  return (
    <group {...p}>
      <mesh castShadow position={[0, cy / 2, cz / 2]} rotation={[slope, 0, 0]}>
        <boxGeometry args={[w, 0.05, len]} />
        <meshStandardMaterial map={map} roughness={0.85} />
      </mesh>
      <mesh position={[0, cy - 0.12, cz - 0.01]}>
        <boxGeometry args={[w, 0.24, 0.03]} />
        <meshStandardMaterial map={map} roughness={0.85} />
      </mesh>
      <Fade w={w} h={0.9} opacity={0.8} position={[0, cy - 0.55, 0.02]} />
      <Detail>
        {[-1, 1].map((k) => (
          <Cy key={k} s={[0.018, 0.018, len, 6]} position={[k * (w / 2 - 0.04), cy / 2 - 0.04, cz / 2]} rotation={[slope + Math.PI / 2, 0, 0]} o={STEEL} ns />
        ))}
      </Detail>
    </group>
  )
}

/** Rooftop air-conditioning unit. */
export function ACUnit({ ...p }) {
  return (
    <group {...p}>
      <RB s={[0.95, 0.62, 0.52]} r={0.04} position={[0, 0.39, 0]} c="#b4b7c2" o={{ roughness: 0.5, metalness: 0.3 }} />
      <Cy s={[0.21, 0.21, 0.02, 24]} position={[0.16, 0.39, 0.265]} rotation={[Math.PI / 2, 0, 0]} c="#17181e" ns />
      <mesh position={[0.16, 0.39, 0.275]}>
        <torusGeometry args={[0.21, 0.016, 8, 28]} />
        <meshStandardMaterial {...STEEL} />
      </mesh>
      <Detail>
        {[-0.14, -0.07, 0, 0.07, 0.14].map((y) => (
          <B key={y} s={[0.26, 0.02, 0.01]} position={[-0.28, 0.39 + y, 0.265]} c="#17181e" ns />
        ))}
        {[-0.38, 0.38].map((x) => (
          <B key={x} s={[0.06, 0.08, 0.5]} position={[x, 0.04, 0]} o={STEEL} ns />
        ))}
      </Detail>
    </group>
  )
}

/** Vertical drain pipe with wall brackets. `position` is the bottom. */
export function Pipe({ h, r = 0.05, c = '#3a3c46', ...p }) {
  return (
    <group {...p}>
      <Cy s={[r, r, h, 12]} position={[0, h / 2, 0]} c={c} o={{ metalness: 0.5, roughness: 0.5 }} ns />
      <Detail>
        {[0.2, 0.5, 0.8].map((k) => (
          <B key={k} s={[r * 3, 0.05, r * 2.6]} position={[0, h * k, -r * 0.4]} c={c} ns />
        ))}
      </Detail>
    </group>
  )
}

/** Roof vent pipe with a little rain cap. */
export function Vent({ h = 0.6, ...p }) {
  return (
    <group {...p}>
      <Cy s={[0.09, 0.09, h, 14]} position={[0, h / 2, 0]} o={STEEL} />
      <mesh position={[0, h + 0.06, 0]} castShadow>
        <coneGeometry args={[0.17, 0.14, 14]} />
        <meshStandardMaterial {...STEEL} />
      </mesh>
    </group>
  )
}

/** Gooseneck sign lamp. `position` is where the arm meets the wall; it reaches forward and down. */
export function WallLamp({ color = '#ffd9a0', ...p }) {
  return (
    <group {...p}>
      <mesh rotation={[0, Math.PI / 2, 0]} position={[0, 0, 0.24]}>
        <torusGeometry args={[0.24, 0.018, 8, 20, Math.PI / 2]} />
        <meshStandardMaterial {...STEEL} />
      </mesh>
      <mesh position={[0, -0.02, 0.5]} rotation={[0.5, 0, 0]}>
        <coneGeometry args={[0.13, 0.16, 18, 1, true]} />
        <meshStandardMaterial {...STEEL} side={THREE.DoubleSide} />
      </mesh>
      <Sp s={[0.05, 12, 8]} position={[0, -0.07, 0.5]} ns>
        <GlowMat color={color} intensity={3} dayIntensity={0.2} base="#fff2dc" />
      </Sp>
    </group>
  )
}

/* ───────────── trophy (lathed cup) ───────────── */

let cupGeo
const cup = () => {
  if (!cupGeo) {
    const pts = [
      [0.0, 0.0],
      [0.055, 0.0],
      [0.03, 0.03],
      [0.022, 0.1],
      [0.06, 0.15],
      [0.13, 0.26],
      [0.16, 0.4],
      [0.165, 0.44],
      // Solid cup with a shallow dish on top. A hollow cup needs two paper-thin walls
      // a few millimetres apart, and those shimmer against each other as the camera moves.
      [0.15, 0.446],
      [0.128, 0.42],
      [0.07, 0.396],
      [0.001, 0.39],
    ].map(([x, y]) => new THREE.Vector2(x, y))
    pts[0].x = 0.001 // keep off the exact axis: zero-radius rings give broken normals
    cupGeo = new THREE.LatheGeometry(pts, 32)
  }
  return cupGeo
}

export function Trophy({ s = 1, ...p }) {
  return (
    <group scale={s} {...p}>
      <RB s={[0.24, 0.1, 0.24]} r={0.02} position={[0, 0.05, 0]} c="#22140c" o={{ roughness: 0.4 }} ns />
      <mesh geometry={cup()} position={[0, 0.1, 0]}>
        <meshStandardMaterial {...GOLD} side={THREE.DoubleSide} />
      </mesh>
      {[-1, 1].map((k) => (
        <mesh key={k} position={[k * 0.165, 0.38, 0]} rotation={[0, 0, k * 0.2]}>
          <torusGeometry args={[0.065, 0.014, 8, 16]} />
          <meshStandardMaterial {...GOLD} />
        </mesh>
      ))}
    </group>
  )
}
