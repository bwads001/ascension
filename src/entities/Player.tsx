import { useFrame } from '@react-three/fiber'
import { RigidBody, CuboidCollider, RapierRigidBody } from '@react-three/rapier'
import { useRef, useState } from 'react'
import { Vector3, Mesh } from 'three'

import { eventQueue } from '../engine/EventQueue'
import { useWorldStore, useCharacterStore, useCombatStore } from '../store'
import type { GameEvent } from '../types'

const SPEED = 8
const ATTACK_RANGE = 3
const ATTACK_COOLDOWN = 500

function Warrior() {
  return (
    <group>
      <mesh castShadow position={[0, 0.5, 0]}>
        <boxGeometry args={[0.6, 0.8, 0.4]} />
        <meshStandardMaterial color="#4a4a4a" metalness={0.3} roughness={0.7} />
      </mesh>
      <mesh castShadow position={[0, 1.1, 0]}>
        <boxGeometry args={[0.4, 0.4, 0.4]} />
        <meshStandardMaterial color="#d4a574" />
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

function Archer() {
  return (
    <group>
      <mesh castShadow position={[0, 0.55, 0]}>
        <boxGeometry args={[0.5, 0.9, 0.35]} />
        <meshStandardMaterial color="#2d5a27" roughness={0.8} />
      </mesh>
      <mesh castShadow position={[0, 1.15, 0]}>
        <boxGeometry args={[0.35, 0.35, 0.35]} />
        <meshStandardMaterial color="#d4a574" />
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

function Mage() {
  const orbRef = useRef<Mesh>(null)

  useFrame((state) => {
    if (orbRef.current) {
      orbRef.current.position.y = 1.5 + Math.sin(state.clock.elapsedTime * 2) * 0.05
    }
  })

  return (
    <group>
      <mesh castShadow position={[0, 0.5, 0]}>
        <coneGeometry args={[0.4, 1, 6]} />
        <meshStandardMaterial color="#6b4c9a" roughness={0.7} />
      </mesh>
      <mesh castShadow position={[0, 1.15, 0]}>
        <boxGeometry args={[0.35, 0.35, 0.35]} />
        <meshStandardMaterial color="#d4a574" />
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

type PlayerClass = keyof typeof CLASSES

interface PlayerProps {
  playerClass?: PlayerClass
}

export default function Player({ playerClass = 'warrior' }: PlayerProps) {
  const ref = useRef<RapierRigidBody>(null)
  const canAttackRef = useRef(true)
  const Character = CLASSES[playerClass]
  const [isAttacking, setIsAttacking] = useState(false)

  const currentCharacterId = useCharacterStore((s) => s.currentCharacterId)
  const entity = useWorldStore((s) => s.entities[currentCharacterId ?? ''])
  const position = entity?.components.position
  const isDead = entity?.components.health?.dead ?? false
  const targetMonsterId = entity?.components.combat?.targetId
  const updateEntity = useWorldStore((s) => s.updateEntity)
  const canAttack = useCombatStore((s) => s.canAttack)
  const setCooldown = useCombatStore((s) => s.setCooldown)
  const entities = useWorldStore((s) => s.entities)

  useFrame((_, delta) => {
    if (!ref.current || isDead || !position || !currentCharacterId) return

    const currentPos = ref.current.translation()
    const current = new Vector3(currentPos.x, currentPos.y, currentPos.z)

    const targetPos = entity?.components.velocity
    if (targetPos && (targetPos.x !== 0 || targetPos.z !== 0)) {
      const target = new Vector3(targetPos.x, position.y, targetPos.z)
      const direction = target.clone().sub(current)
      const distance = direction.length()

      if (distance > 0.1) {
        direction.normalize()
        const moveDistance = Math.min(SPEED * delta, distance)
        const newPos = current.clone().add(direction.multiplyScalar(moveDistance))
        ref.current.setTranslation({ x: newPos.x, y: newPos.y, z: newPos.z }, true)
        updateEntity(currentCharacterId, {
          position: { x: newPos.x, y: newPos.y, z: newPos.z, rotation: 0 },
        })
      }
    }

    if (targetMonsterId && canAttackRef.current) {
      const monster = entities[targetMonsterId]
      if (monster?.components.position && !monster.components.health?.dead) {
        const monsterPos = monster.components.position
        const dx = monsterPos.x - currentPos.x
        const dz = monsterPos.z - currentPos.z
        const distance = Math.sqrt(dx * dx + dz * dz)

        if (distance <= ATTACK_RANGE) {
          const now = performance.now()
          if (canAttack(currentCharacterId, now)) {
            setIsAttacking(true)
            setTimeout(() => setIsAttacking(false), 200)

            const event: GameEvent = {
              type: 'ATTACK_ENTITY',
              timestamp: now,
              attackerId: currentCharacterId,
              targetId: targetMonsterId,
            }
            eventQueue.enqueue(event)

            setCooldown(currentCharacterId, now, ATTACK_COOLDOWN)

            updateEntity(currentCharacterId, {
              combat: { ...entity.components.combat!, targetId: null },
            })
          }
        }
      } else {
        updateEntity(currentCharacterId, {
          combat: { ...entity!.components.combat!, targetId: null },
        })
      }
    }
  })

  if (!position) return null

  if (isDead) {
    return (
      <RigidBody
        ref={ref}
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
      ref={ref}
      position={[position.x, position.y, position.z]}
      colliders={false}
      type="kinematicPosition"
      lockRotations
    >
      <CuboidCollider args={[0.4, 1, 0.4]} position={[0, 1, 0]} />
      <group scale={isAttacking ? 1.1 : 1}>
        <Character />
      </group>
    </RigidBody>
  )
}

export type { PlayerClass }
