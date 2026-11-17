// The boombox's music. Nothing is downloaded or played until the visitor turns it on.
import { useStore } from './store.js'

export const TRACK = {
  title: 'Libre Sampak',
  artist: 'NoPetsAllowed feat. Vicky',
  file: 'audio/boombox.mp3', // inside /public
}

const VOLUME = 0.7

/** Live loudness, read by the boombox every frame. All values 0..1. */
export const beat = { bass: 0, bars: [0, 0, 0, 0, 0] }

let audio = null
let ctx = null
let analyser = null
let data = null
let fade = 0

function ensureAudio() {
  if (audio) return audio
  audio = new Audio()
  audio.preload = 'none'
  audio.loop = true
  audio.volume = 0
  audio.src = `${import.meta.env.BASE_URL}${TRACK.file}`
  // If the file is missing or the browser refuses to play, fall back to "off".
  audio.addEventListener('error', () => useStore.setState({ music: false }))
  return audio
}

/** Lets the speakers move to the actual song. Optional: without it they pulse on a timer. */
function ensureAnalyser() {
  if (ctx) return
  try {
    const AC = window.AudioContext || window.webkitAudioContext
    ctx = new AC()
    const source = ctx.createMediaElementSource(audio)
    analyser = ctx.createAnalyser()
    analyser.fftSize = 64
    analyser.smoothingTimeConstant = 0.78
    source.connect(analyser)
    analyser.connect(ctx.destination)
    data = new Uint8Array(analyser.frequencyBinCount)
  } catch {
    ctx = null
    analyser = null
  }
}

function fadeTo(target, ms, done) {
  cancelAnimationFrame(fade)
  const from = audio.volume
  const t0 = performance.now()
  const step = (now) => {
    // The frame timestamp can be slightly earlier than t0, so clamp both ends:
    // a volume outside 0..1 throws.
    const u = Math.min(1, Math.max(0, (now - t0) / ms))
    audio.volume = Math.min(1, Math.max(0, from + (target - from) * u))
    if (u < 1) fade = requestAnimationFrame(step)
    else done?.()
  }
  fade = requestAnimationFrame(step)
}

/** Must be called from a click or tap, which is what lets the browser start audio. */
export function toggleMusic() {
  const on = !useStore.getState().music
  ensureAudio()
  if (on) {
    ensureAnalyser()
    ctx?.resume?.()
    useStore.setState({ music: true })
    audio
      .play()
      .then(() => fadeTo(VOLUME, 500))
      .catch(() => useStore.setState({ music: false }))
  } else {
    useStore.setState({ music: false })
    fadeTo(0, 350, () => audio.pause())
  }
}

/** Refreshes `beat`. Call once per frame. */
export function sampleBeat(time) {
  const on = useStore.getState().music
  if (on && analyser) {
    analyser.getByteFrequencyData(data)
    let low = 0
    for (let i = 1; i <= 4; i++) low += data[i]
    beat.bass = low / 4 / 255
    for (let b = 0; b < 5; b++) {
      let sum = 0
      for (let i = 0; i < 4; i++) sum += data[1 + b * 4 + i]
      beat.bars[b] = sum / 4 / 255
    }
  } else if (on) {
    // no analyser available: a steady made-up pulse
    beat.bass = Math.pow(Math.abs(Math.sin(time * 3.6)), 4) * 0.8
    for (let b = 0; b < 5; b++) beat.bars[b] = 0.35 + 0.35 * Math.abs(Math.sin(time * (3 + b) + b))
  } else {
    beat.bass *= 0.88
    for (let b = 0; b < 5; b++) beat.bars[b] *= 0.88
  }
}
