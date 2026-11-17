// Flies the camera between sections and nudges the view sideways so the
// focused piece is never hidden behind the info panel.
import * as THREE from 'three'
import { useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { useStore } from '../store.js'
import { SECTION_MAP } from '../data/sections.js'
import { clamp, damp, view } from './kit.jsx'

export function CameraRig() {
  const camera = useThree((s) => s.camera)
  const size = useThree((s) => s.size)
  const section = useStore((s) => s.section)

  const v = useMemo(
    () => ({
      pos: new THREE.Vector3(0, 46, 78), // intro start: high and far
      look: new THREE.Vector3(0, 2, 0),
      wantPos: new THREE.Vector3(),
      wantLook: new THREE.Vector3(),
    }),
    [],
  )
  const off = useRef({ x: 0, y: 0 })

  useFrame((state, dt) => {
    const s = SECTION_MAP[section] ?? SECTION_MAP.home
    const home = section === 'home'
    const aspect = size.width / size.height
    const mobile = size.width < 820
    // Same rule as the CSS: on wide windows the headline sits in a left column.
    const split = home && size.width >= 1100 && aspect >= 1.5

    v.wantPos.set(...s.cam)
    v.wantLook.set(...s.look)

    // Pull back on narrow / portrait screens so everything still fits.
    // On the overview the whole 30-unit-wide block has to fit across the screen.
    // `room` is the share of the width the block may use; 1.62 keeps it from outgrowing the height.
    const room = split ? 0.62 : 1
    let pull = home ? clamp(Math.max(1.62, (72 / (aspect * room) + 13.5) / 39.6), 1.05, 4.5) : clamp(1.7 / aspect, 1.18, 3.2)
    // Phones: showing all 30 units would make the block tiny, so show about 20 and let the visitor swipe.
    if (home && mobile) pull = clamp(10 / (0.268 * aspect) / 39.6, 1.15, 2.4)
    v.wantPos.sub(v.wantLook).multiplyScalar(pull).add(v.wantLook)

    if (home && mobile) {
      v.wantPos.x += view.pan
      v.wantLook.x += view.pan
    }

    // Gentle parallax from the pointer (not on phones, where a touch would make it jump).
    const p = mobile ? 0 : home ? 1 : 0.25
    v.wantPos.x += state.pointer.x * 1.6 * p
    v.wantPos.y += state.pointer.y * 0.8 * p

    // Hold the high intro shot until the scene has loaded, then swoop in.
    const k = useStore.getState().ready ? 1 - Math.exp(-2.6 * dt) : 0
    v.pos.lerp(v.wantPos, k)
    v.look.lerp(v.wantLook, k)
    camera.position.copy(v.pos)
    camera.lookAt(v.look)

    // Shift the picture: left when the panel is open on desktop,
    // up when the bottom sheet is open on mobile, slightly down on the hero.
    let ox = 0
    let oy = -size.height * (mobile ? 0.09 : 0.1) // leave sky for the headline
    if (split) {
      ox = -size.width * 0.185 // slide the block into the right-hand side
      oy = -size.height * 0.02
    }
    if (!home) {
      if (mobile) {
        oy = size.height * 0.2
      } else {
        ox = Math.min(470, size.width * 0.42) / 2
        oy = 0
      }
    }
    off.current.x = damp(off.current.x, ox, 4, dt)
    off.current.y = damp(off.current.y, oy, 4, dt)
    camera.setViewOffset(size.width, size.height, off.current.x, off.current.y, size.width, size.height)
  })

  return null
}
