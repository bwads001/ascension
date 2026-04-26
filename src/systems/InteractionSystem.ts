import { eventQueue } from '../engine/EventQueue'
import { useCombatStore, useInputStore, useWorldStore } from '../store'
import type { System, GameEvent, Entity } from '../types'
import { distanceXZ, getAngle, inRange } from '../utils/math'
import { findTargetInFront } from '../utils/targeting'

const INTERACT_RANGE = 2
const SHIFT_ATTACK_RANGE = 3.5
const SHIFT_ATTACK_CONE = Math.PI

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

function createMoveEvent(entityId: string, target: [number, number, number]): GameEvent {
  return {
    type: 'MOVE_TO',
    timestamp: performance.now(),
    entityId,
    target,
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
    const input = useInputStore.getState()

    for (const event of events) {
      if (event.type === 'INTERACT') {
        this.handleInteract(event.entityId, event.targetId, entities)
      } else if (event.type === 'APPROACH_INTERACT') {
        this.handleApproachInteract(event, store)
      } else if (event.type === 'ATTACK_DIRECTION') {
        const attackEvent = this.handleAttackDirection(
          event.entityId,
          event.direction,
          entities,
          currentTime,
          store
        )
        if (attackEvent) emittedEvents.push(attackEvent)
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

      // Mouse-hold pursuit: re-assert target while mouse held over a monster
      if (input.mouseDown && input.hoveredMonsterId && !input.shiftHeld) {
        const hovered = store.entities[input.hoveredMonsterId]
        if (hovered && !hovered.components.health?.dead) {
          const combat = entity.components.combat
          if (combat && combat.targetId !== input.hoveredMonsterId) {
            store.updateEntity(entity.id, {
              combat: { ...combat, targetId: input.hoveredMonsterId },
            })
          }
        }
      }

      // Shift held: cancel any active pursuit (force stand still)
      if (input.shiftHeld && entity.components.combat?.targetId) {
        store.updateEntity(entity.id, {
          combat: { ...entity.components.combat, targetId: null },
        })
        // Also clear movement destination (force stand still)
        store.updateEntity(entity.id, {
          destination: { x: entity.components.position.x, y: 0, z: entity.components.position.z },
        })
      }

      const combat = entity.components.combat
      if (!combat?.targetId) continue

      const target = store.entities[combat.targetId]
      if (!target || target.components.health?.dead || !target.components.position) {
        // Target invalid - clear it
        store.updateEntity(entity.id, {
          combat: { ...combat, targetId: null },
        })
        continue
      }

      // Use FRESH positions from store, not stale snapshot
      const targetPos = target.components.position
      const freshPlayer = store.entities[entity.id]
      const playerPos = freshPlayer?.components.position ?? entity.components.position

      if (inRange(playerPos, targetPos, combat.attackRange)) {
        // In range: face target, stop moving, attack
        const angle = getAngle(playerPos, targetPos)
        store.updateEntity(entity.id, {
          position: { ...playerPos, rotation: angle },
          destination: { x: playerPos.x, y: 0, z: playerPos.z },
        })

        if (this.canAttack(entity.id, currentTime)) {
          emittedEvents.push(createAttackEvent(entity.id, combat.targetId))
          // Single-click semantics: clear target after firing the attack.
          // If mouse is held, the hover loop above will re-assert it next tick.
          store.updateEntity(entity.id, {
            combat: { ...combat, targetId: null },
          })
        }
      } else {
        // Out of range: pursue (idempotent - destination overwrites each tick)
        emittedEvents.push(createMoveEvent(entity.id, [targetPos.x, 0, targetPos.z]))
      }
    }

    return emittedEvents
  }

  private handleAttackDirection(
    entityId: string,
    direction: [number, number],
    entities: Entity[],
    currentTime: number,
    store: ReturnType<typeof useWorldStore.getState>
  ): GameEvent | null {
    const entity = store.entities[entityId]
    if (!entity?.components.position || !entity.components.combat) return null
    if (entity.components.health?.dead) return null

    // Face the direction
    const pos = entity.components.position
    const rotation = Math.atan2(direction[1], direction[0])
    store.updateEntity(entityId, {
      position: { ...pos, rotation },
      destination: { x: pos.x, y: 0, z: pos.z }, // Stand still
      combat: { ...entity.components.combat, targetId: null },
    })

    if (!this.canAttack(entityId, currentTime)) return null

    // Find target in front cone (after rotation update)
    const updatedEntity = { ...entity, components: { ...entity.components, position: { ...pos, rotation } } }
    const target = findTargetInFront(updatedEntity, entities, SHIFT_ATTACK_RANGE, SHIFT_ATTACK_CONE)
    if (target) {
      return createAttackEvent(entityId, target.id)
    }

    // No target - "swing at air": set cooldown + animation timestamp, no damage event
    const combatStore = useCombatStore.getState()
    combatStore.setCooldown(entityId, currentTime, entity.components.combat.attackCooldown)
    store.updateEntity(entityId, {
      combat: { ...entity.components.combat, lastAttackTime: currentTime, targetId: null },
    })
    return null
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
}

export const interactionSystem = new InteractionSystem()
