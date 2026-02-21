import type { System, GameEvent, Entity } from '../types'

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

export class InteractionSystem implements System {
  readonly name = 'InteractionSystem'
  readonly priority = 5

  update(entities: Entity[], events: GameEvent[], _deltaTime: number): GameEvent[] {
    const emittedEvents: GameEvent[] = []

    for (const event of events) {
      if (event.type === 'INTERACT') {
        const newEvent = this.handleInteract(event.entityId, event.targetId, entities)
        if (newEvent) emittedEvents.push(newEvent)
      }
    }

    return emittedEvents
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
