import { Html } from '@react-three/drei'
import { RigidBody, RapierRigidBody } from '@react-three/rapier'
import { useEffect, useRef, useState } from 'react'
import type { JSX } from 'react'
import type { Mesh } from 'three'

import { physicsBridge } from '../bridge'
import { eventQueue } from '../engine/EventQueue'
import { useWorldStore } from '../store'
import type { MonsterType, GameEvent } from '../types'

interface MonsterProps {
  id: string
}

function HealthBar({ health, maxHealth }: { health: number; maxHealth: number }) {
  const percent = Math.max(0, Math.min(100, (health / maxHealth) * 100))
  return (
    <Html center position={[0, 2.5, 0]} style={{ pointerEvents: 'none' }}>
      <div
        style={{
          width: '50px',
          height: '6px',
          background: 'rgba(0,0,0,0.5)',
          border: '1px solid #333',
          borderRadius: '2px',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            width: `${percent}%`,
            height: '100%',
            background: percent > 50 ? '#4a4' : percent > 25 ? '#aa4' : '#a44',
          }}
        />
      </div>
    </Html>
  )
}

function Slime({ isHit, isHovered }: { isHit: boolean; isHovered: boolean }): JSX.Element {
  const meshRef = useRef<Mesh>(null)

  return (
    <group>
      <mesh ref={meshRef} castShadow position={[0, 0.4, 0]}>
        <sphereGeometry args={[0.4, 16, 12]} />
        <meshStandardMaterial
          color={isHit ? '#ff6666' : '#5a9a5a'}
          emissive={isHovered ? '#ffff00' : '#000000'}
          emissiveIntensity={isHovered ? 0.5 : 0}
          roughness={0.3}
          metalness={0.1}
        />
      </mesh>
      <mesh position={[-0.1, 0.45, 0.35]}>
        <sphereGeometry args={[0.08]} />
        <meshStandardMaterial color="#1a1a1a" />
      </mesh>
      <mesh position={[0.1, 0.45, 0.35]}>
        <sphereGeometry args={[0.08]} />
        <meshStandardMaterial color="#1a1a1a" />
      </mesh>
    </group>
  )
}

function Rat({ isHit, isHovered }: { isHit: boolean; isHovered: boolean }): JSX.Element {
  const baseColor = isHit ? '#ff6666' : '#5c4a3d'
  const emissive = isHovered ? '#ffff00' : '#000000'
  const emissiveIntensity = isHovered ? 0.5 : 0

  return (
    <group>
      <mesh castShadow position={[0, 0.25, 0]}>
        <capsuleGeometry args={[0.15, 0.4, 4, 8]} />
        <meshStandardMaterial
          color={baseColor}
          emissive={emissive}
          emissiveIntensity={emissiveIntensity}
          roughness={0.9}
        />
      </mesh>
      <mesh castShadow position={[0.3, 0.25, 0]}>
        <sphereGeometry args={[0.12, 8, 8]} />
        <meshStandardMaterial
          color={baseColor}
          emissive={emissive}
          emissiveIntensity={emissiveIntensity}
          roughness={0.9}
        />
      </mesh>
      <mesh position={[0.35, 0.28, 0.08]}>
        <sphereGeometry args={[0.04]} />
        <meshStandardMaterial color="#1a1a1a" />
      </mesh>
      <mesh position={[0.35, 0.28, -0.08]}>
        <sphereGeometry args={[0.04]} />
        <meshStandardMaterial color="#1a1a1a" />
      </mesh>
      <mesh castShadow position={[-0.35, 0.2, 0]} rotation={[0, 0, 0.3]}>
        <cylinderGeometry args={[0.02, 0.01, 0.3, 8]} />
        <meshStandardMaterial color="#8b7355" roughness={0.9} />
      </mesh>
      <mesh castShadow position={[-0.35, 0.2, 0]} rotation={[0, 0, -0.3]}>
        <cylinderGeometry args={[0.02, 0.01, 0.3, 8]} />
        <meshStandardMaterial color="#8b7355" roughness={0.9} />
      </mesh>
    </group>
  )
}

