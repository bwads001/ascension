import type { ThreeEvent } from '@react-three/fiber'
import { RigidBody } from '@react-three/rapier'

import { eventQueue } from '../engine/EventQueue'
import { useCharacterStore } from '../store'
import type { GameEvent } from '../types'

interface FloorProps {
  size?: number
  onContextMenu?: (e: ThreeEvent<MouseEvent>) => void
}

export default function Floor({ size = 50, onContextMenu }: FloorProps) {
  const currentCharacterId = useCharacterStore((s) => s.currentCharacterId)

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    if (!currentCharacterId) return

    e.stopPropagation()
    const point = e.point

    const event: GameEvent = {
      type: 'MOVE_TO',
      timestamp: performance.now(),
      entityId: currentCharacterId,
      target: [point.x, 0, point.z],
    }

    eventQueue.enqueue(event)
  }

  return (
    <RigidBody type="fixed" colliders="cuboid">
      <mesh
        receiveShadow
        position={[0, -0.5, 0]}
        onClick={handleClick}
        onContextMenu={onContextMenu}
      >
        <boxGeometry args={[size, 1, size]} />
        <meshStandardMaterial color="#3a3a4a" />
      </mesh>
    </RigidBody>
  )
}
