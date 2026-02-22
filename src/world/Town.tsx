import { RigidBody } from '@react-three/rapier'

export function Cottage({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <RigidBody type="fixed" colliders="cuboid">
        <mesh castShadow position={[0, 1.2, 0]}>
          <boxGeometry args={[2.5, 2.4, 2]} />
          <meshStandardMaterial color="#8b7355" roughness={0.9} />
        </mesh>
      </RigidBody>
      <mesh castShadow position={[0, 3, 0]} rotation={[0, Math.PI / 4, 0]}>
        <coneGeometry args={[2, 1.5, 4]} />
        <meshStandardMaterial color="#5d4037" roughness={0.95} />
      </mesh>
      <mesh position={[0.8, 0.8, 1.01]}>
        <boxGeometry args={[0.6, 1.2, 0.1]} />
        <meshStandardMaterial color="#4a3728" />
      </mesh>
      <mesh position={[-0.5, 1.5, 1.01]}>
        <boxGeometry args={[0.5, 0.5, 0.1]} />
        <meshStandardMaterial color="#87ceeb" transparent opacity={0.7} />
      </mesh>
      <mesh position={[0.5, 1.5, 1.01]}>
        <boxGeometry args={[0.5, 0.5, 0.1]} />
        <meshStandardMaterial color="#87ceeb" transparent opacity={0.7} />
      </mesh>
    </group>
  )
}

export function Shop({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <RigidBody type="fixed" colliders="cuboid">
        <mesh castShadow position={[0, 1.5, 0]}>
          <boxGeometry args={[3, 3, 2.5]} />
          <meshStandardMaterial color="#6b5344" roughness={0.85} />
        </mesh>
      </RigidBody>
      <mesh castShadow position={[0, 3.8, 0]}>
        <boxGeometry args={[3.5, 0.5, 3]} />
        <meshStandardMaterial color="#5d4037" roughness={0.9} />
      </mesh>
      <mesh position={[0, 1, 1.26]}>
        <boxGeometry args={[1.2, 2, 0.1]} />
        <meshStandardMaterial color="#4a3728" />
      </mesh>
      <mesh position={[-1, 0.8, 1.26]}>
        <boxGeometry args={[0.8, 0.8, 0.1]} />
        <meshStandardMaterial color="#87ceeb" transparent opacity={0.6} />
      </mesh>
      <mesh position={[1, 0.8, 1.26]}>
        <boxGeometry args={[0.8, 0.8, 0.1]} />
        <meshStandardMaterial color="#87ceeb" transparent opacity={0.6} />
      </mesh>
      <mesh castShadow position={[1.3, 2.2, 0]}>
        <boxGeometry args={[0.2, 0.4, 0.3]} />
        <meshStandardMaterial color="#8b4513" />
      </mesh>
    </group>
  )
}

export function Tower({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <RigidBody type="fixed" colliders="cuboid">
        <mesh castShadow position={[0, 3, 0]}>
          <cylinderGeometry args={[1.5, 2, 6, 8]} />
          <meshStandardMaterial color="#5a5a5a" roughness={0.8} />
        </mesh>
      </RigidBody>
      <mesh castShadow position={[0, 6.5, 0]}>
        <coneGeometry args={[2, 1.5, 8]} />
        <meshStandardMaterial color="#4a4a4a" roughness={0.85} />
      </mesh>
      <mesh position={[0, 5, 1.4]} rotation={[Math.PI / 6, 0, 0]}>
        <boxGeometry args={[0.3, 0.5, 0.1]} />
        <meshStandardMaterial color="#3a3a3a" />
      </mesh>
      <mesh position={[0, 4, 1.4]} rotation={[Math.PI / 6, 0, 0]}>
        <boxGeometry args={[0.3, 0.5, 0.1]} />
        <meshStandardMaterial color="#3a3a3a" />
      </mesh>
      <mesh position={[0, 3, 1.4]} rotation={[Math.PI / 6, 0, 0]}>
        <boxGeometry args={[0.3, 0.5, 0.1]} />
        <meshStandardMaterial color="#3a3a3a" />
      </mesh>
      <pointLight position={[0, 5.5, 0]} intensity={0.5} color="#ffaa44" distance={8} />
    </group>
  )
}

export function Fence({
  position,
  rotation = 0,
  length = 4,
}: {
  position: [number, number, number]
  rotation?: number
  length?: number
}) {
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      {Array.from({ length: Math.floor(length) }).map((_, i) => (
        <group key={i} position={[(i - length / 2 + 0.5) * 1.2, 0, 0]}>
          <RigidBody type="fixed" colliders="cuboid" key={`rb-${i}`}>
            <mesh castShadow position={[0, 0.5, 0]}>
              <boxGeometry args={[0.1, 1, 0.1]} />
              <meshStandardMaterial color="#5d4037" roughness={0.95} />
            </mesh>
          </RigidBody>
        </group>
      ))}
      <mesh castShadow position={[0, 0.7, 0]}>
        <boxGeometry args={[length * 1.2, 0.1, 0.05]} />
        <meshStandardMaterial color="#5d4037" roughness={0.95} />
      </mesh>
      <mesh castShadow position={[0, 0.4, 0]}>
        <boxGeometry args={[length * 1.2, 0.1, 0.05]} />
        <meshStandardMaterial color="#5d4037" roughness={0.95} />
      </mesh>
    </group>
  )
}
