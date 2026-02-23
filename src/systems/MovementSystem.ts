import { useWorldStore } from '../store'
import type { System, GameEvent, Entity, RoomBounds } from '../types'
import { moveToward, distanceXZ, inRange, getAngle } from '../utils/math'
import { isInTown, TOWN_RADIUS } from '../world'

const PLAYER_SPEED = 8
const WALL_MARGIN = 0.6

function isPointInRoom(x: number, z: number, room: RoomBounds, margin: number): boolean {
  const halfWidth = room.width / 2 - margin
  const halfDepth = room.depth / 2 - margin
  return (
    x >= room.x - halfWidth &&
    x <= room.x + halfWidth &&
    z >= room.z - halfDepth &&
    z <= room.z + halfDepth
  )
}

function findValidPosition(
  currentX: number,
  currentZ: number,
  targetX: number,
  targetZ: number,
  roomBounds: RoomBounds[]
): { x: number; z: number } | null {
  for (const room of roomBounds) {
    if (isPointInRoom(targetX, targetZ, room, WALL_MARGIN)) {
      return { x: targetX, z: targetZ }
    }
  }

  for (const room of roomBounds) {
    const clampedX = Math.max(
      room.x - room.width / 2 + WALL_MARGIN,
      Math.min(room.x + room.width / 2 - WALL_MARGIN, targetX)
    )
    const clampedZ = Math.max(
      room.z - room.depth / 2 + WALL_MARGIN,
      Math.min(room.z + room.depth / 2 - WALL_MARGIN, targetZ)
    )

    if (isPointInRoom(clampedX, clampedZ, room, WALL_MARGIN)) {
      const dx = clampedX - currentX
      const dz = clampedZ - currentZ
      const slideX = Math.abs(dx) > Math.abs(dz) ? clampedX : currentX
      const slideZ = Math.abs(dz) > Math.abs(dx) ? clampedZ : currentZ

      for (const r of roomBounds) {
        if (isPointInRoom(slideX, slideZ, r, WALL_MARGIN)) {
          return { x: slideX, z: slideZ }
        }
      }
      return { x: clampedX, z: clampedZ }
    }
  }

  return null
}

function clampPositionOutsideTown(
  newX: number,
  newZ: number,
  margin: number
): { x: number; z: number } {
  if (!isInTown(newX, newZ)) return { x: newX, z: newZ }

  const angle = Math.atan2(newZ, newX)
  return {
    x: Math.cos(angle) * (TOWN_RADIUS + margin),
    z: Math.sin(angle) * (TOWN_RADIUS + margin),
  }
}

export class MovementSystem implements System {
  readonly name = 'MovementSystem'
  readonly priority = 10

  update(entities: Entity[], events: GameEvent[], deltaTime: number): GameEvent[] {
    const deltaSeconds = deltaTime / 1000
    const store = useWorldStore.getState()

    for (const event of events) {
      if (event.type === 'MOVE_TO') {
        this.handleMoveTo(event.entityId, event.target, store)
      } else if (event.type === 'APPROACH_ENTITY') {
        this.handleApproachEntity(event.entityId, event.targetId, event.stopAtRange, store)
      }
    }

    for (const entity of entities) {
      this.updateMovement(entity, deltaSeconds, store)
    }

    return []
  }

  private handleMoveTo(
    entityId: string,
    target: [number, number, number],
    store: ReturnType<typeof useWorldStore.getState>
  ): void {
    const entity = store.entities[entityId]
    if (!entity?.components.position) return

    store.updateEntity(entityId, {
      velocity: { x: target[0], y: 0, z: target[2] },
    })
  }

  private handleApproachEntity(
    entityId: string,
    targetId: string,
    stopAtRange: number,
    store: ReturnType<typeof useWorldStore.getState>
  ): void {
    const entity = store.entities[entityId]
    const target = store.entities[targetId]

    if (!entity?.components.position || !target?.components.position) return

    const currentPos = entity.components.position
    const targetPos = target.components.position

    if (inRange(currentPos, targetPos, stopAtRange)) {
      store.updateEntity(entityId, {
        velocity: { x: currentPos.x, y: 0, z: currentPos.z },
      })
      return
    }

    store.updateEntity(entityId, {
      velocity: { x: targetPos.x, y: 0, z: targetPos.z },
    })
  }

  private updateMovement(
    entity: Entity,
    deltaSeconds: number,
    store: ReturnType<typeof useWorldStore.getState>
  ): void {
    const position = entity.components.position
    const velocity = entity.components.velocity

    if (!position || !velocity) return

    if (velocity.x === 0 && velocity.z === 0) return

    const targetPos = { x: velocity.x, y: position.y, z: velocity.z }
    const currentPos = { x: position.x, y: position.y, z: position.z }

    const dist = distanceXZ(currentPos, targetPos)

    let speed = PLAYER_SPEED
    if (entity.components.monster) {
      speed = entity.components.monster.speed
    }

    if (entity.components.ai?.behavior === 'aggro') {
      speed *= 1.3
    }

    if (dist <= 0.1) {
      store.updateEntity(entity.id, {
        velocity: { x: 0, y: 0, z: 0 },
      })
      return
    }

    let newPos = moveToward(currentPos, targetPos, speed * deltaSeconds)
    const newRotation = getAngle(currentPos, targetPos)

    if (entity.type === 'monster') {
      const clamped = clampPositionOutsideTown(newPos.x, newPos.z, 1)
      newPos.x = clamped.x
      newPos.z = clamped.z
    }

    if (store.floor > 0 && store.roomBounds.length > 0) {
      const validPos = findValidPosition(
        position.x,
        position.z,
        newPos.x,
        newPos.z,
        store.roomBounds
      )
      if (!validPos) {
        store.updateEntity(entity.id, {
          velocity: { x: 0, y: 0, z: 0 },
        })
        return
      }
      newPos.x = validPos.x
      newPos.z = validPos.z
    }

    store.updateEntity(entity.id, {
      position: { x: newPos.x, y: newPos.y, z: newPos.z, rotation: newRotation },
    })

    const updatedEntity = store.entities[entity.id]
    if (updatedEntity?.components.position) {
      if (distanceXZ(updatedEntity.components.position, targetPos) <= 0.1) {
        store.updateEntity(entity.id, {
          velocity: { x: 0, y: 0, z: 0 },
        })
      }
    }
  }
}

export const movementSystem = new MovementSystem()
