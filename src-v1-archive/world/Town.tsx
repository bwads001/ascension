import { RigidBody } from '@react-three/rapier'
import { useRef, useState } from 'react'
import { Mesh } from 'three'

import { usePlayerStore } from '../store/playerStore'

function Well({ position }: { position: [number, number, number] }) {
  const [hovered, setHovered] = useState(false)
  const heal = usePlayerStore((state) => state.heal)
  const health = usePlayerStore((state) => state.health)
  const maxHealth = usePlayerStore((state) => state.maxHealth)
  const meshRef = useRef<Mesh>(null)

  const handleClick = () => {
    if (health < maxHealth) {
      heal(maxHealth)
    }
  }

  return (
    <group position={position}>
      <mesh
        ref={meshRef}
        castShadow
        receiveShadow
        onClick={handleClick}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
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
      {hovered && (
        <mesh position={[0, 1.5, 0]}>
          <cylinderGeometry args={[0.3, 0.1, 0.4, 8]} />
          <meshStandardMaterial color="#ffffff" transparent opacity={0.3} />
        </mesh>
      )}
    </group>
  )
}

function Cottage({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <RigidBody type="fixed" colliders="cuboid">
        <mesh castShadow receiveShadow position={[0, 1, 0]}>
          <boxGeometry args={[3, 2, 3]} />
          <meshStandardMaterial color="#8b7355" roughness={0.9} />
        </mesh>
        <mesh castShadow position={[0, 2.5, 0]}>
          <coneGeometry args={[2.5, 1.5, 4]} />
          <meshStandardMaterial color="#5d4e37" roughness={0.95} />
        </mesh>
        <mesh position={[0, 0.6, 1.51]}>
          <boxGeometry args={[0.8, 1.2, 0.1]} />
          <meshStandardMaterial color="#3d2817" />
        </mesh>
        <mesh position={[-0.7, 1.3, 1.51]}>
          <boxGeometry args={[0.5, 0.5, 0.1]} />
          <meshStandardMaterial color="#87ceeb" metalness={0.1} roughness={0.3} />
        </mesh>
        <mesh position={[0.7, 1.3, 1.51]}>
          <boxGeometry args={[0.5, 0.5, 0.1]} />
          <meshStandardMaterial color="#87ceeb" metalness={0.1} roughness={0.3} />
        </mesh>
      </RigidBody>
    </group>
  )
}

function Shop({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <RigidBody type="fixed" colliders="cuboid">
        <mesh castShadow receiveShadow position={[0, 1.5, 0]}>
          <boxGeometry args={[4, 3, 3]} />
          <meshStandardMaterial color="#6b5344" roughness={0.85} />
        </mesh>
        <mesh castShadow position={[0, 3.5, 0]}>
          <boxGeometry args={[4.5, 0.8, 3.5]} />
          <meshStandardMaterial color="#4a3728" roughness={0.9} />
        </mesh>
        <mesh castShadow position={[0, 4.2, 0]}>
          <coneGeometry args={[3.5, 1.5, 4]} />
          <meshStandardMaterial color="#5d4e37" roughness={0.95} />
        </mesh>
        <mesh position={[0, 0.8, 1.51]}>
          <boxGeometry args={[1.2, 1.6, 0.1]} />
          <meshStandardMaterial color="#3d2817" />
        </mesh>
        <mesh position={[0, 1.2, 1.55]}>
          <boxGeometry args={[1.4, 0.1, 0.15]} />
          <meshStandardMaterial color="#d4af37" metalness={0.6} roughness={0.4} />
        </mesh>
        <mesh position={[-1.2, 1.5, 1.51]}>
          <boxGeometry args={[0.8, 0.8, 0.1]} />
          <meshStandardMaterial color="#87ceeb" metalness={0.1} roughness={0.3} />
        </mesh>
        <mesh position={[1.2, 1.5, 1.51]}>
          <boxGeometry args={[0.8, 0.8, 0.1]} />
          <meshStandardMaterial color="#87ceeb" metalness={0.1} roughness={0.3} />
        </mesh>
        <mesh position={[2.01, 2, 0]} rotation={[0, Math.PI / 2, 0]}>
          <cylinderGeometry args={[0.8, 0.8, 1, 16]} />
          <meshStandardMaterial color="#d4af37" metalness={0.3} roughness={0.5} />
        </mesh>
      </RigidBody>
    </group>
  )
}

