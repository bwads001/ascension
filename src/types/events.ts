import type { Entity, ComponentMap } from './entities'

export type GameEventType =
  | 'MOVE_TO'
  | 'APPROACH_ENTITY'
  | 'APPROACH_INTERACT'
  | 'ATTACK_ENTITY'
  | 'USE_SKILL'
  | 'SKILL_UNLOCKED'
  | 'TOGGLE_AUTO_ATTACK'
  | 'DAMAGE_DEALT'
  | 'ENTITY_DIED'
  | 'ENTITY_SPAWNED'
  | 'ENTITY_DESTROYED'
  | 'COMPONENT_UPDATED'
  | 'INTERACT'
  | 'HEAL'
  | 'FLOOR_TRANSITION'
  | 'PLAYER_JOINED'
  | 'PLAYER_LEFT'
  | 'GAME_STARTED'
  | 'GAME_PAUSED'
  | 'GAME_RESUMED'

export interface BaseGameEvent {
  type: GameEventType
  timestamp: number
  sourceEntityId?: string
}

export interface MoveToEvent extends BaseGameEvent {
  type: 'MOVE_TO'
  entityId: string
  target: [number, number, number]
}

export interface ApproachEntityEvent extends BaseGameEvent {
  type: 'APPROACH_ENTITY'
  entityId: string
  targetId: string
  stopAtRange: number
}

export interface ApproachInteractEvent extends BaseGameEvent {
  type: 'APPROACH_INTERACT'
  entityId: string
  interactType: 'heal' | 'tower' | 'portal'
  targetPosition: [number, number, number]
}

export interface AttackEntityEvent extends BaseGameEvent {
  type: 'ATTACK_ENTITY'
  attackerId: string
  targetId: string
}

export interface UseSkillEvent extends BaseGameEvent {
  type: 'USE_SKILL'
  entityId: string
  skillId: string
  targetId: string
}

export interface SkillUnlockedEvent extends BaseGameEvent {
  type: 'SKILL_UNLOCKED'
  entityId: string
  skillId: string
}

export interface DamageDealtEvent extends BaseGameEvent {
  type: 'DAMAGE_DEALT'
  sourceId: string
  targetId: string
  amount: number
}

export interface EntityDiedEvent extends BaseGameEvent {
  type: 'ENTITY_DIED'
  entityId: string
  killedBy?: string
}

export interface EntitySpawnedEvent extends BaseGameEvent {
  type: 'ENTITY_SPAWNED'
  entity: Entity
}

export interface EntityDestroyedEvent extends BaseGameEvent {
  type: 'ENTITY_DESTROYED'
  entityId: string
}

export interface ComponentUpdatedEvent extends BaseGameEvent {
  type: 'COMPONENT_UPDATED'
  entityId: string
  component: keyof ComponentMap
  data: ComponentMap[keyof ComponentMap]
}

export interface InteractEvent extends BaseGameEvent {
  type: 'INTERACT'
  entityId: string
  targetId: string
}

export interface HealEvent extends BaseGameEvent {
  type: 'HEAL'
  entityId: string
  amount: number
}

export interface FloorTransitionEvent extends BaseGameEvent {
  type: 'FLOOR_TRANSITION'
  fromFloor: number
  toFloor: number
  playerIds: string[]
}

export interface PlayerJoinedEvent extends BaseGameEvent {
  type: 'PLAYER_JOINED'
  playerId: string
  playerName: string
}

export interface PlayerLeftEvent extends BaseGameEvent {
  type: 'PLAYER_LEFT'
  playerId: string
}

export interface GameStartedEvent extends BaseGameEvent {
  type: 'GAME_STARTED'
}

export interface GamePausedEvent extends BaseGameEvent {
  type: 'GAME_PAUSED'
}

export interface GameResumedEvent extends BaseGameEvent {
  type: 'GAME_RESUMED'
}

export type GameEvent =
  | MoveToEvent
  | ApproachEntityEvent
  | ApproachInteractEvent
  | AttackEntityEvent
  | UseSkillEvent
  | SkillUnlockedEvent
  | DamageDealtEvent
  | EntityDiedEvent
  | EntitySpawnedEvent
  | EntityDestroyedEvent
  | ComponentUpdatedEvent
  | InteractEvent
  | HealEvent
  | FloorTransitionEvent
  | PlayerJoinedEvent
  | PlayerLeftEvent
  | GameStartedEvent
  | GamePausedEvent
  | GameResumedEvent

export function createEvent<T extends GameEvent>(
  type: T['type'],
  data: Omit<T, 'type' | 'timestamp'>
): T {
  return {
    type,
    timestamp: performance.now(),
    ...data,
  } as T
}
