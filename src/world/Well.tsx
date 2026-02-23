import { useRef, useState } from 'react'
import type { Mesh } from 'three'

import { eventQueue } from '../engine/EventQueue'
import { useWorldStore, useCharacterStore } from '../store'
import type { GameEvent } from '../types'

export function Well({ position }: { position: [number, number, number] }) {
  const [hovered, setHovered] = useState(false)
  const meshRef = useRef<Mesh>(null)
  const currentCharacterId = useCharacterStore((s) => s.currentCharacterId)

  const entity = useWorldStore((s) => s.entities[currentCharacterId ?? ''])
  const health = entity?.components.health
  const currentHealth = health?.current ?? 0
  const maxHealth = health?.max ?? 100
  const isFull = currentHealth >= maxHealth

  const handleClick = () => {
    if (!currentCharacterId || isFull) return

    const event: GameEvent = {
      type: 'APPROACH_INTERACT',
      timestamp: performance.now(),
      entityId: currentCharacterId,
      interactType: 'heal',
      targetPosition: position,
    }

    eventQueue.enqueue(event)
  }

  return (
    <group position={position}>
      <mesh
        ref={meshRef}
        castShadow
        receiveShadow
        onClick={handleClick}
        onPointerOver={() => {
          setHovered(true)
          document.body.style.cursor = 'pointer'
        }}
        onPointerOut={() => {
          setHovered(false)
          document.body.style.cursor = 'default'
        }}
      >
        <cylinderGeometry args={[0.8, 1, 0.8, 12]} />
        <meshStandardMaterial color={hovered ? '#7a8a7a' : '#5a6a5a'} roughness={0.9} />
      </mesh>
      <mesh castShadow position={[0, 0.5, 0]}>
        <torusGeometry args={[0.6, 0.1, 8, 16]} />
        <meshStandardMaterial
          color={hovered ? '#c9b896' : '#a89876'}
          metalness={0.3}
          roughness={0.7}
        />
      </mesh>
      <mesh position={[0, 0.3, 0]}>
        <cylinderGeometry args={[0.55, 0.55, 0.2, 12]} />
        <meshStandardMaterial color="#3a5a7a" metalness={0.1} roughness={0.3} />
      </mesh>
      <mesh castShadow position={[0.7, 0.8, 0]} rotation={[0, 0, 0.3]}>
        <cylinderGeometry args={[0.04, 0.04, 1.2, 8]} />
        <meshStandardMaterial color="#5a4a3a" roughness={0.9} />
      </mesh>
      {hovered && !isFull && (
        <mesh position={[0, 1.5, 0]}>
          <cylinderGeometry args={[0.3, 0.1, 0.4, 8]} />
          <meshStandardMaterial color="#ffffff" transparent opacity={0.3} />
        </mesh>
      )}
    </group>
  )
}
