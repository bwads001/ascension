import { Html } from '@react-three/drei'
import { RigidBody } from '@react-three/rapier'
import { useState } from 'react'

import { useWorldStore, useCharacterStore } from '../store'

const KILLS_REQUIRED = 5

export function TowerEntrance({ position }: { position: [number, number, number] }) {
  const [showLockedMessage, setShowLockedMessage] = useState(false)
  const currentCharacterId = useCharacterStore((s) => s.currentCharacterId)
  const entities = useWorldStore((s) => s.entities)
  const setFloor = useWorldStore((s) => s.setFloor)

  const player = currentCharacterId ? entities[currentCharacterId] : null
  const kills = player?.components.player?.kills ?? 0
  const isUnlocked = kills >= KILLS_REQUIRED

  const handleClick = () => {
    if (!isUnlocked) {
      setShowLockedMessage(true)
      setTimeout(() => setShowLockedMessage(false), 2000)
      return
    }

    setFloor(1)
  }

  return (
    <group position={position} onClick={handleClick}>
      <RigidBody type="fixed" colliders="cuboid" position={[-2, 1.5, 0]}>
        <mesh castShadow>
          <boxGeometry args={[1, 3, 1]} />
          <meshStandardMaterial color="#4a4a4a" roughness={0.9} />
        </mesh>
      </RigidBody>
      <RigidBody type="fixed" colliders="cuboid" position={[2, 1.5, 0]}>
        <mesh castShadow>
          <boxGeometry args={[1, 3, 1]} />
          <meshStandardMaterial color="#4a4a4a" roughness={0.9} />
        </mesh>
      </RigidBody>
      <RigidBody type="fixed" colliders="cuboid" position={[0, 3.25, 0]}>
        <mesh castShadow>
          <boxGeometry args={[5, 0.5, 1]} />
          <meshStandardMaterial color="#3a3a3a" roughness={0.9} />
        </mesh>
      </RigidBody>
      <mesh position={[0, 1.25, 0.1]}>
        <boxGeometry args={[3, 2.5, 0.1]} />
        <meshStandardMaterial
          color={isUnlocked ? '#4a8a4a' : '#8a4a4a'}
          emissive={isUnlocked ? '#2a5a2a' : '#5a2a2a'}
          emissiveIntensity={0.3}
          roughness={0.8}
        />
      </mesh>
      {showLockedMessage && (
        <Html center position={[0, 5, 0]} style={{ pointerEvents: 'none' }}>
          <div
            style={{
              background: 'rgba(0,0,0,0.8)',
              color: '#ff6666',
              padding: '8px 16px',
              borderRadius: 4,
              fontFamily: 'system-ui, sans-serif',
              fontSize: 14,
              whiteSpace: 'nowrap',
            }}
          >
            Requires {KILLS_REQUIRED} kills ({kills}/{KILLS_REQUIRED})
          </div>
        </Html>
      )}
      <Html center position={[0, 4.5, 0]} style={{ pointerEvents: 'none' }}>
        <div
          style={{
            background: 'rgba(0,0,0,0.7)',
            color: isUnlocked ? '#4a8a4a' : '#888',
            padding: '4px 12px',
            borderRadius: 4,
            fontFamily: 'system-ui, sans-serif',
            fontSize: 12,
            whiteSpace: 'nowrap',
          }}
        >
          {isUnlocked ? 'Enter Tower' : `Locked (${kills}/${KILLS_REQUIRED} kills)`}
        </div>
      </Html>
    </group>
  )
}
