// Extra street life: string lights, sneakers on a wire, a parking meter,
// a newspaper box, a mailbox, potted plants and crates.
import * as THREE from 'three'
import { useMemo } from 'react'
import { GlowMat, Label } from '../kit.jsx'
import { woodTex } from '../tex.js'
import { B, CHROME, Contact, Cy, Detail, Lathe, RB, STEEL, Sp } from './parts.jsx'
import { plantGeo } from './foliage.js'

const BULBS = ['#ffd27a', '#ff2d95', '#2de2e6', '#5dfc8a', '#ffc233']

/** A sagging wire of coloured bulbs between two points. */
export function StringLights({ from, to, sag = 0.9, count = 14, hang = null }) {
  const { wire, points } = useMemo(() => {
    const a = new THREE.Vector3(...from)
    const b = new THREE.Vector3(...to)
    const mid = a.clone().lerp(b, 0.5)
    mid.y -= sag * 2 // control point; the curve itself dips by `sag`
    const curve = new THREE.QuadraticBezierCurve3(a, mid, b)
    return {
      wire: new THREE.TubeGeometry(curve, 40, 0.012, 5),
      points: Array.from({ length: count }, (_, i) => curve.getPoint((i + 1) / (count + 1))),
      curve,
    }
  }, [from, to, sag, count])
  const hangAt = hang === null ? null : points[Math.min(points.length - 1, hang)]

  return (
    <group>
      <mesh geometry={wire}>
        <meshStandardMaterial color="#0c0c10" roughness={0.6} />
      </mesh>
      {points.map((p, i) => (
        <group key={i} position={[p.x, p.y - 0.07, p.z]}>
          <Cy s={[0.018, 0.018, 0.05, 6]} position={[0, 0.045, 0]} c="#0c0c10" ns />
          <Sp s={[0.05, 10, 8]} ns>
            <GlowMat color={BULBS[i % BULBS.length]} intensity={3.4} dayIntensity={0.5} base="#1a1a1a" />
          </Sp>
        </group>
      ))}
      {hangAt && <Sneakers position={[hangAt.x, hangAt.y, hangAt.z]} />}
    </group>
  )
}

/** The classic pair of sneakers thrown over a wire. */
function Sneakers({ position }) {
  return (
    <group position={position}>
      {[-1, 1].map((k) => (
        <group key={k} position={[k * 0.07, 0, 0]} rotation={[0, 0, k * 0.12]}>
          <Cy s={[0.006, 0.006, 0.42, 5]} position={[0, -0.21, 0]} c="#efece4" ns />
          <group position={[0, -0.46, 0]} rotation={[0.5, k * 0.6, 0]}>
            <RB s={[0.1, 0.07, 0.24]} r={0.03} position={[0, -0.02, 0]} c="#efece4" ns />
            <RB s={[0.09, 0.1, 0.12]} r={0.03} position={[0, 0.04, -0.06]} c="#ff2d95" ns />
          </group>
        </group>
      ))}
    </group>
  )
}

