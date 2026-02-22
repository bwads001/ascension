import { RigidBody, CuboidCollider } from '@react-three/rapier'
import { useState, useRef, useEffect } from 'react'
import type { Mesh } from 'three'

import { useWorldStore, useCharacterStore } from '../store'
import type { PlayerClass } from '../types'

function Warrior({ isHit }: { isHit: boolean }) {
  const bodyColor = isHit ? '#ff6666' : '#4a4a4a'
  const skinColor = isHit ? '#ffaaaa' : '#d4a574'

  return (
    <group>
      <mesh castShadow position={[0, 0.5, 0]}>
        <boxGeometry args={[0.6, 0.8, 0.4]} />
        <meshStandardMaterial color={bodyColor} metalness={0.3} roughness={0.7} />
      </mesh>
      <mesh castShadow position={[0, 1.1, 0]}>
        <boxGeometry args={[0.4, 0.4, 0.4]} />
        <meshStandardMaterial color={skinColor} />
      </mesh>
      <mesh castShadow position={[0, 1.4, 0]}>
        <boxGeometry args={[0.5, 0.2, 0.5]} />
        <meshStandardMaterial color="#c0c0c0" metalness={0.6} roughness={0.4} />
      </mesh>
      <mesh castShadow position={[0.4, 0.7, 0]} rotation={[0, 0, Math.PI / 2]}>
        <boxGeometry args={[0.08, 0.7, 0.05]} />
        <meshStandardMaterial color="#c0c0c0" metalness={0.8} roughness={0.3} />
      </mesh>
      <mesh castShadow position={[0.7, 0.7, 0]}>
        <boxGeometry args={[0.15, 0.2, 0.05]} />
        <meshStandardMaterial color="#c0c0c0" metalness={0.8} roughness={0.3} />
      </mesh>
      <mesh castShadow position={[-0.4, 0.6, 0.1]} rotation={[0, 0, Math.PI / 6]}>
        <boxGeometry args={[0.4, 0.5, 0.05]} />
        <meshStandardMaterial color="#8b4513" metalness={0.1} roughness={0.8} />
      </mesh>
      <mesh position={[0, 1.2, 0.21]}>
        <boxGeometry args={[0.08, 0.08, 0.05]} />
        <meshStandardMaterial color="#2c3e50" />
      </mesh>
      <mesh position={[0.1, 1.2, 0.21]}>
        <boxGeometry args={[0.08, 0.08, 0.05]} />
        <meshStandardMaterial color="#2c3e50" />
      </mesh>
    </group>
  )
}

function Archer({ isHit }: { isHit: boolean }) {
  const bodyColor = isHit ? '#ff6666' : '#2d5a27'
  const skinColor = isHit ? '#ffaaaa' : '#d4a574'

  return (
    <group>
      <mesh castShadow position={[0, 0.55, 0]}>
        <boxGeometry args={[0.5, 0.9, 0.35]} />
        <meshStandardMaterial color={bodyColor} roughness={0.8} />
      </mesh>
      <mesh castShadow position={[0, 1.15, 0]}>
        <boxGeometry args={[0.35, 0.35, 0.35]} />
        <meshStandardMaterial color={skinColor} />
      </mesh>
      <mesh castShadow position={[0, 1.45, 0]}>
        <coneGeometry args={[0.25, 0.2, 4]} />
        <meshStandardMaterial color="#1a3d1a" roughness={0.9} />
      </mesh>
      <mesh position={[0, 1.2, 0.2]}>
        <boxGeometry args={[0.25, 0.08, 0.05]} />
        <meshStandardMaterial color="#1a1a1a" />
      </mesh>
      <mesh position={[0, 1.15, 0.22]}>
        <boxGeometry args={[0.05, 0.05, 0.05]} />
        <meshStandardMaterial color="#2c3e50" />
      </mesh>
      <mesh castShadow position={[0.35, 0.9, -0.1]} rotation={[0, 0, -0.3]}>
        <boxGeometry args={[0.05, 0.8, 0.03]} />
        <meshStandardMaterial color="#8b4513" roughness={0.9} />
      </mesh>
      <mesh castShadow position={[0.35, 0.9, -0.1]} rotation={[0, 0, -0.3]}>
        <boxGeometry args={[0.5, 0.03, 0.03]} />
        <meshStandardMaterial color="#f5f5dc" roughness={0.6} />
      </mesh>
      <mesh castShadow position={[-0.35, 0.7, -0.15]} rotation={[0.3, 0, 0]}>
        <boxGeometry args={[0.12, 0.3, 0.12]} />
        <meshStandardMaterial color="#8b4513" roughness={0.9} />
      </mesh>
    </group>
  )
}

