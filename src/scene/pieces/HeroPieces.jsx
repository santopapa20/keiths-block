// The stars of the block: the graffiti tag, the figure, the lowrider and passing traffic.
import * as THREE from 'three'
import { useLayoutEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useTexture } from '@react-three/drei'
import { useStore } from '../../store.js'
import { GlowMat, Label, NightLight, clamp, damp, glowTexture } from '../kit.jsx'
import { B, CHROME, Cy, Detail, GLASS, GOLD, RB, Sp } from './parts.jsx'
import { stripeTex } from '../tex.js'
import { Slot } from '../Slot.jsx'

/* ───────────── "KEITH" sprayed on the wall ───────────── */

// The big piece, built in layers like a real wall piece:
// silver halo → dark 3D shadow → pink fill with a cream outline.
const PIECE = { text: 'Keith', size: 2.25, y: 2.5, spacing: 0.02 }

function Slant({ amount = 0.2, children }) {
  const ref = useRef()
  useLayoutEffect(() => {
    // Shear x by height so the letters lean forward (text can't be italicised any other way).
    ref.current.matrix.makeShear(0, 0, amount, 0, 0, 0)
    ref.current.matrixAutoUpdate = false
  }, [amount])
  return <group ref={ref}>{children}</group>
}

export function GraffitiTag() {
  const hasModel = useStore((st) => st.modelStatus.wall === 'ready')
  const layers = useRef([])
  const t0 = useRef(null)

  // The piece gets "sprayed" on from left to right shortly after the wall pops up.
  useFrame(({ clock }) => {
    if (t0.current === null) t0.current = clock.elapsedTime
    const u = clamp((clock.elapsedTime - t0.current - 1.7) / 1.4, 0, 1)
    const edge = -6 + u * 12
    const rect = [-6, -4, edge, 4]
    layers.current.forEach((t) => {
      if (t) t.clipRect = rect
    })
  })

  // A Tripo wall arrives with its own mural painted on, so the lettering and tags drawn here
  // would double up. Keep only the pink light that washes the wall.
  if (hasModel) return <NightLight position={[0.35, 3, 3.6]} color="#ff2d95" intensity={30} distance={11} />

  const common = { font: 'wild', size: PIECE.size, letterSpacing: PIECE.spacing }
  return (
    <group position={[0.35, 0, 0.27]}>
      {/* the italic cut of the font already leans, so no extra slant */}
      <Slant amount={0}>
        <group position={[0, 0, 0]}>
          {/* silver halo */}
          <Label ref={(el) => (layers.current[0] = el)} {...common} color="#b9b4c9" position={[0, PIECE.y, 0]} outlineWidth={0.17} outlineColor="#b9b4c9">
            {PIECE.text}
          </Label>
          {/* 3D shadow, pushed down-right */}
          <Label ref={(el) => (layers.current[1] = el)} {...common} color="#12041c" position={[0.13, PIECE.y - 0.13, 0.008]} outlineWidth={0.085} outlineColor="#12041c">
            {PIECE.text}
          </Label>
          {/* fill + outline */}
          <Label ref={(el) => (layers.current[2] = el)} {...common} color="#ff2d95" position={[0, PIECE.y, 0.016]} outlineWidth={0.05} outlineColor="#fff3d6">
            {PIECE.text}
          </Label>
        </group>
      </Slant>
      {/* smaller tags */}
      <Label font="marker" size={0.42} color="#2de2e6" position={[3.45, 3.78, 0]} rotation={[0, 0, -0.12]}>
        {'</>'}
      </Label>
      <Label font="marker" size={0.34} color="#ffc233" position={[-3.5, 0.5, 0]} rotation={[0, 0, 0.1]}>
        {"CIT-U '26"}
      </Label>
      <Label font="marker" size={0.3} color="#5dfc8a" position={[3.5, 0.55, 0]} rotation={[0, 0, -0.08]}>
        200 OK
      </Label>
      <Label font="marker" size={0.28} color="#e8e4f5" position={[-3.7, 3.85, 0]} rotation={[0, 0, 0.06]}>
        git push
      </Label>
      <NightLight position={[0, 3, 3]} color="#ff2d95" intensity={30} distance={11} />
    </group>
  )
}

/* ───────────── The figure (cardboard standee until the GLB lands) ───────────── */

const FIG_H = 2.75
const FIG_W = FIG_H * (1086 / 1448)

