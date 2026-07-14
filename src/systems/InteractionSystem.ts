import { eventQueue } from '../engine/EventQueue'
import { useCombatStore, useWorldStore } from '../store'
import type { System, GameEvent, Entity } from '../types'
import { distanceXZ } from '../utils/math'
import { findTargetInFront } from '../utils/targeting'

const INTERACT_RANGE = 2
const AUTO_ATTACK_RANGE = 3.5
const AUTO_ATTACK_CONE = Math.PI
const POTION_COOLDOWN = 10000
const POTION_HEAL_PERCENT = 0.3

interface PendingInteraction {
  type: 'heal' | 'tower' | 'portal'
  targetPosition: [number, number, number]
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
        this.handleInteract(event.entityId, event.targetId, entities)
      } else if (event.type === 'APPROACH_INTERACT') {
        this.handleApproachInteract(event, store)
      } else if (event.type === 'USE_POTION') {
        this.handleUsePotion(event.entityId, currentTime, store)
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

      const combat = entity.components.combat
      if (!combat?.autoAttackEnabled) continue

      console.log('[InteractionSystem] Auto-attack enabled for', entity.id)
      const target = findTargetInFront(entity, entities, AUTO_ATTACK_RANGE, AUTO_ATTACK_CONE)
      console.log('[InteractionSystem] Found target:', target?.id ?? 'none')
      if (target) {
        const canAtk = this.canAttack(entity.id, currentTime)
        console.log('[InteractionSystem] Can attack:', canAtk)
        if (!canAtk) continue
        console.log('[InteractionSystem] Creating ATTACK_ENTITY event')
        emittedEvents.push(createAttackEvent(entity.id, target.id))
      }
    }

    return emittedEvents
  }

  private canAttack(entityId: string, currentTime: number): boolean {
    const combatStore = useCombatStore.getState()
    return combatStore.canAttack(entityId, currentTime)
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

  private handleInteract(entityId: string, targetId: string, entities: Entity[]): void {
    const player = entities.find((e) => e.id === entityId)
    const target = entities.find((e) => e.id === targetId)

    if (!player || !target) return

    const targetPos = target.components.position
    if (!targetPos) return

    eventQueue.enqueue({
      type: 'MOVE_TO',
      timestamp: performance.now(),
      entityId,
      target: [targetPos.x, 0, targetPos.z],
    })
  }

  private handleUsePotion(
    entityId: string,
    currentTime: number,
    store: ReturnType<typeof useWorldStore.getState>
  ): void {
    const entity = store.entities[entityId]
    if (!entity?.components.player || !entity.components.health) return

    const player = entity.components.player
    const health = entity.components.health

    if (player.potions <= 0) return
    if (currentTime - player.lastPotionTime < POTION_COOLDOWN) return
    if (health.current >= health.max) return

    const healAmount = Math.floor(health.max * POTION_HEAL_PERCENT)
    const newHealth = Math.min(health.max, health.current + healAmount)

    store.updateEntity(entityId, {
      health: { ...health, current: newHealth },
      player: {
        ...player,
        potions: player.potions - 1,
        lastPotionTime: currentTime,
      },
    })
  }
}

export const interactionSystem = new InteractionSystem()
