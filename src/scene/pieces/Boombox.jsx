// The boombox by the wall. Click it (or its speech bubble) to turn the music on and off.
import * as THREE from 'three'
import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import { useStore } from '../../store.js'
import { TRACK, beat, sampleBeat, toggleMusic } from '../../sound.js'
import { clamp, damp, overlayEvents } from '../kit.jsx'
import { B, CHROME, Contact, Cy, Detail, RB, Sp } from './parts.jsx'
import { Slot } from '../Slot.jsx'

const NOTE_COLORS = ['#ff2d95', '#2de2e6', '#ffc233', '#5dfc8a', '#ff2d95', '#2de2e6']

/** A little 3D quaver: head, stem and flag. */
function Note({ color }) {
  return (
    <group>
      <mesh rotation={[0, 0, 0.5]} scale={[1.25, 0.9, 1]}>
        <sphereGeometry args={[0.07, 12, 10]} />
        <meshBasicMaterial color={color} toneMapped={false} transparent />
      </mesh>
      <mesh position={[0.075, 0.16, 0]}>
        <boxGeometry args={[0.022, 0.32, 0.022]} />
        <meshBasicMaterial color={color} toneMapped={false} transparent />
      </mesh>
      <mesh position={[0.13, 0.27, 0]} rotation={[0, 0, -0.5]}>
        <boxGeometry args={[0.13, 0.045, 0.022]} />
        <meshBasicMaterial color={color} toneMapped={false} transparent />
      </mesh>
    </group>
  )
}

