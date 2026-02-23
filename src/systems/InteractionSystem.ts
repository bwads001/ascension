import { eventQueue } from '../engine/EventQueue'
import { useCombatStore, useWorldStore } from '../store'
import type { System, GameEvent, Entity } from '../types'
import { inRange, distanceXZ } from '../utils/math'

const INTERACT_RANGE = 2

interface PendingInteraction {
  type: 'heal' | 'tower' | 'portal'
  targetPosition: [number, number, number]
}

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

  private pendingInteractions: Map<string, PendingInteraction> = new Map()

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
      } else if (event.type === 'APPROACH_INTERACT') {
        this.handleApproachInteract(event, store)
      }
    }

    for (const entity of entities) {
      if (entity.type !== 'player') continue
      if (!entity.components.position) continue
      if (entity.components.health?.dead) continue

      const pending = this.pendingInteractions.get(entity.id)
      if (pending) {
        const pos = entity.components.position
        const dist = distanceXZ(
          { x: pos.x, y: pos.y, z: pos.z },
          { x: pending.targetPosition[0], y: 0, z: pending.targetPosition[2] }
        )

        if (dist <= INTERACT_RANGE) {
          this.executeInteraction(entity.id, pending, store, emittedEvents)
          this.pendingInteractions.delete(entity.id)
        }
        continue
      }

      if (!entity.components.combat?.targetId) continue

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

    this.pendingInteractions.delete(entityId)

    store.updateEntity(entityId, {
      combat: { ...entity.components.combat, targetId },
    })
  }

  private handleApproachInteract(
    event: {
      entityId: string
      interactType: 'heal' | 'tower' | 'portal'
      targetPosition: [number, number, number]
    },
    store: ReturnType<typeof useWorldStore.getState>
  ): void {
    const entity = store.entities[event.entityId]
    if (!entity?.components.position) return

    if (entity.components.combat) {
      store.updateEntity(event.entityId, {
        combat: { ...entity.components.combat, targetId: null },
      })
    }

    this.pendingInteractions.set(event.entityId, {
      type: event.interactType,
      targetPosition: event.targetPosition,
    })

    eventQueue.enqueue({
      type: 'MOVE_TO',
      timestamp: performance.now(),
      entityId: event.entityId,
      target: event.targetPosition,
    })
  }

  private executeInteraction(
    entityId: string,
    interaction: PendingInteraction,
    store: ReturnType<typeof useWorldStore.getState>,
    events: GameEvent[]
  ): void {
    if (interaction.type === 'heal') {
      const entity = store.entities[entityId]
      if (!entity?.components.health) return

      const healEvent: GameEvent = {
        type: 'HEAL',
        timestamp: performance.now(),
        entityId,
        amount: entity.components.health.max,
      }
      events.push(healEvent)
    } else if (interaction.type === 'tower') {
      store.setFloor(1)
    } else if (interaction.type === 'portal') {
      store.setFloor(0)
    }
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
