import { create } from 'zustand'

interface PlayerState {
  health: number
  maxHealth: number
  position: [number, number, number]
  targetPosition: [number, number, number] | null
  floor: number
  kills: number
  playerClass: 'warrior' | 'archer' | 'mage'
  setHealth: (health: number) => void
  setPosition: (position: [number, number, number]) => void
  setTargetPosition: (position: [number, number, number] | null) => void
  setFloor: (floor: number) => void
  setPlayerClass: (playerClass: 'warrior' | 'archer' | 'mage') => void
  addKill: () => void
  takeDamage: (amount: number) => void
}

export const usePlayerStore = create<PlayerState>((set) => ({
  health: 100,
  maxHealth: 100,
  position: [0, 0, 0],
  targetPosition: null,
  floor: 0,
  kills: 0,
  playerClass: 'warrior',
  setHealth: (health) => set({ health }),
  setPosition: (position) => set({ position }),
  setTargetPosition: (targetPosition) => set({ targetPosition }),
  setFloor: (floor) => set({ floor }),
  setPlayerClass: (playerClass) => set({ playerClass }),
  addKill: () => set((state) => ({ kills: state.kills + 1 })),
  takeDamage: (amount) =>
    set((state) => ({
      health: Math.max(0, state.health - amount),
    })),
}))
