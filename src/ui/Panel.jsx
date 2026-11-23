import { useEffect, useRef, useState } from 'react'
import { useStore } from '../store.js'
import { SECTIONS, SECTION_MAP } from '../data/sections.js'
import { certifications, education, experience, profile, projects, skills } from '../data/content.js'

const STOPS = SECTIONS.filter((s) => s.id !== 'home')
const asset = (path) => `${import.meta.env.BASE_URL}${path}`

/* ───────────── section bodies ───────────── */

function About() {
  return (
    <>
      {profile.summary.map((p) => (
        <p key={p} className="lead">
          {p}
        </p>
      ))}
      <dl className="facts">
        {profile.facts.map(([k, v]) => (
          <div key={k}>
            <dt>{k}</dt>
            <dd>{v}</dd>
          </div>
        ))}
      </dl>
      <h3>Strengths</h3>
      <ul className="chips">
        {profile.strengths.map((s) => (
          <li key={s}>{s}</li>
        ))}
      </ul>
    </>
  )
}

function Skills() {
  return (
    <>
      {skills.map((g) => (
        <section key={g.group} className={`skill-group tone-${g.color}`}>
          <h3>{g.group}</h3>
          <ul className="chips">
            {g.items.map((i) => (
              <li key={i}>{i}</li>
            ))}
          </ul>
        </section>
      ))}
    </>
  )
}

