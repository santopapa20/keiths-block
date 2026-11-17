import { create } from 'zustand'
import { SECTIONS } from './data/sections.js'

const ids = SECTIONS.map((s) => s.id)

// Quality tiers: 2 = everything, 1 = full detail without the costly screen effects,
// 0 = fine detail hidden too. Add ?quality=high, ?quality=medium or ?quality=low to the
// address to pin one; without it the site measures the frame rate and decides by itself.
const wanted = typeof window === 'undefined' ? null : new URLSearchParams(window.location.search).get('quality')
const TIERS = { low: 0, medium: 1, high: 2 }
const locked = wanted in TIERS
const startTier = locked ? TIERS[wanted] : 1

export const useStore = create((set, get) => ({
  section: 'home',
  night: true,
  rain: false,
  music: false, // is the boombox playing? (switched through toggleMusic in sound.js)
  ready: false, // scene built AND all Tripo models loaded: the loading screen lifts
  sceneReady: false, // the 3D scene itself has finished building
  probed: false, // we have checked which Tripo models exist
  hovered: null,
  tier: startTier,
  low: startTier === 0, // fine detail hidden
  qualityLocked: locked,
  models: {}, // slot name -> url of a GLB found in /public/models
  modelStatus: {}, // slot name -> 'waiting' | 'loading' | 'ready' | 'failed'

  setSection: (section) => set({ section }),
  step: (dir) => {
    const i = ids.indexOf(get().section)
    set({ section: ids[(i + dir + ids.length) % ids.length] })
  },
  toggleNight: () => set((s) => ({ night: !s.night })),
  toggleRain: () => set((s) => ({ rain: !s.rain })),
  setReady: () => set({ sceneReady: true }),
  setHovered: (hovered) => set({ hovered }),
  setTier: (tier) => set({ tier, low: tier === 0 }),
  setModels: (models) => set({ models }),
}))

// Shared, mutable values read inside render loops (no re-renders).
// mix: 1 = full night, 0 = full day.
export const env = { mix: 1 }
