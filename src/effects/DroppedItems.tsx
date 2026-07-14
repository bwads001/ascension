import { RigidBody } from '@react-three/rapier'
import { useState } from 'react'

import { useCharacterStore, useWorldStore } from '../store'
import { useDroppedItemsStore } from '../store/droppedItemsStore'
import type { Equipment, EquipmentSlot } from '../types/items'
import { getRarityColor } from '../types/items'

const SLOT_GLOW_COLORS: Record<EquipmentSlot, string> = {
  weapon: '#ff6600',
  helmet: '#6699ff',
  chest: '#ff6666',
  legs: '#66ff66',
  accessory: '#ffff66',
}

function DroppedItem({ id, item, x, z }: { id: string; item: Equipment; x: number; z: number }) {
  const [hovered, setHovered] = useState(false)
  const currentCharacterId = useCharacterStore((s) => s.currentCharacterId)
  const removeItem = useDroppedItemsStore((s) => s.removeItem)
  const updateEntity = useWorldStore((s) => s.updateEntity)

  const handlePickup = () => {
    if (!currentCharacterId) return

    const store = useWorldStore.getState()
    const player = store.entities[currentCharacterId]
    if (!player?.components.player) return

    const inventory = player.components.player.inventory ?? []
    if (inventory.length >= 20) return

    const dropped = removeItem(id)
    if (!dropped) return

    updateEntity(currentCharacterId, {
      player: {
        ...player.components.player,
        inventory: [...inventory, item],
      },
    })
  }

  const color = getRarityColor(item.rarity)
  const glowColor = SLOT_GLOW_COLORS[item.slot]

  return (
    <RigidBody type="fixed" position={[x, 0.3, z]}>
      <mesh
        castShadow
        onClick={handlePickup}
        onPointerEnter={() => setHovered(true)}
        onPointerLeave={() => setHovered(false)}
        scale={hovered ? 1.3 : 1}
      >
        <boxGeometry args={[0.3, 0.3, 0.3]} />
        <meshStandardMaterial
          color={color}
          emissive={glowColor}
          emissiveIntensity={hovered ? 0.8 : 0.4}
          metalness={0.5}
          roughness={0.3}
        />
      </mesh>
      {hovered && (
        <pointLight position={[0, 0.5, 0]} intensity={0.5} color={glowColor} distance={3} />
      )}
    </RigidBody>
  )
}

export default function DroppedItems() {
  const items = useDroppedItemsStore((s) => s.items)

  return (
    <>
      {items.map((dropped) => (
        <DroppedItem
          key={dropped.id}
          id={dropped.id}
          item={dropped.item}
          x={dropped.x}
          z={dropped.z}
        />
      ))}
    </>
  )
}
