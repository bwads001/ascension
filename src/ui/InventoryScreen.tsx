import { useCharacterStore, useWorldStore } from '../store'
import type { Equipment, EquipmentSlot } from '../types/items'
import {
  getRarityColor,
  getRarityName,
  SLOT_NAMES,
  calculateEquipmentBonuses,
} from '../types/items'

interface InventoryScreenProps {
  onClose: () => void
}

export default function InventoryScreen({ onClose }: InventoryScreenProps) {
  const currentCharacterId = useCharacterStore((s) => s.currentCharacterId)
  const entity = useWorldStore((s) => s.entities[currentCharacterId ?? ''])
  const player = entity?.components.player

  if (!player) return null

  const equipment = player.equipment ?? {}
  const inventory = player.inventory ?? []
  const bonuses = calculateEquipmentBonuses(equipment)

  const handleEquip = (item: Equipment) => {
    if (!currentCharacterId) return
    const store = useWorldStore.getState()
    const playerEntity = store.entities[currentCharacterId]
    if (!playerEntity?.components.player) return

    const currentEquipped = playerEntity.components.player.equipment?.[item.slot]
    const newEquipment = { ...playerEntity.components.player.equipment, [item.slot]: item }
    const newInventory = playerEntity.components.player.inventory.filter((i) => i.id !== item.id)

    if (currentEquipped) {
      newInventory.push(currentEquipped)
    }

    store.updateEntity(currentCharacterId, {
      player: {
        ...playerEntity.components.player,
        equipment: newEquipment,
        inventory: newInventory,
      },
    })
  }

  const handleUnequip = (slot: EquipmentSlot) => {
    if (!currentCharacterId) return
    const store = useWorldStore.getState()
    const playerEntity = store.entities[currentCharacterId]
    if (!playerEntity?.components.player) return

    const item = playerEntity.components.player.equipment?.[slot]
    if (!item) return

    if (playerEntity.components.player.inventory.length >= 20) return

    const newEquipment = { ...playerEntity.components.player.equipment }
    delete newEquipment[slot]

    store.updateEntity(currentCharacterId, {
      player: {
        ...playerEntity.components.player,
        equipment: newEquipment,
        inventory: [...playerEntity.components.player.inventory, item],
      },
    })
  }

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.panel} onClick={(e) => e.stopPropagation()}>
        <div style={styles.header}>
          <h2 style={styles.title}>Inventory</h2>
          <button style={styles.closeButton} onClick={onClose}>
            ✕
          </button>
        </div>

        <div style={styles.content}>
          <div style={styles.section}>
            <h3 style={styles.sectionTitle}>Equipment</h3>
            <div style={styles.equipmentGrid}>
              {(Object.keys(SLOT_NAMES) as EquipmentSlot[]).map((slot) => {
                const item = equipment[slot]
                return (
                  <div key={slot} style={styles.equipSlot}>
                    <div style={styles.slotLabel}>{SLOT_NAMES[slot]}</div>
                    {item ? (
                      <div
                        style={{
                          ...styles.itemBox,
                          borderColor: getRarityColor(item.rarity),
                        }}
                        onClick={() => handleUnequip(slot)}
                        title={`${item.name}\n${getRarityName(item.rarity)}\nLevel ${item.level}\n\nClick to unequip`}
                      >
                        <div
                          style={{ ...styles.rarityBar, background: getRarityColor(item.rarity) }}
                        />
                        <div style={styles.itemName}>{item.name}</div>
                        <div style={styles.itemLevel}>Lv {item.level}</div>
                      </div>
                    ) : (
                      <div style={styles.emptySlot}>Empty</div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          <div style={styles.section}>
            <h3 style={styles.sectionTitle}>Equipment Bonuses</h3>
            <div style={styles.bonusList}>
              {Object.entries(bonuses).map(([stat, value]) => (
                <div key={stat} style={styles.bonusItem}>
                  <span style={styles.bonusStat}>{stat}:</span>
                  <span style={styles.bonusValue}>+{value}</span>
                </div>
              ))}
              {Object.keys(bonuses).length === 0 && <div style={styles.noBonus}>No bonuses</div>}
            </div>
          </div>

          <div style={styles.section}>
            <h3 style={styles.sectionTitle}>Bag ({inventory.length}/20)</h3>
            <div style={styles.inventoryGrid}>
              {inventory.map((item) => (
                <div
                  key={item.id}
                  style={{
                    ...styles.itemBox,
                    borderColor: getRarityColor(item.rarity),
                  }}
                  onClick={() => handleEquip(item)}
                  title={`${item.name}\n${getRarityName(item.rarity)}\nLevel ${item.level}\n\nClick to equip`}
                >
                  <div style={{ ...styles.rarityBar, background: getRarityColor(item.rarity) }} />
                  <div style={styles.itemName}>{item.name}</div>
                  <div style={styles.itemLevel}>Lv {item.level}</div>
                </div>
              ))}
              {inventory.length === 0 && <div style={styles.emptyBag}>Bag is empty</div>}
            </div>
          </div>

          <div style={styles.section}>
            <h3 style={styles.sectionTitle}>Potions</h3>
            <div style={styles.potionCount}>
              <span style={styles.potionIcon}>🧪</span>
              <span>{player.potions ?? 0} Health Potions</span>
            </div>
          </div>
        </div>

        <div style={styles.footer}>Press I to close</div>
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
    padding: 20,
    minWidth: 500,
    maxWidth: 600,
    maxHeight: '80vh',
    overflowY: 'auto',
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
    fontSize: 22,
    color: '#fff',
    fontFamily: 'system-ui, sans-serif',
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
  content: {
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
  },
  section: {
    background: 'rgba(0, 0, 0, 0.2)',
    borderRadius: 8,
    padding: 12,
  },
  sectionTitle: {
    margin: '0 0 10px 0',
    fontSize: 14,
    color: '#8a8aaa',
    fontFamily: 'system-ui, sans-serif',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  equipmentGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: 8,
  },
  equipSlot: {
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
  },
  slotLabel: {
    fontSize: 11,
    color: '#666',
    fontFamily: 'system-ui, sans-serif',
  },
  itemBox: {
    background: 'rgba(40, 40, 60, 0.8)',
    border: '2px solid',
    borderRadius: 6,
    padding: 8,
    cursor: 'pointer',
    position: 'relative',
    overflow: 'hidden',
    transition: 'background 0.15s',
  },
  rarityBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
  },
  itemName: {
    fontSize: 12,
    color: '#fff',
    fontFamily: 'system-ui, sans-serif',
    marginBottom: 2,
  },
  itemLevel: {
    fontSize: 10,
    color: '#888',
    fontFamily: 'system-ui, sans-serif',
  },
  emptySlot: {
    background: 'rgba(30, 30, 40, 0.5)',
    border: '2px dashed #333',
    borderRadius: 6,
    padding: 8,
    color: '#444',
    fontSize: 11,
    textAlign: 'center',
  },
  bonusList: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 8,
  },
  bonusItem: {
    display: 'flex',
    gap: 4,
    padding: '4px 8px',
    background: 'rgba(74, 138, 74, 0.2)',
    borderRadius: 4,
  },
  bonusStat: {
    color: '#8a8aaa',
    fontSize: 12,
    textTransform: 'capitalize',
  },
  bonusValue: {
    color: '#4a8a4a',
    fontSize: 12,
    fontWeight: 'bold',
  },
  noBonus: {
    color: '#555',
    fontSize: 12,
    fontStyle: 'italic',
  },
  inventoryGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: 8,
    minHeight: 60,
  },
  emptyBag: {
    gridColumn: '1 / -1',
    color: '#555',
    fontSize: 12,
    fontStyle: 'italic',
    textAlign: 'center',
    padding: 20,
  },
  potionCount: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    color: '#ccc',
    fontSize: 14,
  },
  potionIcon: {
    fontSize: 20,
  },
  footer: {
    textAlign: 'center',
    color: '#555',
    fontSize: 12,
    fontFamily: 'system-ui, sans-serif',
    marginTop: 12,
  },
}
