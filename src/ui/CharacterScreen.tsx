import { useWorldStore, useCharacterStore } from '../store'
import type { PlayerComponent } from '../types'

const ATTRIBUTE_INFO = {
  strength: { name: 'Strength', effect: '+2 melee damage per point', icon: '⚔️' },
  agility: { name: 'Agility', effect: '+2 ranged damage per point', icon: '🏹' },
  intellect: { name: 'Intellect', effect: '+2 spell damage per point', icon: '✨' },
  stamina: { name: 'Stamina', effect: '+10 max HP, +1 HP regen per point', icon: '❤️' },
} as const

type AttributeKey = keyof typeof ATTRIBUTE_INFO

function getDerivedStats(player: PlayerComponent | undefined) {
  if (!player)
    return { maxHealth: 100, meleeDamage: 8, rangedDamage: 8, spellDamage: 8, hpRegen: 0 }

  const baseHealth = 100
  const baseDamage = 8

  return {
    maxHealth: baseHealth + player.attributes.stamina * 10,
    meleeDamage: baseDamage + player.attributes.strength * 2,
    rangedDamage: baseDamage + player.attributes.agility * 2,
    spellDamage: baseDamage + player.attributes.intellect * 2,
    hpRegen: player.attributes.stamina,
  }
}

interface CharacterScreenProps {
  onClose: () => void
}

