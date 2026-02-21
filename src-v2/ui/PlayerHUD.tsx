import { useWorldStore, useCharacterStore } from '../store'

export default function PlayerHUD() {
  const currentCharacterId = useCharacterStore((s) => s.currentCharacterId)
  const entity = useWorldStore((s) => s.entities[currentCharacterId ?? ''])
  const health = entity?.components.health
  const player = entity?.components.player

  if (!health || !player) return null

  const healthPercent = Math.max(0, Math.min(100, (health.current / health.max) * 100))

  return (
    <div style={styles.container}>
      <div style={styles.playerInfo}>
        <span style={styles.name}>{player.name}</span>
        <span style={styles.class}>{player.class}</span>
      </div>
      <div style={styles.healthBar}>
        <div style={{ ...styles.healthFill, width: `${healthPercent}%` }} />
        <span style={styles.healthText}>
          {health.current} / {health.max}
        </span>
      </div>
      <div style={styles.stats}>
        <span>Kills: {player.kills}</span>
      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    position: 'absolute',
    top: 16,
    left: 16,
    background: 'rgba(0,0,0,0.7)',
    padding: 16,
    borderRadius: 8,
    color: '#fff',
    fontFamily: 'system-ui, sans-serif',
    minWidth: 200,
  },
  playerInfo: {
    marginBottom: 8,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  name: {
    fontSize: 18,
    fontWeight: 600,
  },
  class: {
    fontSize: 14,
    opacity: 0.7,
    textTransform: 'capitalize',
  },
  healthBar: {
    position: 'relative',
    height: 24,
    background: '#2a2a2a',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  healthFill: {
    height: '100%',
    background: 'linear-gradient(180deg, #4a8a4a 0%, #3a6a3a 100%)',
    transition: 'width 0.2s ease',
  },
  healthText: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    fontSize: 12,
    fontWeight: 600,
    textShadow: '0 1px 2px rgba(0,0,0,0.8)',
  },
  stats: {
    fontSize: 12,
    opacity: 0.8,
  },
}
