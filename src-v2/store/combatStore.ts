import { create } from 'zustand'

interface CombatCooldown {
  entityId: string
  lastAttackTime: number
  cooldownMs: number
}

interface CombatState {
  cooldowns: Record<string, CombatCooldown>
  pendingAttacks: Array<{ attackerId: string; targetId: string; timestamp: number }>

  setCooldown: (entityId: string, lastAttackTime: number, cooldownMs: number) => void
  canAttack: (entityId: string, currentTime: number) => boolean
  addPendingAttack: (attackerId: string, targetId: string) => void
  clearPendingAttacks: () => void
  reset: () => void
}

export const useCombatStore = create<CombatState>((set, get) => ({
  cooldowns: {},
  pendingAttacks: [],

  setCooldown: (entityId, lastAttackTime, cooldownMs) => {
    set((state) => ({
      cooldowns: {
        ...state.cooldowns,
        [entityId]: { entityId, lastAttackTime, cooldownMs },
      },
    }))
  },

  canAttack: (entityId, currentTime) => {
    const { cooldowns } = get()
    const cooldown = cooldowns[entityId]
    if (!cooldown) return true

    return currentTime - cooldown.lastAttackTime >= cooldown.cooldownMs
  },

  addPendingAttack: (attackerId, targetId) => {
    set((state) => ({
      pendingAttacks: [
        ...state.pendingAttacks,
        { attackerId, targetId, timestamp: performance.now() },
      ],
    }))
  },

  clearPendingAttacks: () => set({ pendingAttacks: [] }),

  reset: () => set({ cooldowns: {}, pendingAttacks: [] }),
}))
