import { useEffect } from 'react'
import { useStore } from './store.js'
import { SECTION_MAP } from './data/sections.js'
import Scene from './scene/Scene.jsx'
import { useModelProbe } from './scene/Slot.jsx'
import Nav from './ui/Nav.jsx'
import Hero from './ui/Hero.jsx'
import Panel from './ui/Panel.jsx'
import Loader from './ui/Loader.jsx'

/** Arrow keys step through the block, Escape goes back to the overview. */
function useKeys() {
  useEffect(() => {
    const onKey = (e) => {
      if (e.target.closest?.('input, textarea')) return
      const { step, setSection } = useStore.getState()
      if (e.key === 'ArrowRight') step(1)
      else if (e.key === 'ArrowLeft') step(-1)
      else if (e.key === 'Escape') setSection('home')
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])
}

/**
 * Scrolling over the scene moves to the next / previous stop.
 * One scroll gesture = one stop, however long a trackpad keeps coasting.
 */
function useWheelNav() {
  useEffect(() => {
    let acc = 0
    let last = 0
    let fired = false
    const onWheel = (e) => {
      if (e.target.closest?.('.panel, .nav')) return // let the panel scroll normally
      const now = performance.now()
      if (now - last > 240) {
        // the wheel went quiet: this is a new gesture
        acc = 0
        fired = false
      }
      last = now
      if (fired) return
      acc += e.deltaY
      if (Math.abs(acc) > 50) {
        useStore.getState().step(acc > 0 ? 1 : -1)
        fired = true
      }
    }
    window.addEventListener('wheel', onWheel, { passive: true })
    return () => window.removeEventListener('wheel', onWheel)
  }, [])
}

/**
 * Keeps the address bar in step with the section (…/#skills), so a section can be
 * linked to directly and the browser's Back button walks back through the tour.
 */
function useHashSync() {
  useEffect(() => {
    const fromUrl = () => {
      const id = window.location.hash.slice(1)
      useStore.getState().setSection(SECTION_MAP[id] ? id : 'home')
    }
    fromUrl()
    const unsubscribe = useStore.subscribe((state, prev) => {
      if (state.section === prev.section) return
      const want = state.section === 'home' ? '' : `#${state.section}`
      if (window.location.hash === want) return
      window.history.pushState(null, '', want || window.location.pathname + window.location.search)
    })
    window.addEventListener('popstate', fromUrl)
    return () => {
      unsubscribe()
      window.removeEventListener('popstate', fromUrl)
    }
  }, [])
}

/** The loading screen lifts once the scene is built and every Tripo model has loaded (or failed). */
function useReadyGate() {
  const sceneReady = useStore((s) => s.sceneReady)
  const probed = useStore((s) => s.probed)
  const status = useStore((s) => s.modelStatus)
  useEffect(() => {
    const settled = Object.values(status).every((v) => v === 'ready' || v === 'failed')
    if (sceneReady && probed && settled) useStore.setState({ ready: true })
  }, [sceneReady, probed, status])
}

export default function App() {
  const night = useStore((s) => s.night)
  useReadyGate()
  useModelProbe()
  useKeys()
  useWheelNav()
  useHashSync()

  return (
    <div className={`app ${night ? 'is-night' : 'is-day'}`}>
      <div className="stage">
        <Scene />
      </div>
      <Nav />
      <Hero />
      <Panel />
      <Loader />
    </div>
  )
}
