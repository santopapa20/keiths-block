// The world around the floating block, built in code: Cebu from the air.
// A sky with a glowing horizon and a moon or sun, a sea with moving ripples, islands with beaches
// (lit up along the coast at night), a long cable-stayed bridge near the horizon, clouds and
// stars. Everything blends between night (env.mix = 1) and day (env.mix = 0).
//
// The camera looks down on the block, which would put a real horizon above the top of the
// picture. So the sea is a plane that slopes away from the viewer: its horizon then sits in the
// upper third of the view, as a straight line, wherever the camera is. Everything standing on the
// sea (islands, bridge, clouds, lights) lives in one group that is sheared by the same slope.
import * as THREE from 'three'
import { useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { env } from '../store.js'
import { rng } from './kit.jsx'

const SEA_Y = -42 // height of the water directly under the block
const SLOPE = Math.tan(THREE.MathUtils.degToRad(12.5)) // how steeply the sea falls away: sets the horizon height
const SEA_R = 1900
const SKY_R = 2000

/* ───────────── sky ───────────── */

const skyVert = /* glsl */ `
  varying vec3 vW;
  void main() {
    vec4 w = modelMatrix * vec4(position, 1.0);
    vW = w.xyz;
    gl_Position = projectionMatrix * viewMatrix * w;
  }
`
const skyFrag = /* glsl */ `
  uniform vec3 uZenith;
  uniform vec3 uMid;
  uniform vec3 uGlow;
  uniform vec3 uUp;
  uniform vec3 uOrb;
  uniform float uMix;
  uniform float uFall;
  varying vec3 vW;
  void main() {
    vec3 d = normalize(vW - cameraPosition);
    float t = max(dot(d, uUp), 0.0); // 0 on the horizon
    vec3 sky = mix(uMid, uZenith, smoothstep(0.0, 0.5, t));
    vec3 col = mix(sky, uGlow, exp(-t * uFall));

    // the sun by day (disc and a wide warm glow), a crescent moon by night
    float c = dot(d, uOrb);
    if (c > 0.9) {
      float ang = acos(min(c, 1.0));
      vec3 right = normalize(cross(uOrb, uUp));
      vec3 up = cross(right, uOrb);
      vec2 p = vec2(dot(d, right), dot(d, up));
      float sun = (1.0 - smoothstep(0.022, 0.03, ang)) * 2.2 + exp(-ang * 9.0) * 0.45;
      float moon = (1.0 - smoothstep(0.019, 0.021, length(p))) * smoothstep(0.016, 0.019, length(p - vec2(0.009, 0.006))) * 1.8 + exp(-ang * 24.0) * 0.28;
      col += mix(vec3(1.0, 0.92, 0.72) * sun, vec3(1.0, 0.95, 0.86) * moon, uMix);
    }
    gl_FragColor = vec4(col, 1.0);
  }
`

/* ───────────── sea ───────────── */

const ISLANDS = [
  // x, z, radius x, radius z, height, seed — ridges along the horizon first
  [-700, -1300, 360, 110, 70, 3],
  [650, -1250, 330, 100, 80, 5],
  [-260, -1040, 95, 42, 26, 8],
  [150, -1550, 220, 60, 40, 9],
  // islands in the middle distance
  [-430, -520, 92, 66, 30, 11],
  [235, -500, 76, 58, 28, 13],
  [-60, -660, 32, 23, 10, 15],
  [95, -330, 18, 14, 7, 17],
  // the near coasts, low in the corners of the view
  [-98, -78, 42, 36, 13, 19],
  [102, -88, 40, 34, 12, 21],
]

const seaVert = /* glsl */ `
  varying vec2 vP;
  void main() {
    vP = vec2(position.x, -position.y); // where this bit of water is on the map, before the slope
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`
const seaFrag = /* glsl */ `
  uniform float uTime;
  uniform vec3 uDeep;
  uniform vec3 uMid;
  uniform vec3 uGlow;
  uniform vec3 uShallow;
  uniform vec3 uGlint;
  uniform vec2 uOrbAz;
  uniform vec4 uIsl[${ISLANDS.length}];
  varying vec2 vP;

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
  }
  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y);
  }

  void main() {
    vec2 p = vP;
    float r = length(p);
    // ripples: long and thin, sliding slowly. They fade out with distance so the far water stays calm.
    float w = noise(vec2(p.x * 0.05 + uTime * 0.05, p.y * 0.15 - uTime * 0.1)) * 0.6 + noise(vec2(p.x * 0.12 - uTime * 0.06, p.y * 0.34 + uTime * 0.07)) * 0.4;
    float calm = 1.0 - smoothstep(120.0, 750.0, r);
    w = mix(0.5, w, calm);

    vec3 col = mix(uDeep, uMid, clamp(smoothstep(60.0, 900.0, r) + (w - 0.5) * 0.3, 0.0, 1.0));

    // bright shallows around every island
    float sh = 0.0;
    for (int i = 0; i < ${ISLANDS.length}; i++) {
      float d = length((p - uIsl[i].xy) / uIsl[i].zw);
      sh = max(sh, 1.0 - smoothstep(1.0, 1.6, d));
    }
    col = mix(col, uShallow, sh * (0.7 + 0.3 * w));

    // glints on the crests, and a shimmering path under the moon / sun
    float crest = smoothstep(0.7, 0.93, w);
    col += uGlint * crest * (0.2 + sh * 0.3);
    float along = dot(p / max(r, 1.0), uOrbAz);
    float path = smoothstep(0.985, 0.9998, along) * smoothstep(60.0, 500.0, r);
    col += uGlint * path * (0.16 + 0.5 * smoothstep(0.45, 0.9, w));

    // the far water melts into the glow on the horizon
    col = mix(col, uGlow, smoothstep(650.0, 1750.0, r) * 0.96);
    gl_FragColor = vec4(col, 1.0);
  }
`

/* ───────────── islands ───────────── */

const SAND = new THREE.Color('#ecdcab')
const GREEN = new THREE.Color('#57ad55')
const DEEP_GREEN = new THREE.Color('#2a7a3f')

/** An island's outline and height, as functions, so its lights can be put exactly on its surface. */
function islandShape(seed) {
  const r = rng(seed)
  const k = [r() * 6.28, r() * 6.28, r() * 6.28, 0.14 + r() * 0.12, 0.06 + r() * 0.08]
  return {
    radius: (a) => 1 + k[3] * Math.sin(a * 2 + k[0]) + k[4] * Math.sin(a * 5 + k[1]) + 0.04 * Math.sin(a * 9 + k[2]),
    // 1 in the middle, 0 at the shore
    height: (a, f) => Math.pow(Math.max(0, 1 - f * f), 0.85) * (0.8 + 0.2 * Math.sin(a * 3 + k[1]) * (1 - f)),
  }
}

function islandGeo(shape) {
  const SEG = 40
  const RINGS = 9
  const pos = []
  const col = []
  const idx = []
  const c = new THREE.Color()
  for (let j = 0; j <= RINGS; j++) {
    const f = j / RINGS
    for (let i = 0; i <= SEG; i++) {
      const a = (i / SEG) * Math.PI * 2
      const R = shape.radius(a) * f
      const h = shape.height(a, f)
      pos.push(Math.cos(a) * R, h, Math.sin(a) * R)
      // sand at the shore, green above it, darker toward the top
      if (h < 0.13) c.copy(SAND).lerp(GREEN, THREE.MathUtils.smoothstep(h, 0.05, 0.13))
      else c.copy(GREEN).lerp(DEEP_GREEN, Math.min(1, ((h - 0.13) / 0.87) * 0.9 + 0.12 * Math.sin(a * 7 + f * 9)))
      col.push(c.r, c.g, c.b)
    }
  }
  for (let j = 0; j < RINGS; j++) {
    for (let i = 0; i < SEG; i++) {
      const a = j * (SEG + 1) + i
      const b = a + 1
      const d = a + SEG + 1
      const e = d + 1
      idx.push(a, b, d, b, e, d)
    }
  }
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3))
  g.setIndex(idx)
  g.computeVertexNormals()
  return g
}

