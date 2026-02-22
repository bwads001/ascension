import { entityManager } from '../engine/EntityManager'
import type { System, GameEvent, Entity } from '../types'
import { moveToward, distanceXZ, inRange } from '../utils/math'
import { isInTown, TOWN_RADIUS } from '../world'

const PLAYER_SPEED = 8

function clampPositionOutsideTown(
  currentX: number,
  currentZ: number,
  newX: number,
  newZ: number,
  margin: number
): { x: number; z: number } {
  if (!isInTown(newX, newZ)) return { x: newX, z: newZ }

  const dx = newX - currentX
  const dz = newZ - currentZ

  if (dx === 0 && dz === 0) return { x: newX, z: newZ }

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

    for (const event of events) {
      if (event.type === 'MOVE_TO') {
        this.handleMoveTo(event.entityId, event.target, deltaSeconds)
      } else if (event.type === 'APPROACH_ENTITY') {
        this.handleApproachEntity(event.entityId, event.targetId, event.stopAtRange, deltaSeconds)
      }
    }

    for (const entity of entities) {
      this.updateMovement(entity, deltaSeconds)
    }

    return []
  }

  private handleMoveTo(
    entityId: string,
    target: [number, number, number],
    _deltaSeconds: number
  ): void {
    const entity = entityManager.get(entityId)
    if (!entity?.components.position) return

    entityManager.updateComponent(entityId, 'velocity', {
      x: target[0],
      y: 0,
      z: target[2],
    })
  }

  private handleApproachEntity(
    entityId: string,
    targetId: string,
    stopAtRange: number,
    _deltaSeconds: number
  ): void {
    const entity = entityManager.get(entityId)
    const target = entityManager.get(targetId)

    if (!entity?.components.position || !target?.components.position) return

    const currentPos = entity.components.position
    const targetPos = target.components.position

    if (inRange(currentPos, targetPos, stopAtRange)) {
      entityManager.updateComponent(entityId, 'velocity', {
        x: currentPos.x,
        y: 0,
        z: currentPos.z,
      })
      return
    }

    entityManager.updateComponent(entityId, 'velocity', {
      x: targetPos.x,
      y: 0,
      z: targetPos.z,
    })
  }

  private updateMovement(entity: Entity, deltaSeconds: number): void {
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
      entityManager.updateComponent(entity.id, 'velocity', {
        x: 0,
        y: 0,
        z: 0,
      })
      return
    }

    let newPos = moveToward(currentPos, targetPos, speed * deltaSeconds)

    if (entity.type === 'monster') {
      const clamped = clampPositionOutsideTown(position.x, position.z, newPos.x, newPos.z, 1)
      newPos.x = clamped.x
      newPos.z = clamped.z
    }

    entityManager.updateComponent(entity.id, 'position', {
      x: newPos.x,
      y: newPos.y,
      z: newPos.z,
    })

    if (distanceXZ(newPos, targetPos) <= 0.1) {
      entityManager.updateComponent(entity.id, 'velocity', {
        x: 0,
        y: 0,
        z: 0,
      })
    }
  }
}

export const movementSystem = new MovementSystem()
