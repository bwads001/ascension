import { useWorldStore, useCharacterStore, useUIStore } from '../store'
import { PLAYER_DEFAULTS } from '../types'

export default function DeathScreen() {
  const currentCharacterId = useCharacterStore((s) => s.currentCharacterId)
  const entity = useWorldStore((s) => s.entities[currentCharacterId ?? ''])
  const health = entity?.components.health
  const setShowStartScreen = useUIStore((s) => s.setShowStartScreen)

  if (!health?.dead) return null

  const handleRespawn = () => {
    const worldStore = useWorldStore.getState()
    const current = worldStore.entities[currentCharacterId!]
    const combat = current?.components.combat

    worldStore.updateEntity(currentCharacterId!, {
      health: {
        current: PLAYER_DEFAULTS.health!.max,
        max: PLAYER_DEFAULTS.health!.max,
        dead: false,
      },
      position: {
        x: 0,
        y: 0,
        z: 0,
        rotation: 0,
      },
      destination: { x: 0, y: 0, z: 0 },
      ...(combat ? { combat: { ...combat, targetId: null } } : {}),
    })
  }

  const handleMainMenu = () => {
    setShowStartScreen(true)
  }

  return (
    <div style={styles.overlay}>
      <div style={styles.container}>
        <h1 style={styles.title}>YOU DIED</h1>
        <div style={styles.buttons}>
          <button style={styles.button} onClick={handleRespawn}>
            Respawn
          </button>
          <button style={{ ...styles.button, ...styles.secondaryButton }} onClick={handleMainMenu}>
            Main Menu
          </button>
        </div>
      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(139, 0, 0, 0.8)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  container: {
    textAlign: 'center',
  },
  title: {
    fontSize: 64,
    color: '#fff',
    fontFamily: 'system-ui, sans-serif',
    textShadow: '0 4px 8px rgba(0,0,0,0.5)',
    margin: 0,
    marginBottom: 32,
  },
  buttons: {
    display: 'flex',
    gap: 16,
    justifyContent: 'center',
  },
  button: {
    padding: '16px 32px',
    fontSize: 18,
    fontWeight: 600,
    background: '#4a8a4a',
    border: 'none',
    borderRadius: 8,
    color: '#fff',
    cursor: 'pointer',
    fontFamily: 'system-ui, sans-serif',
  },
  secondaryButton: {
    background: 'rgba(255,255,255,0.2)',
  },
}
