import { create } from 'zustand'

import type { Equipment } from '../types/items'

export interface DroppedItem {
  id: string
  item: Equipment
  x: number
  y: number
  z: number
  createdAt: number
}

interface DroppedItemsState {
  items: DroppedItem[]
  addItem: (item: Equipment, x: number, y: number, z: number) => string
  removeItem: (id: string) => DroppedItem | null
  getItem: (id: string) => DroppedItem | null
  tick: (currentTime: number) => void
}

const ITEM_DESPAWN_TIME = 60000

export const useDroppedItemsStore = create<DroppedItemsState>((set, get) => ({
  items: [],

  addItem: (item, x, y, z) => {
    const id = crypto.randomUUID()
    const dropped: DroppedItem = {
      id,
      item,
      x,
      y,
      z,
      createdAt: performance.now(),
    }
    set((state) => ({ items: [...state.items, dropped] }))
    return id
  },

  removeItem: (id) => {
    const { items } = get()
    const item = items.find((i) => i.id === id)
    if (!item) return null
    set((state) => ({ items: state.items.filter((i) => i.id !== id) }))
    return item
  },

  getItem: (id) => {
    return get().items.find((i) => i.id === id) ?? null
  },

  tick: (currentTime) => {
    set((state) => ({
      items: state.items.filter((i) => currentTime - i.createdAt < ITEM_DESPAWN_TIME),
    }))
  },
}))
