import { create } from 'zustand'

interface PlayerState {
  health: number
  maxHealth: number
  position: [number, number, number]
  targetPosition: [number, number, number] | null
  targetMonsterId: string | null
  floor: number
  kills: number
  playerClass: 'warrior' | 'archer' | 'mage'
  isDead: boolean
  setHealth: (health: number) => void
  setPosition: (position: [number, number, number]) => void
  setTargetPosition: (position: [number, number, number] | null) => void
  setTargetMonsterId: (id: string | null) => void
  setFloor: (floor: number) => void
  setPlayerClass: (playerClass: 'warrior' | 'archer' | 'mage') => void
  addKill: () => void
  takeDamage: (amount: number) => void
  heal: (amount: number) => void
  respawn: () => void
}

export const usePlayerStore = create<PlayerState>((set) => ({
  health: 100,
  maxHealth: 100,
  position: [0, 0, 0],
  targetPosition: null,
  targetMonsterId: null,
  floor: 0,
  kills: 0,
  playerClass: 'warrior',
  isDead: false,
  setHealth: (health) => set({ health, isDead: health <= 0 }),
  setPosition: (position) => set({ position }),
  setTargetPosition: (targetPosition) => set({ targetPosition }),
  setTargetMonsterId: (targetMonsterId) => set({ targetMonsterId }),
  setFloor: (floor) => set({ floor }),
  setPlayerClass: (playerClass) => set({ playerClass }),
  addKill: () => set((state) => ({ kills: state.kills + 1 })),
  takeDamage: (amount) =>
    set((state) => {
      const newHealth = Math.max(0, state.health - amount)
      return { health: newHealth, isDead: newHealth <= 0 }
    }),
  heal: (amount) =>
    set((state) => ({
      health: Math.min(state.maxHealth, state.health + amount),
    })),
  respawn: () =>
    set({
      health: 100,
      position: [0, 0, 0],
      targetPosition: null,
      targetMonsterId: null,
      isDead: false,
    }),
}))
