import { useStore } from '../store.js'

export default function Loader() {
  const ready = useStore((s) => s.ready)

  return (
    <div className={`loader ${ready ? 'is-done' : ''}`} aria-hidden={ready} role="status">
      <p className="loader__tag">Keith&apos;s Block</p>
      <div className="loader__bar">
        <i />
      </div>
      <p className="loader__sub">setting up the street…</p>
    </div>
  )
}
