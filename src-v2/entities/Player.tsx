import { RigidBody, CuboidCollider, RapierRigidBody } from '@react-three/rapier'
import { useEffect, useRef } from 'react'
import type { JSX } from 'react'

import { physicsBridge } from '../bridge'
import { useWorldStore } from '../store'
import type { PlayerClass } from '../types'

interface PlayerProps {
  id: string
}

function Warrior(): JSX.Element {
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
    </group>
  )
}

function Archer(): JSX.Element {
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
      <mesh castShadow position={[0.35, 0.9, -0.1]} rotation={[0, 0, -0.3]}>
        <boxGeometry args={[0.05, 0.8, 0.03]} />
        <meshStandardMaterial color="#8b4513" roughness={0.9} />
      </mesh>
      <mesh castShadow position={[0.35, 0.9, -0.1]} rotation={[0, 0, -0.3]}>
        <boxGeometry args={[0.5, 0.03, 0.03]} />
        <meshStandardMaterial color="#f5f5dc" roughness={0.6} />
      </mesh>
    </group>
  )
}

function Mage(): JSX.Element {
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
      <mesh castShadow position={[0.5, 0.9, 0]}>
        <cylinderGeometry args={[0.03, 0.03, 1.2, 8]} />
        <meshStandardMaterial color="#8b4513" roughness={0.8} />
      </mesh>
      <mesh castShadow position={[0.5, 1.5, 0]}>
        <sphereGeometry args={[0.12, 16, 16]} />
        <meshStandardMaterial color="#00ffff" emissive="#00ffff" emissiveIntensity={0.8} />
      </mesh>
      <pointLight position={[0.5, 1.5, 0]} intensity={0.3} color="#00ffff" distance={2} />
    </group>
  )
}

const CLASS_MODELS: Record<PlayerClass, () => JSX.Element> = {
  warrior: Warrior,
  archer: Archer,
  mage: Mage,
}

export default function Player({ id }: PlayerProps) {
  const ref = useRef<RapierRigidBody>(null)
  const entity = useWorldStore((s) => s.entities[id])
  const position = entity?.components.position
  const playerClass = entity?.components.player?.class ?? 'warrior'
  const dead = entity?.components.health?.dead ?? false

  useEffect(() => {
    if (ref.current) {
      physicsBridge.register(id, ref.current)
      return () => physicsBridge.unregister(id)
    }
  }, [id])

  if (!position || dead) return null

  const CharacterModel = CLASS_MODELS[playerClass]

  return (
    <RigidBody
      ref={ref}
      position={[position.x, position.y, position.z]}
      colliders={false}
      type="kinematicPosition"
      lockRotations
    >
      <CuboidCollider args={[0.4, 1, 0.4]} position={[0, 1, 0]} />
      <CharacterModel />
    </RigidBody>
  )
}
