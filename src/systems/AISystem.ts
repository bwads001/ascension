import { useWorldStore } from '../store'
import type { System, GameEvent, Entity } from '../types'
import { distanceXZ, inRange, randomPointInRadius } from '../utils/math'
import { isInTown, TOWN_RADIUS } from '../world'

const WANDER_INTERVAL = 5000
const WANDER_RADIUS = 8
const LEASH_DISTANCE = 20

function createMoveToEvent(entityId: string, target: [number, number, number]): GameEvent {
  return {
    type: 'MOVE_TO',
    timestamp: performance.now(),
    entityId,
    target,
  }
}

function clampOutsideTown(x: number, z: number, margin: number): [number, number] {
  if (!isInTown(x, z)) return [x, z]

  const angle = Math.atan2(z, x)
  return [Math.cos(angle) * (TOWN_RADIUS + margin), Math.sin(angle) * (TOWN_RADIUS + margin)]
}

export class AISystem implements System {
  readonly name = 'AISystem'
  readonly priority = 15

  update(entities: Entity[], _events: GameEvent[], _deltaTime: number): GameEvent[] {
    const emittedEvents: GameEvent[] = []
    const currentTime = performance.now()
    const store = useWorldStore.getState()

    for (const entity of entities) {
      if (entity.type !== 'monster') continue
      if (!entity.components.ai || !entity.components.position) continue
      if (entity.components.health?.dead) continue

      const ai = entity.components.ai
      const position = entity.components.position

      const player = this.findNearestPlayer(entity, entities)

      if (player && player.components.position) {
        const playerPos = player.components.position

        const inDungeon = store.floor > 0
        if (!inDungeon && isInTown(playerPos.x, playerPos.z)) {
          this.updateWander(entity, currentTime, emittedEvents, store)
          continue
        }

        const dist = distanceXZ(position, playerPos)

        if (dist <= ai.aggroRange) {
          this.updateAggro(entity, player, emittedEvents, store)
          continue
        }
      }

      this.updateWander(entity, currentTime, emittedEvents, store)
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

  private updateAggro(
    monster: Entity,
    player: Entity,
    events: GameEvent[],
    store: ReturnType<typeof useWorldStore.getState>
  ): void {
    const position = monster.components.position!
    const playerPos = player.components.position!
    const ai = monster.components.ai!

    const distFromHome = distanceXZ(position, {
      x: ai.homePosition[0],
      y: 0,
      z: ai.homePosition[2],
    })

    if (distFromHome > LEASH_DISTANCE) {
      store.updateEntity(monster.id, {
        ai: { ...ai, behavior: 'wander', targetId: null },
      })
      events.push(createMoveToEvent(monster.id, [ai.homePosition[0], 0, ai.homePosition[2]]))
      return
    }

    store.updateEntity(monster.id, {
      ai: { ...ai, behavior: 'aggro', targetId: player.id },
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

  private updateWander(
    entity: Entity,
    currentTime: number,
    events: GameEvent[],
    store: ReturnType<typeof useWorldStore.getState>
  ): void {
    const ai = entity.components.ai!

    if (ai.behavior !== 'wander') {
      store.updateEntity(entity.id, {
        ai: { ...ai, behavior: 'wander', targetId: null },
      })
    }

    if (currentTime - ai.lastWanderTime >= WANDER_INTERVAL) {
      let newTarget = randomPointInRadius(
        { x: ai.homePosition[0], y: 0, z: ai.homePosition[2] },
        WANDER_RADIUS
      )

      const [clampedX, clampedZ] = clampOutsideTown(newTarget.x, newTarget.z, 3)
      newTarget.x = clampedX
      newTarget.z = clampedZ

      store.updateEntity(entity.id, {
        ai: {
          ...ai,
          wanderTarget: [newTarget.x, newTarget.y, newTarget.z],
          lastWanderTime: currentTime,
        },
      })

      events.push(createMoveToEvent(entity.id, [newTarget.x, 0, newTarget.z]))
    }
  }
}

export const aiSystem = new AISystem()
