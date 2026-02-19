import { useFrame } from '@react-three/fiber'
import { RigidBody, RapierRigidBody } from '@react-three/rapier'
import { useRef, useState } from 'react'
import * as THREE from 'three'

interface EnemyProps {
  position: [number, number, number]
  color?: string
  id?: string
}

export default function Enemy({ position, color = '#e74c3c', id }: EnemyProps) {
  const ref = useRef<RapierRigidBody>(null)
  const [hovered, setHovered] = useState(false)
  const materialRef = useRef<THREE.MeshStandardMaterial>(null)

  useFrame(() => {
    if (materialRef.current) {
      materialRef.current.emissiveIntensity = hovered ? 0.5 : 0.2
    }
  })

  return (
    <RigidBody ref={ref} position={position} type="dynamic" mass={0.5} key={id}>
      <mesh
        castShadow
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial
          ref={materialRef}
          color={color}
          metalness={0.4}
          roughness={0.6}
          emissive={color}
          emissiveIntensity={0.2}
        />
      </mesh>
      <mesh position={[0, 0.3, 0.35]}>
        <boxGeometry args={[0.15, 0.15, 0.1]} />
        <meshStandardMaterial color="#2c3e50" />
      </mesh>
      <mesh position={[0.25, 0.3, 0.35]}>
        <boxGeometry args={[0.15, 0.15, 0.1]} />
        <meshStandardMaterial color="#2c3e50" />
      </mesh>
    </RigidBody>
  )
}
