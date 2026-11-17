// The main lights and the reflections, plus the view around the block (see Vista.jsx).
// Everything blends between night (env.mix = 1) and day (env.mix = 0).
import * as THREE from 'three'
import { useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Environment, Lightformer } from '@react-three/drei'
import { env, useStore } from '../store.js'
import { damp, lerp } from './kit.jsx'
import { Vista } from './Vista.jsx'

export function Atmosphere() {
  const night = useStore((s) => s.night)
  const hemi = useRef()
  const sun = useRef()
  const scene = useThree((s) => s.scene)

  const C = useMemo(
    () => ({
      hemiSkyN: new THREE.Color('#6a58c8'),
      hemiSkyD: new THREE.Color('#d9edff'),
      hemiGndN: new THREE.Color('#2a1638'),
      hemiGndD: new THREE.Color('#8a7358'),
      sunN: new THREE.Color('#9fb2ff'),
      sunD: new THREE.Color('#fff0d2'),
      sunPosN: new THREE.Vector3(-12, 20, 14),
      sunPosD: new THREE.Vector3(14, 24, 12),
    }),
    [],
  )

  useFrame((_, dt) => {
    env.mix = damp(env.mix, night ? 1 : 0, 3, dt)
    const m = env.mix
    hemi.current.color.lerpColors(C.hemiSkyD, C.hemiSkyN, m)
    hemi.current.groundColor.lerpColors(C.hemiGndD, C.hemiGndN, m)
    hemi.current.intensity = lerp(1.5, 1.05, m)
    scene.environmentIntensity = lerp(0.9, 0.7, m)
    sun.current.color.lerpColors(C.sunD, C.sunN, m)
    sun.current.intensity = lerp(3.4, 1.9, m)
    sun.current.position.lerpVectors(C.sunPosD, C.sunPosN, m)
  })

  return (
    <>
      <Vista />

      {/* What shiny things reflect (glass, chrome, car paint, wet road). Drawn once, costs nothing per frame. */}
      <Environment resolution={64} frames={1} background={false}>
        <color attach="background" args={['#0b0818']} />
        <Lightformer form="rect" intensity={4} color="#ff2d95" position={[-7, 3, 5]} scale={[7, 3, 1]} />
        <Lightformer form="rect" intensity={4} color="#2de2e6" position={[7, 3, 5]} scale={[7, 3, 1]} />
        <Lightformer form="rect" intensity={2.2} color="#ffd9a8" position={[0, 9, 0]} rotation={[Math.PI / 2, 0, 0]} scale={[12, 12, 1]} />
        <Lightformer form="rect" intensity={1.4} color="#6a58c8" position={[0, 3, -9]} scale={[22, 7, 1]} />
        <Lightformer form="rect" intensity={1.2} color="#ffb45e" position={[0, 1.5, 9]} scale={[18, 3, 1]} />
      </Environment>

      <hemisphereLight ref={hemi} />
      <directionalLight ref={sun} castShadow shadow-mapSize={[2048, 2048]} shadow-bias={-0.0003} shadow-normalBias={0.04} shadow-radius={3.5}>
        <orthographicCamera attach="shadow-camera" args={[-21, 21, 16, -16, 1, 70]} />
      </directionalLight>
    </>
  )
}
