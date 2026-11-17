import { Suspense, useEffect, useRef } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { PerformanceMonitor } from '@react-three/drei'
import { Bloom, EffectComposer, N8AO, TiltShift2, ToneMapping, Vignette } from '@react-three/postprocessing'
import { ToneMappingMode } from 'postprocessing'
import { env, useStore } from '../store.js'
import { Atmosphere } from './Atmosphere.jsx'
import { CameraRig } from './CameraRig.jsx'
import { World } from './World.jsx'
import { lerp } from './kit.jsx'

function Ready() {
  const setReady = useStore((s) => s.setReady)
  useEffect(() => {
    setReady()
  }, [setReady])
  return null
}

function Effects({ full }) {
  const bloom = useRef()
  useFrame(() => {
    if (bloom.current) bloom.current.intensity = lerp(0.35, 1.05, env.mix)
  })
  return (
    <EffectComposer multisampling={0}>
      {/* soft shading in corners and under ledges; top tier only */}
      {full ? <N8AO halfRes quality="performance" aoRadius={1.1} distanceFalloff={0.8} intensity={2.4} color="#12061f" /> : <></>}
      <Bloom ref={bloom} mipmapBlur luminanceThreshold={0.9} luminanceSmoothing={0.2} intensity={1} radius={0.72} />
      {/* blurs the top and bottom of the frame — this is what makes it read as a miniature; top tier only */}
      {full ? <TiltShift2 blur={0.1} taper={0.55} samples={6} /> : <></>}
      <Vignette offset={0.22} darkness={0.7} />
      <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
    </EffectComposer>
  )
}

/**
 * Shadows are redrawn every frame only on the top tier. Lower tiers redraw them every second or
 * third frame: the shadow pass draws every model on the block, even the ones off screen.
 */
function ShadowPacer() {
  const gl = useThree((s) => s.gl)
  const frame = useRef(0)
  useEffect(() => {
    gl.shadowMap.autoUpdate = false
    gl.shadowMap.needsUpdate = true
    return () => {
      gl.shadowMap.autoUpdate = true
    }
  }, [gl])
  useFrame(() => {
    const { tier, ready } = useStore.getState()
    const every = !ready || tier === 2 ? 1 : tier === 1 ? 2 : 3
    if (++frame.current % every === 0) gl.shadowMap.needsUpdate = true
  })
  return null
}

export default function Scene() {
  const ready = useStore((s) => s.ready)
  const tier = useStore((s) => s.tier)
  const setTier = useStore((s) => s.setTier)
  const locked = useStore((s) => s.qualityLocked)
  const full = tier === 2
  // Phones have very dense screens: drawn at one canvas pixel per CSS pixel the scene looks blocky,
  // and at phone sizes the extra pixels are cheap. Bigger screens keep the lighter setting.
  const phone = typeof window !== 'undefined' && window.innerWidth < 820
  const dpr = phone ? (tier === 0 ? [1, 1.5] : [1, 2]) : full ? [1, 1.5] : 1
  return (
    <Canvas
      shadows
      dpr={dpr}
      camera={{ fov: 30, near: 0.5, far: 2600, position: [0, 46, 78] }}
      gl={{ antialias: false, powerPreference: 'high-performance' }}
    >
      {/* Auto quality: starts in the middle tier, steps up when the frame rate is
          comfortably high and down when it drops. It only starts measuring once the loading
          screen has lifted, so the stutter of models arriving doesn't count against the device. */}
      {!locked && ready && (
        <PerformanceMonitor
          bounds={() => [30, 56]}
          flipflops={3}
          onChange={({ factor }) => setTier(factor > 0.65 ? 2 : factor < 0.35 ? 0 : 1)}
          onFallback={() => setTier(Math.max(0, useStore.getState().tier - 1))}
        />
      )}
      <Suspense fallback={null}>
        <Atmosphere />
        <World />
        <Ready />
      </Suspense>
      <CameraRig />
      <ShadowPacer />
      <Effects full={full} />
    </Canvas>
  )
}
