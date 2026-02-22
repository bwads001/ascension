import { RigidBody } from '@react-three/rapier'

function GrassTuft({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh castShadow position={[0, 0.15, 0]}>
        <coneGeometry args={[0.1, 0.4, 4]} />
        <meshStandardMaterial color="#4a7c4a" roughness={0.9} />
      </mesh>
      <mesh castShadow position={[0.08, 0.1, 0.05]} rotation={[0, 0.3, 0.1]}>
        <coneGeometry args={[0.08, 0.3, 4]} />
        <meshStandardMaterial color="#3d6b3d" roughness={0.9} />
      </mesh>
      <mesh castShadow position={[-0.06, 0.12, -0.04]} rotation={[0, -0.4, -0.1]}>
        <coneGeometry args={[0.07, 0.28, 4]} />
        <meshStandardMaterial color="#5a8a5a" roughness={0.9} />
      </mesh>
    </group>
  )
}

function Rock({ position, scale = 1 }: { position: [number, number, number]; scale?: number }) {
  return (
    <RigidBody type="fixed" colliders="cuboid">
      <mesh castShadow receiveShadow position={position} scale={scale}>
        <dodecahedronGeometry args={[0.5, 0]} />
        <meshStandardMaterial color="#6b6b6b" roughness={0.95} metalness={0.1} />
      </mesh>
    </RigidBody>
  )
}

function Path({
  position,
  rotation = 0,
  width = 2,
}: {
  position: [number, number, number]
  rotation?: number
  width?: number
}) {
  return (
    <mesh receiveShadow position={position} rotation={[0, rotation, 0]}>
      <boxGeometry args={[width, 0.02, 1]} />
      <meshStandardMaterial color="#5d4e37" roughness={0.95} />
    </mesh>
  )
}

function Tree({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <RigidBody type="fixed" colliders="cuboid">
        <mesh castShadow position={[0, 1, 0]}>
          <cylinderGeometry args={[0.3, 0.4, 2, 8]} />
          <meshStandardMaterial color="#5d4037" roughness={0.95} />
        </mesh>
      </RigidBody>
      <mesh castShadow position={[0, 2.5, 0]}>
        <coneGeometry args={[1.2, 2, 8]} />
        <meshStandardMaterial color="#2d5a27" roughness={0.9} />
      </mesh>
      <mesh castShadow position={[0, 3.5, 0]}>
        <coneGeometry args={[0.9, 1.5, 8]} />
        <meshStandardMaterial color="#3d6b3d" roughness={0.9} />
      </mesh>
    </group>
  )
}

const TOWN_RADIUS = 12
const FIELD_RADIUS = 28

export function isInTown(x: number, z: number): boolean {
  return Math.sqrt(x * x + z * z) < TOWN_RADIUS
}

export { TOWN_RADIUS, FIELD_RADIUS }

function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5)
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const WILDERNESS_SEED = 12345

const grassTufts: [number, number, number][] = []
const rocks: { pos: [number, number, number]; scale: number }[] = []
const trees: [number, number, number][] = []
const paths: { pos: [number, number, number]; rot: number; width: number }[] = []

;(function generateGrass() {
  let rand = mulberry32(WILDERNESS_SEED + 1)
  for (let i = 0; i < 200; i++) {
    const angle = rand() * Math.PI * 2
    const radius = TOWN_RADIUS + 2 + rand() * (FIELD_RADIUS - TOWN_RADIUS - 2)
    const x = Math.cos(angle) * radius
    const z = Math.sin(angle) * radius

    if (!isInTown(x, z)) {
      grassTufts.push([x, 0, z])
    }
  }
})()

;(function generateEasternFieldGrass() {
  let rand = mulberry32(WILDERNESS_SEED + 10)
  for (let i = 0; i < 100; i++) {
    const x = 58 + rand() * 32
    const z = -20 + rand() * 40
    grassTufts.push([x, 0, z])
  }
})()

;(function generateRocks() {
  let rand = mulberry32(WILDERNESS_SEED + 2)
  for (let i = 0; i < 15; i++) {
    const angle = rand() * Math.PI * 2
    const radius = TOWN_RADIUS + 5 + rand() * (FIELD_RADIUS - TOWN_RADIUS - 8)
    const x = Math.cos(angle) * radius
    const z = Math.sin(angle) * radius

    if (!isInTown(x, z)) {
      rocks.push({ pos: [x, 0.3, z], scale: 0.5 + rand() * 1.5 })
    }
  }
})()

;(function generateEasternFieldRocks() {
  let rand = mulberry32(WILDERNESS_SEED + 11)
  for (let i = 0; i < 8; i++) {
    const x = 60 + rand() * 28
    const z = -18 + rand() * 36
    rocks.push({ pos: [x, 0.3, z], scale: 0.5 + rand() * 1.5 })
  }
})()

;(function generateTrees() {
  let rand = mulberry32(WILDERNESS_SEED + 3)
  for (let i = 0; i < 8; i++) {
    const angle = rand() * Math.PI * 2
    const radius = TOWN_RADIUS + 8 + rand() * (FIELD_RADIUS - TOWN_RADIUS - 10)
    const x = Math.cos(angle) * radius
    const z = Math.sin(angle) * radius

    if (!isInTown(x, z)) {
      trees.push([x, 0, z])
    }
  }
})()

;(function generateEasternFieldTrees() {
  let rand = mulberry32(WILDERNESS_SEED + 12)
  for (let i = 0; i < 6; i++) {
    const x = 62 + rand() * 24
    const z = -16 + rand() * 32
    trees.push([x, 0, z])
  }
})()

;(function generateNorthernPath() {
  for (let i = 0; i < 8; i++) {
    const z = 14 + i * 4
    paths.push({ pos: [0, 0.01, z], rot: 0, width: 2 })
  }
})()

;(function generateEasternPath() {
  for (let i = 0; i < 10; i++) {
    const x = 28 + i * 4
    paths.push({ pos: [x, 0.01, 0], rot: Math.PI / 2, width: 6 })
  }
})()

export default function Wilderness() {
  return (
    <group>
      {grassTufts.map((pos, i) => (
        <GrassTuft key={`grass-${i}`} position={pos} />
      ))}
      {rocks.map((rock, i) => (
        <Rock key={`rock-${i}`} position={rock.pos} scale={rock.scale} />
      ))}
      {trees.map((pos, i) => (
        <Tree key={`tree-${i}`} position={pos} />
      ))}
      {paths.map((path, i) => (
        <Path key={`path-${i}`} position={path.pos} rotation={path.rot} width={path.width} />
      ))}
    </group>
  )
}
