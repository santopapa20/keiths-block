// A Slot shows a Tripo GLB when one exists in /public/models. The loading screen stays up until
// every model is in, so the hand-built version (its children) is only ever shown when there is
// no Tripo model for that slot, or when one fails to load.
//
// The models are loaded a few at a time (see AT_ONCE): fast enough that the wait is short,
// without holding every model's decoded textures in memory at the same moment.
import * as THREE from 'three'
import { Component, Suspense, useEffect, useMemo } from 'react'
import { useGLTF } from '@react-three/drei'
import { clone as cloneSkinned } from 'three/examples/jsm/utils/SkeletonUtils.js'
import { useStore } from '../store.js'
import { MODEL_SLOTS } from '../data/models.js'

/** Models nearest the opening view load first. */
const ORDER = ['figure', 'wall', 'boombox', 'lowrider', 'shop', 'storefront', 'pawnshop', 'court', 'payphone']

/** How many models download and decode at the same time. */
const AT_ONCE = 4

/** Starts waiting models, nearest first, until AT_ONCE of them are loading. */
function startWaiting(status) {
  let busy = Object.values(status).filter((v) => v === 'loading').length
  for (const n of ORDER) {
    if (busy >= AT_ONCE) break
    if (status[n] !== 'waiting') continue
    status[n] = 'loading'
    busy++
  }
  return status
}

/** Marks one model finished (ready or failed) and starts the next one waiting. */
function advance(name, result) {
  const { modelStatus } = useStore.getState()
  if (modelStatus[name] !== 'loading') return
  useStore.setState({ modelStatus: startWaiting({ ...modelStatus, [name]: result }) })
}

/** Looks for each slot's GLB once at startup, then starts loading the first one. */
export function useModelProbe() {
  useEffect(() => {
    let alive = true
    const base = import.meta.env.BASE_URL
    Promise.all(
      Object.entries(MODEL_SLOTS).map(async ([name, cfg]) => {
        const url = `${base}models/${cfg.file}`
        try {
          const res = await fetch(url, { method: 'HEAD' })
          const type = res.headers.get('content-type') || ''
          // Dev servers answer unknown paths with index.html, so rule that out.
          return res.ok && !type.includes('text/html') ? [name, url] : null
        } catch {
          return null
        }
      }),
    ).then((found) => {
      if (!alive) return
      const models = Object.fromEntries(found.filter(Boolean))
      const modelStatus = startWaiting(Object.fromEntries(Object.keys(models).map((n) => [n, 'waiting'])))
      useStore.setState({ models, modelStatus, probed: true })
    })
    return () => {
      alive = false
    }
  }, [])
}

class Fallback extends Component {
  state = { failed: false }
  static getDerivedStateFromError() {
    return { failed: true }
  }
  componentDidCatch(err) {
    console.warn(`[models] ${this.props.name} could not be loaded, showing the built-in version instead.`, err)
    this.props.onFail?.()
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children
  }
}

const TEXTURE_SLOTS = ['map', 'normalMap', 'roughnessMap', 'metalnessMap', 'aoMap', 'emissiveMap']
const noRaycast = () => {}

function FittedModel({ name, url, cfg }) {
  const { scene } = useGLTF(url)

  const object = useMemo(() => {
    const model = cloneSkinned(scene)
    let triangles = 0
    model.traverse((o) => {
      if (!o.isMesh) return
      const g = o.geometry
      triangles += (g.index ? g.index.count : g.attributes.position.count) / 3
    })
    // At millions of triangles, drawing the model a second time for the shadow pass would
    // halve the frame rate, so very dense models don't cast shadows.
    const dense = triangles > 400000

    model.traverse((o) => {
      if (!o.isMesh) return
      o.castShadow = !dense
      o.receiveShadow = true
      // Hit-testing a pointer against millions of triangles on every mouse move would freeze
      // the page; a simple invisible box (added below) receives the clicks instead.
      o.raycast = noRaycast
      // Tripo paints are often fully metallic, which goes near-black under dim night reflections.
      // `shine` strengthens the reflections for that one model.
      if (cfg.shine && o.material) {
        o.material = o.material.clone()
        o.material.envMapIntensity = cfg.shine
      }
      // Once a texture has been sent to the graphics card, free the copy held in memory.
      // A 2048px image holds about 16 MB there, and each model has three.
      for (const slot of TEXTURE_SLOTS) {
        const tex = o.material?.[slot]
        if (tex && !tex.userData.releases) {
          tex.userData.releases = true
          tex.onUpdate = () => {
            tex.onUpdate = null
            tex.image?.close?.()
          }
        }
      }
    })

    const turned = new THREE.Group()
    turned.add(model)
    turned.rotation.y = cfg.rotateY || 0
    turned.updateMatrixWorld(true)

    const box = new THREE.Box3().setFromObject(turned)
    const dim = box.getSize(new THREE.Vector3())
    const center = box.getCenter(new THREE.Vector3())
    const k = (cfg.size / (cfg.fit === 'height' ? dim.y : dim.x)) * (cfg.scale || 1)

    // Centre on x/z, feet on the ground.
    turned.position.set(-center.x, -box.min.y, -center.z)
    const fitted = new THREE.Group()
    fitted.add(turned)

    // Invisible stand-in that takes the clicks and hovers for the whole model.
    const hit = new THREE.Mesh(new THREE.BoxGeometry(dim.x, dim.y, dim.z), new THREE.MeshBasicMaterial({ visible: false }))
    hit.position.set(0, dim.y / 2, 0)
    fitted.add(hit)

    fitted.scale.setScalar(Number.isFinite(k) && k > 0 ? k : 1)
    const [ox, oy, oz] = cfg.offset || [0, 0, 0]
    fitted.position.set(ox, oy, oz)
    return fitted
  }, [scene, cfg])

  // Let this model be drawn once (which sends it to the graphics card) before it counts as ready.
  useEffect(() => {
    const t = setTimeout(() => advance(name, 'ready'), 60)
    return () => clearTimeout(t)
  }, [name])

  return <primitive object={object} />
}

export function Slot({ name, children }) {
  const url = useStore((s) => s.models[name])
  const status = useStore((s) => s.modelStatus[name])
  // No Tripo model for this slot, or it failed: show the built-in version.
  if (!url || status === 'failed') return children
  // Waiting its turn: show nothing (the loading screen is still up).
  if (status !== 'loading' && status !== 'ready') return null
  return (
    <Fallback name={name} fallback={children} onFail={() => advance(name, 'failed')}>
      <Suspense fallback={null}>
        <FittedModel name={name} url={url} cfg={MODEL_SLOTS[name]} />
      </Suspense>
    </Fallback>
  )
}