export function FigureStandee() {
  const tex = useTexture(`${import.meta.env.BASE_URL}figure.webp`)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.anisotropy = 8
  return (
    <group>
      <mesh position={[0, FIG_H / 2 + 0.03, 0]} castShadow>
        <planeGeometry args={[FIG_W, FIG_H]} />
        <meshStandardMaterial
          map={tex}
          emissiveMap={tex}
          emissive="#ffffff"
          emissiveIntensity={0.3}
          alphaTest={0.5}
          side={THREE.DoubleSide}
          roughness={0.9}
        />
      </mesh>
      <mesh position={[0, 0.03, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.72, 0.78, 0.06, 28]} />
        <meshStandardMaterial color="#15121d" roughness={0.6} />
      </mesh>
    </group>
  )
}

/** Turns whatever is inside toward the cursor, with a little idle sway. */
export function FigureMotion({ children }) {
  const ref = useRef()
  useFrame((state, dt) => {
    if (!ref.current) return
    const t = state.clock.elapsedTime
    ref.current.rotation.y = damp(ref.current.rotation.y, state.pointer.x * 0.55, 4, dt)
    ref.current.rotation.z = Math.sin(t * 0.9) * 0.015
    ref.current.position.y = Math.abs(Math.sin(t * 1.4)) * 0.03
  })
  return <group ref={ref}>{children}</group>
}

/* ───────────── Cars ───────────── */

const PAINT = { color: '#7b2ff7', metalness: 0.6, roughness: 0.22 }

/** Whitewall tyre on a polished rim. The axle runs along z. */
function Wheel({ position, rim = GOLD, white = true }) {
  const spokes = [0, 1, 2, 3, 4, 5, 6, 7]
  return (
    <group position={position}>
      <mesh castShadow>
        <torusGeometry args={[0.235, 0.105, 14, 30]} />
        <meshStandardMaterial color="#0b0b0f" roughness={0.85} />
      </mesh>
      {white &&
        [-1, 1].map((k) => (
          <mesh key={k} position={[0, 0, k * 0.107]} rotation={[0, k > 0 ? 0 : Math.PI, 0]}>
            <ringGeometry args={[0.205, 0.262, 30]} />
            <meshStandardMaterial color="#efece4" roughness={0.6} />
          </mesh>
        ))}
      <Cy s={[0.17, 0.17, 0.19, 26]} rotation={[Math.PI / 2, 0, 0]} o={rim} ns />
      {[-1, 1].map((k) => (
        <Sp key={k} s={[0.055, 12, 8]} position={[0, 0, k * 0.095]} o={CHROME} ns />
      ))}
      <Detail>
        {[-1, 1].map((k) =>
          spokes.map((i) => <B key={`${k}${i}`} s={[0.32, 0.012, 0.008]} position={[0, 0, k * 0.098]} rotation={[0, 0, (i * Math.PI) / 8]} o={CHROME} ns />),
        )}
      </Detail>
    </group>
  )
}