/* ───────────── bridge ───────────── */

const BRIDGE = { z: -1100, x0: -250, x1: 560, deck: SEA_Y + 11, towers: [40, 300], towerTop: SEA_Y + 46 }

function bridgeGeo() {
  const parts = []
  const box = (w, h, d, x, y, z) => {
    const g = new THREE.BoxGeometry(w, h, d)
    g.translate(x, y, z)
    parts.push(g)
  }
  const { z, x0, x1, deck, towers, towerTop } = BRIDGE
  box(x1 - x0, 2, 9, (x0 + x1) / 2, deck, z)
  for (let x = x0 + 15; x < x1; x += 30) box(3, deck - SEA_Y, 5, x, (deck + SEA_Y) / 2, z)
  for (const x of towers) {
    // a tall pylon with a cross on top, like the bridge between Cebu City and Cordova
    for (const k of [-1, 1]) box(3, towerTop - SEA_Y, 3, x, (towerTop + SEA_Y) / 2, z + k * 5)
    box(3.6, 3, 13, x, towerTop - 7, z)
    box(1.6, 11, 1.6, x, towerTop + 5.5, z)
    box(1.6, 1.6, 7, x, towerTop + 7.5, z)
  }
  return mergeGeometries(parts)
}

function cableGeo() {
  const { z, deck, towers, towerTop } = BRIDGE
  const pts = []
  for (const x of towers) {
    for (let i = 1; i <= 8; i++) {
      for (const k of [-1, 1]) pts.push(x, towerTop - 2 - i * 1.4, z, x + k * i * 13, deck + 1, z)
    }
  }
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3))
  return g
}