export function ParkingMeter({ position }) {
  return (
    <group position={position}>
      <Cy s={[0.035, 0.035, 1.05, 12]} position={[0, 0.52, 0]} o={STEEL} />
      <Cy s={[0.07, 0.08, 0.05, 14]} position={[0, 0.025, 0]} o={STEEL} ns />
      <RB s={[0.18, 0.26, 0.14]} r={0.045} position={[0, 1.16, 0]} c="#3b3e4a" o={{ metalness: 0.6, roughness: 0.35 }} />
      <mesh position={[0, 1.29, 0]} castShadow>
        <sphereGeometry args={[0.09, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color="#3b3e4a" metalness={0.6} roughness={0.35} />
      </mesh>
      <mesh position={[0, 1.2, 0.072]}>
        <planeGeometry args={[0.11, 0.07]} />
        <GlowMat color="#5dfc8a" intensity={2} dayIntensity={0.5} base="#03130a" />
      </mesh>
      <Detail>
        <B s={[0.05, 0.012, 0.01]} position={[0, 1.1, 0.072]} c="#05060a" ns />
      </Detail>
    </group>
  )
}

export function NewsBox({ position, rotation, color = '#2de2e6' }) {
  return (
    <group position={position} rotation={rotation}>
      {[
        [-0.2, -0.16],
        [0.2, -0.16],
        [-0.2, 0.16],
        [0.2, 0.16],
      ].map(([x, z]) => (
        <B key={`${x}${z}`} s={[0.04, 0.3, 0.04]} position={[x, 0.15, z]} o={STEEL} ns />
      ))}
      <RB s={[0.52, 0.78, 0.44]} r={0.04} position={[0, 0.69, 0]} c={color} o={{ roughness: 0.4, metalness: 0.3 }} />
      <mesh position={[0, 0.8, 0.223]}>
        <planeGeometry args={[0.38, 0.36]} />
        <meshStandardMaterial color="#e9e4d4" roughness={0.9} />
      </mesh>
      <Label position={[0, 0.88, 0.226]} size={0.075} color="#14141a">
        DAILY COMMIT
      </Label>
      <Label position={[0, 0.76, 0.226]} size={0.045} color="#3a3a44">
        KEITH SHIPS AGAIN
      </Label>
      <B s={[0.3, 0.03, 0.03]} position={[0, 0.58, 0.235]} o={CHROME} ns />
      <Contact w={0.6} d={0.5} opacity={0.6} />
    </group>
  )
}

export function Mailbox({ position, rotation }) {
  const BLUE = { color: '#1c3f9e', roughness: 0.4, metalness: 0.3 }
  return (
    <group position={position} rotation={rotation}>
      {[
        [-0.2, -0.17],
        [0.2, -0.17],
        [-0.2, 0.17],
        [0.2, 0.17],
      ].map(([x, z]) => (
        <B key={`${x}${z}`} s={[0.05, 0.28, 0.05]} position={[x, 0.14, z]} o={BLUE} ns />
      ))}
      <B s={[0.56, 0.62, 0.5]} position={[0, 0.59, 0]} o={BLUE} />
      <mesh position={[0, 0.9, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.25, 0.25, 0.56, 22, 1, false, 0, Math.PI]} />
        <meshStandardMaterial {...BLUE} side={THREE.DoubleSide} />
      </mesh>
      <B s={[0.4, 0.06, 0.02]} position={[0, 0.92, 0.255]} c="#0b1a45" ns />
      <Detail>
        {[0.31, 0.86].map((y) => (
          <B key={y} s={[0.58, 0.03, 0.52]} position={[0, y, 0]} c="#17358a" ns />
        ))}
        <Cy s={[0.015, 0.015, 0.3, 8]} position={[0, 1.0, 0.275]} rotation={[0, 0, Math.PI / 2]} o={CHROME} ns />
        <B s={[0.3, 0.1, 0.012]} position={[0, 0.44, 0.253]} c="#e9ecf5" ns />
      </Detail>
      <Label position={[0, 0.6, 0.253]} size={0.09} color="#e9ecf5">
        MAIL
      </Label>
      <Contact w={0.65} d={0.6} opacity={0.6} />
    </group>
  )
}

/* ───────────── plants ───────────── */

export function PottedPlant({ position, s = 1, pot = '#b4583a', leaf = '#3fae6a', seed = 1 }) {
  return (
    <group position={position} scale={s}>
      {/* terracotta pot with a thick rim, filled with soil */}
      <Lathe
        seg={24}
        pts={[
          [0.14, 0],
          [0.157, 0.015],
          [0.2, 0.3],
          [0.245, 0.31],
          [0.252, 0.4],
          [0.225, 0.405],
          [0.2, 0.37],
        ]}
        c={pot}
        o={{ roughness: 0.78 }}
      />
      <Cy s={[0.205, 0.205, 0.02, 20]} position={[0, 0.365, 0]} c="#2a1d17" ns />
      <mesh geometry={plantGeo(seed)} position={[0, 0.37, 0]} castShadow>
        <meshStandardMaterial vertexColors color={leaf} roughness={0.62} side={THREE.DoubleSide} />
      </mesh>
      <Contact w={0.55} d={0.55} opacity={0.55} />
    </group>
  )
}

export function Crates({ position, rotation }) {
  const wood = woodTex('#9a6a3c', 6)
  const Crate = (p) => (
    <group {...p}>
      <mesh position={[0, 0.25, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.6, 0.5, 0.5]} />
        <meshStandardMaterial map={wood} roughness={0.8} />
      </mesh>
      <Detail>
        {[-0.24, 0.24].map((x) => (
          <B key={x} s={[0.06, 0.5, 0.52]} position={[x, 0.25, 0]} c="#7a5230" ns />
        ))}
        {[0.035, 0.465].map((y) => (
          <B key={y} s={[0.62, 0.07, 0.53]} position={[0, y, 0]} c="#6e4a2b" ns />
        ))}
        <B s={[0.05, 0.62, 0.012]} position={[0, 0.25, 0.262]} rotation={[0, 0, 0.82]} c="#7a5230" ns />
      </Detail>
    </group>
  )
  return (
    <group position={position} rotation={rotation}>
      <Crate />
      <Crate position={[0.08, 0.5, 0.02]} rotation={[0, 0.3, 0]} />
      <Contact w={0.8} d={0.7} opacity={0.6} />
    </group>
  )
}
