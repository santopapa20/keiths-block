// Front of the block: the basketball court (Education) and the payphone (Contact).
import * as THREE from 'three'
import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useTexture } from '@react-three/drei'
import { useStore } from '../../store.js'
import { GlowMat, Label, Neon, NightLight, lerp } from '../kit.jsx'
import { ballTex, courtSet, linkTex, markTex } from '../tex.js'
import { B, CHROME, Contact, Cy, Detail, RB, STEEL, Sp, Tex } from './parts.jsx'

/* ───────────── Education: home court in CIT-U maroon & gold ───────────── */

const LINE = '#ffc233'
/** A painted court line, worn through in places. `args` is [length along x, (unused), length along z]. */
const Line = ({ args, position, seed = 1 }) => {
  const [w, , d] = args
  const long = w >= d
  return (
    <mesh position={position} rotation={[-Math.PI / 2, 0, long ? 0 : Math.PI / 2]}>
      <planeGeometry args={long ? [w, d] : [d, w]} />
      <meshStandardMaterial map={markTex(LINE, seed)} alphaTest={0.5} roughness={0.7} polygonOffset polygonOffsetFactor={-1} />
    </mesh>
  )
}

export function Court() {
  const surface = courtSet()
  const net = useMemo(() => {
    const t = linkTex().clone()
    t.repeat.set(16, 11)
    t.needsUpdate = true
    return t
  }, [])
  return (
    <group>
      <mesh position={[0, 0.03, 0]} receiveShadow>
        <boxGeometry args={[9, 0.06, 4.4]} />
        <Tex set={surface} repeat={[2, 1]} bump={1} o={{ roughness: 0.8 }} />
      </mesh>
      {/* concrete edging, so the court sits in the pavement as a slab */}
      {[-2.27, 2.27].map((z) => (
        <B key={z} s={[9.28, 0.09, 0.14]} position={[0, 0.045, z]} c="#9d98aa" ns />
      ))}
      {[-4.57, 4.57].map((x) => (
        <B key={x} s={[0.14, 0.09, 4.4]} position={[x, 0.045, 0]} c="#9d98aa" ns />
      ))}
      <Contact w={9.4} d={4.8} opacity={0.5} />
      {/* border */}
      <Line args={[8.7, 0.012, 0.07]} position={[0, 0.066, 2.05]} />
      <Line args={[8.7, 0.012, 0.07]} position={[0, 0.066, -2.05]} seed={2} />
      <Line args={[0.07, 0.012, 4.17]} position={[-4.35, 0.066, 0]} />
      <Line args={[0.07, 0.012, 4.17]} position={[4.35, 0.066, 0]} seed={3} />
      {/* the key */}
      <mesh position={[-3.1, 0.064, 0]}>
        <boxGeometry args={[2.5, 0.01, 1.7]} />
        <meshStandardMaterial color="#5c1620" roughness={0.7} />
      </mesh>
      <Line args={[2.5, 0.012, 0.06]} position={[-3.1, 0.068, 0.85]} />
      <Line args={[2.5, 0.012, 0.06]} position={[-3.1, 0.068, -0.85]} seed={4} />
      <Line args={[0.06, 0.012, 1.76]} position={[-1.85, 0.068, 0]} />
      {/* three-point arc */}
      <mesh position={[-3.6, 0.068, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1.95, 2.02, 48, 1, -Math.PI / 2, Math.PI]} />
        <meshStandardMaterial color={LINE} roughness={0.6} />
      </mesh>

      {/* chain-link fence behind the hoop */}
      <group position={[-4.78, 0, 0]}>
        {[-2.2, 0, 2.2].map((z) => (
          <Cy key={z} s={[0.045, 0.045, 3.3, 12]} position={[0, 1.65, z]} c="#8a8e9a" o={{ metalness: 0.7, roughness: 0.35 }} />
        ))}
        <Cy s={[0.035, 0.035, 4.5, 10]} position={[0, 3.28, 0]} rotation={[Math.PI / 2, 0, 0]} c="#8a8e9a" o={{ metalness: 0.7, roughness: 0.35 }} ns />
        <Cy s={[0.028, 0.028, 4.5, 10]} position={[0, 0.16, 0]} rotation={[Math.PI / 2, 0, 0]} c="#8a8e9a" o={{ metalness: 0.7, roughness: 0.35 }} ns />
        {[-2.2, 0, 2.2].map((z) => (
          <Sp key={z} s={[0.065, 12, 8]} position={[0, 3.33, z]} c="#8a8e9a" o={{ metalness: 0.7, roughness: 0.35 }} ns />
        ))}
        <mesh position={[0, 1.7, 0]} rotation={[0, Math.PI / 2, 0]}>
          <planeGeometry args={[4.4, 3.1]} />
          <meshStandardMaterial map={net} transparent alphaTest={0.25} side={THREE.DoubleSide} metalness={0.6} roughness={0.4} />
        </mesh>
      </group>
    </group>
  )
}

