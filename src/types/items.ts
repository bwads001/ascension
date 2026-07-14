export type EquipmentSlot = 'weapon' | 'helmet' | 'chest' | 'legs' | 'accessory'

export type ItemRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary'

export interface ItemStats {
  strength?: number
  agility?: number
  intellect?: number
  stamina?: number
  attackDamage?: number
  attackSpeed?: number
  critChance?: number
}

export interface Equipment {
  id: string
  name: string
  slot: EquipmentSlot
  rarity: ItemRarity
  level: number
  stats: ItemStats
}

export type EquipmentMap = Partial<Record<EquipmentSlot, Equipment>>

export interface HealthPotion {
  id: string
  name: string
  healAmount: number
}

export function getRarityColor(rarity: ItemRarity): string {
  const colors: Record<ItemRarity, string> = {
    common: '#aaaaaa',
    uncommon: '#1eff00',
    rare: '#0070dd',
    epic: '#a335ee',
    legendary: '#ff8000',
  }
  return colors[rarity]
}

export function getRarityName(rarity: ItemRarity): string {
  const names: Record<ItemRarity, string> = {
    common: 'Common',
    uncommon: 'Uncommon',
    rare: 'Rare',
    epic: 'Epic',
    legendary: 'Legendary',
  }
  return names[rarity]
}

export const SLOT_NAMES: Record<EquipmentSlot, string> = {
  weapon: 'Weapon',
  helmet: 'Helmet',
  chest: 'Chest',
  legs: 'Legs',
  accessory: 'Accessory',
}

const WEAPON_NAMES = ['Sword', 'Axe', 'Mace', 'Dagger', 'Staff']
const HELMET_NAMES = ['Helm', 'Hood', 'Crown', 'Cap', 'Mask']
const CHEST_NAMES = ['Plate', 'Robe', 'Vest', 'Armor', 'Tunic']
const LEGS_NAMES = ['Greaves', 'Pants', 'Leggings', 'Trousers']
const ACCESSORY_NAMES = ['Ring', 'Amulet', 'Pendant', 'Talisman', 'Charm']

const PREFIXES: Record<ItemRarity, string[]> = {
  common: ['Simple', 'Basic', 'Plain'],
  uncommon: ['Sturdy', 'Fine', 'Solid'],
  rare: ['Enchanted', 'Mystic', 'Arcane'],
  epic: ['Powerful', 'Mighty', 'Heroic'],
  legendary: ['Legendary', 'Mythical', 'Divine'],
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function generateStats(slot: EquipmentSlot, level: number, rarity: ItemRarity): ItemStats {
  const stats: ItemStats = {}
  const mult = getRarityMultiplier(rarity)
  const base = level * mult

  const primaryStat = Math.floor(base * 2)
  const secondaryStat = Math.floor(base)

  const statOptions: (keyof ItemStats)[] = ['strength', 'agility', 'intellect', 'stamina']

  if (slot === 'weapon') {
    stats.attackDamage = Math.floor(3 + level * 1.5 * mult)
    const mainStat = pickRandom(statOptions)
    stats[mainStat] = primaryStat
  } else if (slot === 'accessory') {
    const stat1 = pickRandom(statOptions)
    let stat2 = pickRandom(statOptions)
    while (stat2 === stat1) stat2 = pickRandom(statOptions)
    stats[stat1] = secondaryStat
    stats[stat2] = Math.floor(secondaryStat * 0.5)
  } else {
    stats.stamina = primaryStat
    const stat = pickRandom(statOptions.filter((s) => s !== 'stamina'))
    stats[stat] = secondaryStat
  }

  return stats
}

export function getRarityMultiplier(rarity: ItemRarity): number {
  const multipliers: Record<ItemRarity, number> = {
    common: 1,
    uncommon: 1.25,
    rare: 1.5,
    epic: 2,
    legendary: 3,
  }
  return multipliers[rarity]
}

export function generateEquipment(slot: EquipmentSlot, level: number): Equipment {
  const rarityRoll = Math.random()
  let rarity: ItemRarity
  if (rarityRoll < 0.5) rarity = 'common'
  else if (rarityRoll < 0.75) rarity = 'uncommon'
  else if (rarityRoll < 0.92) rarity = 'rare'
  else if (rarityRoll < 0.98) rarity = 'epic'
  else rarity = 'legendary'

  const nameLists: Record<EquipmentSlot, string[]> = {
    weapon: WEAPON_NAMES,
    helmet: HELMET_NAMES,
    chest: CHEST_NAMES,
    legs: LEGS_NAMES,
    accessory: ACCESSORY_NAMES,
  }

  const prefix = pickRandom(PREFIXES[rarity])
  const baseName = pickRandom(nameLists[slot])
  const name = `${prefix} ${baseName}`

  return {
    id: crypto.randomUUID(),
    name,
    slot,
    rarity,
    level,
    stats: generateStats(slot, level, rarity),
  }
}

export function generateLootDrop(monsterLevel: number): Equipment | null {
  if (Math.random() > 0.25) return null

  const slots: EquipmentSlot[] = ['weapon', 'helmet', 'chest', 'legs', 'accessory']
  const slot = pickRandom(slots)
  return generateEquipment(slot, Math.max(1, monsterLevel + Math.floor(Math.random() * 3) - 1))
}

export function createHealthPotion(): HealthPotion {
  return {
    id: crypto.randomUUID(),
    name: 'Health Potion',
    healAmount: 50,
  }
}

export function calculateEquipmentBonuses(equipment: EquipmentMap): ItemStats {
  const totals: ItemStats = {}

  for (const item of Object.values(equipment)) {
    if (!item) continue
    for (const [stat, value] of Object.entries(item.stats)) {
      totals[stat as keyof ItemStats] = (totals[stat as keyof ItemStats] ?? 0) + (value ?? 0)
    }
  }

  return totals
}
