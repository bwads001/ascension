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
    damageMultiplier: 0.8,
    areaRadius: 4,
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
    damageMultiplier: 0.6,
    areaRadius: 8,
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
  },
}

export const CLASS_SKILL_BARS: Record<PlayerClass, string[]> = {
  warrior: ['basic_attack', 'power_strike', 'whirlwind', 'battle_cry', '', '', '', '', '', ''],
  archer: ['basic_attack', 'aimed_shot', 'multi_shot', 'evasion', '', '', '', '', '', ''],
  mage: ['basic_attack', 'fireball', 'frost_nova', 'heal', '', '', '', '', '', ''],
}