export function Boombox({ position, rotation }) {
  const music = useStore((s) => s.music)
  const ready = useStore((s) => s.ready)
  const inAbout = useStore((s) => s.section === 'about')
  const setHovered = useStore((s) => s.setHovered)
  const tripo = useStore((s) => s.modelStatus.boombox === 'ready')

  const body = useRef()
  const speakers = useRef([])
  const cones = useRef([])
  const bars = useRef()
  const notes = useRef()
  const ring = useRef()
  const led = useRef()

  const power = useRef(0) // eases 0 → 1 when switched on, back to 0 when switched off
  const kick = useRef(0) // one-shot bump at the moment of switching
  const ringT = useRef(1) // 0 → 1 as the "power on" shockwave expands
  const first = useRef(true)

  const coneMat = useMemo(() => new THREE.MeshStandardMaterial({ color: '#0a2030', emissive: '#2de2e6', emissiveIntensity: 0.3, roughness: 0.4 }), [])
  // Glow laid over the speaker cones of the Tripo model, which is one solid piece and can't thump.
  const glowMat = useMemo(
    () => new THREE.MeshBasicMaterial({ color: '#2de2e6', transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }),
    [],
  )
  const tint = useMemo(() => ({ off: new THREE.Color('#2de2e6'), a: new THREE.Color('#ff2d95'), b: new THREE.Color('#2de2e6') }), [])

  // Switching on fires a shockwave; switching off gives the box a little slump.
  useEffect(() => {
    if (first.current) {
      first.current = false
      return
    }
    kick.current = music ? 1 : -1
    if (music) ringT.current = 0
  }, [music])

  useFrame(({ clock }, dt) => {
    const t = clock.elapsedTime
    sampleBeat(t)
    power.current = damp(power.current, music ? 1 : 0, music ? 5 : 3, dt)
    kick.current = damp(kick.current, 0, 5, dt)
    const p = power.current
    const bass = beat.bass

    // body: bounces to the bass when on, slumps for a moment when switched off
    if (body.current) {
      const bounce = bass * 0.07 * p + Math.max(0, kick.current) * 0.12
      const slump = Math.min(0, kick.current) * 0.1
      body.current.position.y = bounce
      body.current.scale.set(1 - slump * 0.6, 1 + slump + bass * 0.04 * p, 1)
      body.current.rotation.z = Math.sin(t * 9) * 0.02 * p * bass
    }

    // speakers: thump with the bass and swap between pink and cyan
    const idle = 1 + Math.pow(Math.abs(Math.sin(t * 2.2)), 8) * 0.03
    const thump = 1 + bass * 0.3 * p
    speakers.current.forEach((s) => s && s.scale.setScalar(p > 0.02 ? thump : idle))
    cones.current.forEach((c) => c && (c.position.z = 0.012 + bass * 0.05 * p))
    coneMat.emissive.copy(tint.off).lerp(Math.sin(t * 2.4) > 0 ? tint.a : tint.b, p)
    coneMat.emissiveIntensity = 0.3 + (1.4 + bass * 2.6) * p
    glowMat.color.copy(coneMat.emissive)
    glowMat.opacity = p * (0.22 + bass * 0.78)

    // equaliser bars in the cassette window
    if (bars.current) {
      bars.current.children.forEach((bar, i) => {
        const h = clamp(0.08 + beat.bars[i] * 1.1 * p, 0.08, 1)
        bar.scale.y = damp(bar.scale.y, h, 18, dt)
      })
    }

    // power light: red when off, green when on
    if (led.current) {
      led.current.emissive.setRGB(1 - p, p, 0.15)
      led.current.emissiveIntensity = 1.6 + p * 1.6 + (p > 0.5 ? bass : Math.sin(t * 3) * 0.6)
    }

    // "power on" shockwave ring
    if (ring.current) {
      ringT.current = Math.min(1, ringT.current + dt * 1.6)
      const u = ringT.current
      ring.current.visible = u < 1
      ring.current.scale.setScalar(0.3 + u * 3.2)
      ring.current.material.opacity = (1 - u) * 0.9
    }

    // notes float up out of the speakers while it plays
    if (notes.current) {
      notes.current.children.forEach((n, i) => {
        const u = (t * 0.32 + i / 6) % 1
        const side = i % 2 ? 1 : -1
        n.position.set(side * (0.32 + u * 0.5) + Math.sin(u * 9 + i) * 0.12, 0.7 + u * 2.3, 0.2 + Math.cos(u * 7 + i) * 0.12)
        n.rotation.z = Math.sin(u * 6 + i) * 0.5
        const s = p * (0.6 + Math.sin(u * Math.PI) * 0.7) * (1 + bass * 0.25)
        n.scale.setScalar(Math.max(0.0001, s))
        const fade = Math.sin(u * Math.PI) * p
        n.traverse((o) => {
          if (o.material) o.material.opacity = fade
        })
        n.visible = p > 0.01
      })
    }
  })

  const over = (e) => {
    e.stopPropagation()
    setHovered('boombox')
    document.body.style.cursor = 'pointer'
  }
  const out = () => {
    setHovered(null)
    document.body.style.cursor = ''
  }
  const click = (e) => {
    e.stopPropagation()
    if (e.delta > 6) return // that was a drag
    toggleMusic()
  }

  return (
    <group position={position} rotation={rotation}>
      <group ref={body} onClick={click} onPointerOver={over} onPointerOut={out}>
        <Slot name="boombox">
        <group>
        <RB s={[1.06, 0.52, 0.3]} r={0.06} position={[0, 0.28, 0]} c="#23252e" o={{ roughness: 0.4, metalness: 0.3 }} />
        {[-0.3, 0.3].map((x, i) => (
          <group key={x} position={[x, 0.25, 0.155]} ref={(el) => (speakers.current[i] = el)}>
            <mesh>
              <torusGeometry args={[0.165, 0.022, 10, 28]} />
              <meshStandardMaterial {...CHROME} />
            </mesh>
            <mesh rotation={[Math.PI / 2, 0, 0]} material={coneMat}>
              <cylinderGeometry args={[0.15, 0.15, 0.02, 28]} />
            </mesh>
            <group ref={(el) => (cones.current[i] = el)} position={[0, 0, 0.012]}>
              <Sp s={[0.05, 14, 10]} c="#06080c" o={{ roughness: 0.3 }} ns />
            </group>
          </group>
        ))}
        {/* cassette window with a five-band equaliser */}
        <B s={[0.22, 0.14, 0.02]} position={[0, 0.38, 0.155]} c="#06080c" o={{ roughness: 0.1, metalness: 0.5 }} ns />
        <group ref={bars} position={[0, 0.325, 0.168]}>
          {[-0.07, -0.035, 0, 0.035, 0.07].map((x, i) => (
            <group key={x} position={[x, 0, 0]} scale={[1, 0.08, 1]}>
              <mesh position={[0, 0.055, 0]}>
                <boxGeometry args={[0.022, 0.11, 0.004]} />
                <meshBasicMaterial color={['#5dfc8a', '#5dfc8a', '#ffc233', '#ffc233', '#ff2d95'][i]} toneMapped={false} />
              </mesh>
            </group>
          ))}
        </group>
        {/* power light */}
        <mesh position={[0.44, 0.47, 0.155]}>
          <sphereGeometry args={[0.022, 10, 8]} />
          <meshStandardMaterial ref={led} color="#1a1a1a" emissive="#ff2a2a" emissiveIntensity={2} />
        </mesh>
        <Detail>
          {[-0.08, -0.04, 0, 0.04, 0.08].map((x) => (
            <B key={x} s={[0.03, 0.03, 0.04]} position={[x, 0.555, 0.08]} o={CHROME} ns />
          ))}
          <Cy s={[0.006, 0.006, 0.6, 6]} position={[0.42, 0.8, -0.08]} rotation={[0, 0, -0.35]} o={CHROME} ns />
        </Detail>
        <mesh position={[0, 0.54, 0]}>
          <torusGeometry args={[0.34, 0.022, 8, 24, Math.PI]} />
          <meshStandardMaterial {...CHROME} />
        </mesh>
        </group>
        </Slot>

        {/* Effects re-laid on boombox.glb, at positions measured from the model. */}
        {tripo && (
          <group>
            {/* a glow over each speaker cone that pulses with the bass */}
            {[-0.363, 0.363].map((x) => (
              <mesh key={x} position={[x, 0.261, 0.2]} material={glowMat}>
                <ringGeometry args={[0.052, 0.112, 36]} />
              </mesh>
            ))}
            {/* equaliser in the small display between the two knobs */}
            <group ref={bars} position={[0, 0.322, 0.194]}>
              {[-0.048, -0.024, 0, 0.024, 0.048].map((x, i) => (
                <group key={x} position={[x, 0, 0]} scale={[1, 0.08, 1]}>
                  <mesh position={[0, 0.033, 0]}>
                    <boxGeometry args={[0.016, 0.066, 0.003]} />
                    <meshBasicMaterial color={['#5dfc8a', '#5dfc8a', '#ffc233', '#ffc233', '#ff2d95'][i]} toneMapped={false} />
                  </mesh>
                </group>
              ))}
            </group>
            {/* power light, top right corner of the front */}
            <mesh position={[0.5, 0.44, 0.19]}>
              <sphereGeometry args={[0.014, 10, 8]} />
              <meshStandardMaterial ref={led} color="#1a1a1a" emissive="#ff2a2a" emissiveIntensity={2} />
            </mesh>
          </group>
        )}
      </group>

      {/* shockwave when it powers on */}
      <mesh ref={ring} position={[0, 0.3, 0.2]} visible={false}>
        <torusGeometry args={[0.4, 0.02, 8, 48]} />
        <meshBasicMaterial color="#ff2d95" transparent opacity={0} toneMapped={false} depthWrite={false} />
      </mesh>

      <group ref={notes}>
        {NOTE_COLORS.map((c, i) => (
          <group key={i} visible={false}>
            <Note color={c} />
          </group>
        ))}
      </group>

      <Contact w={1.1} d={0.4} opacity={0.6} />

      {/* speech bubble (only in the About view; mounted after loading so nothing re-suspends under it) */}
      {ready && (
        <Html position={[0.1, 1.28, 0.1]} center zIndexRange={[20, 0]}>
          <button
            type="button"
            className={`bubble ${inAbout ? '' : 'is-hidden'} ${music ? 'is-on' : ''}`}
            tabIndex={inAbout ? 0 : -1}
            aria-pressed={music}
            aria-label={music ? `Turn the music off. Now playing ${TRACK.title} by ${TRACK.artist}` : 'Turn the boombox on to play music'}
            {...overlayEvents}
            onClick={(e) => {
              e.stopPropagation() // keep the click out of the 3D scene underneath
              toggleMusic()
            }}
          >
            <span className="bubble__ping" aria-hidden="true" />
            {music ? (
              <>
                <span className="bubble__badge" aria-hidden="true">
                  <span className="bubble__eq">
                    <i />
                    <i />
                    <i />
                  </span>
                </span>
                <span className="bubble__text">Turn me off</span>
              </>
            ) : (
              <>
                <span className="bubble__badge" aria-hidden="true">
                  <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
                    <path d="M8 5.5v13l11-6.5-11-6.500Z" />
                  </svg>
                </span>
                <span className="bubble__text">Turn me on</span>
              </>
            )}
          </button>
        </Html>
      )}
    </group>
  )
}
