// Lays out the whole block. Positions are in world units; x runs left→right,
// z runs back→front (the street runs along x between z = -1 and z = 4).
import * as THREE from 'three'
import { useEffect, useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import { useStore } from '../store.js'
import { SECTIONS } from '../data/sections.js'
import { NightLight, Pop, SW, Spot, clamp, damp, overlayEvents, view } from './kit.jsx'
import { Slot } from './Slot.jsx'
import { Boombox } from './pieces/Boombox.jsx'
import { Detail } from './pieces/parts.jsx'
import { Crates, Mailbox, NewsBox, ParkingMeter, PottedPlant, StringLights } from './pieces/Extras.jsx'
import { Hologram } from './Hologram.jsx'
import { Ground } from './pieces/Ground.jsx'
import {
  Apartment,
  BrickWall,
  Storefront,
  StorefrontSigns,
  TechShop,
  TechShopSigns,
  TrophyShop,
  TrophyShopSigns,
} from './pieces/Buildings.jsx'
import { FigureMotion, FigureStandee, GraffitiTag, LowriderSlot, Taxi } from './pieces/HeroPieces.jsx'
import { Ball, Court, CourtBanner, CourtLogo, Hoop, Payphone, PayphoneBody } from './pieces/Yard.jsx'
import {
  Barrier,
  Bench,
  Cone,
  Hydrant,
  Manhole,
  Rain,
  StreetLamp,
  StreetSign,
  TrashCan,
  Tree,
} from './pieces/Props.jsx'

function Hotspot({ s }) {
  const home = useStore((st) => st.section === 'home')
  const hot = useStore((st) => st.hovered === s.id)
  const setSection = useStore((st) => st.setSection)
  const setHovered = useStore((st) => st.setHovered)
  const btn = useRef()
  const p = useMemo(() => new THREE.Vector3(), [])
  // On phones the block is wider than the screen. A label near the edge fades out
  // instead of being cut in half.
  useFrame(({ camera, size }) => {
    const el = btn.current
    if (!el) return
    let o = 1
    if (size.width < 820 && useStore.getState().section === 'home') {
      p.set(...s.anchor).project(camera)
      o = clamp((0.86 - Math.abs(p.x)) / 0.2, 0, 1)
    }
    el.style.opacity = o === 1 ? '' : o.toFixed(2)
    el.style.pointerEvents = o < 0.4 ? 'none' : ''
  })
  return (
    <Html position={s.anchor} center zIndexRange={[20, 0]}>
      <button
        ref={btn}
        type="button"
        className={`hotspot ${home ? '' : 'is-hidden'} ${hot ? 'is-hot' : ''}`}
        tabIndex={home ? 0 : -1}
        {...overlayEvents}
        onClick={(e) => {
          e.stopPropagation() // keep the click out of the 3D scene underneath
          setSection(s.id)
        }}
        onPointerEnter={() => setHovered(s.id)}
        onPointerLeave={() => setHovered(null)}
      >
        <i />
        {s.label}
      </button>
    </Html>
  )
}

export function World() {
  const root = useRef()
  const spin = useRef(0)
  const pan = useRef(0)
  const touched = useRef(false) // has the visitor dragged yet?
  const gl = useThree((s) => s.gl)
  const ready = useStore((s) => s.ready)

  // Drag left/right on the overview: spins the block on big screens, pans across it on phones.
  useEffect(() => {
    const el = gl.domElement
    let down = false
    let lastX = 0
    const onDown = (e) => {
      down = true
      lastX = e.clientX
    }
    const onMove = (e) => {
      if (!down) return
      if (useStore.getState().section === 'home') {
        const dx = e.clientX - lastX
        if (window.innerWidth < 820) {
          if (Math.abs(dx) > 0) touched.current = true
          pan.current = clamp(pan.current - dx * 0.042, -8.5, 8.5)
        } else {
          spin.current = clamp(spin.current + dx * 0.005, -0.6, 0.6)
        }
      }
      lastX = e.clientX
    }
    const onUp = () => {
      down = false
    }
    el.addEventListener('pointerdown', onDown)
    window.addEventListener('pointermove', onMove, true)
    window.addEventListener('pointerup', onUp, true)
    window.addEventListener('pointercancel', onUp, true)
    return () => {
      el.removeEventListener('pointerdown', onDown)
      window.removeEventListener('pointermove', onMove, true)
      window.removeEventListener('pointerup', onUp, true)
      window.removeEventListener('pointercancel', onUp, true)
    }
  }, [gl])

  useFrame((_, dt) => {
    if (!root.current) return
    const home = useStore.getState().section === 'home'
    const phone = window.innerWidth < 820
    if (!home || phone) spin.current = 0
    if (!home || !phone) pan.current = 0
    // Until the visitor drags, drift slowly from side to side so it is obvious there is more to see.
    const drift = home && phone && !touched.current ? Math.sin(performance.now() / 3600) * 4.5 : pan.current
    view.pan = damp(view.pan, home && phone ? drift : 0, 4, dt)
    root.current.rotation.y = damp(root.current.rotation.y, spin.current, 5, dt)
  })

  return (
    <group ref={root}>
      <Pop delay={0}>
        <Ground />
      </Pop>

      {/* ── back row ── */}
      <Pop delay={0.55} position={[-1.5, SW, -7.7]}>
        <Apartment />
      </Pop>

      <Pop delay={0.3} position={[-10.5, SW, -6.5]}>
        <Spot id="skills">
          <Slot name="shop">
            <TechShop />
          </Slot>
          <TechShopSigns />
        </Spot>
      </Pop>

      <Pop delay={0.45} position={[-1.5, SW, -4]}>
        <Spot id="about" lift={0.04}>
          <Slot name="wall">
            <BrickWall />
          </Slot>
          <GraffitiTag />
        </Spot>
      </Pop>

      <Pop delay={0.7} position={[6.25, SW, -6.5]}>
        <Spot id="projects">
          <Slot name="storefront">
            <Storefront />
          </Slot>
          <StorefrontSigns />
        </Spot>
      </Pop>
      <Pop delay={1.2} position={[0, SW, 0]}>
        <Cone position={[4.3, 0, -2.9]} />
        <Cone position={[8.4, 0, -2.6]} />
        <Barrier position={[6.1, 0, -2.5]} rotation={[0, 0.12, 0]} />
      </Pop>

      <Pop delay={0.85} position={[11.75, SW, -6.5]}>
        <Spot id="certs">
          <Slot name="pawnshop">
            <TrophyShop />
          </Slot>
          <TrophyShopSigns />
        </Spot>
      </Pop>

      {/* ── the street ── */}
      <Pop delay={1.0} position={[-5.1, SW, -2.2]}>
        <Spot id="about" lift={0.18}>
          <FigureMotion>
            {/* hologram first, then the real model, each time About opens */}
            <Hologram section="about" minY={SW} maxY={SW + 2.8}>
              <Slot name="figure">
                <FigureStandee />
              </Slot>
            </Hologram>
          </FigureMotion>
          {/* soft key light so the figure reads at night */}
          <NightLight position={[0.9, 2.6, 2.4]} color="#ffe9d2" intensity={14} distance={7} />
        </Spot>
      </Pop>

      <Pop delay={1.1} position={[2.2, 0.1, 0.4]}>
        <Spot id="experience">
          <LowriderSlot />
        </Spot>
      </Pop>
      <Taxi />
      <Manhole position={[-0.8, 0.1, 2.4]} />

      {/* ── front row ── */}
      <Pop delay={0.9} position={[-8.5, SW, 7.3]}>
        <Spot id="education" lift={0.06}>
          <Slot name="court">
            <Court />
            <Hoop />
          </Slot>
          <CourtLogo />
          <Ball />
          <CourtBanner />
        </Spot>
      </Pop>

      <Pop delay={1.15} position={[9.5, SW, 7.2]}>
        <Spot id="contact">
          <Payphone>
            <Slot name="payphone">
              <PayphoneBody />
            </Slot>
          </Payphone>
        </Spot>
      </Pop>

      {/* ── street furniture ── */}
      <Pop delay={1.3} position={[0, SW, 0]}>
        <StreetLamp position={[-6.9, 0, -1.5]} dir={1} />
        <StreetLamp position={[9.2, 0, -1.5]} dir={1} />
        <StreetLamp position={[1.6, 0, 4.6]} dir={-1} />
        <StreetSign position={[-14.2, 0, 4.6]} />
        <Hydrant position={[4.5, 0, -1.6]} />
        <TrashCan position={[-6.85, 0, -3.15]} />
        <Boombox position={[-3.7, 0, -3.1]} rotation={[0, 0.2, 0]} />
        <Bench position={[4.4, 0, 6.6]} />
        <Tree position={[14.2, 0, 9.3]} s={0.75} />
        <Tree position={[-14.2, 0, 9.3]} s={0.7} />
        <Tree position={[-13.6, 0, -2.4]} s={0.8} />
      </Pop>

      {/* ── extra street life ── */}
      <Pop delay={1.45} position={[0, SW, 0]}>
        <ParkingMeter position={[0.4, 0, -1.4]} />
        <NewsBox position={[8.1, 0, -1.7]} rotation={[0, -0.2, 0]} />
        <Mailbox position={[11.6, 0, 5.1]} rotation={[0, -0.4, 0]} />
        <PottedPlant position={[-7.85, 0, -2.8]} />
        <PottedPlant position={[-9.15, 0, -2.85]} s={0.85} pot="#3d6fb0" seed={2} leaf="#4bbf78" />
        <PottedPlant position={[13.95, 0, -2.9]} s={0.9} pot="#c99a2a" seed={3} leaf="#37a05f" />
        <Crates position={[9.05, 0, -3.05]} rotation={[0, 0.25, 0]} />
        <Detail>
          <StringLights from={[-7.1, 5.55, -3.45]} to={[9.6, 5.05, -3.45]} sag={0.55} count={22} />
          <StringLights from={[3.1, 4.45, -3.7]} to={[1.6, 4.1, 4.6]} sag={0.45} count={11} hang={6} />
        </Detail>
      </Pop>

      <Rain />

      {/* Labels mount only after everything has loaded, so nothing re-suspends under them. */}
      {ready && SECTIONS.filter((s) => s.anchor).map((s) => <Hotspot key={s.id} s={s} />)}
    </group>
  )
}
