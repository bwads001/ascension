import type { ThreeEvent } from '@react-three/fiber'
import { RigidBody } from '@react-three/rapier'
import { useEffect } from 'react'

import { eventQueue } from '../engine/EventQueue'
import { useCharacterStore, useWorldStore } from '../store'
import type { GameEvent, RoomBounds } from '../types'

interface RoomConfig {
  x: number
  z: number
  width: number
  depth: number
}

function WallWithDoorway({
  position,
  width,
  height,
  depth,
  doorwayWidth = 3,
}: {
  position: [number, number, number]
  width: number
  height: number
  depth: number
  doorwayWidth?: number
}) {
  const [px, py, pz] = position
  const sideWidth = (width - doorwayWidth) / 2

  return (
    <group>
      <RigidBody type="fixed" colliders="cuboid">
        <mesh castShadow receiveShadow position={[px - (width - sideWidth) / 2, py, pz]}>
          <boxGeometry args={[sideWidth, height, depth]} />
          <meshStandardMaterial color="#3a3a4a" roughness={0.9} />
        </mesh>
      </RigidBody>
      <RigidBody type="fixed" colliders="cuboid">
        <mesh castShadow receiveShadow position={[px + (width - sideWidth) / 2, py, pz]}>
          <boxGeometry args={[sideWidth, height, depth]} />
          <meshStandardMaterial color="#3a3a4a" roughness={0.9} />
        </mesh>
      </RigidBody>
    </group>
  )
}

function WallDepthWithDoorway({
  position,
  width,
  height,
  depth,
  doorwayWidth = 3,
}: {
  position: [number, number, number]
  width: number
  height: number
  depth: number
  doorwayWidth?: number
}) {
  const [px, py, pz] = position
  const sideDepth = (depth - doorwayWidth) / 2

  return (
    <group>
      <RigidBody type="fixed" colliders="cuboid">
        <mesh castShadow receiveShadow position={[px, py, pz - (depth - sideDepth) / 2]}>
          <boxGeometry args={[width, height, sideDepth]} />
          <meshStandardMaterial color="#3a3a4a" roughness={0.9} />
        </mesh>
      </RigidBody>
      <RigidBody type="fixed" colliders="cuboid">
        <mesh castShadow receiveShadow position={[px, py, pz + (depth - sideDepth) / 2]}>
          <boxGeometry args={[width, height, sideDepth]} />
          <meshStandardMaterial color="#3a3a4a" roughness={0.9} />
        </mesh>
      </RigidBody>
    </group>
  )
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

function DungeonFloor({ width, depth }: { width: number; depth: number }) {
  const currentCharacterId = useCharacterStore((s) => s.currentCharacterId)

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    if (!currentCharacterId) return

    e.stopPropagation()
    const point = e.point

    const event: GameEvent = {
      type: 'MOVE_TO',
      timestamp: performance.now(),
      entityId: currentCharacterId,
      target: [point.x, 0, point.z],
    }

    eventQueue.enqueue(event)
  }

  return (
    <RigidBody type="fixed" colliders="cuboid">
      <mesh receiveShadow position={[0, -0.5, 0]} onClick={handleClick}>
        <boxGeometry args={[width, 1, depth]} />
        <meshStandardMaterial color="#2a2a3a" roughness={0.95} />
      </mesh>
      {[...Array(Math.floor(width / 3))].map((_, i) =>
        [...Array(Math.floor(depth / 3))].map((_row, j) => (
          <mesh
            key={`tile-${i}-${j}`}
            receiveShadow
            position={[(i - width / 6 + 0.5) * 3, -0.49, (j - depth / 6 + 0.5) * 3]}
            onClick={handleClick}
          >
            <boxGeometry args={[2.9, 0.02, 2.9]} />
            <meshStandardMaterial color={(i + j) % 2 === 0 ? '#3a3a4a' : '#2a2a3a'} />
          </mesh>
        ))
      )}
    </RigidBody>
  )
}

function Torch({
  position,
  castShadow = false,
}: {
  position: [number, number, number]
  castShadow?: boolean
}) {
  return (
    <group position={position}>
      <mesh castShadow>
        <cylinderGeometry args={[0.05, 0.08, 0.4, 8]} />
        <meshStandardMaterial color="#4a3a2a" roughness={0.9} />
      </mesh>
      <mesh position={[0, 0.3, 0]}>
        <sphereGeometry args={[0.1, 8, 8]} />
        <meshStandardMaterial color="#ff6600" emissive="#ff4400" emissiveIntensity={4} />
      </mesh>
      <pointLight
        position={[0, 0.5, 0]}
        intensity={15}
        distance={25}
        color="#ffaa55"
        castShadow={castShadow}
      />
    </group>
  )
}

