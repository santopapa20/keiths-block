import { useEffect, useRef } from 'react'
import { useStore } from '../store.js'
import { SECTIONS } from '../data/sections.js'
import { profile } from '../data/content.js'
import { TRACK, toggleMusic } from '../sound.js'

const Moon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
    <path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5Z" fill="currentColor" />
  </svg>
)
const Sun = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <circle cx="12" cy="12" r="4" fill="currentColor" />
    <path d="M12 2v2.5M12 19.5V22M2 12h2.5M19.5 12H22M4.9 4.9l1.8 1.8M17.3 17.3l1.8 1.8M4.9 19.1l1.8-1.8M17.3 6.7l1.8-1.8" />
  </svg>
)
const Drops = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M7 15.5a4.5 4.5 0 0 1 .6-8.9A5.5 5.5 0 0 1 18 8.5a3.5 3.5 0 0 1-.5 7" />
    <path d="M9 18l-1 3M13 17l-1 3M17 18l-1 3" />
  </svg>
)

export default function Nav() {
  const section = useStore((s) => s.section)
  const night = useStore((s) => s.night)
  const rain = useStore((s) => s.rain)
  const music = useStore((s) => s.music)
  const setSection = useStore((s) => s.setSection)
  const toggleNight = useStore((s) => s.toggleNight)
  const toggleRain = useStore((s) => s.toggleRain)
  const links = useRef()

  useEffect(() => {
    links.current?.querySelector('.is-active')?.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' })
  }, [section])

  return (
    <nav className={`nav ${section === 'home' ? 'is-home' : ''}`} aria-label="Sections">
      <button type="button" className="nav__logo" onClick={() => setSection('home')} aria-label="Back to the block">
        Keith<span>.</span>
      </button>

      <div className="nav__links" ref={links}>
        {SECTIONS.filter((s) => s.id !== 'home').map((s) => (
          <button
            key={s.id}
            type="button"
            className={section === s.id ? 'is-active' : ''}
            aria-current={section === s.id ? 'page' : undefined}
            onClick={() => setSection(s.id)}
          >
            {s.label}
          </button>
        ))}
      </div>

      <div className="nav__tools">
        {music && (
          <button
            type="button"
            className="icon-btn is-on is-music"
            onClick={toggleMusic}
            aria-label={`Turn the music off. Now playing ${TRACK.title} by ${TRACK.artist}`}
            title={`Now playing: ${TRACK.title} — ${TRACK.artist}. Click to turn off.`}
          >
            <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="currentColor">
              <path d="M9 4v10.2A3.2 3.2 0 1 0 11 17V8h6V4H9Z" />
            </svg>
          </button>
        )}
        <button
          type="button"
          className="icon-btn"
          onClick={toggleNight}
          aria-label={night ? 'Switch to day' : 'Switch to night'}
          title={night ? 'Switch to day' : 'Switch to night'}
        >
          {night ? <Sun /> : <Moon />}
        </button>
        <button
          type="button"
          className={`icon-btn ${rain ? 'is-on' : ''}`}
          onClick={toggleRain}
          aria-pressed={rain}
          aria-label="Toggle rain"
          title="Toggle rain"
        >
          <Drops />
        </button>
        <a className="btn btn--small" href={`${import.meta.env.BASE_URL}${profile.resume}`} download>
          Résumé
        </a>
      </div>
    </nav>
  )
}
