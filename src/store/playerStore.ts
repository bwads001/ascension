import { create } from 'zustand'

interface PlayerState {
  health: number
  maxHealth: number
  position: [number, number, number]
  floor: number
  setHealth: (health: number) => void
  setPosition: (position: [number, number, number]) => void
  setFloor: (floor: number) => void
  takeDamage: (amount: number) => void
}

export const usePlayerStore = create<PlayerState>((set) => ({
  health: 100,
  maxHealth: 100,
  position: [0, 2, 0],
  floor: 1,
  setHealth: (health) => set({ health }),
  setPosition: (position) => set({ position }),
  setFloor: (floor) => set({ floor }),
  takeDamage: (amount) =>
    set((state) => ({
      health: Math.max(0, state.health - amount),
    })),
}))