/* ───────────── clouds ───────────── */

let lump
function lumpGeo() {
  if (lump) return lump
  const g = new THREE.SphereGeometry(1, 20, 14)
  const p = g.attributes.position
  const v = new THREE.Vector3()
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i)
    v.multiplyScalar(1 + Math.sin(v.x * 5 + 1) * Math.sin(v.y * 4 + 2) * Math.sin(v.z * 5.5) * 0.12)
    p.setXYZ(i, v.x, v.y, v.z)
  }
  lump = g
  return g
}

/** One cloud: a row of soft lumps, flat underneath, shaded darker toward the bottom. */
function cloudGeo(seed) {
  const r = rng(seed)
  const parts = []
  const n = 5 + Math.floor(r() * 3)
  for (let i = 0; i < n; i++) {
    const g = lumpGeo().clone()
    const s = 0.55 + r() * 0.5
    g.scale(s * (1.1 + r() * 0.5), s * (0.7 + r() * 0.25), s * (0.9 + r() * 0.4))
    g.rotateY(r() * 6.28)
    g.translate((i - (n - 1) / 2) * 0.62 + (r() - 0.5) * 0.3, s * 0.42 + (r() - 0.5) * 0.12, (r() - 0.5) * 0.7)
    parts.push(g)
  }
  const geo = mergeGeometries(parts)
  const p = geo.attributes.position
  const colors = new Float32Array(p.count * 3)
  for (let i = 0; i < p.count; i++) {
    if (p.getY(i) < 0) p.setY(i, p.getY(i) * 0.25) // flatten the underside
    const s = 0.62 + 0.38 * THREE.MathUtils.smoothstep(p.getY(i), -0.05, 0.75)
    colors[i * 3] = colors[i * 3 + 1] = colors[i * 3 + 2] = s
  }
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3))
  geo.computeVertexNormals()
  return geo
}

const CLOUDS = [
  // x, height above the sea, z, size, stretch, seed
  [-78, 12, -50, 6, 1.3, 31], // low, in the bottom corners
  [80, 11, -56, 5.5, 1.4, 33],
  [300, 38, -330, 17, 1.8, 37], // out to the side
  [-560, 60, -980, 26, 3, 39], // long thin ones near the horizon
  [520, 80, -1050, 28, 2.8, 41],
  [600, 235, -1400, 32, 2.8, 45], // up in the sky
]

/* ───────────── lights and stars (points) ───────────── */

const dotVert = /* glsl */ `
  attribute float aSize;
  attribute float aPhase;
  uniform float uTime;
  uniform float uPx;
  uniform float uFixed;
  uniform float uTwinkle;
  uniform float uFlat;
  uniform vec3 uTint;
  varying vec3 vColor;
  varying float vGlow;
  void main() {
    vColor = mix(color, uTint, uFlat);
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mv;
    // stars keep one size on screen; lights shrink with distance like everything else
    gl_PointSize = uFixed > 0.5 ? aSize * uPx : clamp(aSize * uPx / max(-mv.z, 1.0), 1.5, 26.0);
    vGlow = 1.0 - uTwinkle * (0.5 + 0.5 * sin(uTime * 2.2 + aPhase));
  }
`
const dotFrag = /* glsl */ `
  uniform float uOpacity;
  uniform float uBoost;
  varying vec3 vColor;
  varying float vGlow;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    float a = 1.0 - smoothstep(0.08, 0.5, d);
    gl_FragColor = vec4(vColor * uBoost * vGlow, a * uOpacity);
  }
`