function generateDungeon(floor: number): RoomConfig[] {
  const rooms: RoomConfig[] = []
  const numRooms = 5 + floor * 2
  const minSize = 14
  const maxSize = 26

  for (let i = 0; i < numRooms; i++) {
    const roomWidth = minSize + Math.floor(Math.random() * (maxSize - minSize))
    const roomDepth = minSize + Math.floor(Math.random() * (maxSize - minSize))

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

interface RoomConnections {
  north?: boolean
  south?: boolean
  east?: boolean
  west?: boolean
}

function Room({ config, connections }: { config: RoomConfig; connections: RoomConnections }) {
  const { x, z, width, depth } = config
  const wallHeight = 4
  const wallThickness = 0.5

  const torchPositions: [number, number, number][] = [
    [x - width / 2 + 2, 2.5, z - depth / 2 + 2],
    [x + width / 2 - 2, 2.5, z + depth / 2 - 2],
  ]

  return (
    <group position={[x, 0, z]}>
      <DungeonFloor width={width} depth={depth} />

      {connections.north ? (
        <WallWithDoorway
          position={[0, wallHeight / 2, -depth / 2]}
          width={width}
          height={wallHeight}
          depth={wallThickness}
        />
      ) : (
        <Wall
          position={[0, wallHeight / 2, -depth / 2]}
          width={width}
          height={wallHeight}
          depth={wallThickness}
        />
      )}

      {connections.south ? (
        <WallWithDoorway
          position={[0, wallHeight / 2, depth / 2]}
          width={width}
          height={wallHeight}
          depth={wallThickness}
        />
      ) : (
        <Wall
          position={[0, wallHeight / 2, depth / 2]}
          width={width}
          height={wallHeight}
          depth={wallThickness}
        />
      )}

      {connections.west ? (
        <WallDepthWithDoorway
          position={[-width / 2, wallHeight / 2, 0]}
          width={wallThickness}
          height={wallHeight}
          depth={depth}
        />
      ) : (
        <Wall
          position={[-width / 2, wallHeight / 2, 0]}
          width={wallThickness}
          height={wallHeight}
          depth={depth}
        />
      )}

      {connections.east ? (
        <WallDepthWithDoorway
          position={[width / 2, wallHeight / 2, 0]}
          width={wallThickness}
          height={wallHeight}
          depth={depth}
        />
      ) : (
        <Wall
          position={[width / 2, wallHeight / 2, 0]}
          width={wallThickness}
          height={wallHeight}
          depth={depth}
        />
      )}

      {torchPositions.map((pos, i) => (
        <Torch key={i} position={pos} castShadow={i === 0} />
      ))}
    </group>
  )
}

function Corridor({ from, to }: { from: RoomConfig; to: RoomConfig }) {
  const dx = to.x - from.x
  const dz = to.z - from.z
  const distance = Math.sqrt(dx * dx + dz * dz)

  if (distance < 1) return null

  const corridorWidth = 3
  const wallHeight = 4
  const wallThickness = 0.5

  const isHorizontal = Math.abs(dx) > Math.abs(dz)

  if (isHorizontal) {
    const corridorLength = Math.abs(dx) - from.width / 2 - to.width / 2
    if (corridorLength <= 0) return null

    const centerX =
      from.x + (dx > 0 ? from.width / 2 : -from.width / 2) + (corridorLength / 2) * Math.sign(dx)

    return (
      <group>
        <RigidBody type="fixed" colliders="cuboid">
          <mesh receiveShadow position={[centerX, -0.5, from.z]} onClick={() => {}}>
            <boxGeometry args={[corridorLength, 1, corridorWidth]} />
            <meshStandardMaterial color="#2a2a3a" roughness={0.95} />
          </mesh>
        </RigidBody>
        <Wall
          position={[centerX, wallHeight / 2, from.z - corridorWidth / 2]}
          width={corridorLength}
          height={wallHeight}
          depth={wallThickness}
        />
        <Wall
          position={[centerX, wallHeight / 2, from.z + corridorWidth / 2]}
          width={corridorLength}
          height={wallHeight}
          depth={wallThickness}
        />
        <Torch position={[centerX, 2.5, from.z - 1]} />
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
          <mesh receiveShadow position={[from.x, -0.5, centerZ]} onClick={() => {}}>
            <boxGeometry args={[corridorWidth, 1, corridorLength]} />
            <meshStandardMaterial color="#2a2a3a" roughness={0.95} />
          </mesh>
        </RigidBody>
        <Wall
          position={[from.x - corridorWidth / 2, wallHeight / 2, centerZ]}
          width={wallThickness}
          height={wallHeight}
          depth={corridorLength}
        />
        <Wall
          position={[from.x + corridorWidth / 2, wallHeight / 2, centerZ]}
          width={wallThickness}
          height={wallHeight}
          depth={corridorLength}
        />
        <Torch position={[from.x, 2.5, centerZ]} />
      </group>
    )
  }
}

function ExitPortal({ position }: { position: [number, number, number] }) {
  const currentCharacterId = useCharacterStore((s) => s.currentCharacterId)

  const handleClick = () => {
    if (!currentCharacterId) return

    const event: GameEvent = {
      type: 'APPROACH_INTERACT',
      timestamp: performance.now(),
      entityId: currentCharacterId,
      interactType: 'portal',
      targetPosition: position,
    }

    eventQueue.enqueue(event)
  }

  return (
    <group position={position} onClick={handleClick}>
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
  rooms: RoomConfig[]
}

export default function FloorDungeon({ rooms }: FloorDungeonProps) {
  const setRoomBounds = useWorldStore((s) => s.setRoomBounds)

  useEffect(() => {
    const DOORWAY_BUFFER = 2
    const bounds: RoomBounds[] = []

    for (let i = 0; i < rooms.length; i++) {
      const room = rooms[i]
      let boundWidth = room.width
      let boundDepth = room.depth
      let boundX = room.x
      let boundZ = room.z

      if (i > 0) {
        const prev = rooms[i - 1]
        const dx = room.x - prev.x
        const dz = room.z - prev.z
        if (Math.abs(dx) > Math.abs(dz)) {
          boundWidth += DOORWAY_BUFFER
          if (dx > 0) boundX -= DOORWAY_BUFFER / 2
          else boundX += DOORWAY_BUFFER / 2
        } else {
          boundDepth += DOORWAY_BUFFER
          if (dz > 0) boundZ -= DOORWAY_BUFFER / 2
          else boundZ += DOORWAY_BUFFER / 2
        }
      }

      if (i < rooms.length - 1) {
        const next = rooms[i + 1]
        const dx = next.x - room.x
        const dz = next.z - room.z
        if (Math.abs(dx) > Math.abs(dz)) {
          boundWidth += DOORWAY_BUFFER
          if (dx > 0) boundX += DOORWAY_BUFFER / 2
          else boundX -= DOORWAY_BUFFER / 2
        } else {
          boundDepth += DOORWAY_BUFFER
          if (dz > 0) boundZ += DOORWAY_BUFFER / 2
          else boundZ -= DOORWAY_BUFFER / 2
        }
      }

      bounds.push({ x: boundX, z: boundZ, width: boundWidth, depth: boundDepth })
    }

    for (let i = 0; i < rooms.length - 1; i++) {
      const from = rooms[i]
      const to = rooms[i + 1]
      const dx = to.x - from.x
      const dz = to.z - from.z
      const corridorWidth = 3

      if (Math.abs(dx) > Math.abs(dz)) {
        const corridorLength = Math.abs(dx) - from.width / 2 - to.width / 2
        if (corridorLength > 0) {
          const centerX = from.x + (dx > 0 ? 1 : -1) * (from.width / 2 + corridorLength / 2)
          bounds.push({
            x: centerX,
            z: from.z,
            width: corridorLength + DOORWAY_BUFFER,
            depth: corridorWidth,
          })
        }
      } else {
        const corridorLength = Math.abs(dz) - from.depth / 2 - to.depth / 2
        if (corridorLength > 0) {
          const centerZ = from.z + (dz > 0 ? 1 : -1) * (from.depth / 2 + corridorLength / 2)
          bounds.push({
            x: from.x,
            z: centerZ,
            width: corridorWidth,
            depth: corridorLength + DOORWAY_BUFFER,
          })
        }
      }
    }

    setRoomBounds(bounds)

    return () => setRoomBounds([])
  }, [rooms, setRoomBounds])

  function getRoomConnections(index: number): RoomConnections {
    const connections: RoomConnections = {}

    if (index > 0) {
      const prev = rooms[index - 1]
      const curr = rooms[index]
      const dx = curr.x - prev.x
      const dz = curr.z - prev.z
      if (Math.abs(dx) > Math.abs(dz)) {
        if (dx > 0) connections.west = true
        else connections.east = true
      } else {
        if (dz > 0) connections.north = true
        else connections.south = true
      }
    }

    if (index < rooms.length - 1) {
      const curr = rooms[index]
      const next = rooms[index + 1]
      const dx = next.x - curr.x
      const dz = next.z - curr.z
      if (Math.abs(dx) > Math.abs(dz)) {
        if (dx > 0) connections.east = true
        else connections.west = true
      } else {
        if (dz > 0) connections.south = true
        else connections.north = true
      }
    }

    return connections
  }

  const lastRoom = rooms[rooms.length - 1]
  const exitPosition: [number, number, number] = [lastRoom.x, 0, lastRoom.z]

  return (
    <group>
      {rooms.map((room, i) => (
        <Room key={i} config={room} connections={getRoomConnections(i)} />
      ))}
      {rooms.slice(0, -1).map((room, i) => (
        <Corridor key={`corridor-${i}`} from={room} to={rooms[i + 1]} />
      ))}
      <ExitPortal position={exitPosition} />
    </group>
  )
}

export { generateDungeon }
