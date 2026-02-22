import { entityManager } from '../engine/EntityManager'
import type { System, GameEvent, Entity } from '../types'
import { distanceXZ, inRange, randomPointInRadius } from '../utils/math'

const WANDER_INTERVAL = 3000
const WANDER_RADIUS = 8

function createMoveToEvent(entityId: string, target: [number, number, number]): GameEvent {
  return {
    type: 'MOVE_TO',
    timestamp: performance.now(),
    entityId,
    target,
  }
}

export class AISystem implements System {
  readonly name = 'AISystem'
  readonly priority = 15

  update(entities: Entity[], _events: GameEvent[], _deltaTime: number): GameEvent[] {
    const emittedEvents: GameEvent[] = []
    const currentTime = performance.now()

    for (const entity of entities) {
      if (entity.type !== 'monster') continue
      if (!entity.components.ai || !entity.components.position) continue
      if (entity.components.health?.dead) continue

      const ai = entity.components.ai
      const position = entity.components.position

      const player = this.findNearestPlayer(entity, entities)

      if (player && player.components.position) {
        const playerPos = player.components.position
        const dist = distanceXZ(position, playerPos)

        if (dist <= ai.aggroRange) {
          this.updateAggro(entity, player, emittedEvents)
          continue
        }
      }

      this.updateWander(entity, currentTime, emittedEvents)
    }

    return emittedEvents
  }

  private findNearestPlayer(monster: Entity, entities: Entity[]): Entity | null {
    let nearest: Entity | null = null
    let nearestDist = Infinity

    for (const entity of entities) {
      if (entity.type !== 'player') continue
      if (entity.components.health?.dead) continue
      if (!entity.components.position) continue

      const dist = distanceXZ(monster.components.position!, entity.components.position)
      if (dist < nearestDist) {
        nearestDist = dist
        nearest = entity
      }
    }

    return nearest
  }

  private updateAggro(monster: Entity, player: Entity, events: GameEvent[]): void {
    const position = monster.components.position!
    const playerPos = player.components.position!

    entityManager.updateComponent(monster.id, 'ai', {
      behavior: 'aggro',
      targetId: player.id,
    })

    const combat = monster.components.combat
    if (combat && inRange(position, playerPos, combat.attackRange)) {
      events.push({
        type: 'ATTACK_ENTITY',
        timestamp: performance.now(),
        attackerId: monster.id,
        targetId: player.id,
      })
    } else {
      events.push(createMoveToEvent(monster.id, [playerPos.x, 0, playerPos.z]))
    }
  }

  private updateWander(entity: Entity, currentTime: number, events: GameEvent[]): void {
    const ai = entity.components.ai!

    if (ai.behavior !== 'wander') {
      entityManager.updateComponent(entity.id, 'ai', {
        behavior: 'wander',
        targetId: null,
      })
    }

    if (currentTime - ai.lastWanderTime >= WANDER_INTERVAL) {
      const newTarget = randomPointInRadius(
        { x: ai.homePosition[0], y: 0, z: ai.homePosition[2] },
        WANDER_RADIUS
      )

      entityManager.updateComponent(entity.id, 'ai', {
        wanderTarget: [newTarget.x, newTarget.y, newTarget.z],
        lastWanderTime: currentTime,
      })

      events.push(createMoveToEvent(entity.id, [newTarget.x, 0, newTarget.z]))
    }
  }
}

export const aiSystem = new AISystem()
