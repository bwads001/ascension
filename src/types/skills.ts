import type { PlayerClass } from './entities'

export type SkillTargetType = 'self' | 'enemy' | 'area' | 'direction'

export interface SkillDefinition {
  id: string
  name: string
  description: string
  icon: string
  cooldown: number
  range: number
  targetType: SkillTargetType
  classes: PlayerClass[]
  unlockLevel: number
  damageMultiplier?: number
  areaRadius?: number
  manaCost?: number
}

export interface SkillState {
  skillId: string
  lastUsedTime: number
  onCooldown: boolean
}

export const SKILLS: Record<string, SkillDefinition> = {
  basic_attack: {
    id: 'basic_attack',
    name: 'Attack',
    description: 'Basic melee attack',
    icon: '⚔',
    cooldown: 0,
    range: 3,
    targetType: 'enemy',
    classes: ['warrior', 'archer', 'mage'],
    unlockLevel: 1,
    damageMultiplier: 1,
  },
  power_strike: {
    id: 'power_strike',
    name: 'Power Strike',
    description: 'A powerful blow dealing 200% damage',
    icon: '💥',
    cooldown: 5000,
    range: 3,
    targetType: 'enemy',
    classes: ['warrior'],
    unlockLevel: 2,
    damageMultiplier: 2,
  },
  whirlwind: {
    id: 'whirlwind',
    name: 'Whirlwind',
    description: 'Spin and damage all nearby enemies',
    icon: '🌀',
    cooldown: 8000,
    range: 4,
    targetType: 'area',
    classes: ['warrior'],
    unlockLevel: 4,
    damageMultiplier: 0.8,
    areaRadius: 4,
  },
  battle_cry: {
    id: 'battle_cry',
    name: 'Battle Cry',
    description: 'Boost damage for 5 seconds',
    icon: '📢',
    cooldown: 20000,
    range: 0,
    targetType: 'self',
    classes: ['warrior'],
    unlockLevel: 6,
  },
  aimed_shot: {
    id: 'aimed_shot',
    name: 'Aimed Shot',
    description: 'A precise shot dealing 250% damage',
    icon: '🎯',
    cooldown: 4000,
    range: 10,
    targetType: 'enemy',
    classes: ['archer'],
    unlockLevel: 2,
    damageMultiplier: 2.5,
  },
  multi_shot: {
    id: 'multi_shot',
    name: 'Multi Shot',
    description: 'Fire arrows at all nearby enemies',
    icon: '🏹',
    cooldown: 7000,
    range: 8,
    targetType: 'area',
    classes: ['archer'],
    unlockLevel: 4,
    damageMultiplier: 0.6,
    areaRadius: 8,
  },
  evasion: {
    id: 'evasion',
    name: 'Evasion',
    description: 'Dodge attacks for 3 seconds',
    icon: '💨',
    cooldown: 15000,
    range: 0,
    targetType: 'self',
    classes: ['archer'],
    unlockLevel: 6,
  },
  fireball: {
    id: 'fireball',
    name: 'Fireball',
    description: 'Hurl a fireball dealing 200% damage',
    icon: '🔥',
    cooldown: 4000,
    range: 8,
    targetType: 'enemy',
    classes: ['mage'],
    unlockLevel: 2,
    damageMultiplier: 2,
  },
  frost_nova: {
    id: 'frost_nova',
    name: 'Frost Nova',
    description: 'Blast nearby enemies with frost',
    icon: '❄',
    cooldown: 8000,
    range: 5,
    targetType: 'area',
    classes: ['mage'],
    unlockLevel: 4,
    damageMultiplier: 1,
    areaRadius: 5,
  },
  heal: {
    id: 'heal',
    name: 'Heal',
    description: 'Restore 30% of max health',
    icon: '💚',
    cooldown: 15000,
    range: 0,
    targetType: 'self',
    classes: ['mage'],
    unlockLevel: 6,
  },
}

export function getAvailableSkills(playerClass: PlayerClass, level: number): string[] {
  const skills: string[] = ['basic_attack']

  for (const [id, skill] of Object.entries(SKILLS)) {
    if (id === 'basic_attack') continue
    if (skill.classes.includes(playerClass) && skill.unlockLevel <= level) {
      skills.push(id)
    }
  }

  return skills
}

export function getSkillBar(playerClass: PlayerClass, level: number): (string | null)[] {
  const available = getAvailableSkills(playerClass, level)
  const bar: (string | null)[] = Array(10).fill(null)

  for (let i = 0; i < Math.min(available.length, 10); i++) {
    bar[i] = available[i]
  }

  return bar
}