const LIGHT_TINTS = [
  [new THREE.Color('#ffc46b'), 0.6],
  [new THREE.Color('#ff4fa3'), 0.85],
  [new THREE.Color('#49e0e8'), 1],
]

/** Where the coast and bridge lights go, and the stars. */
function buildDots(shapes) {
  const r = rng(404)
  const lights = { pos: [], col: [], size: [], phase: [] }
  const add = (set, x, y, z, c, size) => {
    set.pos.push(x, y, z)
    set.col.push(c.r, c.g, c.b)
    set.size.push(size)
    set.phase.push(r() * 6.28)
  }
  const tint = () => {
    const k = r()
    return LIGHT_TINTS.find(([, upTo]) => k <= upTo)[0]
  }
  ISLANDS.forEach(([x, z, rx, rz, h], i) => {
    const shape = shapes[i]
    const far = Math.hypot(x, z)
    const count = Math.round(10 + Math.sqrt(rx * rz) * 0.55)
    for (let n = 0; n < count; n++) {
      // towns hug the shore, mostly on the side that faces the block
      const a = r() > 0.25 ? r() * Math.PI : r() * Math.PI * 2
      const f = 0.66 + r() * 0.3
      const R = shape.radius(a) * f
      // a far light is drawn bigger in the world, so it is still a few pixels on screen
      add(lights, x + Math.cos(a) * R * rx, SEA_Y + shape.height(a, f) * h + 0.4, z + Math.sin(a) * R * rz, tint(), (0.4 + r() * 0.4) * (1 + far / 420))
    }
  })
  const gold = LIGHT_TINTS[0][0]
  const pink = LIGHT_TINTS[1][0]
  for (let x = BRIDGE.x0; x <= BRIDGE.x1; x += 11) add(lights, x, BRIDGE.deck + 2.5, BRIDGE.z + 5, gold, 1.9)
  for (const x of BRIDGE.towers) {
    for (let y = BRIDGE.deck + 8; y <= BRIDGE.towerTop + 9; y += 8) add(lights, x, y, BRIDGE.z + 6, pink, 2.4)
  }

  const stars = { pos: [], col: [], size: [], phase: [] }
  const starTints = [new THREE.Color('#ffffff'), new THREE.Color('#cfd8ff'), new THREE.Color('#ffc9ec')]
  const v = new THREE.Vector3()
  while (stars.size.length < 620) {
    v.set(r() * 2 - 1, r() * 1.3 - 0.3, r() * 2 - 1)
    if (v.lengthSq() > 1 || v.lengthSq() < 0.05) continue
    v.normalize().multiplyScalar(SKY_R * 0.9)
    add(stars, v.x, v.y, v.z, starTints[Math.floor(r() * 3)], 1.1 + r() * 2)
  }

  const toGeo = (set) => {
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.Float32BufferAttribute(set.pos, 3))
    g.setAttribute('color', new THREE.Float32BufferAttribute(set.col, 3))
    g.setAttribute('aSize', new THREE.Float32BufferAttribute(set.size, 1))
    g.setAttribute('aPhase', new THREE.Float32BufferAttribute(set.phase, 1))
    return g
  }
  return { lights: toGeo(lights), stars: toGeo(stars) }
}

/** A material for a cloud of soft dots. Its numbers are changed through `material.uniforms` every frame. */
function dotMaterial({ fixed = false, twinkle = 0, boost = 1, flat = null, additive = true }) {
  return new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uPx: { value: 1 },
      uFixed: { value: fixed ? 1 : 0 },
      uTwinkle: { value: twinkle },
      uOpacity: { value: 0 },
      uBoost: { value: boost },
      uFlat: { value: flat ? 1 : 0 },
      uTint: { value: new THREE.Color(flat || '#ffffff') },
    },
    vertexShader: dotVert,
    fragmentShader: dotFrag,
    vertexColors: true,
    transparent: true,
    depthWrite: false,
    blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending,
  })
}

/* ───────────── the whole view ───────────── */