export default function CharacterScreen({ onClose }: CharacterScreenProps) {
  const currentCharacterId = useCharacterStore((s) => s.currentCharacterId)
  const entity = useWorldStore((s) => s.entities[currentCharacterId ?? ''])
  const player = entity?.components.player

  if (!player) return null

  const stats = getDerivedStats(player)

  const handleAddAttribute = (attr: AttributeKey) => {
    if (player.unspentPoints <= 0) return

    const store = useWorldStore.getState()
    const currentEntity = store.entities[currentCharacterId!]
    if (!currentEntity?.components.player) return

    const newAttributes = {
      ...player.attributes,
      [attr]: player.attributes[attr] + 1,
    }

    const newStats = getDerivedStats({ ...player, attributes: newAttributes })

    store.updateEntity(currentCharacterId!, {
      player: {
        ...player,
        attributes: newAttributes,
        unspentPoints: player.unspentPoints - 1,
      },
      health: currentEntity.components.health
        ? {
            ...currentEntity.components.health,
            max: newStats.maxHealth,
          }
        : undefined,
    })
  }

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.panel} onClick={(e) => e.stopPropagation()}>
        <div style={styles.header}>
          <h2 style={styles.title}>{player.name}</h2>
          <span style={styles.class}>
            Level {player.level} {player.class}
          </span>
          <button style={styles.closeButton} onClick={onClose}>
            ✕
          </button>
        </div>

        <div style={styles.xpBar}>
          <div style={styles.xpLabel}>
            XP: {player.xp} / {player.xpToNextLevel}
          </div>
          <div style={styles.xpBarBg}>
            <div
              style={{
                ...styles.xpBarFill,
                width: `${(player.xp / player.xpToNextLevel) * 100}%`,
              }}
            />
          </div>
        </div>

        {player.unspentPoints > 0 && (
          <div style={styles.unspentBanner}>
            {player.unspentPoints} attribute point{player.unspentPoints > 1 ? 's' : ''} available!
          </div>
        )}

        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>Attributes</h3>
          {(Object.keys(ATTRIBUTE_INFO) as AttributeKey[]).map((attr) => (
            <div key={attr} style={styles.attrRow}>
              <div style={styles.attrInfo}>
                <span style={styles.attrIcon}>{ATTRIBUTE_INFO[attr].icon}</span>
                <div>
                  <div style={styles.attrName}>{ATTRIBUTE_INFO[attr].name}</div>
                  <div style={styles.attrEffect}>{ATTRIBUTE_INFO[attr].effect}</div>
                </div>
              </div>
              <div style={styles.attrValue}>
                <span style={styles.attrNumber}>{player.attributes[attr]}</span>
                {player.unspentPoints > 0 && (
                  <button style={styles.addButton} onClick={() => handleAddAttribute(attr)}>
                    +
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>Derived Stats</h3>
          <div style={styles.statsGrid}>
            <div style={styles.statItem}>
              <span style={styles.statLabel}>Max Health</span>
              <span style={styles.statValue}>{stats.maxHealth}</span>
            </div>
            <div style={styles.statItem}>
              <span style={styles.statLabel}>Melee Damage</span>
              <span style={styles.statValue}>{stats.meleeDamage}</span>
            </div>
            <div style={styles.statItem}>
              <span style={styles.statLabel}>Ranged Damage</span>
              <span style={styles.statValue}>{stats.rangedDamage}</span>
            </div>
            <div style={styles.statItem}>
              <span style={styles.statLabel}>Spell Damage</span>
              <span style={styles.statValue}>{stats.spellDamage}</span>
            </div>
            <div style={styles.statItem}>
              <span style={styles.statLabel}>HP Regen</span>
              <span style={styles.statValue}>{stats.hpRegen}/30s</span>
            </div>
          </div>
        </div>

        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>Statistics</h3>
          <div style={styles.statsGrid}>
            <div style={styles.statItem}>
              <span style={styles.statLabel}>Total Kills</span>
              <span style={styles.statValue}>{player.kills}</span>
            </div>
          </div>
        </div>

        <div style={styles.footer}>Press C to close</div>
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
    background: 'rgba(0, 0, 0, 0.7)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  panel: {
    background: 'linear-gradient(180deg, #2a2a3e 0%, #1a1a2e 100%)',
    border: '2px solid #4a4a6a',
    borderRadius: 12,
    padding: 24,
    minWidth: 400,
    maxWidth: 500,
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  title: {
    margin: 0,
    fontSize: 24,
    color: '#fff',
    fontFamily: 'system-ui, sans-serif',
  },
  class: {
    color: '#8a8aaa',
    fontFamily: 'system-ui, sans-serif',
    fontSize: 14,
    textTransform: 'capitalize',
  },
  closeButton: {
    marginLeft: 'auto',
    background: 'transparent',
    border: 'none',
    color: '#888',
    fontSize: 20,
    cursor: 'pointer',
    padding: 4,
  },
  xpBar: {
    marginBottom: 16,
  },
  xpLabel: {
    color: '#aaa',
    fontSize: 12,
    fontFamily: 'system-ui, sans-serif',
    marginBottom: 4,
  },
  xpBarBg: {
    height: 8,
    background: '#1a1a2e',
    borderRadius: 4,
    overflow: 'hidden',
  },
  xpBarFill: {
    height: '100%',
    background: 'linear-gradient(90deg, #4a8aff, #8a4aff)',
    borderRadius: 4,
    transition: 'width 0.3s ease',
  },
  unspentBanner: {
    background: 'linear-gradient(90deg, #4a8a4a, #6aaa6a)',
    color: '#fff',
    padding: '8px 16px',
    borderRadius: 6,
    textAlign: 'center',
    fontFamily: 'system-ui, sans-serif',
    fontWeight: 600,
    marginBottom: 16,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    margin: '0 0 12px 0',
    fontSize: 14,
    color: '#8a8aaa',
    fontFamily: 'system-ui, sans-serif',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  attrRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '8px 12px',
    background: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 6,
    marginBottom: 6,
  },
  attrInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
  },
  attrIcon: {
    fontSize: 20,
  },
  attrName: {
    color: '#fff',
    fontFamily: 'system-ui, sans-serif',
    fontSize: 14,
  },
  attrEffect: {
    color: '#666',
    fontFamily: 'system-ui, sans-serif',
    fontSize: 11,
  },
  attrValue: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  attrNumber: {
    color: '#fff',
    fontFamily: 'system-ui, sans-serif',
    fontSize: 18,
    fontWeight: 600,
    minWidth: 30,
    textAlign: 'center',
  },
  addButton: {
    width: 28,
    height: 28,
    borderRadius: 6,
    border: 'none',
    background: '#4a8a4a',
    color: '#fff',
    fontSize: 18,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 8,
  },
  statItem: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '8px 12px',
    background: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 6,
  },
  statLabel: {
    color: '#888',
    fontFamily: 'system-ui, sans-serif',
    fontSize: 12,
  },
  statValue: {
    color: '#fff',
    fontFamily: 'system-ui, sans-serif',
    fontSize: 12,
    fontWeight: 600,
  },
  footer: {
    textAlign: 'center',
    color: '#555',
    fontSize: 12,
    fontFamily: 'system-ui, sans-serif',
    marginTop: 8,
  },
}