/** Lowrider body. Points toward -x. */
export function LowriderBody() {
  return (
    <group>
      <RB s={[4.7, 0.44, 1.72]} r={0.16} position={[0, 0.58, 0]} o={PAINT} />
      <RB s={[1.75, 0.2, 1.6]} r={0.08} position={[-1.38, 0.82, 0]} o={PAINT} />
      <RB s={[1.5, 0.18, 1.6]} r={0.08} position={[1.56, 0.81, 0]} o={PAINT} />
      {/* fender skirts over each wheel */}
      {[
        [-1.4, 0.86],
        [-1.4, -0.86],
        [1.4, 0.86],
        [1.4, -0.86],
      ].map(([x, z]) => (
        <mesh key={`${x}${z}`} position={[x, 0.66, z]} scale={[0.5, 0.17, 0.075]} castShadow>
          <sphereGeometry args={[1, 22, 14]} />
          <meshStandardMaterial {...PAINT} />
        </mesh>
      ))}
      {/* chrome belt line + gold side spear */}
      <B s={[4.5, 0.03, 1.745]} position={[0, 0.8, 0]} o={CHROME} ns />
      <B s={[3.2, 0.04, 1.752]} position={[0.1, 0.64, 0]} o={GOLD} ns />

      {/* cabin: raked glass under a cream roof */}
      <B s={[1.5, 0.38, 1.46]} position={[0.32, 1.1, 0]} o={GLASS} />
      <B s={[0.05, 0.58, 1.44]} position={[-0.6, 1.1, 0]} rotation={[0, 0, -0.55]} o={GLASS} ns />
      <B s={[0.05, 0.52, 1.44]} position={[1.22, 1.08, 0]} rotation={[0, 0, 0.7]} o={GLASS} ns />
      <RB s={[1.62, 0.09, 1.5]} r={0.04} position={[0.3, 1.33, 0]} c="#f2eee6" o={{ roughness: 0.35, metalness: 0.2 }} />

      {/* bumpers, grille, lights */}
      {[-2.42, 2.42].map((x) => (
        <mesh key={x} position={[x, 0.45, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
          <capsuleGeometry args={[0.07, 1.7, 6, 14]} />
          <meshStandardMaterial {...CHROME} />
        </mesh>
      ))}
      <B s={[0.04, 0.2, 1.0]} position={[-2.36, 0.66, 0]} c="#07080c" ns />
      <Detail>
        {[-0.42, -0.28, -0.14, 0, 0.14, 0.28, 0.42].map((z) => (
          <B key={z} s={[0.05, 0.2, 0.03]} position={[-2.37, 0.66, z]} o={CHROME} ns />
        ))}
        <Cy s={[0.006, 0.006, 0.7, 6]} position={[1.9, 1.25, 0.7]} rotation={[0, 0, -0.25]} o={CHROME} ns />
      </Detail>
      {[-0.74, -0.54, 0.54, 0.74].map((z) => (
        <group key={z} position={[-2.35, 0.7, z]}>
          <Sp s={[0.085, 14, 10]} ns>
            <GlowMat color="#fff1b8" intensity={3} dayIntensity={0.6} base="#fff1b8" />
          </Sp>
          <mesh rotation={[0, Math.PI / 2, 0]}>
            <torusGeometry args={[0.092, 0.014, 8, 18]} />
            <meshStandardMaterial {...CHROME} />
          </mesh>
        </group>
      ))}
      {[-0.79, 0.79].map((z) => (
        <group key={z}>
          <B s={[0.9, 0.09, 0.04]} position={[1.86, 0.93, z]} rotation={[0, 0, -0.07]} o={PAINT} ns />
          <B s={[0.05, 0.22, 0.1]} position={[2.36, 0.82, z * 0.94]} ns>
            <GlowMat color="#ff2a2a" intensity={2.6} dayIntensity={0.5} base="#5a0a0a" />
          </B>
        </group>
      ))}
      {[-0.45, 0.45].map((z) => (
        <Cy key={z} s={[0.04, 0.04, 0.3, 12]} position={[2.42, 0.3, z]} rotation={[0, 0, Math.PI / 2]} o={CHROME} ns />
      ))}
    </group>
  )
}

export function Lowrider() {
  const body = useRef()
  const hovered = useStore((s) => s.hovered === 'experience')
  const glow = useMemo(() => glowTexture('#ff2d95'), [])
  const amp = useRef(0.2)

  // Hydraulics: the front end hops, harder when you hover the car.
  useFrame(({ clock }, dt) => {
    if (!body.current) return
    const t = clock.elapsedTime
    const showOff = Math.sin(t * 0.55) > 0.55
    amp.current = damp(amp.current, hovered ? 1 : showOff ? 0.7 : 0.12, 4, dt)
    const hop = Math.abs(Math.sin(t * (hovered ? 7 : 4.5)))
    body.current.rotation.z = -hop * 0.085 * amp.current
    body.current.position.y = hop * 0.07 * amp.current
  })

  return (
    <group>
      <Wheel position={[-1.4, 0.34, 0.8]} />
      <Wheel position={[-1.4, 0.34, -0.8]} />
      <Wheel position={[1.4, 0.34, 0.8]} />
      <Wheel position={[1.4, 0.34, -0.8]} />
      <group ref={body}>
        <LowriderBody />
      </group>
      {/* underglow */}
      <mesh position={[0, 0.015, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[6.4, 3.4]} />
        <meshBasicMaterial map={glow} transparent opacity={0.9} depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} />
      </mesh>
    </group>
  )
}

/**
 * The lowrider on the block. When /public/models/lowrider.glb exists it shows that Tripo model
 * and keeps the hydraulics hop and the pink underglow; otherwise it shows the hand-built car.
 *
 * The Tripo car is one solid piece, so the whole car tips up around its rear axle
 * (front wheels leave the ground), the way a real lowrider hops.
 */
export function LowriderSlot() {
  const ready = useStore((s) => s.modelStatus.lowrider === 'ready')
  const hovered = useStore((s) => s.hovered === 'experience')
  const glow = useMemo(() => glowTexture('#ff2d95'), [])
  const tip = useRef()
  const amp = useRef(0.2)

  useFrame(({ clock }, dt) => {
    if (!tip.current) return
    if (!ready) {
      // the built-in car is showing and does its own hop
      tip.current.rotation.z = 0
      tip.current.position.y = 0
      return
    }
    const t = clock.elapsedTime
    const showOff = Math.sin(t * 0.55) > 0.55
    amp.current = damp(amp.current, hovered ? 1 : showOff ? 0.7 : 0.1, 4, dt)
    const hop = Math.abs(Math.sin(t * (hovered ? 7 : 4.5)))
    tip.current.rotation.z = -hop * 0.07 * amp.current
    tip.current.position.y = hop * 0.03 * amp.current
  })

  const REAR_AXLE = 1.45 // the front of the car points toward -x
  return (
    <group>
      <group position={[REAR_AXLE, 0, 0]}>
        <group ref={tip}>
          <group position={[-REAR_AXLE, 0, 0]}>
            <Slot name="lowrider">
              <Lowrider />
            </Slot>
          </group>
        </group>
      </group>
      {/* underglow (the built-in car brings its own) */}
      {ready && (
        <mesh position={[0, 0.015, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[6.4, 3.4]} />
          <meshBasicMaterial map={glow} transparent opacity={0.9} depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} />
        </mesh>
      )}
    </group>
  )
}

/** A little taxi that crosses the block every so often (overview only, so it never drives through a close-up). */
export function Taxi() {
  const ref = useRef()
  useFrame(({ clock }) => {
    if (!ref.current) return
    if (useStore.getState().section !== 'home') {
      ref.current.visible = false
      return
    }
    const loop = 15
    const t = clock.elapsedTime % loop
    const x = -17.5 + (t / 6.5) * 35 // crosses in 6.5s, then waits off-stage
    const visible = t < 6.5
    ref.current.visible = visible
    if (!visible) return
    ref.current.position.x = x
    ref.current.scale.setScalar(clamp((15.2 - Math.abs(x)) / 1.6, 0.0001, 1))
  })
  const YELLOW = { color: '#ffc233', metalness: 0.4, roughness: 0.3 }
  return (
    <group ref={ref} position={[0, 0.1, 2.75]} visible={false}>
      <Wheel position={[-0.95, 0.3, 0.62]} rim={CHROME} white={false} />
      <Wheel position={[-0.95, 0.3, -0.62]} rim={CHROME} white={false} />
      <Wheel position={[0.95, 0.3, 0.62]} rim={CHROME} white={false} />
      <Wheel position={[0.95, 0.3, -0.62]} rim={CHROME} white={false} />
      <RB s={[3.1, 0.52, 1.36]} r={0.14} position={[0, 0.58, 0]} o={YELLOW} />
      <RB s={[1.75, 0.46, 1.24]} r={0.12} position={[-0.1, 1.04, 0]} o={GLASS} />
      <RB s={[1.5, 0.07, 1.2]} r={0.03} position={[-0.1, 1.27, 0]} o={YELLOW} ns />
      <B s={[2.6, 0.1, 1.37]} position={[0, 0.6, 0]} c="#14141a" ns />
      {[-1, 1].map((k) => (
        <group key={k}>
          <RB s={[0.14, 0.14, 1.42]} r={0.05} position={[k * 1.58, 0.42, 0]} o={CHROME} ns />
          <mesh position={[0, 0.74, k * 0.686]} rotation={[0, k > 0 ? 0 : Math.PI, 0]}>
            <planeGeometry args={[2.3, 0.1]} />
            <meshStandardMaterial map={stripeTex('#14141a', '#ffc233', 24)} roughness={0.5} />
          </mesh>
          <Label position={[-0.1, 1.4, k * 0.125]} rotation={[0, k > 0 ? 0 : Math.PI, 0]} size={0.11} color="#14141a">
            TAXI
          </Label>
        </group>
      ))}
      <RB s={[0.5, 0.16, 0.24]} r={0.04} position={[-0.1, 1.4, 0]} ns>
        <GlowMat color="#fff1b8" intensity={2.5} dayIntensity={0.5} base="#fff1b8" />
      </RB>
      {[-0.45, 0.45].map((z) => (
        <group key={z}>
          <Sp s={[0.09, 12, 8]} position={[1.55, 0.64, z]} ns>
            <GlowMat color="#fff1b8" intensity={3} dayIntensity={0.6} base="#fff1b8" />
          </Sp>
          <B s={[0.05, 0.1, 0.22]} position={[-1.56, 0.64, z]} ns>
            <GlowMat color="#ff2a2a" intensity={2.2} dayIntensity={0.5} base="#5a0a0a" />
          </B>
        </group>
      ))}
    </group>
  )
}