export function Vista() {
  const scene = useThree((s) => s.scene)
  const tilt = useRef()
  const clouds = useRef()

  const C = useMemo(
    () => ({
      zenithN: new THREE.Color('#070418'),
      zenithD: new THREE.Color('#2b78d4'),
      midN: new THREE.Color('#2a0f5c'),
      midD: new THREE.Color('#62b0f0'),
      glowN: new THREE.Color('#d61f8c'),
      glowD: new THREE.Color('#f6dfc8'),
      deepN: new THREE.Color('#120830'),
      deepD: new THREE.Color('#0b4fa8'),
      seaN: new THREE.Color('#2a1560'),
      seaD: new THREE.Color('#2187d6'),
      shallowN: new THREE.Color('#12a8c4'),
      shallowD: new THREE.Color('#3fd9d2'),
      glintN: new THREE.Color('#ff7ac4'),
      glintD: new THREE.Color('#ffffff'),
      fogN: new THREE.Color('#8a2a8e'),
      fogD: new THREE.Color('#d5e6ee'),
      landN: new THREE.Color('#6a4fb0'),
      landD: new THREE.Color('#ffffff'),
      cloudN: new THREE.Color('#6a4cb4'),
      cloudD: new THREE.Color('#ffffff'),
      cloudGlowN: new THREE.Color('#250a36'),
      steelN: new THREE.Color('#3a2a5a'),
      steelD: new THREE.Color('#eef1f5'),
      black: new THREE.Color('#000000'),
    }),
    [],
  )

  const built = useMemo(() => {
    const shapes = ISLANDS.map(([, , , , , seed]) => islandShape(seed))
    return {
      islands: shapes.map((s) => islandGeo(s)),
      clouds: CLOUDS.map(([, , , , , seed]) => cloudGeo(seed)),
      bridge: bridgeGeo(),
      cables: cableGeo(),
      ...buildDots(shapes),
      sky: new THREE.ShaderMaterial({
        uniforms: {
          uZenith: { value: new THREE.Color() },
          uMid: { value: new THREE.Color() },
          uGlow: { value: new THREE.Color() },
          uUp: { value: new THREE.Vector3(0, 1, 0) },
          uOrb: { value: new THREE.Vector3(0, 0.1, -1).normalize() },
          uMix: { value: 1 },
          uFall: { value: 16 },
        },
        vertexShader: skyVert,
        fragmentShader: skyFrag,
        side: THREE.BackSide,
        depthWrite: false,
      }),
      sea: new THREE.ShaderMaterial({
        uniforms: {
          uTime: { value: 0 },
          uDeep: { value: new THREE.Color() },
          uMid: { value: new THREE.Color() },
          uGlow: { value: new THREE.Color() },
          uShallow: { value: new THREE.Color() },
          uGlint: { value: new THREE.Color() },
          uOrbAz: { value: new THREE.Vector2(0, -1) },
          uIsl: { value: ISLANDS.map(([x, z, rx, rz]) => new THREE.Vector4(x, z, rx, rz)) },
        },
        vertexShader: seaVert,
        fragmentShader: seaFrag,
      }),
      lightsMat: dotMaterial({ twinkle: 0.45, boost: 1.1 }),
      townMat: dotMaterial({ flat: '#f3ede2', additive: false }),
      starMat: dotMaterial({ fixed: true, twinkle: 0.7, boost: 0.9 }),
      land: new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1 }),
      cloud: new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1 }),
      steel: new THREE.MeshStandardMaterial({ roughness: 0.7 }),
      wire: new THREE.LineBasicMaterial({ transparent: true, opacity: 0.75 }),
      fog: new THREE.Fog('#000000', 300, 1900),
      fwd: new THREE.Vector3(0, 0, -1),
      up: new THREE.Vector3(),
      flat: new THREE.Vector3(),
    }
  }, [])

  useFrame(({ clock, gl, camera, size }) => {
    const m = env.mix
    const t = clock.elapsedTime
    const { sky, sea, lightsMat, townMat, starMat, land, cloud, steel, wire, fog, fwd, up, flat } = built
    if (scene.fog !== fog) scene.fog = fog
    fog.color.lerpColors(C.fogD, C.fogN, m)

    // Which way the camera faces, on the map. The sea slopes away in that direction.
    camera.getWorldDirection(flat)
    flat.y = 0
    if (flat.lengthSq() > 1e-6) fwd.copy(flat.normalize())
    const g = tilt.current
    if (g) {
      g.matrixAutoUpdate = false
      g.matrix.set(1, 0, 0, 0, -SLOPE * fwd.x, 1, -SLOPE * fwd.z, 0, 0, 0, 1, 0, 0, 0, 0, 1)
      g.matrixWorldNeedsUpdate = true
    }
    up.set(SLOPE * fwd.x, 1, SLOPE * fwd.z).normalize() // straight up from the sloping sea

    // The moon / sun: low over the horizon, off to the left on wide screens, nearer the middle on phones.
    const tall = size.width < size.height
    const az = tall ? -0.06 : -0.5
    const el = tall ? 0.13 : 0.075
    const orb = sky.uniforms.uOrb.value
    orb.set(Math.sin(az), 0, -Math.cos(az))
    orb.addScaledVector(up, -orb.dot(up)).normalize() // onto the horizon…
    orb.multiplyScalar(Math.cos(el)).addScaledVector(up, Math.sin(el)).normalize() // …then up a little
    sea.uniforms.uOrbAz.value.set(Math.sin(az), -Math.cos(az))

    sky.uniforms.uUp.value.copy(up)
    sky.uniforms.uZenith.value.lerpColors(C.zenithD, C.zenithN, m)
    sky.uniforms.uMid.value.lerpColors(C.midD, C.midN, m)
    sky.uniforms.uGlow.value.lerpColors(C.glowD, C.glowN, m)
    sky.uniforms.uMix.value = m
    sky.uniforms.uFall.value = THREE.MathUtils.lerp(26, 22, m)

    sea.uniforms.uTime.value = t
    sea.uniforms.uDeep.value.lerpColors(C.deepD, C.deepN, m)
    sea.uniforms.uMid.value.lerpColors(C.seaD, C.seaN, m)
    sea.uniforms.uGlow.value.lerpColors(C.glowD, C.glowN, m)
    sea.uniforms.uShallow.value.lerpColors(C.shallowD, C.shallowN, m)
    sea.uniforms.uGlint.value.lerpColors(C.glintD, C.glintN, m)

    land.color.lerpColors(C.landD, C.landN, m)
    cloud.color.lerpColors(C.cloudD, C.cloudN, m)
    cloud.emissive.lerpColors(C.black, C.cloudGlowN, m)
    steel.color.lerpColors(C.steelD, C.steelN, m)
    wire.color.copy(steel.color)

    // points are sized in screen pixels, so they need the height of the picture
    const px = (gl.domElement.height * 0.5) / Math.tan(THREE.MathUtils.degToRad(camera.fov) * 0.5)
    lightsMat.uniforms.uTime.value = t
    lightsMat.uniforms.uPx.value = px
    lightsMat.uniforms.uOpacity.value = m
    townMat.uniforms.uPx.value = px * 0.6
    townMat.uniforms.uOpacity.value = (1 - m) * 0.9
    starMat.uniforms.uTime.value = t
    starMat.uniforms.uPx.value = gl.getPixelRatio()
    starMat.uniforms.uOpacity.value = THREE.MathUtils.smoothstep(m, 0.4, 1)

    // clouds drift a little, each at its own pace
    clouds.current?.children.forEach((c, i) => {
      c.position.x = CLOUDS[i][0] + Math.sin(t * 0.035 + i * 1.7) * CLOUDS[i][3]
    })
  })

  return (
    <group>
      <mesh scale={SKY_R} renderOrder={-10} frustumCulled={false} material={built.sky}>
        <sphereGeometry args={[1, 40, 20]} />
      </mesh>
      <points geometry={built.stars} material={built.starMat} frustumCulled={false} />

      {/* everything that stands on the sea, sloped with it */}
      <group ref={tilt}>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, SEA_Y, 0]} material={built.sea} frustumCulled={false}>
          <circleGeometry args={[SEA_R, 96]} />
        </mesh>

        {ISLANDS.map(([x, z, rx, rz, h], i) => (
          <mesh key={i} geometry={built.islands[i]} material={built.land} position={[x, SEA_Y - 0.05, z]} scale={[rx, h, rz]} frustumCulled={false} />
        ))}

        <mesh geometry={built.bridge} material={built.steel} frustumCulled={false} />
        <lineSegments geometry={built.cables} material={built.wire} frustumCulled={false} />

        {/* towns: pale dots by day, glowing lights by night */}
        <points geometry={built.lights} material={built.townMat} frustumCulled={false} />
        <points geometry={built.lights} material={built.lightsMat} frustumCulled={false} />

        <group ref={clouds}>
          {CLOUDS.map(([x, y, z, size, stretch], i) => (
            <mesh key={i} geometry={built.clouds[i]} material={built.cloud} position={[x, SEA_Y + y, z]} scale={[size * stretch, size, size]} frustumCulled={false} />
          ))}
        </group>
      </group>
    </group>
  )
}
