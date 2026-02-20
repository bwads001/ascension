import { create } from 'zustand'

import { usePlayerStore } from './playerStore'

export interface MonsterData {
  id: string
  type: 'slime' | 'rat' | 'skeleton'
  position: [number, number, number]
  health: number
  maxHealth: number
  dead: boolean
}

interface GameState {
  monsters: Map<string, MonsterData>
  registerMonster: (monster: MonsterData) => void
  updateMonsterPosition: (id: string, position: [number, number, number]) => void
  damageMonster: (id: string, amount: number) => void
  removeMonster: (id: string) => void
  getMonster: (id: string) => MonsterData | undefined
  getMonstersInRange: (position: [number, number, number], range: number) => MonsterData[]
}

export const useGameStore = create<GameState>((set, get) => ({
  monsters: new Map(),

  registerMonster: (monster) =>
    set((state) => {
      const newMonsters = new Map(state.monsters)
      const existing = newMonsters.get(monster.id)
      if (existing && existing.dead) {
        return { monsters: newMonsters }
      }
      newMonsters.set(monster.id, monster)
      return { monsters: newMonsters }
    }),

  updateMonsterPosition: (id, position) =>
    set((state) => {
      const newMonsters = new Map(state.monsters)
      const monster = newMonsters.get(id)
      if (monster && !monster.dead) {
        newMonsters.set(id, { ...monster, position })
      }
      return { monsters: newMonsters }
    }),

  damageMonster: (id, amount) =>
    set((state) => {
      const newMonsters = new Map(state.monsters)
      const monster = newMonsters.get(id)
      if (monster && !monster.dead) {
        const newHealth = Math.max(0, monster.health - amount)
        if (newHealth <= 0) {
          newMonsters.set(id, { ...monster, health: 0, dead: true })
          usePlayerStore.getState().addKill()
        } else {
          newMonsters.set(id, { ...monster, health: newHealth })
        }
      }
      return { monsters: newMonsters }
    }),

  removeMonster: (id) =>
    set((state) => {
      const newMonsters = new Map(state.monsters)
      newMonsters.delete(id)
      return { monsters: newMonsters }
    }),

  getMonster: (id) => get().monsters.get(id),

  getMonstersInRange: (position, range) => {
    const monsters = get().monsters
    const result: MonsterData[] = []
    monsters.forEach((monster) => {
      if (monster.dead) return
      const dx = monster.position[0] - position[0]
      const dz = monster.position[2] - position[2]
      const distance = Math.sqrt(dx * dx + dz * dz)
      if (distance <= range) {
        result.push(monster)
      }
    })
    return result
  },
}))