function Tower({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <RigidBody type="fixed" colliders="cuboid">
        <mesh castShadow receiveShadow position={[0, 3, 0]}>
          <cylinderGeometry args={[1.5, 1.8, 6, 8]} />
          <meshStandardMaterial color="#5a5a5a" roughness={0.8} />
        </mesh>
        <mesh castShadow position={[0, 6.5, 0]}>
          <coneGeometry args={[2, 1.5, 8]} />
          <meshStandardMaterial color="#3d5c5c" roughness={0.9} />
        </mesh>
        <mesh position={[0, 0.8, 1.51]}>
          <boxGeometry args={[0.8, 1.2, 0.1]} />
          <meshStandardMaterial color="#4a3728" />
        </mesh>
        {[0, 1, 2, 3].map((i) => (
          <mesh key={i} position={[0, 2 + i * 1.5, 1.6]}>
            <boxGeometry args={[0.4, 0.6, 0.1]} />
            <meshStandardMaterial color="#87ceeb" metalness={0.1} roughness={0.3} />
          </mesh>
        ))}
      </RigidBody>
    </group>
  )
}

function FencePost({ position }: { position: [number, number, number] }) {
  return (
    <RigidBody type="fixed" colliders="cuboid">
      <mesh castShadow position={position}>
        <boxGeometry args={[0.2, 1, 0.2]} />
        <meshStandardMaterial color="#5d4e37" roughness={0.95} />
      </mesh>
    </RigidBody>
  )
}

function FenceRail({
  start,
  end,
}: {
  start: [number, number, number]
  end: [number, number, number]
}) {
  const dx = end[0] - start[0]
  const dz = end[2] - start[2]
  const length = Math.sqrt(dx * dx + dz * dz)
  const angle = Math.atan2(dz, dx)

  return (
    <RigidBody type="fixed" colliders="cuboid">
      <mesh
        castShadow
        position={[(start[0] + end[0]) / 2, 0.6, (start[2] + end[2]) / 2]}
        rotation={[0, -angle, 0]}
      >
        <boxGeometry args={[length, 0.1, 0.08]} />
        <meshStandardMaterial color="#6b5b4a" roughness={0.9} />
      </mesh>
      <mesh
        castShadow
        position={[(start[0] + end[0]) / 2, 0.3, (start[2] + end[2]) / 2]}
        rotation={[0, -angle, 0]}
      >
        <boxGeometry args={[length, 0.1, 0.08]} />
        <meshStandardMaterial color="#6b5b4a" roughness={0.9} />
      </mesh>
    </RigidBody>
  )
}

function FenceSection({
  start,
  end,
  gap = false,
}: {
  start: [number, number, number]
  end: [number, number, number]
  gap?: boolean
}) {
  const dx = end[0] - start[0]
  const dz = end[2] - start[2]
  const length = Math.sqrt(dx * dx + dz * dz)
  const posts = gap ? 2 : Math.floor(length / 1.5) + 1

  const postPositions: [number, number, number][] = []
  for (let i = 0; i < posts; i++) {
    const t = i / (posts - 1)
    postPositions.push([start[0] + dx * t, 0.5, start[2] + dz * t])
  }

  return (
    <group>
      {postPositions.map((pos, i) => (
        <FencePost key={i} position={pos} />
      ))}
      {!gap && <FenceRail start={start} end={end} />}
    </group>
  )
}

export default function Town() {
  const fenceRadius = 12
  const gateAngle = 0

  const fencePoints: [number, number, number][] = []
  const numPosts = 16
  for (let i = 0; i < numPosts; i++) {
    const angle = (i / numPosts) * Math.PI * 2
    fencePoints.push([Math.cos(angle) * fenceRadius, 0, Math.sin(angle) * fenceRadius])
  }

  return (
    <group>
      <Cottage position={[-4, 0, -2]} />
      <Shop position={[4, 0, -3]} />
      <Tower position={[0, 0, 5]} />
      <Well position={[-2, 0, 4]} />

      {fencePoints.map((start, i) => {
        const end = fencePoints[(i + 1) % numPosts]
        const midAngle = ((i + 0.5) / numPosts) * Math.PI * 2
        const isGate =
          Math.abs(midAngle - gateAngle) < 0.3 || Math.abs(midAngle - gateAngle - Math.PI * 2) < 0.3

        return <FenceSection key={i} start={start} end={end} gap={isGate} />
      })}
    </group>
  )
}
