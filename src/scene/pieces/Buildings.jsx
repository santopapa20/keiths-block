// Buildings along the back of the block. Each is built around its own origin:
// centre of the footprint, standing on the sidewalk, front face toward +z.
import * as THREE from 'three'
import { useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { env, useStore } from '../../store.js'
import { GlowMat, Label, Neon, NightLight, rng } from '../kit.jsx'
import { brickSet, glassTex, plasterSet, shutterSet, woodTex } from '../tex.js'
import { ACUnit, Awning, B, Contact, Cy, Detail, Door, GOLD, Pipe, RB, STEEL, Shell, Sp, Tex, Trophy, Vent, WallLamp, Win } from './parts.jsx'

/* ───────────── Skills: the Stack Shop ───────────── */

const SKILL_SIGNS = [
  ['JAVA', -2.45, 4.98, '#ff8a3d'],
  ['SPRING BOOT', 0.75, 4.98, '#5dfc8a'],
  ['REACT', -2.6, 4.4, '#2de2e6'],
  ['MYSQL', -0.95, 4.4, '#6aa8ff'],
  ['REST API', 0.85, 4.4, '#ff2d95'],
  ['JWT', 2.55, 4.4, '#ffc233'],
]
const SCREENS = [
  [-2.4, '#ff2d95'],
  [-1.05, '#2de2e6'],
  [0.3, '#ffc233'],
]

/** The neon that should stay even after a Tripo shop replaces the placeholder. */
// Where the neon sits. "built" matches the shop made in code; "tripo" matches shop.glb,
// whose sign board, upper panel and door are at slightly different heights.
const SIGN_LAYOUT = {
  built: { mainY: 3.6, mainZ: 3.2, rowDy: 0, skillZ: 3.1, open: [2.3, 1.62, 3.2] },
  tripo: { mainY: 3.42, mainZ: 3.3, rowDy: -0.3, skillZ: 3.16, open: [2.25, 1.55, 3.16] },
}

export function TechShopSigns() {
  const L = useStore((s) => (s.modelStatus.shop === 'ready' ? SIGN_LAYOUT.tripo : SIGN_LAYOUT.built))
  return (
    <group>
      <Neon position={[0, L.mainY, L.mainZ]} size={0.72} color="#2de2e6" flicker>
        STACK SHOP
      </Neon>
      {SKILL_SIGNS.map(([text, x, y, color]) => (
        <Neon key={text} position={[x, y + L.rowDy, L.skillZ]} size={0.34} color={color} boost={2}>
          {text}
        </Neon>
      ))}
      <Neon position={L.open} size={0.17} color="#ff2d95" boost={2}>
        OPEN
      </Neon>
      <NightLight position={[0, 2.6, 5.4]} color="#2de2e6" intensity={26} distance={11} />
    </group>
  )
}

export function TechShop() {
  const wall = plasterSet({ color: '#1b3a5a', seed: 3, streaks: 10 })
  return (
    <group>
      <Shell w={7} h={5.5} d={6} set={wall} trim="#0d1f33" />
      {/* corner pilasters */}
      {[-3.38, 3.38].map((x) => (
        <B key={x} s={[0.34, 5.1, 0.16]} position={[x, 2.72, 3.04]} c="#132b44" ns />
      ))}
      {/* glossy tiled base */}
      <B s={[6.4, 0.5, 0.06]} position={[0, 0.6, 3.035]} c="#0a1826" o={{ roughness: 0.2, metalness: 0.3 }} ns />

      {/* shop window */}
      <B s={[4.36, 2.06, 0.14]} position={[-1.05, 1.45, 3.02]} o={STEEL} ns />
      <mesh position={[-1.05, 1.45, 3.1]}>
        <planeGeometry args={[4.12, 1.82]} />
        <GlowMat color="#69e6ff" intensity={1.15} dayIntensity={0.22} base="#0a2030" emissiveMap={glassTex(2, true)} />
      </mesh>
      <Detail>
        {[-1.74, -0.36].map((x) => (
          <B key={x} s={[0.06, 1.82, 0.05]} position={[x, 1.45, 3.115]} o={STEEL} ns />
        ))}
      </Detail>
      <RB s={[4.3, 0.09, 0.34]} r={0.03} position={[-1.05, 0.5, 3.2]} c="#0d1f33" ns />
      {SCREENS.map(([x, c]) => (
        <group key={x} position={[x, 1.28, 3.24]}>
          <RB s={[0.98, 0.66, 0.07]} r={0.025} c="#05070c" o={{ roughness: 0.3 }} ns />
          <mesh position={[0, 0.01, 0.04]}>
            <planeGeometry args={[0.86, 0.52]} />
            <GlowMat color={c} intensity={1.7} dayIntensity={0.9} base="#000000" />
          </mesh>
          <Cy s={[0.03, 0.04, 0.34, 10]} position={[0, -0.48, -0.02]} c="#05070c" ns />
          <RB s={[0.4, 0.04, 0.22]} r={0.015} position={[0, -0.66, 0]} c="#05070c" ns />
        </group>
      ))}

      <Door position={[2.3, 0, 3.06]} c="#0a1826" glow="#69e6ff" />
      <Awning w={4.6} position={[-1.05, 2.96, 3.02]} c1="#ff2d95" c2="#3a0c26" stripes={10} />

      {/* sign board + marquee panel for the skill neons */}
      <B s={[6.44, 1.12, 0.1]} position={[0, 3.62, 3.05]} c="#1d3d5e" ns />
      <B s={[6.24, 0.92, 0.14]} position={[0, 3.62, 3.07]} c="#060b13" o={{ roughness: 0.4 }} ns />
      <B s={[6.44, 1.22, 0.06]} position={[0, 4.7, 3.035]} c="#0b1a2c" ns />

      {/* side wall facing the street corner */}
      <Pipe h={5} position={[3.56, 0.3, 2.2]} rotation={[0, Math.PI / 2, 0]} />
      <Win w={0.9} h={1.1} lit color="#8fd8ff" position={[3.5, 3.7, -0.4]} rotation={[0, Math.PI / 2, 0]} frame="#0d1f33" sill="#132b44" />
      <Detail>
        <RB s={[0.14, 0.62, 0.44]} r={0.03} position={[3.56, 1.5, 0.9]} c="#8a8f9c" o={{ metalness: 0.4, roughness: 0.5 }} ns />
      </Detail>

      {/* roof */}
      <ACUnit position={[-2, 5.5, -0.6]} />
      <ACUnit position={[-0.5, 5.5, -1.7]} rotation={[0, 0.5, 0]} />
      <Vent position={[2.6, 5.5, 1.4]} />
      <Vent h={0.45} position={[2.2, 5.5, 1.8]} />
      <group position={[1.3, 5.5, 0.4]}>
        <Cy s={[0.04, 0.04, 0.7, 10]} position={[0, 0.35, 0]} o={STEEL} />
        <mesh position={[0, 0.82, 0.05]} rotation={[0.95, 0.4, 0]} castShadow>
          <sphereGeometry args={[0.55, 28, 14, 0, Math.PI * 2, 0, Math.PI / 2.2]} />
          <meshStandardMaterial color="#c9ccd6" side={THREE.DoubleSide} roughness={0.45} metalness={0.3} />
        </mesh>
      </group>
      <group position={[2.9, 5.5, -1.6]}>
        <Cy s={[0.025, 0.035, 1.9, 8]} position={[0, 0.95, 0]} o={STEEL} />
        <Sp s={[0.05, 10, 8]} position={[0, 1.93, 0]} ns>
          <GlowMat color="#ff3030" intensity={4} dayIntensity={0.6} base="#400000" />
        </Sp>
      </group>
    </group>
  )
}

/* ───────────── Backdrop: apartment block with fire escape + billboard ───────────── */

const ROWS = [5.05, 6.13, 7.21]

export function Apartment() {
  const wall = brickSet({ hue: 255, sat: 12, light: 21, mortar: '#100e16', rows: 20, cols: 8, seed: 21 })
  const staves = woodTex('#5a4033', 8)
  const windows = useMemo(() => {
    const r = rng(21)
    const out = []
    ROWS.forEach((y) => {
      for (let col = 0; col < 5; col++) out.push({ x: -3 + col * 1.5, y, lit: r() > 0.42, warm: r() > 0.3, blind: r() > 0.55 ? 0.25 + r() * 0.35 : 0 })
    })
    return out
  }, [])

  return (
    <group>
      <Shell w={8} h={8.2} d={4} set={wall} repeat={[3, 3.2]} trim="#14111d" plinth="#100e16" bump={1.6} />
      {windows.map((w, i) => (
        <Win
          key={i}
          w={0.9}
          h={0.78}
          position={[w.x, w.y, 2.0]}
          lit={w.lit}
          seed={i % 5}
          color={w.warm ? '#ffd27a' : '#8fd8ff'}
          blind={w.blind}
          frame="#3b3648"
          sill="#57526a"
          intensity={1.5}
        />
      ))}

      {/* fire escape */}
      {ROWS.map((y, i) => (
        <group key={y} position={[-0.75, y - 0.56, 2.42]}>
          <B s={[2.5, 0.05, 0.72]} o={STEEL} />
          <B s={[2.5, 0.04, 0.04]} position={[0, 0.62, 0.34]} o={STEEL} ns />
          {[-1.23, 1.23].map((x) => (
            <B key={x} s={[0.04, 0.62, 0.72]} position={[x, 0.31, 0]} o={STEEL} ns />
          ))}
          <Detail>
            {[-0.9, -0.6, -0.3, 0, 0.3, 0.6, 0.9].map((x) => (
              <B key={x} s={[0.025, 0.6, 0.025]} position={[x, 0.31, 0.34]} o={STEEL} ns />
            ))}
          </Detail>
          {i < ROWS.length - 1 && <B s={[1.5, 0.05, 0.4]} position={[0.75, 0.54, -0.05]} rotation={[0, 0, 0.8]} o={STEEL} ns />}
        </group>
      ))}

      {/* window AC boxes */}
      <Detail>
        {[
          [1.5, 5.05],
          [-3, 6.13],
          [3, 7.21],
        ].map(([x, y]) => (
          <RB key={`${x}${y}`} s={[0.6, 0.34, 0.4]} r={0.03} position={[x, y - 0.62, 2.2]} c="#a9acb8" o={{ metalness: 0.3, roughness: 0.5 }} ns />
        ))}
      </Detail>
      <Pipe h={7.6} position={[3.7, 0.3, 2.06]} c="#2a2833" />

      {/* water tank */}
      <group position={[-2.6, 8.2, -0.3]}>
        {[
          [-0.45, -0.45],
          [0.45, -0.45],
          [-0.45, 0.45],
          [0.45, 0.45],
        ].map(([x, z]) => (
          <B key={`${x}${z}`} s={[0.08, 0.95, 0.08]} position={[x, 0.47, z]} o={STEEL} />
        ))}
        <B s={[1.3, 0.07, 1.3]} position={[0, 0.96, 0]} o={STEEL} />
        <mesh position={[0, 1.62, 0]} castShadow>
          <cylinderGeometry args={[0.74, 0.74, 1.25, 28]} />
          <meshStandardMaterial map={staves} roughness={0.9} />
        </mesh>
        {[1.2, 1.62, 2.04].map((y) => (
          <mesh key={y} position={[0, y, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.745, 0.018, 6, 32]} />
            <meshStandardMaterial {...STEEL} />
          </mesh>
        ))}
        <mesh position={[0, 2.52, 0]} castShadow>
          <coneGeometry args={[0.84, 0.55, 28]} />
          <meshStandardMaterial color="#2c211b" roughness={0.85} />
        </mesh>
      </group>

      {/* stair bulkhead + vents */}
      <B s={[1.5, 1.25, 1.5]} position={[3.05, 8.82, -1]} c="#1a1724" />
      <B s={[1.7, 0.08, 1.7]} position={[3.05, 9.48, -1]} c="#100e16" ns />
      <B s={[0.6, 1, 0.04]} position={[3.05, 8.72, -0.23]} c="#0b0a10" ns />
      <Vent position={[-0.6, 8.2, -1.2]} />

      {/* billboard */}
      <group position={[1.2, 8.2, 1.3]}>
        {[-2.3, 2.3].map((x) => (
          <group key={x}>
            <B s={[0.12, 1.15, 0.12]} position={[x, 0.57, 0]} o={STEEL} />
            <Detail>
              <B s={[0.07, 1.5, 0.07]} position={[x, 0.75, -0.42]} rotation={[0.6, 0, 0]} o={STEEL} ns />
            </Detail>
          </group>
        ))}
        <B s={[5.66, 1.72, 0.14]} position={[0, 1.75, 0]} o={STEEL} />
        <B s={[5.44, 1.5, 0.18]} position={[0, 1.75, 0]} c="#07070d" o={{ roughness: 0.5 }} ns />
        <Detail>
          {[-1.8, 0, 1.8].map((x) => (
            <group key={x} position={[x, 2.62, 0.05]}>
              <B s={[0.03, 0.03, 0.5]} position={[0, 0.05, 0.22]} o={STEEL} ns />
              <Sp s={[0.045, 10, 8]} position={[0, 0.02, 0.46]} ns>
                <GlowMat color="#bfffd2" intensity={3} dayIntensity={0.2} base="#e9fff0" />
              </Sp>
            </group>
          ))}
        </Detail>
        <Neon position={[0, 1.76, 0.12]} size={0.78} color="#5dfc8a" flicker>
          OPEN FOR WORK
        </Neon>
      </group>
    </group>
  )
}

/* ───────────── Projects: the storefront that isn't open yet ───────────── */

/**
 * The lettering on the unopened shop. With the shop built in code, only the neon is needed here
 * (that building draws its own "COMING SOON" paper). With storefront.glb, the sign board is lower
 * and the papered window is blank, so the neon moves down and the window lettering is drawn here.
 */
export function StorefrontSigns() {
  const tripo = useStore((s) => s.modelStatus.storefront === 'ready')
  if (!tripo) {
    return (
      <Neon position={[0, 3.62, 3.17]} size={0.62} color="#ffc233" flicker boost={1.9}>
        PROJECTS
      </Neon>
    )
  }
  return (
    <group>
      <Neon position={[0, 2.46, 3.14]} size={0.36} color="#ffc233" flicker boost={1.9}>
        PROJECTS
      </Neon>
      <Label position={[-0.85, 1.5, 3.08]} size={0.3} color="#1c1712">
        COMING SOON
      </Label>
      <Label position={[-0.85, 1.16, 3.08]} size={0.14} color="#5a4d3c" font="marker">
        new work dropping here
      </Label>
    </group>
  )
}

export function Storefront() {
  const wall = plasterSet({ color: '#5a4d42', seed: 11, streaks: 22, dirt: 1 })
  const shutter = shutterSet('#70747d')
  return (
    <group>
      <Shell w={5.5} h={4.5} d={6} set={wall} trim="#2e2722" plinth="#1c1815" />
      {/* papered-over window */}
      <B s={[3.26, 2.16, 0.12]} position={[-0.85, 1.5, 3.02]} c="#1e1915" ns />
      <B s={[3, 1.9, 0.04]} position={[-0.85, 1.5, 3.075]} c="#d8cdb0" o={{ roughness: 1 }} ns />
      <Label position={[-0.85, 1.76, 3.1]} size={0.46} color="#1c1712">
        COMING SOON
      </Label>
      <Label position={[-0.85, 1.26, 3.1]} size={0.2} color="#5a4d3c" font="marker">
        new work dropping here
      </Label>
      {[
        [-2.2, 2.33, 0.5],
        [0.5, 2.33, -0.5],
        [-2.2, 0.67, -0.5],
        [0.5, 0.67, 0.5],
      ].map(([x, y, r], i) => (
        <mesh key={i} position={[x, y, 3.1]} rotation={[0, 0, r]}>
          <planeGeometry args={[0.42, 0.12]} />
          <meshStandardMaterial color="#ffc233" roughness={0.6} />
        </mesh>
      ))}

      {/* roll-down shutter */}
      <mesh position={[1.85, 1.25, 3.04]} receiveShadow>
        <boxGeometry args={[1.4, 2.5, 0.08]} />
        <Tex set={shutter} repeat={[1, 1]} bump={2} o={{ metalness: 0.5, roughness: 0.5 }} />
      </mesh>
      {[1.12, 2.58].map((x) => (
        <B key={x} s={[0.08, 2.5, 0.14]} position={[x, 1.25, 3.05]} o={STEEL} ns />
      ))}
      <RB s={[1.62, 0.28, 0.24]} r={0.04} position={[1.85, 2.63, 3.1]} o={STEEL} />
      <Detail>
        <RB s={[0.1, 0.12, 0.05]} r={0.015} position={[1.85, 0.14, 3.1]} o={GOLD} ns />
      </Detail>

      {/* sign board */}
      <B s={[4.94, 1.04, 0.1]} position={[0, 3.62, 3.05]} c="#2e2722" ns />
      <B s={[4.74, 0.84, 0.14]} position={[0, 3.62, 3.07]} c="#14110f" o={{ roughness: 0.5 }} ns />

      {/* still being set up: ladder, paint, a bare work light */}
      <group position={[-2.52, 0, 3.12]} rotation={[-0.2, 0, 0]}>
        {[-0.2, 0.2].map((x) => (
          <B key={x} s={[0.05, 3.3, 0.05]} position={[x, 1.65, 0]} c="#c79a3c" o={{ metalness: 0.3, roughness: 0.5 }} />
        ))}
        <Detail>
          {[0.4, 0.8, 1.2, 1.6, 2, 2.4, 2.8].map((y) => (
            <Cy key={y} s={[0.02, 0.02, 0.4, 8]} position={[0, y, 0]} rotation={[0, 0, Math.PI / 2]} c="#c79a3c" ns />
          ))}
        </Detail>
      </group>
      {[
        [0.75, 3.55, '#ff2d95'],
        [1.02, 3.42, '#2de2e6'],
      ].map(([x, z, c]) => (
        <group key={x} position={[x, 0, z]}>
          <Cy s={[0.13, 0.11, 0.26, 20]} position={[0, 0.13, 0]} c="#c9ccd6" o={{ metalness: 0.6, roughness: 0.35 }} />
          <Cy s={[0.115, 0.115, 0.01, 20]} position={[0, 0.262, 0]} c={c} o={{ roughness: 0.2 }} ns />
        </group>
      ))}
      <group position={[-0.85, 3.08, 3.45]}>
        <Cy s={[0.008, 0.008, 0.5, 6]} position={[0, -0.25, 0]} c="#111" ns />
        <Sp s={[0.07, 14, 10]} position={[0, -0.55, 0]} ns>
          <GlowMat color="#ffd9a0" intensity={3.2} dayIntensity={0.3} base="#fff2dc" />
        </Sp>
      </group>

      <Vent position={[-1.6, 4.5, 0.8]} />
      <ACUnit position={[1.2, 4.5, -1]} rotation={[0, -0.4, 0]} />
    </group>
  )
}

/* ───────────── Certifications: the Trophy Room ───────────── */

/**
 * The neon name on the Trophy Room. pawnshop.glb has its marquee board lower and further back
 * than the shop built in code, so the neon has a second position for it.
 */
export function TrophyShopSigns() {
  const tripo = useStore((s) => s.modelStatus.pawnshop === 'ready')
  return (
    <Neon position={tripo ? [0.06, 3.0, 3.0] : [0, 3.95, 3.17]} size={tripo ? 0.38 : 0.44} color="#ffc233">
      TROPHY ROOM
    </Neon>
  )
}

/** Marquee bulbs around the sign, chasing in two alternating groups. */
function MarqueeBulbs({ w, h, nx = 11, ny = 3, ...p }) {
  const mats = useMemo(() => [0, 1].map(() => new THREE.MeshStandardMaterial({ color: '#3a2a08', emissive: '#ffcf70' })), [])
  const pts = useMemo(() => {
    const out = []
    for (let i = 0; i < nx; i++) {
      const x = -w / 2 + (w * i) / (nx - 1)
      out.push([x, h / 2], [x, -h / 2])
    }
    for (let i = 1; i < ny - 1; i++) {
      const y = -h / 2 + (h * i) / (ny - 1)
      out.push([-w / 2, y], [w / 2, y])
    }
    return out
  }, [w, h, nx, ny])
  useFrame(({ clock }) => {
    const flip = Math.floor(clock.elapsedTime * 2.2) % 2
    const k = 0.3 + 0.7 * env.mix
    mats[0].emissiveIntensity = (flip ? 3.2 : 0.6) * k
    mats[1].emissiveIntensity = (flip ? 0.6 : 3.2) * k
  })
  return (
    <group {...p}>
      {pts.map(([x, y], i) => (
        <mesh key={i} position={[x, y, 0]} material={mats[i % 2]}>
          <sphereGeometry args={[0.04, 10, 8]} />
        </mesh>
      ))}
    </group>
  )
}

export function TrophyShop() {
  const wall = plasterSet({ color: '#44236b', seed: 17, streaks: 6 })
  return (
    <group>
      <Shell w={4.5} h={5} d={6} set={wall} trim="#241238" plinth="#160a26" />
      <B s={[4.62, 0.06, 6.12]} position={[0, 4.56, 0]} o={GOLD} ns />
      {/* display window with a gold frame */}
      <B s={[2.68, 1.98, 0.14]} position={[-0.6, 1.6, 3.02]} o={{ ...GOLD, emissiveIntensity: 0.15 }} ns />
      <mesh position={[-0.6, 1.6, 3.1]}>
        <planeGeometry args={[2.5, 1.8]} />
        <GlowMat color="#ffd27a" intensity={1.35} dayIntensity={0.25} base="#2a1c08" emissiveMap={glassTex(3, true)} />
      </mesh>
      <RB s={[2.86, 0.1, 0.46]} r={0.03} position={[-0.6, 0.66, 3.27]} c="#12091f" o={{ roughness: 0.35 }} ns />
      <Trophy position={[-1.5, 0.71, 3.27]} s={1.15} />
      <Trophy position={[-0.9, 0.71, 3.27]} s={1.5} />
      <Trophy position={[-0.25, 0.71, 3.27]} s={1.25} />
      <Trophy position={[0.35, 0.71, 3.27]} s={1.05} />

      <Door position={[1.4, 0, 3.06]} w={1.05} c="#1d0f30" glow="#ffd27a" frame="#12091f" />
      <Awning w={2.9} position={[-0.6, 2.98, 3.02]} c1="#ffc233" c2="#44236b" stripes={8} len={1} />

      {/* marquee sign */}
      <B s={[4.14, 0.94, 0.1]} position={[0, 3.95, 3.05]} o={{ ...GOLD, emissiveIntensity: 0.12 }} ns />
      <B s={[3.86, 0.66, 0.14]} position={[0, 3.95, 3.07]} c="#0e0718" o={{ roughness: 0.5 }} ns />
      <Detail>
        <MarqueeBulbs w={4} h={0.8} position={[0, 3.95, 3.13]} />
      </Detail>

      {/* the big cup on the roof */}
      <RB s={[1.1, 0.4, 1.1]} r={0.05} position={[0.2, 5.2, 0.6]} c="#160a26" />
      <Trophy s={3} position={[0.2, 5.4, 0.6]} />
      <Vent position={[-1.4, 5, -1.2]} />
      <NightLight position={[0, 2.2, 5.2]} color="#ffb030" intensity={5} distance={7} />
    </group>
  )
}

/* ───────────── The graffiti wall ───────────── */

const POSTERS = [
  [3.74, 2.62, 0.07, '#ffc233', '#1c1712', 'NO BUGS', 'ALLOWED'],
  [3.82, 1.86, -0.09, '#e8e4f5', '#1c1712', '404', 'not found'],
]

export function BrickWall() {
  const bricks = brickSet()
  return (
    <group>
      <mesh position={[0, 2.1, 0]} castShadow receiveShadow>
        <boxGeometry args={[9, 4.2, 0.5]} />
        <Tex set={bricks} repeat={[3, 1.4]} bump={1.8} o={{ roughness: 0.95 }} />
      </mesh>
      {/* end pilasters */}
      {[-4.6, 4.6].map((x) => (
        <group key={x} position={[x, 0, 0]}>
          <mesh position={[0, 2.2, 0]} castShadow receiveShadow>
            <boxGeometry args={[0.62, 4.4, 0.68]} />
            <Tex set={bricks} repeat={[0.25, 1.47]} bump={1.8} o={{ roughness: 0.95 }} />
          </mesh>
          <RB s={[0.8, 0.16, 0.86]} r={0.04} position={[0, 4.48, 0]} c="#77727f" />
        </group>
      ))}
      {/* coping + footing */}
      <B s={[8.7, 0.1, 0.62]} position={[0, 4.24, 0]} c="#5d5866" ns />
      <RB s={[8.7, 0.12, 0.76]} r={0.035} position={[0, 4.34, 0]} c="#77727f" />
      <B s={[9.2, 0.22, 0.62]} position={[0, 0.11, 0]} c="#3d3944" ns />
      <Contact w={9.6} d={1} />

      <Pipe h={4} position={[4.18, 0.22, 0.3]} c="#2f3039" />
      <WallLamp position={[-2.6, 4.12, 0.26]} color="#ffc9ec" />
      <WallLamp position={[2.6, 4.12, 0.26]} color="#ffc9ec" />

      {/* wheat-pasted posters */}
      {POSTERS.map(([x, y, rot, bg, ink, big, small]) => (
        <group key={big} position={[x, y, 0.256]} rotation={[0, 0, rot]}>
          <mesh>
            <planeGeometry args={[0.62, 0.78]} />
            <meshStandardMaterial color={bg} roughness={1} />
          </mesh>
          <Label position={[0, 0.12, 0.004]} size={0.17} color={ink}>
            {big}
          </Label>
          <Label position={[0, -0.14, 0.004]} size={0.1} color={ink} font="marker">
            {small}
          </Label>
        </group>
      ))}

      {/* weeds along the foot of the wall */}
      <Detail>
        {[-3.9, -2.2, -0.4, 1.1, 2.9].map((x, i) => (
          <group key={x} position={[x, 0, 0.36]}>
            {[-0.07, 0, 0.08].map((dx, k) => (
              <mesh key={dx} position={[dx, 0.1 + (k % 2) * 0.04, 0]} rotation={[0, 0, dx * 3]}>
                <coneGeometry args={[0.03, 0.22 + ((i + k) % 3) * 0.06, 6]} />
                <meshStandardMaterial color="#3f8a4d" roughness={0.9} />
              </mesh>
            ))}
          </group>
        ))}
      </Detail>
    </group>
  )
}