function Mage({ isHit }: { isHit: boolean }) {
  const bodyColor = isHit ? '#ff6666' : '#6b4c9a'
  const skinColor = isHit ? '#ffaaaa' : '#d4a574'
  const orbRef = useRef<Mesh>(null)

  return (
    <group>
      <mesh castShadow position={[0, 0.5, 0]}>
        <coneGeometry args={[0.4, 1, 6]} />
        <meshStandardMaterial color={bodyColor} roughness={0.7} />
      </mesh>
      <mesh castShadow position={[0, 1.15, 0]}>
        <boxGeometry args={[0.35, 0.35, 0.35]} />
        <meshStandardMaterial color={skinColor} />
      </mesh>
      <mesh castShadow position={[0, 1.45, 0]}>
        <coneGeometry args={[0.22, 0.25, 6]} />
        <meshStandardMaterial color="#4a3670" roughness={0.8} />
      </mesh>
      <mesh position={[0, 1.18, 0.2]}>
        <boxGeometry args={[0.08, 0.08, 0.05]} />
        <meshStandardMaterial color="#2c3e50" />
      </mesh>
      <mesh position={[0.1, 1.18, 0.2]}>
        <boxGeometry args={[0.08, 0.08, 0.05]} />
        <meshStandardMaterial color="#2c3e50" />
      </mesh>
      <mesh castShadow position={[0.5, 0.9, 0]}>
        <cylinderGeometry args={[0.03, 0.03, 1.2, 8]} />
        <meshStandardMaterial color="#8b4513" roughness={0.8} />
      </mesh>
      <mesh ref={orbRef} castShadow position={[0.5, 1.5, 0]}>
        <sphereGeometry args={[0.12, 16, 16]} />
        <meshStandardMaterial color="#00ffff" emissive="#00ffff" emissiveIntensity={0.8} />
      </mesh>
      <pointLight position={[0.5, 1.5, 0]} intensity={0.3} color="#00ffff" distance={2} />
    </group>
  )
}

const CLASSES = {
  warrior: Warrior,
  archer: Archer,
  mage: Mage,
}

interface PlayerProps {
  playerClass?: PlayerClass
}

export default function Player({ playerClass = 'warrior' }: PlayerProps) {
  const currentCharacterId = useCharacterStore((s) => s.currentCharacterId)
  const entity = useWorldStore((s) => s.entities[currentCharacterId ?? ''])
  const position = entity?.components.position
  const isDead = entity?.components.health?.dead ?? false
  const currentHealth = entity?.components.health?.current ?? 150

  const [isAttacking, setIsAttacking] = useState(false)
  const [isHit, setIsHit] = useState(false)
  const [shake, setShake] = useState(0)
  const lastAttackTime = useRef(0)
  const lastHealth = useRef(currentHealth)

  const combat = entity?.components.combat
  if (combat?.lastAttackTime && combat.lastAttackTime !== lastAttackTime.current) {
    lastAttackTime.current = combat.lastAttackTime
    setIsAttacking(true)
    setTimeout(() => setIsAttacking(false), 200)
  }

  useEffect(() => {
    if (currentHealth < lastHealth.current) {
      setIsHit(true)
      setShake(Math.random() * 0.3)
      setTimeout(() => setIsHit(false), 150)
      setTimeout(() => setShake(0), 100)
    }
    lastHealth.current = currentHealth
  }, [currentHealth])

  const Character = CLASSES[playerClass]

  if (!position) return null

  if (isDead) {
    return (
      <RigidBody
        position={[position.x, position.y, position.z]}
        colliders={false}
        type="kinematicPosition"
        lockRotations
      >
        <CuboidCollider args={[0.4, 1, 0.4]} position={[0, 1, 0]} />
      </RigidBody>
    )
  }

  return (
    <RigidBody
      position={[position.x + shake, position.y, position.z]}
      colliders={false}
      type="kinematicPosition"
      lockRotations
    >
      <CuboidCollider args={[0.4, 1, 0.4]} position={[0, 1, 0]} />
      <group scale={isAttacking ? 1.1 : 1}>
        <Character isHit={isHit} />
      </group>
    </RigidBody>
  )
}

export type { PlayerClass }
