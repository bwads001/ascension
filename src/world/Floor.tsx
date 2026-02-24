import type { ThreeEvent } from '@react-three/fiber'
import { RigidBody } from '@react-three/rapier'

import { eventQueue } from '../engine/EventQueue'
import { useCharacterStore, useWorldStore } from '../store'
import type { GameEvent } from '../types'

interface FloorProps {
  onContextMenu?: (e: ThreeEvent<MouseEvent>) => void
}

export default function Floor({ onContextMenu }: FloorProps) {
  const currentCharacterId = useCharacterStore((s) => s.currentCharacterId)

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    if (!currentCharacterId) return

    e.stopPropagation()
    const point = e.point

    const store = useWorldStore.getState()
    const entity = store.entities[currentCharacterId]
    if (entity?.components.combat?.autoAttackEnabled) {
      store.updateEntity(currentCharacterId, {
        combat: { ...entity.components.combat, autoAttackEnabled: false },
      })
    }

    const event: GameEvent = {
      type: 'MOVE_TO',
      timestamp: performance.now(),
      entityId: currentCharacterId,
      target: [point.x, 0, point.z],
    }

    eventQueue.enqueue(event)
  }

  return (
    <>
      <RigidBody type="fixed" colliders="cuboid">
        <mesh
          receiveShadow
          position={[0, -0.5, 0]}
          onClick={handleClick}
          onContextMenu={onContextMenu}
        >
          <boxGeometry args={[60, 1, 80]} />
          <meshStandardMaterial color="#3d5c3d" roughness={0.95} />
        </mesh>
        {[...Array(15)].map((_, i) =>
          [...Array(20)].map((_row, j) => (
            <mesh key={`${i}-${j}`} receiveShadow position={[(i - 7) * 4, -0.49, (j - 10) * 4]}>
              <boxGeometry args={[3.8, 0.02, 3.8]} />
              <meshStandardMaterial color={(i + j) % 2 === 0 ? '#4a6b4a' : '#3d5c3d'} />
            </mesh>
          ))
        )}
        <mesh receiveShadow position={[-25, -0.49, 0]}>
          <boxGeometry args={[1, 0.02, 80]} />
          <meshStandardMaterial color="#5d4e37" roughness={0.9} />
        </mesh>
        <mesh receiveShadow position={[25, -0.49, 0]}>
          <boxGeometry args={[1, 0.02, 80]} />
          <meshStandardMaterial color="#5d4e37" roughness={0.9} />
        </mesh>
      </RigidBody>

      <RigidBody type="fixed" colliders="cuboid">
        <mesh receiveShadow position={[75, -0.5, 0]} onClick={handleClick}>
          <boxGeometry args={[40, 1, 50]} />
          <meshStandardMaterial color="#3d5c3d" roughness={0.95} />
        </mesh>
        {[...Array(10)].map((_, i) =>
          [...Array(12)].map((_row, j) => (
            <mesh key={`east-${i}-${j}`} receiveShadow position={[58 + i * 4, -0.49, -22 + j * 4]}>
              <boxGeometry args={[3.8, 0.02, 3.8]} />
              <meshStandardMaterial color={(i + j) % 2 === 0 ? '#4a6b4a' : '#3d5c3d'} />
            </mesh>
          ))
        )}
      </RigidBody>

      <RigidBody type="fixed" colliders="cuboid">
        <mesh receiveShadow position={[42.5, -0.51, 0]} onClick={handleClick}>
          <boxGeometry args={[25, 1, 6]} />
          <meshStandardMaterial color="#5d4e37" roughness={0.95} />
        </mesh>
      </RigidBody>
    </>
  )
}
