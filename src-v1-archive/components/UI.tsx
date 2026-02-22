import { usePlayerStore } from '../store/playerStore'

function DeathScreen() {
  const respawn = usePlayerStore((state) => state.respawn)

  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        background: 'rgba(0, 0, 0, 0.8)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 200,
        pointerEvents: 'auto',
      }}
    >
      <h1
        style={{
          color: '#c41e3a',
          fontFamily: 'serif',
          fontSize: '64px',
          marginBottom: '20px',
          textShadow: '3px 3px 6px rgba(0,0,0,0.8)',
        }}
      >
        YOU DIED
      </h1>
      <button
        onClick={respawn}
        style={{
          background: 'linear-gradient(180deg, #5a4a3a, #3a2a1a)',
          color: '#d4af37',
          border: '2px solid #8b7355',
          padding: '15px 40px',
          fontSize: '20px',
          fontFamily: 'serif',
          cursor: 'pointer',
          borderRadius: '4px',
        }}
      >
        Respawn
      </button>
    </div>
  )
}

export default function UI() {
  const { health, maxHealth, floor, kills, isDead } = usePlayerStore()
  const healthPercent = (health / maxHealth) * 100

  return (
    <div className="ui-overlay">
      {isDead && <DeathScreen />}

      <div className="health-bar">
        <div className="health-fill" style={{ width: `${healthPercent}%` }} />
        <span className="health-text">
          {health} / {maxHealth}
        </span>
      </div>

      <div className="floor-indicator">{floor === 0 ? 'Overworld' : `Floor ${floor}`}</div>

      <div className="kills-indicator">Kills: {kills}</div>

      <div className="controls">
        <div>
          <span className="key">Left Click</span> Move
        </div>
        <div>
          <span className="key">Right Click</span> Attack
        </div>
        <div>
          <span className="key">Well</span> Heal (in town)
        </div>
      </div>
    </div>
  )
}