function Skeleton({ isHit, isHovered }: { isHit: boolean; isHovered: boolean }): JSX.Element {
  const baseColor = isHit ? '#ff6666' : '#e8e8e0'
  const emissive = isHovered ? '#ffff00' : '#000000'
  const emissiveIntensity = isHovered ? 0.5 : 0

  return (
    <group>
      <mesh castShadow position={[0, 0.8, 0]}>
        <boxGeometry args={[0.3, 0.8, 0.2]} />
        <meshStandardMaterial
          color={baseColor}
          emissive={emissive}
          emissiveIntensity={emissiveIntensity}
          roughness={0.8}
        />
      </mesh>
      <mesh castShadow position={[0, 1.4, 0]}>
        <boxGeometry args={[0.25, 0.25, 0.25]} />
        <meshStandardMaterial
          color={baseColor}
          emissive={emissive}
          emissiveIntensity={emissiveIntensity}
          roughness={0.8}
        />
      </mesh>
      <mesh position={[-0.06, 1.42, 0.13]}>
        <sphereGeometry args={[0.04]} />
        <meshStandardMaterial color="#1a1a1a" />
      </mesh>
      <mesh position={[0.06, 1.42, 0.13]}>
        <sphereGeometry args={[0.04]} />
        <meshStandardMaterial color="#1a1a1a" />
      </mesh>
      <mesh castShadow position={[-0.25, 0.8, 0]} rotation={[0, 0, 0.5]}>
        <boxGeometry args={[0.08, 0.5, 0.08]} />
        <meshStandardMaterial
          color={baseColor}
          emissive={emissive}
          emissiveIntensity={emissiveIntensity}
          roughness={0.8}
        />
      </mesh>
      <mesh castShadow position={[0.25, 0.8, 0]} rotation={[0, 0, -0.5]}>
        <boxGeometry args={[0.08, 0.5, 0.08]} />
        <meshStandardMaterial
          color={baseColor}
          emissive={emissive}
          emissiveIntensity={emissiveIntensity}
          roughness={0.8}
        />
      </mesh>
      <mesh castShadow position={[-0.1, 0.2, 0]}>
        <boxGeometry args={[0.1, 0.4, 0.1]} />
        <meshStandardMaterial
          color={baseColor}
          emissive={emissive}
          emissiveIntensity={emissiveIntensity}
          roughness={0.8}
        />
      </mesh>
      <mesh castShadow position={[0.1, 0.2, 0]}>
        <boxGeometry args={[0.1, 0.4, 0.1]} />
        <meshStandardMaterial
          color={baseColor}
          emissive={emissive}
          emissiveIntensity={emissiveIntensity}
          roughness={0.8}
        />
      </mesh>
    </group>
  )
}

const MONSTER_MODELS: Record<
  MonsterType,
  (props: { isHit: boolean; isHovered: boolean }) => JSX.Element
> = {
  slime: Slime,
  rat: Rat,
  skeleton: Skeleton,
}

export default function Monster({ id }: MonsterProps) {
  const ref = useRef<RapierRigidBody>(null)
  const entity = useWorldStore((s) => s.entities[id])
  const position = entity?.components.position
  const monsterType = entity?.components.monster?.type ?? 'slime'
  const health = entity?.components.health
  const dead = health?.dead ?? false
  const [isHovered, setIsHovered] = useState(false)

  useEffect(() => {
    if (ref.current) {
      physicsBridge.register(id, ref.current)
      return () => physicsBridge.unregister(id)
    }
  }, [id])

  const handleClick = () => {
    const playerIds = Object.values(useWorldStore.getState().entities)
      .filter((e) => e.type === 'player')
      .map((e) => e.id)

    if (playerIds.length === 0) return

    const event: GameEvent = {
      type: 'INTERACT',
      timestamp: performance.now(),
      entityId: playerIds[0],
      targetId: id,
    }

    eventQueue.enqueue(event)
  }

  if (!position || dead) return null

  const MonsterModel = MONSTER_MODELS[monsterType]
  const isHit = false

  return (
    <RigidBody
      ref={ref}
      position={[position.x, position.y, position.z]}
      colliders={false}
      type="kinematicPosition"
      lockRotations
    >
      <group
        onClick={handleClick}
        onPointerOver={(e) => {
          e.stopPropagation()
          setIsHovered(true)
          document.body.style.cursor = 'pointer'
        }}
        onPointerOut={() => {
          setIsHovered(false)
          document.body.style.cursor = 'default'
        }}
      >
        <MonsterModel isHit={isHit} isHovered={isHovered} />
        {health && <HealthBar health={health.current} maxHealth={health.max} />}
      </group>
    </RigidBody>
  )
}