/** The CIT-U seal painted at centre court (background already cut out of the PNG). */
export function CourtLogo() {
  const tex = useTexture(`${import.meta.env.BASE_URL}citu-logo.png`)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.anisotropy = 16
  return (
    <group position={[1.9, 0, 0]}>
      {/* darker medallion + gold ring so the maroon gear stands out from the maroon floor */}
      <mesh position={[0, 0.064, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[1.72, 56]} />
        <meshStandardMaterial color="#3d0d16" roughness={0.75} />
      </mesh>
      <mesh position={[0, 0.067, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1.72, 1.8, 56]} />
        <meshStandardMaterial color={LINE} roughness={0.6} />
      </mesh>
      <mesh position={[0, 0.072, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[3, 3]} />
        <meshStandardMaterial
          map={tex}
          emissiveMap={tex}
          emissive="#ffffff"
          emissiveIntensity={0.18}
          transparent
          alphaTest={0.02}
          depthWrite={false}
          roughness={0.75}
          polygonOffset
          polygonOffsetFactor={-2}
        />
      </mesh>
    </group>
  )
}

export function Hoop() {
  const arm = useMemo(
    () =>
      new THREE.TubeGeometry(
        new THREE.QuadraticBezierCurve3(new THREE.Vector3(-4.3, 2.7, 0), new THREE.Vector3(-4.3, 3.35, 0), new THREE.Vector3(-3.8, 3.1, 0)),
        16,
        0.06,
        10,
      ),
    [],
  )
  const net = useMemo(() => {
    const t = linkTex('#f4f1ff').clone()
    t.repeat.set(10, 3)
    t.needsUpdate = true
    return t
  }, [])
  return (
    <group>
      {/* padded base + pole + gooseneck */}
      <RB s={[0.74, 0.07, 0.74]} r={0.025} position={[-4.3, 0.095, 0]} o={STEEL} ns />
      <RB s={[0.46, 1.5, 0.46]} r={0.1} position={[-4.3, 0.82, 0]} c="#6e1a27" o={{ roughness: 0.6 }} />
      {[0.5, 1.2].map((y) => (
        <B key={y} s={[0.47, 0.05, 0.47]} position={[-4.3, y, 0]} c="#ffc233" ns />
      ))}
      <Cy s={[0.08, 0.1, 2.75, 16]} position={[-4.3, 1.38, 0]} o={STEEL} />
      <mesh geometry={arm} castShadow>
        <meshStandardMaterial {...STEEL} />
      </mesh>
      {/* backboard: frame, glass, shooter's square */}
      <B s={[0.08, 1.12, 1.68]} position={[-3.78, 3.0, 0]} o={STEEL} />
      <mesh position={[-3.735, 3.0, 0]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[1.56, 1.0]} />
        <meshStandardMaterial color="#eef3ff" transparent opacity={0.4} roughness={0.05} metalness={0.3} />
      </mesh>
      {[
        [0, 0.21, 0.56, 0.035],
        [0, -0.21, 0.56, 0.035],
        [0.265, 0, 0.035, 0.42],
        [-0.265, 0, 0.035, 0.42],
      ].map(([z, y, w, h], i) => (
        <B key={i} s={[0.01, h, w]} position={[-3.728, 2.86 + y, z]} c="#f4f1ff" ns />
      ))}
      {/* rim + bracket + net */}
      <B s={[0.3, 0.06, 0.1]} position={[-3.62, 2.64, 0]} c="#ff6a1a" ns />
      <mesh position={[-3.44, 2.66, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <torusGeometry args={[0.26, 0.022, 10, 36]} />
        <meshStandardMaterial color="#ff6a1a" emissive="#ff6a1a" emissiveIntensity={0.25} metalness={0.4} roughness={0.4} />
      </mesh>
      <mesh position={[-3.44, 2.42, 0]}>
        <cylinderGeometry args={[0.255, 0.15, 0.46, 24, 1, true]} />
        <meshStandardMaterial map={net} transparent alphaTest={0.3} side={THREE.DoubleSide} roughness={0.9} />
      </mesh>
      <Contact w={0.7} d={0.7} opacity={0.6} position={[-4.3, 0.07, 0]} />
    </group>
  )
}

export function Ball() {
  const ref = useRef()
  useFrame(({ clock }) => {
    if (!ref.current) return
    const T = 4.6
    const t = clock.elapsedTime % T
    const floor = 0.24
    let x
    let y
    if (t < 1.6) {
      // dribble on the spot
      x = 1.3
      y = floor + Math.abs(Math.sin(t * Math.PI * 2.5)) * 0.75
    } else if (t < 2.7) {
      // the shot
      const u = (t - 1.6) / 1.1
      x = lerp(1.3, -3.44, u)
      y = lerp(floor, 2.7, u) + 4 * 1.75 * u * (1 - u)
    } else if (t < 3.1) {
      // swish
      const u = (t - 2.7) / 0.4
      x = -3.44
      y = lerp(2.7, floor, u * u)
    } else {
      // bounces back out
      const u = (t - 3.1) / 1.5
      x = lerp(-3.44, 1.3, u)
      y = floor + Math.abs(Math.sin(u * Math.PI * 3)) * 0.55 * (1 - u)
    }
    ref.current.position.set(x, y, 0)
    ref.current.rotation.z -= 0.06
  })
  return (
    <mesh ref={ref} castShadow>
      <sphereGeometry args={[0.18, 28, 20]} />
      <meshStandardMaterial map={ballTex()} roughness={0.75} />
    </mesh>
  )
}

/** Low courtside board along the back of the court. Kept under a metre tall so it never blocks a camera. */
export function CourtBanner() {
  return (
    <group position={[0, 0, -2.5]}>
      {[-1.7, 1.7].map((x) => (
        <Cy key={x} s={[0.05, 0.05, 1, 12]} position={[x, 0.5, 0]} o={STEEL} />
      ))}
      <RB s={[3.5, 0.8, 0.08]} r={0.03} position={[0, 0.6, 0]} c="#7a1f2b" o={{ roughness: 0.6 }} />
      <mesh position={[0, 0.6, 0.045]}>
        <planeGeometry args={[3.3, 0.64]} />
        <meshStandardMaterial color="#5c1620" roughness={0.7} />
      </mesh>
      <Label position={[0, 0.72, 0.06]} size={0.36} color="#ffc233">
        CIT-UNIVERSITY
      </Label>
      <Label position={[0, 0.41, 0.06]} size={0.16} color="#f4e7c8">
        BS INFORMATION TECHNOLOGY · CLASS OF 2026
      </Label>
    </group>
  )
}

/* ───────────── Contact: the payphone ───────────── */

const BLUE = { color: '#1e4fd6', roughness: 0.4, metalness: 0.3 }

export function PayphoneBody() {
  const keys = []
  for (let r = 0; r < 4; r++) for (let c = 0; c < 3; c++) keys.push([0.1 + c * 0.105, 1.6 - r * 0.105])
  const cord = useMemo(
    () =>
      new THREE.TubeGeometry(
        new THREE.CatmullRomCurve3([
          new THREE.Vector3(-0.22, 1.36, 0.2),
          new THREE.Vector3(-0.3, 1.0, 0.26),
          new THREE.Vector3(-0.1, 0.86, 0.24),
          new THREE.Vector3(0.05, 1.08, 0.17),
        ]),
        24,
        0.012,
        6,
      ),
    [],
  )
  return (
    <group>
      {/* pedestal */}
      <Cy s={[0.34, 0.4, 0.08, 22]} position={[0, 0.04, -0.1]} o={STEEL} />
      <RB s={[0.24, 2.2, 0.24]} r={0.05} position={[0, 1.1, -0.1]} o={STEEL} />
      {/* enclosure */}
      {[-0.54, 0.54].map((x) => (
        <RB key={x} s={[0.07, 1.55, 0.76]} r={0.03} position={[x, 1.66, 0.12]} o={BLUE} />
      ))}
      <B s={[1.1, 1.55, 0.06]} position={[0, 1.66, -0.24]} o={{ ...BLUE, color: '#1a43b8' }} />
      <RB s={[1.2, 0.36, 0.8]} r={0.06} position={[0, 2.56, 0.12]}>
        <GlowMat color="#bfe9ff" intensity={1.5} dayIntensity={0.3} base="#dff3ff" />
      </RB>
      <Label position={[0, 2.56, 0.525]} size={0.24} color="#0b2a6b">
        PHONE
      </Label>
      {/* the phone itself */}
      <RB s={[0.8, 0.98, 0.3]} r={0.05} position={[0, 1.56, 0]} c="#2a2c36" o={{ roughness: 0.4, metalness: 0.4 }} />
      <B s={[0.44, 0.7, 0.02]} position={[0.16, 1.5, 0.155]} o={CHROME} ns />
      {keys.map(([x, y], i) => (
        <RB key={i} s={[0.075, 0.075, 0.03]} r={0.012} position={[x, y, 0.172]} c="#d5d8e2" o={{ roughness: 0.3 }} ns />
      ))}
      <mesh position={[0.2, 1.79, 0.168]}>
        <planeGeometry args={[0.36, 0.13]} />
        <GlowMat color="#5dfc8a" intensity={1.8} dayIntensity={0.6} base="#03130a" />
      </mesh>
      {/* handset on its cradle, with a curled cord */}
      <group position={[-0.22, 1.6, 0.2]}>
        <mesh castShadow>
          <capsuleGeometry args={[0.045, 0.42, 6, 12]} />
          <meshStandardMaterial color="#0a0a0f" roughness={0.35} />
        </mesh>
        <Sp s={[0.075, 14, 10]} position={[0, 0.25, 0.01]} c="#0a0a0f" o={{ roughness: 0.35 }} ns />
        <Sp s={[0.075, 14, 10]} position={[0, -0.25, 0.01]} c="#0a0a0f" o={{ roughness: 0.35 }} ns />
      </group>
      <mesh geometry={cord}>
        <meshStandardMaterial {...CHROME} />
      </mesh>
      <Detail>
        <B s={[0.1, 0.02, 0.012]} position={[0.2, 1.93, 0.158]} c="#05060a" ns />
        <RB s={[0.14, 0.1, 0.03]} r={0.012} position={[0.2, 1.16, 0.16]} c="#05060a" ns />
        {/* shelf with a phone book, and a couple of stickers */}
        <B s={[0.9, 0.04, 0.3]} position={[0, 1.0, 0.1]} o={STEEL} ns />
        <B s={[0.3, 0.07, 0.22]} position={[0.2, 1.055, 0.1]} rotation={[0, 0.2, 0]} c="#ffc233" ns />
        <mesh position={[0.578, 1.9, 0.2]} rotation={[0, Math.PI / 2, 0.15]}>
          <planeGeometry args={[0.22, 0.14]} />
          <meshStandardMaterial color="#ff2d95" roughness={0.6} />
        </mesh>
        <mesh position={[0.578, 1.45, 0.05]} rotation={[0, Math.PI / 2, -0.1]}>
          <circleGeometry args={[0.09, 16]} />
          <meshStandardMaterial color="#5dfc8a" roughness={0.6} />
        </mesh>
      </Detail>
      <Contact w={1.2} d={0.9} opacity={0.65} />
    </group>
  )
}

export function Payphone({ children }) {
  const ref = useRef()
  const ring = useRef()
  const hovered = useStore((s) => s.hovered === 'contact')
  const tripo = useStore((s) => s.modelStatus.payphone === 'ready')
  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    const ringing = hovered || t % 6 < 1.5
    if (ref.current) ref.current.rotation.z = ringing ? Math.sin(t * 46) * 0.03 : 0
    if (ring.current) ring.current.visible = ringing && Math.sin(t * 13) > -0.3
  })
  return (
    <group>
      <group ref={ref}>
        {children}
        {/* payphone.glb has a blank light box on top; the built version letters its own */}
        {tripo && (
          <>
            <Label position={[0, 2.45, 0.305]} size={0.19} color="#0b2a6b" letterSpacing={0.08}>
              PHONE
            </Label>
            <NightLight position={[0, 2.3, 1.1]} color="#cfeaff" intensity={7} distance={5} />
          </>
        )}
      </group>
      <group ref={ring} position={[0, 3.1, 0.2]} rotation={[0, 0, 0.08]}>
        <Neon font="marker" size={0.3} color="#ff2d95">
          ring ring!
        </Neon>
      </group>
    </group>
  )
}
