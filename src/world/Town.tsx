import { RigidBody } from '@react-three/rapier'

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

export { Cottage, Shop, Tower, FenceSection }
