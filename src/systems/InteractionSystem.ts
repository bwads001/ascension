import { useCombatStore, useWorldStore } from '../store'
import type { System, GameEvent, Entity } from '../types'
import { inRange } from '../utils/math'

function createMoveToEvent(entityId: string, target: [number, number, number]): GameEvent {
  return {
    type: 'MOVE_TO',
    timestamp: performance.now(),
    entityId,
    target,
  }
}

function createApproachEntityEvent(
  entityId: string,
  targetId: string,
  stopAtRange: number
): GameEvent {
  return {
    type: 'APPROACH_ENTITY',
    timestamp: performance.now(),
    entityId,
    targetId,
    stopAtRange,
  }
}

function createAttackEvent(attackerId: string, targetId: string): GameEvent {
  return {
    type: 'ATTACK_ENTITY',
    timestamp: performance.now(),
    attackerId,
    targetId,
  }
}

export class InteractionSystem implements System {
  readonly name = 'InteractionSystem'
  readonly priority = 5

  update(entities: Entity[], events: GameEvent[], _deltaTime: number): GameEvent[] {
    const emittedEvents: GameEvent[] = []
    const currentTime = performance.now()
    const store = useWorldStore.getState()

    for (const event of events) {
      if (event.type === 'INTERACT') {
        const newEvent = this.handleInteract(event.entityId, event.targetId, entities)
        if (newEvent) emittedEvents.push(newEvent)
      } else if (event.type === 'APPROACH_ENTITY') {
        this.handleApproachEntity(event.entityId, event.targetId, store)
      }
    }

    for (const entity of entities) {
      if (entity.type !== 'player') continue
      if (!entity.components.combat?.targetId) continue
      if (!entity.components.position) continue
      if (entity.components.health?.dead) continue

      const targetId = entity.components.combat.targetId
      const target = store.entities[targetId]

      if (!target?.components.position) {
        store.updateEntity(entity.id, {
          combat: { ...entity.components.combat, targetId: null },
        })
        continue
      }

      if (target.components.health?.dead) {
        store.updateEntity(entity.id, {
          combat: { ...entity.components.combat, targetId: null },
        })
        continue
      }

      const attackRange = entity.components.combat.attackRange
      if (!inRange(entity.components.position, target.components.position, attackRange)) {
        continue
      }

      if (!this.canAttack(entity.id, currentTime)) {
        continue
      }

      emittedEvents.push(createAttackEvent(entity.id, targetId))
    }

    return emittedEvents
  }

  private canAttack(entityId: string, currentTime: number): boolean {
    const combatStore = useCombatStore.getState()
    return combatStore.canAttack(entityId, currentTime)
  }

  private handleApproachEntity(
    entityId: string,
    targetId: string,
    store: ReturnType<typeof useWorldStore.getState>
  ): void {
    const entity = store.entities[entityId]
    if (!entity?.components.combat) return

    store.updateEntity(entityId, {
      combat: { ...entity.components.combat, targetId },
    })
  }

  private handleInteract(entityId: string, targetId: string, entities: Entity[]): GameEvent | null {
    const player = entities.find((e) => e.id === entityId)
    const target = entities.find((e) => e.id === targetId)

    if (!player || !target) return null

    if (target.type === 'monster' && target.components.health && !target.components.health.dead) {
      return createApproachEntityEvent(
        entityId,
        targetId,
        player.components.combat?.attackRange ?? 3
      )
    }

    return createMoveToEvent(entityId, [
      target.components.position?.x ?? 0,
      target.components.position?.y ?? 0,
      target.components.position?.z ?? 0,
    ])
  }
}

export const interactionSystem = new InteractionSystem()
