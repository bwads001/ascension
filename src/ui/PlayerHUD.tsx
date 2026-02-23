import { useWorldStore, useCharacterStore } from '../store'

export default function PlayerHUD() {
  const currentCharacterId = useCharacterStore((s) => s.currentCharacterId)
  const entity = useWorldStore((s) => s.entities[currentCharacterId ?? ''])
  const health = entity?.components.health
  const player = entity?.components.player

  if (!health || !player) return null

  const healthPercent = Math.max(0, Math.min(100, (health.current / health.max) * 100))
  const xpPercent = Math.max(0, Math.min(100, (player.xp / player.xpToNextLevel) * 100))

  return (
    <div style={styles.container}>
      <div style={styles.playerInfo}>
        <span style={styles.name}>{player.name}</span>
        <span style={styles.level}>
          Lv. {player.level} {player.class}
        </span>
      </div>
      <div style={styles.barContainer}>
        <div style={styles.barLabel}>HP</div>
        <div style={styles.healthBar}>
          <div style={{ ...styles.healthFill, width: `${healthPercent}%` }} />
          <span style={styles.barText}>
            {health.current} / {health.max}
          </span>
        </div>
      </div>
      <div style={styles.barContainer}>
        <div style={styles.barLabel}>XP</div>
        <div style={styles.xpBar}>
          <div style={{ ...styles.xpFill, width: `${xpPercent}%` }} />
          <span style={styles.barText}>
            {player.xp} / {player.xpToNextLevel}
          </span>
        </div>
      </div>
      {player.unspentPoints > 0 && (
        <div style={styles.unspentPoints}>
          {player.unspentPoints} attribute point{player.unspentPoints > 1 ? 's' : ''}! Press C
        </div>
      )}
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
    minWidth: 220,
  },
  playerInfo: {
    marginBottom: 12,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  name: {
    fontSize: 18,
    fontWeight: 600,
  },
  level: {
    fontSize: 14,
    opacity: 0.7,
    textTransform: 'capitalize',
  },
  barContainer: {
    marginBottom: 8,
  },
  barLabel: {
    fontSize: 10,
    opacity: 0.6,
    marginBottom: 2,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  healthBar: {
    position: 'relative',
    height: 20,
    background: '#2a2a2a',
    borderRadius: 4,
    overflow: 'hidden',
  },
  healthFill: {
    height: '100%',
    background: 'linear-gradient(180deg, #4a8a4a 0%, #3a6a3a 100%)',
    transition: 'width 0.2s ease',
  },
  xpBar: {
    position: 'relative',
    height: 16,
    background: '#2a2a2a',
    borderRadius: 4,
    overflow: 'hidden',
  },
  xpFill: {
    height: '100%',
    background: 'linear-gradient(180deg, #4a6aff 0%, #3a4adf 100%)',
    transition: 'width 0.3s ease',
  },
  barText: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    fontSize: 11,
    fontWeight: 600,
    textShadow: '0 1px 2px rgba(0,0,0,0.8)',
  },
  unspentPoints: {
    background: 'linear-gradient(90deg, #4a8a4a, #6aaa6a)',
    padding: '6px 10px',
    borderRadius: 4,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: 600,
    marginBottom: 8,
  },
  stats: {
    fontSize: 12,
    opacity: 0.8,
  },
}
