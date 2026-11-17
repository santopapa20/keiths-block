import { useStore } from '../store.js'
import { profile } from '../data/content.js'

export default function Hero() {
  const home = useStore((s) => s.section === 'home')
  const ready = useStore((s) => s.ready)
  const setSection = useStore((s) => s.setSection)
  const on = home && ready
  const [first, middle, last] = profile.name.split(' ')

  return (
    <header className={`hero ${on ? '' : 'is-off'}`} aria-hidden={!home}>
      <div className="hero__text">
        <p className="hero__eyebrow">
          <i /> Open for work · {profile.location}
        </p>
        {/* Screen readers get the plain name from aria-label; the graffiti letters are visual only. */}
        <h1 className="hero__name" aria-label={profile.name}>
          <span aria-hidden="true">{first}</span> <span aria-hidden="true">{middle}</span> <em aria-hidden="true">{last}</em>
        </h1>
        <p className="hero__role">
          {profile.role}{' '}
          <span>
            <i className="hero__dot">· </i>
            {profile.tagline}
          </span>
        </p>
      </div>

      <div className="hero-cta">
        <div className="hero-cta__row">
          <button type="button" className="btn" tabIndex={home ? 0 : -1} onClick={() => setSection('about')}>
            Explore the block →
          </button>
          <button type="button" className="btn btn--ghost" tabIndex={home ? 0 : -1} onClick={() => setSection('contact')}>
            Contact me
          </button>
        </div>
        <p className="hero-cta__hint">
          <span className="only-mouse">Drag to spin · click any building · scroll to tour</span>
          <span className="only-touch">Swipe to explore · tap a building</span>
        </p>
      </div>
    </header>
  )
}
