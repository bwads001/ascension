import { RigidBody } from '@react-three/rapier'

interface RoomConfig {
  x: number
  z: number
  width: number
  depth: number
}

function Wall({
  position,
  width,
  height,
  depth,
}: {
  position: [number, number, number]
  width: number
  height: number
  depth: number
}) {
  return (
    <RigidBody type="fixed" colliders="cuboid">
      <mesh castShadow receiveShadow position={position}>
        <boxGeometry args={[width, height, depth]} />
        <meshStandardMaterial color="#3a3a4a" roughness={0.9} />
      </mesh>
    </RigidBody>
  )
}

function Floor({ width, depth }: { width: number; depth: number }) {
  return (
    <RigidBody type="fixed" colliders="cuboid">
      <mesh receiveShadow position={[0, -0.5, 0]}>
        <boxGeometry args={[width, 1, depth]} />
        <meshStandardMaterial color="#2a2a3a" roughness={0.95} />
      </mesh>
      {[...Array(Math.floor(width / 3))].map((_, i) =>
        [...Array(Math.floor(depth / 3))].map((_row, j) => (
          <mesh
            key={`tile-${i}-${j}`}
            receiveShadow
            position={[(i - width / 6 + 0.5) * 3, -0.49, (j - depth / 6 + 0.5) * 3]}
          >
            <boxGeometry args={[2.9, 0.02, 2.9]} />
            <meshStandardMaterial color={(i + j) % 2 === 0 ? '#3a3a4a' : '#2a2a3a'} />
          </mesh>
        ))
      )}
    </RigidBody>
  )
}

function generateDungeon(floor: number): RoomConfig[] {
  const rooms: RoomConfig[] = []
  const numRooms = 3 + Math.floor(floor / 2)
  const baseSize = 12

  for (let i = 0; i < numRooms; i++) {
    const roomWidth = baseSize + Math.floor(Math.random() * 6)
    const roomDepth = baseSize + Math.floor(Math.random() * 6)

    let x = 0
    let z = 0

    if (i > 0) {
      const prevRoom = rooms[i - 1]
      const direction = Math.random() < 0.5 ? 1 : -1
      if (Math.random() < 0.5) {
        x = prevRoom.x + direction * (prevRoom.width / 2 + roomWidth / 2 + 4)
        z = prevRoom.z
      } else {
        x = prevRoom.x
        z = prevRoom.z + direction * (prevRoom.depth / 2 + roomDepth / 2 + 4)
      }
    }

    rooms.push({ x, z, width: roomWidth, depth: roomDepth })
  }

  return rooms
}

function Room({ config }: { config: RoomConfig }) {
  const { x, z, width, depth } = config
  const wallHeight = 4
  const wallThickness = 0.5

  return (
    <group position={[x, 0, z]}>
      <Floor width={width} depth={depth} />

      <Wall
        position={[0, wallHeight / 2, -depth / 2]}
        width={width}
        height={wallHeight}
        depth={wallThickness}
      />
      <Wall
        position={[0, wallHeight / 2, depth / 2]}
        width={width}
        height={wallHeight}
        depth={wallThickness}
      />
      <Wall
        position={[-width / 2, wallHeight / 2, 0]}
        width={wallThickness}
        height={wallHeight}
        depth={depth}
      />
      <Wall
        position={[width / 2, wallHeight / 2, 0]}
        width={wallThickness}
        height={wallHeight}
        depth={depth}
      />
    </group>
  )
}

function Corridor({ from, to }: { from: RoomConfig; to: RoomConfig }) {
  const dx = to.x - from.x
  const dz = to.z - from.z
  const distance = Math.sqrt(dx * dx + dz * dz)

  if (distance < 1) return null

  const corridorWidth = 3

  const isHorizontal = Math.abs(dx) > Math.abs(dz)

  if (isHorizontal) {
    const corridorLength = Math.abs(dx) - from.width / 2 - to.width / 2
    if (corridorLength <= 0) return null

    const centerX =
      from.x + (dx > 0 ? from.width / 2 : -from.width / 2) + (corridorLength / 2) * Math.sign(dx)

    return (
      <group>
        <RigidBody type="fixed" colliders="cuboid">
          <mesh receiveShadow position={[centerX, -0.5, from.z]}>
            <boxGeometry args={[corridorLength, 1, corridorWidth]} />
            <meshStandardMaterial color="#2a2a3a" roughness={0.95} />
          </mesh>
        </RigidBody>
      </group>
    )
  } else {
    const corridorLength = Math.abs(dz) - from.depth / 2 - to.depth / 2
    if (corridorLength <= 0) return null

    const centerZ =
      from.z + (dz > 0 ? from.depth / 2 : -from.depth / 2) + (corridorLength / 2) * Math.sign(dz)

    return (
      <group>
        <RigidBody type="fixed" colliders="cuboid">
          <mesh receiveShadow position={[from.x, -0.5, centerZ]}>
            <boxGeometry args={[corridorWidth, 1, corridorLength]} />
            <meshStandardMaterial color="#2a2a3a" roughness={0.95} />
          </mesh>
        </RigidBody>
      </group>
    )
  }
}

function ExitPortal({
  position,
  onExit,
}: {
  position: [number, number, number]
  onExit: () => void
}) {
  return (
    <group position={position} onClick={onExit}>
      <RigidBody type="fixed" colliders="cuboid">
        <mesh position={[0, 0.05, 0]}>
          <cylinderGeometry args={[1.5, 1.5, 0.1, 16]} />
          <meshStandardMaterial
            color="#4a6aff"
            emissive="#4a6aff"
            emissiveIntensity={0.5}
            transparent
            opacity={0.7}
          />
        </mesh>
      </RigidBody>
      <pointLight position={[0, 1, 0]} intensity={1} color="#4a6aff" distance={5} />
    </group>
  )
}

interface FloorDungeonProps {
  floor: number
  onExit: () => void
}

export default function FloorDungeon({ floor, onExit }: FloorDungeonProps) {
  const rooms = generateDungeon(floor)
  const lastRoom = rooms[rooms.length - 1]
  const exitPosition: [number, number, number] = [lastRoom.x, 0, lastRoom.z]

  return (
    <group>
      {rooms.map((room, i) => (
        <Room key={i} config={room} />
      ))}
      {rooms.slice(0, -1).map((room, i) => (
        <Corridor key={`corridor-${i}`} from={room} to={rooms[i + 1]} />
      ))}
      <ExitPortal position={exitPosition} onExit={onExit} />
    </group>
  )
}

export { generateDungeon }
