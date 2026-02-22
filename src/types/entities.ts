export type EntityType = 'player' | 'monster' | 'npc' | 'prop' | 'projectile'

export type PlayerClass = 'warrior' | 'archer' | 'mage'

export type MonsterType = 'slime' | 'rat' | 'skeleton'

export type AIBehavior = 'idle' | 'wander' | 'aggro' | 'flee' | 'dead'

export interface PositionComponent {
  x: number
  y: number
  z: number
  rotation: number
}

export interface VelocityComponent {
  x: number
  y: number
  z: number
}

export interface HealthComponent {
  current: number
  max: number
  dead: boolean
}

export interface CombatComponent {
  attackRange: number
  attackDamage: number
  attackCooldown: number
  lastAttackTime: number
  targetId: string | null
}

export interface AIComponent {
  behavior: AIBehavior
  aggroRange: number
  homePosition: [number, number, number]
  wanderTarget: [number, number, number]
  lastWanderTime: number
  targetId: string | null
}

export interface PlayerComponent {
  class: PlayerClass
  name: string
  kills: number
}

export interface MonsterComponent {
  type: MonsterType
  speed: number
}

export interface RenderComponent {
  visible: boolean
  highlighted: boolean
  opacity: number
}

export interface NetworkComponent {
  ownerId: string | null
  isReplicated: boolean
  lastSyncTime: number
}

export interface ComponentMap {
  position?: PositionComponent
  velocity?: VelocityComponent
  health?: HealthComponent
  combat?: CombatComponent
  ai?: AIComponent
  player?: PlayerComponent
  monster?: MonsterComponent
  render?: RenderComponent
  network?: NetworkComponent
}

export interface Entity {
  id: string
  type: EntityType
  components: ComponentMap
  createdAt: number
  updatedAt: number
}

export interface EntityFactoryConfig {
  type: EntityType
  id?: string
  components: Partial<ComponentMap>
}

export const PLAYER_DEFAULTS: Partial<ComponentMap> = {
  position: { x: 0, y: 0, z: 0, rotation: 0 },
  health: { current: 100, max: 100, dead: false },
  combat: {
    attackRange: 3,
    attackDamage: 25,
    attackCooldown: 500,
    lastAttackTime: 0,
    targetId: null,
  },
  render: { visible: true, highlighted: false, opacity: 1 },
}

export const MONSTER_DEFAULTS: Record<MonsterType, Partial<ComponentMap>> = {
  slime: {
    health: { current: 25, max: 25, dead: false },
    combat: {
      attackRange: 1.5,
      attackDamage: 10,
      attackCooldown: 1000,
      lastAttackTime: 0,
      targetId: null,
    },
    ai: {
      behavior: 'wander',
      aggroRange: 8,
      homePosition: [0, 0, 0],
      wanderTarget: [0, 0, 0],
      lastWanderTime: 0,
      targetId: null,
    },
    monster: { type: 'slime', speed: 1.5 },
    render: { visible: true, highlighted: false, opacity: 1 },
  },
  rat: {
    health: { current: 15, max: 15, dead: false },
    combat: {
      attackRange: 1.5,
      attackDamage: 8,
      attackCooldown: 800,
      lastAttackTime: 0,
      targetId: null,
    },
    ai: {
      behavior: 'wander',
      aggroRange: 10,
      homePosition: [0, 0, 0],
      wanderTarget: [0, 0, 0],
      lastWanderTime: 0,
      targetId: null,
    },
    monster: { type: 'rat', speed: 3 },
    render: { visible: true, highlighted: false, opacity: 1 },
  },
  skeleton: {
    health: { current: 50, max: 50, dead: false },
    combat: {
      attackRange: 2,
      attackDamage: 15,
      attackCooldown: 1200,
      lastAttackTime: 0,
      targetId: null,
    },
    ai: {
      behavior: 'wander',
      aggroRange: 12,
      homePosition: [0, 0, 0],
      wanderTarget: [0, 0, 0],
      lastWanderTime: 0,
      targetId: null,
    },
    monster: { type: 'skeleton', speed: 2 },
    render: { visible: true, highlighted: false, opacity: 1 },
  },
}