function Experience() {
  return (
    <>
      {experience.map((job) => (
        <article key={job.title} className="job">
          <p className="job__when">{job.when}</p>
          <h3>{job.title}</h3>
          <p className="job__org">{job.org}</p>
          <ul className="bullets">
            {job.points.map((p) => (
              <li key={p}>{p}</li>
            ))}
          </ul>
          {job.tech.length > 0 && (
            <ul className="chips chips--small">
              {job.tech.map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ul>
          )}
        </article>
      ))}
    </>
  )
}

function Projects() {
  if (projects.length === 0) {
    return (
      <div className="soon">
        <p className="soon__stamp">Coming soon</p>
        <p className="lead">This storefront is still getting set up. New work is on the way — check back soon.</p>
        <p className="muted">In the meantime, the capstone I co-developed is over in Experience.</p>
        <button type="button" className="btn btn--ghost" onClick={() => useStore.getState().setSection('experience')}>
          See the SAES capstone →
        </button>
      </div>
    )
  }
  return (
    <div className="works">
      {projects.map((p) => (
        <article key={p.title} className="work">
          {p.image &&
            (p.link ? (
              <a className="work__shot" href={p.link} target="_blank" rel="noreferrer" aria-label={`Open the ${p.title} live demo`}>
                <img src={asset(p.image)} alt={`Screenshot of ${p.title}`} loading="lazy" />
              </a>
            ) : (
              <img src={asset(p.image)} alt={`Screenshot of ${p.title}`} loading="lazy" />
            ))}
          <h3>{p.title}</h3>
          <p>{p.description}</p>
          {p.tech?.length > 0 && (
            <ul className="chips chips--small">
              {p.tech.map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ul>
          )}
          {(p.link || p.repo) && (
            <div className="work__links">
              {p.link && (
                <a className="btn btn--small" href={p.link} target="_blank" rel="noreferrer">
                  Live demo →
                </a>
              )}
              {p.repo && (
                <a className="btn btn--small btn--ghost" href={p.repo} target="_blank" rel="noreferrer">
                  Source code
                </a>
              )}
            </div>
          )}
        </article>
      ))}
    </div>
  )
}

function Education() {
  return (
    <article className="school">
      <p className="job__when">{education.when}</p>
      <h3>{education.school}</h3>
      <p className="lead">{education.degree}</p>
    </article>
  )
}

function Certs() {
  return (
    <ul className="certs">
      {certifications.map((c) => (
        <li key={c.name}>
          <span className="certs__cup" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
              <path d="M7 4h10v5a5 5 0 0 1-10 0V4Z" />
              <rect x="11" y="13.5" width="2" height="4.5" />
              <rect x="8" y="18" width="8" height="2" rx="1" />
              <path d="M7 6H4.5v1.5A3 3 0 0 0 7 10.400M17 6h2.500v1.500A3 3 0 0 1 17 10.400" fill="none" stroke="currentColor" strokeWidth="1.600" />
            </svg>
          </span>
          <div>
            <strong>{c.name}</strong>
            {c.by && <span>{c.by}</span>}
          </div>
        </li>
      ))}
    </ul>
  )
}

function Contact() {
  const [copied, setCopied] = useState(false)
  const [name, setName] = useState('')
  const [message, setMessage] = useState('')

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(profile.email)
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch {
      /* clipboard unavailable — the address is visible on screen anyway */
    }
  }

  // No server needed: this opens the visitor's own mail app with the message filled in.
  const mailto = `mailto:${profile.email}?subject=${encodeURIComponent(
    `Hello from ${name || 'your portfolio'}`,
  )}&body=${encodeURIComponent(message)}`

  return (
    <>
      <p className="lead">Got a role, a project or a question? The line is open.</p>
      <div className="contact-card">
        <span className="muted">Email</span>
        <a className="contact-card__mail" href={`mailto:${profile.email}`}>
          {profile.email}
        </a>
        <button type="button" className="btn btn--small btn--ghost" onClick={copy}>
          {copied ? 'Copied' : 'Copy address'}
        </button>
      </div>
      {profile.phone && (
        <div className="contact-card">
          <span className="muted">Phone</span>
          <a className="contact-card__mail" href={`tel:${profile.phone.replace(/\s/g, '')}`}>
            {profile.phone}
          </a>
        </div>
      )}

      <form className="form" onSubmit={(e) => e.preventDefault()}>
        <label>
          Your name
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Who's calling?" autoComplete="name" />
        </label>
        <label>
          Message
          <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={4} placeholder="What's up?" />
        </label>
        <a className="btn" href={mailto}>
          Open in my mail app →
        </a>
      </form>

      <div className="contact-foot">
        <span>{profile.address}</span>
        <a className="link" href={asset(profile.resume)} download>
          Download résumé (PDF)
        </a>
      </div>
    </>
  )
}

const BODIES = { about: About, skills: Skills, experience: Experience, projects: Projects, education: Education, certs: Certs, contact: Contact }

/* ───────────── the panel ───────────── */

export default function Panel() {
  const section = useStore((s) => s.section)
  const setSection = useStore((s) => s.setSection)
  const step = useStore((s) => s.step)
  const open = section !== 'home'

  // Keep showing the last section while the panel slides away.
  const [shown, setShown] = useState('about')
  // Phones: the panel is a bottom sheet. It opens at half height so the scene stays visible,
  // and the grip (tap, or swipe the header up or down) stretches it to full height for reading.
  const [tall, setTall] = useState(false)
  const swipe = useRef(null)
  const body = useRef()
  const panel = useRef()
  useEffect(() => {
    if (open) {
      setShown(section)
      setTall(false)
      body.current?.scrollTo({ top: 0 })
      panel.current?.focus({ preventScroll: true }) // keyboard and screen-reader users land in the panel
    }
  }, [open, section])

  const s = SECTION_MAP[shown]
  const Body = BODIES[shown]
  const index = STOPS.findIndex((x) => x.id === shown)

  return (
    <aside ref={panel} tabIndex={-1} aria-label={s.label} className={`panel ${open ? 'is-open' : ''} ${tall ? 'is-tall' : ''}`} aria-hidden={!open} inert={!open}>
      <button type="button" className="panel__grip" onClick={() => setTall((t) => !t)} aria-expanded={tall} aria-label={tall ? 'Shrink the panel to see the scene' : 'Expand the panel'}>
        <i />
      </button>
      <header
        className="panel__head"
        onTouchStart={(e) => {
          swipe.current = e.touches[0].clientY
        }}
        onTouchEnd={(e) => {
          if (swipe.current === null) return
          const dy = e.changedTouches[0].clientY - swipe.current
          swipe.current = null
          if (dy < -28) setTall(true)
          else if (dy > 28) setTall(false)
        }}
      >
        <div>
          <p className="panel__tag">{s.tag}</p>
          <h2>{s.label}</h2>
        </div>
        <button type="button" className="icon-btn" onClick={() => setSection('home')} aria-label="Close and go back to the block" title="Back to the block (Esc)">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>
      </header>

      <div className="panel__body" ref={body} key={shown}>
        <Body />
      </div>

      <footer className="panel__foot">
        <button type="button" onClick={() => step(-1)}>
          ← Prev
        </button>
        <span>
          {String(index + 1).padStart(2, '0')} / {String(STOPS.length).padStart(2, '0')}
        </span>
        <button type="button" onClick={() => step(1)}>
          Next →
        </button>
      </footer>
    </aside>
  )
}
