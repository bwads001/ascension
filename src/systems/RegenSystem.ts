import { useWorldStore } from '../store'
import type { System, GameEvent, Entity } from '../types'

const REGEN_INTERVAL = 30000

export class RegenSystem implements System {
  readonly name = 'RegenSystem'
  readonly priority = 30
  private lastRegenTime: number = 0

  update(entities: Entity[], _events: GameEvent[], _deltaTime: number): GameEvent[] {
    const currentTime = performance.now()
    const store = useWorldStore.getState()

    if (currentTime - this.lastRegenTime < REGEN_INTERVAL) {
      return []
    }

    this.lastRegenTime = currentTime

    for (const entity of entities) {
      if (entity.type !== 'player') continue
      if (!entity.components.health) continue
      if (!entity.components.player) continue
      if (entity.components.health.dead) continue

      const health = entity.components.health
      const stamina = entity.components.player.attributes.stamina
      const regenAmount = stamina

      if (regenAmount <= 0) continue
      if (health.current >= health.max) continue

      const newHealth = Math.min(health.max, health.current + regenAmount)
      store.updateEntity(entity.id, {
        health: { ...health, current: newHealth },
      })
    }

    return []
  }
}

export const regenSystem = new RegenSystem()
