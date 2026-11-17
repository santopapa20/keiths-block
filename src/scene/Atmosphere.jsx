// Sky, sun/moon, stars and the main lights. Everything blends between
// night (env.mix = 1) and day (env.mix = 0).
import * as THREE from 'three'
import { useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Environment, Lightformer, Stars } from '@react-three/drei'
import { env, useStore } from '../store.js'
import { damp, lerp } from './kit.jsx'
import { cityTex, cloudTex } from './tex.js'

const skyVert = /* glsl */ `
  varying vec3 vDir;
  void main() {
    vDir = normalize(position);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`
const skyFrag = /* glsl */ `
  uniform vec3 top;
  uniform vec3 bottom;
  varying vec3 vDir;
  void main() {
    float h = smoothstep(-0.22, 0.55, vDir.y);
    gl_FragColor = vec4(mix(bottom, top, h), 1.0);
  }
`

const belowVert = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`
const belowFrag = /* glsl */ `
  uniform sampler2D map;
  uniform float uOpacity;
  uniform float uRepeat;
  uniform vec2 uDrift;
  uniform vec3 uTint;
  uniform float uBoost;
  varying vec2 vUv;
  void main() {
    vec4 t = texture2D(map, vUv * uRepeat + uDrift);
    float fade = smoothstep(0.5, 0.12, distance(vUv, vec2(0.5)));
    // city lights: brightness is the alpha. clouds: use the texture's own alpha.
    float a = mix(t.a, max(max(t.r, t.g), t.b), uBoost);
    vec3 rgb = mix(uTint, t.rgb * uTint * 2.0, uBoost);
    gl_FragColor = vec4(rgb, a * fade * uOpacity);
  }
`

/**
 * What lies beneath the floating block: a city glittering far below at night,
 * a deck of clouds by day. Two big flat sheets, so it costs almost nothing.
 */
function Below() {
  const city = useRef()
  const clouds = useRef()
  const cityU = useMemo(
    () => ({ map: { value: cityTex() }, uOpacity: { value: 1 }, uRepeat: { value: 2.5 }, uDrift: { value: new THREE.Vector2() }, uTint: { value: new THREE.Color('#ffffff') }, uBoost: { value: 1 } }),
    [],
  )
  const cloudU = useMemo(
    () => ({ map: { value: cloudTex() }, uOpacity: { value: 0 }, uRepeat: { value: 3 }, uDrift: { value: new THREE.Vector2() }, uTint: { value: new THREE.Color('#ffffff') }, uBoost: { value: 0 } }),
    [],
  )
  useFrame(({ clock }) => {
    const m = env.mix
    cityU.uOpacity.value = m * 0.6
    city.current.visible = m > 0.02
    cloudU.uOpacity.value = lerp(0.95, 0.16, m)
    cloudU.uTint.value.setRGB(lerp(1, 0.55, m), lerp(1, 0.4, m), lerp(1, 0.85, m))
    cloudU.uDrift.value.set(clock.elapsedTime * 0.004, clock.elapsedTime * 0.0015)
  })
  return (
    <>
      <mesh ref={city} rotation={[-Math.PI / 2, 0, 0]} position={[0, -70, -20]}>
        <planeGeometry args={[520, 520]} />
        <shaderMaterial uniforms={cityU} vertexShader={belowVert} fragmentShader={belowFrag} transparent depthWrite={false} blending={THREE.AdditiveBlending} />
      </mesh>
      <mesh ref={clouds} rotation={[-Math.PI / 2, 0, 0]} position={[0, -34, -10]}>
        <planeGeometry args={[420, 420]} />
        <shaderMaterial uniforms={cloudU} vertexShader={belowVert} fragmentShader={belowFrag} transparent depthWrite={false} />
      </mesh>
    </>
  )
}

export function Atmosphere() {
  const night = useStore((s) => s.night)
  const hemi = useRef()
  const sun = useRef()
  const stars = useRef()
  const disc = useRef()
  const scene = useThree((s) => s.scene)

  const C = useMemo(
    () => ({
      skyTopN: new THREE.Color('#06041a'),
      skyTopD: new THREE.Color('#3f8fda'),
      skyBotN: new THREE.Color('#4a1763'),
      skyBotD: new THREE.Color('#ffd2a6'),
      hemiSkyN: new THREE.Color('#6a58c8'),
      hemiSkyD: new THREE.Color('#d9edff'),
      hemiGndN: new THREE.Color('#2a1638'),
      hemiGndD: new THREE.Color('#8a7358'),
      sunN: new THREE.Color('#9fb2ff'),
      sunD: new THREE.Color('#fff0d2'),
      sunPosN: new THREE.Vector3(-12, 20, 14),
      sunPosD: new THREE.Vector3(14, 24, 12),
      discN: new THREE.Color('#fdf6d8').multiplyScalar(1.5),
      discD: new THREE.Color('#fff3c4').multiplyScalar(3),
    }),
    [],
  )
  const uniforms = useMemo(() => ({ top: { value: new THREE.Color() }, bottom: { value: new THREE.Color() } }), [])

  useFrame((_, dt) => {
    env.mix = damp(env.mix, night ? 1 : 0, 3, dt)
    const m = env.mix
    uniforms.top.value.lerpColors(C.skyTopD, C.skyTopN, m)
    uniforms.bottom.value.lerpColors(C.skyBotD, C.skyBotN, m)
    hemi.current.color.lerpColors(C.hemiSkyD, C.hemiSkyN, m)
    hemi.current.groundColor.lerpColors(C.hemiGndD, C.hemiGndN, m)
    hemi.current.intensity = lerp(1.5, 1.05, m)
    scene.environmentIntensity = lerp(0.9, 0.7, m)
    sun.current.color.lerpColors(C.sunD, C.sunN, m)
    sun.current.intensity = lerp(3.4, 1.9, m)
    sun.current.position.lerpVectors(C.sunPosD, C.sunPosN, m)
    stars.current.visible = m > 0.6
    disc.current.color.lerpColors(C.discD, C.discN, m)
  })

  return (
    <>
      <mesh scale={320} renderOrder={-10}>
        <sphereGeometry args={[1, 32, 16]} />
        <shaderMaterial side={THREE.BackSide} depthWrite={false} uniforms={uniforms} vertexShader={skyVert} fragmentShader={skyFrag} />
      </mesh>

      {/* moon by night, sun by day */}
      <mesh position={[-70, 52, -150]}>
        <sphereGeometry args={[8, 32, 16]} />
        <meshBasicMaterial ref={disc} toneMapped={false} />
      </mesh>

      <Below />

      <group ref={stars}>
        <Stars radius={140} depth={50} count={1800} factor={6} saturation={0.4} fade speed={0.6} />
      </group>

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
      <directionalLight
        ref={sun}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0003}
        shadow-normalBias={0.04}
        shadow-radius={3.5}
      >
        <orthographicCamera attach="shadow-camera" args={[-21, 21, 16, -16, 1, 70]} />
      </directionalLight>
    </>
  )
}
