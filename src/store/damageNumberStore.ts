import { create } from 'zustand'

export interface DamageNumber {
  id: string
  x: number
  y: number
  z: number
  amount: number
  isPlayerDamage: boolean
  createdAt: number
}

interface DamageNumberState {
  numbers: DamageNumber[]
  addDamageNumber: (
    x: number,
    y: number,
    z: number,
    amount: number,
    isPlayerDamage: boolean
  ) => void
  removeDamageNumber: (id: string) => void
  tick: (currentTime: number) => void
}

const DAMAGE_NUMBER_DURATION = 1500

export const useDamageNumberStore = create<DamageNumberState>((set) => ({
  numbers: [],

  addDamageNumber: (x, y, z, amount, isPlayerDamage) => {
    const id = crypto.randomUUID()
    set((state) => ({
      numbers: [
        ...state.numbers,
        { id, x, y, z, amount, isPlayerDamage, createdAt: performance.now() },
      ],
    }))
  },

  removeDamageNumber: (id) => {
    set((state) => ({
      numbers: state.numbers.filter((n) => n.id !== id),
    }))
  },

  tick: (currentTime) => {
    set((state) => ({
      numbers: state.numbers.filter((n) => currentTime - n.createdAt < DAMAGE_NUMBER_DURATION),
    }))
  },
}))
