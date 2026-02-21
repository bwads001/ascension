import { create } from 'zustand'

import type { Entity, ComponentMap } from '../types'

interface WorldState {
  entities: Record<string, Entity>
  floor: number
  time: number

  setEntity: (entity: Entity) => void
  updateEntity: (id: string, components: Partial<ComponentMap>) => void
  removeEntity: (id: string) => void
  setFloor: (floor: number) => void
  setTime: (time: number) => void
  reset: () => void
}

export const useWorldStore = create<WorldState>((set) => ({
  entities: {},
  floor: 0,
  time: 0,

  setEntity: (entity) =>
    set((state) => ({
      entities: { ...state.entities, [entity.id]: entity },
    })),

  updateEntity: (id, components) =>
    set((state) => {
      const entity = state.entities[id]
      if (!entity) return state

      return {
        entities: {
          ...state.entities,
          [id]: {
            ...entity,
            components: { ...entity.components, ...components },
            updatedAt: performance.now(),
          },
        },
      }
    }),

  removeEntity: (id) =>
    set((state) => {
      const { [id]: _, ...rest } = state.entities
      return { entities: rest }
    }),

  setFloor: (floor) => set({ floor }),
  setTime: (time) => set({ time }),
  reset: () => set({ entities: {}, floor: 0, time: 0 }),
}))
