import { useWorldStore } from '../store'
import type { System, GameEvent, Entity } from '../types'

export class SyncSystem implements System {
  readonly name = 'SyncSystem'
  readonly priority = 100

  update(entities: Entity[], _events: GameEvent[], _deltaTime: number): GameEvent[] {
    const worldStore = useWorldStore.getState()

    for (const entity of entities) {
      const existingEntity = worldStore.entities[entity.id]
      if (!existingEntity || existingEntity.updatedAt !== entity.updatedAt) {
        worldStore.setEntity(entity)
      }
    }

    const storeIds = Object.keys(worldStore.entities)
    for (const id of storeIds) {
      if (!entities.find((e) => e.id === id)) {
        worldStore.removeEntity(id)
      }
    }

    return []
  }
}

export const syncSystem = new SyncSystem()
