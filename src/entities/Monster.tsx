import { useFrame } from '@react-three/fiber'
import { RigidBody, RapierRigidBody } from '@react-three/rapier'
import { useRef, useState, useEffect } from 'react'
import { Vector3, Mesh } from 'three'

import { isInTown, TOWN_RADIUS } from '../world/Wilderness'

type MonsterType = 'slime' | 'rat' | 'skeleton'

interface MonsterProps {
  type: MonsterType
  position: [number, number, number]
}

const SPEEDS: Record<MonsterType, number> = {
  slime: 1.5,
  rat: 3,
  skeleton: 2,
}

function Slime({ color = '#5a9a5a' }: { color?: string }) {
  const meshRef = useRef<Mesh>(null)

  useFrame((state) => {
    if (meshRef.current) {
      const scale = 1 + Math.sin(state.clock.elapsedTime * 3) * 0.1
      meshRef.current.scale.setScalar(scale)
    }
  })

  return (
    <group>
      <mesh ref={meshRef} castShadow position={[0, 0.4, 0]}>
        <sphereGeometry args={[0.4, 16, 12]} />
        <meshStandardMaterial color={color} roughness={0.3} metalness={0.1} />
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

function Rat() {
  return (
    <group>
      <mesh castShadow position={[0, 0.25, 0]}>
        <capsuleGeometry args={[0.15, 0.4, 4, 8]} />
        <meshStandardMaterial color="#5c4a3d" roughness={0.9} />
      </mesh>
      <mesh castShadow position={[0.3, 0.25, 0]}>
        <sphereGeometry args={[0.12, 8, 8]} />
        <meshStandardMaterial color="#5c4a3d" roughness={0.9} />
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

function Skeleton() {
  return (
    <group>
      <mesh castShadow position={[0, 0.8, 0]}>
        <boxGeometry args={[0.3, 0.8, 0.2]} />
        <meshStandardMaterial color="#e8e8e0" roughness={0.8} />
      </mesh>
      <mesh castShadow position={[0, 1.4, 0]}>
        <boxGeometry args={[0.25, 0.25, 0.25]} />
        <meshStandardMaterial color="#e8e8e0" roughness={0.8} />
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
        <meshStandardMaterial color="#e8e8e0" roughness={0.8} />
      </mesh>
      <mesh castShadow position={[0.25, 0.8, 0]} rotation={[0, 0, -0.5]}>
        <boxGeometry args={[0.08, 0.5, 0.08]} />
        <meshStandardMaterial color="#e8e8e0" roughness={0.8} />
      </mesh>
      <mesh castShadow position={[-0.1, 0.2, 0]}>
        <boxGeometry args={[0.1, 0.4, 0.1]} />
        <meshStandardMaterial color="#e8e8e0" roughness={0.8} />
      </mesh>
      <mesh castShadow position={[0.1, 0.2, 0]}>
        <boxGeometry args={[0.1, 0.4, 0.1]} />
        <meshStandardMaterial color="#e8e8e0" roughness={0.8} />
      </mesh>
    </group>
  )
}

const MONSTERS: Record<MonsterType, React.FC> = {
  slime: Slime,
  rat: Rat,
  skeleton: Skeleton,
}

export default function Monster({ type, position }: MonsterProps) {
  const ref = useRef<RapierRigidBody>(null)
  const [wanderTarget, setWanderTarget] = useState<Vector3>(new Vector3(...position))

  const MonsterMesh = MONSTERS[type]
  const speed = SPEEDS[type]

  useEffect(() => {
    const interval = setInterval(
      () => {
        if (ref.current) {
          const currentPos = ref.current.translation()
          const offsetX = (Math.random() - 0.5) * 8
          const offsetZ = (Math.random() - 0.5) * 8
          let newX = currentPos.x + offsetX
          let newZ = currentPos.z + offsetZ

          if (isInTown(newX, newZ)) {
            const angle = Math.atan2(newZ, newX)
            newX = Math.cos(angle) * (TOWN_RADIUS + 3)
            newZ = Math.sin(angle) * (TOWN_RADIUS + 3)
          }

          setWanderTarget(new Vector3(newX, 0, newZ))
        }
      },
      2000 + Math.random() * 3000
    )

    return () => clearInterval(interval)
  }, [])

  useFrame((_, delta) => {
    if (!ref.current) return

    const currentPos = ref.current.translation()
    const current = new Vector3(currentPos.x, currentPos.y, currentPos.z)

    const direction = wanderTarget.clone().sub(current)
    const distance = direction.length()

    if (distance > 0.5) {
      direction.normalize()
      const newPos = current.clone().add(direction.multiplyScalar(speed * delta))

      if (isInTown(newPos.x, newPos.z)) {
        const angle = Math.atan2(newPos.z, newPos.x)
        newPos.x = Math.cos(angle) * (TOWN_RADIUS + 1)
        newPos.z = Math.sin(angle) * (TOWN_RADIUS + 1)
      }

      ref.current.setTranslation({ x: newPos.x, y: newPos.y, z: newPos.z }, true)
    }
  })

  return (
    <RigidBody
      ref={ref}
      position={position}
      colliders={false}
      type="kinematicPosition"
      lockRotations
    >
      <MonsterMesh />
    </RigidBody>
  )
}

export type { MonsterType }
