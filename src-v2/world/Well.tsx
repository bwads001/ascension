import { RigidBody } from '@react-three/rapier'

import { eventQueue } from '../engine/EventQueue'
import { useWorldStore, useCharacterStore } from '../store'
import type { GameEvent } from '../types'

export function Well({ position }: { position: [number, number, number] }) {
  const currentCharacterId = useCharacterStore((s) => s.currentCharacterId)

  const handleClick = () => {
    if (!currentCharacterId) return

    const entity = useWorldStore.getState().entities[currentCharacterId]
    if (!entity?.components.health) return

    const health = entity.components.health
    if (health.current >= health.max) return

    const event: GameEvent = {
      type: 'HEAL',
      timestamp: performance.now(),
      entityId: currentCharacterId,
      amount: health.max,
    }

    eventQueue.enqueue(event)
  }

  return (
    <group position={position} onClick={handleClick}>
      <RigidBody type="fixed" colliders="cuboid">
        <mesh castShadow position={[0, 0.4, 0]}>
          <cylinderGeometry args={[0.8, 1, 0.8, 12]} />
          <meshStandardMaterial color="#6b6b6b" roughness={0.7} />
        </mesh>
      </RigidBody>
      <mesh position={[0, 0.15, 0]}>
        <cylinderGeometry args={[0.6, 0.6, 0.1, 12]} />
        <meshStandardMaterial color="#4a6a8a" roughness={0.3} metalness={0.5} />
      </mesh>
      <mesh castShadow position={[0.9, 0.9, 0]}>
        <cylinderGeometry args={[0.05, 0.05, 1.5, 8]} />
        <meshStandardMaterial color="#4a4a4a" metalness={0.6} />
      </mesh>
      <mesh castShadow position={[-0.9, 0.9, 0]}>
        <cylinderGeometry args={[0.05, 0.05, 1.5, 8]} />
        <meshStandardMaterial color="#4a4a4a" metalness={0.6} />
      </mesh>
      <mesh castShadow position={[0, 1.6, 0]}>
        <cylinderGeometry args={[1, 0.8, 0.2, 12]} />
        <meshStandardMaterial color="#5a5a5a" roughness={0.8} />
      </mesh>
    </group>
  )
}
