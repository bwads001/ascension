import { usePlayerStore } from '../store/playerStore'

export default function UI() {
  const { health, maxHealth, floor } = usePlayerStore()
  const healthPercent = (health / maxHealth) * 100

  return (
    <div className="ui-overlay">
      <div className="health-bar">
        <div className="health-fill" style={{ width: `${healthPercent}%` }} />
        <span className="health-text">
          {health} / {maxHealth}
        </span>
      </div>

      <div className="floor-indicator">{floor === 0 ? 'Overworld' : `Floor ${floor}`}</div>

      <div className="controls">
        <div>
          <span className="key">Click</span> Move
        </div>
        <div>
          <span className="key">J</span> / <span className="key">Z</span> Attack
        </div>
      </div>
    </div>
  )
}
