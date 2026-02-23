import { create } from 'zustand'

import { SKILLS, type SkillState } from '../types/skills'

interface SkillStoreState {
  skillStates: Record<string, SkillState>
  activeSkill: string | null
  lastSkillActivationTime: number

  useSkill: (skillId: string, currentTime: number) => boolean
  isOnCooldown: (skillId: string, currentTime: number) => boolean
  getCooldownRemaining: (skillId: string, currentTime: number) => number
  setActiveSkill: (skillId: string | null) => void
  tick: (currentTime: number) => void
}

export const useSkillStore = create<SkillStoreState>((set, get) => ({
  skillStates: {},
  activeSkill: null,
  lastSkillActivationTime: 0,

  useSkill: (skillId, currentTime) => {
    const { skillStates } = get()
    const existing = skillStates[skillId]

    if (existing && existing.onCooldown) {
      return false
    }

    set({
      skillStates: {
        ...skillStates,
        [skillId]: {
          skillId,
          lastUsedTime: currentTime,
          onCooldown: true,
        },
      },
      lastSkillActivationTime: currentTime,
    })

    return true
  },

  isOnCooldown: (skillId, _currentTime) => {
    const { skillStates } = get()
    const state = skillStates[skillId]
    if (!state) return false
    return state.onCooldown
  },

  getCooldownRemaining: (skillId, _currentTime) => {
    const { skillStates } = get()
    const state = skillStates[skillId]
    if (!state) return 0

    const skill = SKILLS[skillId]
    if (!skill || skill.cooldown === 0) return 0

    const elapsed = performance.now() - state.lastUsedTime
    const remaining = skill.cooldown - elapsed
    return Math.max(0, remaining)
  },

  setActiveSkill: (skillId) => {
    set({ activeSkill: skillId })
  },

  tick: (_currentTime) => {
    const { skillStates } = get()

    const updated: Record<string, SkillState> = {}
    let changed = false

    for (const [id, state] of Object.entries(skillStates)) {
      const skill = SKILLS[id]
      if (skill && skill.cooldown > 0) {
        const elapsed = performance.now() - state.lastUsedTime
        const stillOnCooldown = elapsed < skill.cooldown
        if (state.onCooldown !== stillOnCooldown) {
          updated[id] = { ...state, onCooldown: stillOnCooldown }
          changed = true
        }
      }
    }

    if (changed) {
      set({ skillStates: { ...skillStates, ...updated } })
    }
  },
}))
