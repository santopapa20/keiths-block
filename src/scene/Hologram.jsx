// Hologram reveal: when `section` becomes active, whatever is inside turns into a
// teal scan-line hologram, holds for a moment, then a bright scan line sweeps from
// the feet to the head and leaves the real, textured model behind it.
import * as THREE from 'three'
import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useStore } from '../store.js'
import { clamp, damp } from './kit.jsx'

const HOLD = 3.4 // seconds as a full hologram (covers the camera fly-in, then lingers)
const SWEEP = 2.6 // seconds for the scan line to travel feet → head

const VERT_HEAD = /* glsl */ `
  varying float vHoloY;
`
const VERT_BODY = /* glsl */ `
  vHoloY = (modelMatrix * vec4(transformed, 1.0)).y;
`
const FRAG_HEAD = /* glsl */ `
  varying float vHoloY;
  uniform float uHolo;
  uniform float uWipe;
  uniform float uTime;
  uniform float uMinY;
  uniform float uMaxY;
  uniform vec3 uHoloColor;
`
const FRAG_BODY = /* glsl */ `
  {
    float hy = (vHoloY - uMinY) / max(0.0001, uMaxY - uMinY);
    // hologram above the scan line, real model below it
    float mask = uHolo * smoothstep(uWipe - 0.015, uWipe + 0.015, hy);

    vec3 hN = normalize(vNormal);
    vec3 hV = normalize(vViewPosition);
    float fres = pow(1.0 - abs(dot(hN, hV)), 2.2);
    float lines = 0.5 + 0.5 * sin(hy * 300.0 - uTime * 7.0);
    float slow = 0.5 + 0.5 * sin(hy * 9.0 + uTime * 1.6);
    float lum = dot(gl_FragColor.rgb, vec3(0.299, 0.587, 0.114));
    float flicker = 0.88 + 0.12 * sin(uTime * 43.0) * sin(uTime * 17.0);

    vec3 holo = uHoloColor * (0.12 + lum * 1.1 + fres * 2.6 + lines * 0.28 + slow * 0.12) * flicker;
    float holoAlpha = clamp(0.28 + fres * 0.9 + lines * 0.2, 0.0, 1.0);

    gl_FragColor.rgb = mix(gl_FragColor.rgb, holo, mask);
    gl_FragColor.a = mix(gl_FragColor.a, holoAlpha, mask);

    // the bright scan line itself
    float band = uHolo * exp(-pow((hy - uWipe) / 0.022, 2.0));
    gl_FragColor.rgb += uHoloColor * band * 4.0;
    gl_FragColor.a = max(gl_FragColor.a, band);
  }
`

function patch(material, uniforms) {
  const m = material.clone()
  m.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms)
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', `#include <common>\n${VERT_HEAD}`)
      .replace('#include <project_vertex>', `#include <project_vertex>\n${VERT_BODY}`)
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', `#include <common>\n${FRAG_HEAD}`)
      .replace('#include <dithering_fragment>', `#include <dithering_fragment>\n${FRAG_BODY}`)
  }
  m.customProgramCacheKey = () => 'hologram-reveal'
  m.userData.hologram = true
  return m
}

/**
 * @param section  the section id that triggers the reveal
 * @param minY/maxY  world-space height range of the model (feet / top of head)
 */
export function Hologram({ section, minY = 0, maxY = 3, color = '#35f2d0', children }) {
  const group = useRef()
  const active = useStore((s) => s.section === section)
  const t0 = useRef(null) // clock time the reveal started, null = not running
  const pending = useRef(false)
  const strength = useRef(0)

  const uniforms = useMemo(
    () => ({
      uHolo: { value: 0 },
      uWipe: { value: -0.1 },
      uTime: { value: 0 },
      uMinY: { value: minY },
      uMaxY: { value: maxY },
      uHoloColor: { value: new THREE.Color(color) },
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  )

  useEffect(() => {
    pending.current = active // start (or cancel) on the next frame
    if (!active) t0.current = null
  }, [active])

  useFrame(({ clock }, dt) => {
    const g = group.current
    if (!g) return

    // Patch any mesh that has appeared (the GLB arrives after the placeholder).
    g.traverse((o) => {
      if (!o.isMesh || !o.material || o.material.userData?.hologram) return
      if (!o.material.isMeshStandardMaterial) return
      o.material = patch(o.material, uniforms)
    })

    const now = clock.elapsedTime
    if (pending.current) {
      pending.current = false
      t0.current = now
    }

    let target = 0
    let wipe = -0.1
    if (t0.current !== null) {
      const t = now - t0.current
      if (t < HOLD + SWEEP) {
        target = 1
        const u = clamp((t - HOLD) / SWEEP, 0, 1)
        wipe = -0.1 + u * u * (3 - 2 * u) * 1.25 // ease in-out, ends above the head
      } else {
        t0.current = null
      }
    }

    // Snap on fast (a flickery "materialise"), fade off gently if interrupted.
    strength.current = target === 1 ? damp(strength.current, 1, 9, dt) : damp(strength.current, 0, 6, dt)
    if (target === 0 && t0.current === null && wipe < 0 && strength.current < 0.004) strength.current = 0

    uniforms.uTime.value = now
    uniforms.uHolo.value = strength.current
    if (target === 1) uniforms.uWipe.value = wipe

    const seeThrough = strength.current > 0.002
    g.traverse((o) => {
      if (o.isMesh && o.material?.userData?.hologram) o.material.transparent = seeThrough
    })
  })

  return <group ref={group}>{children}</group>
}
