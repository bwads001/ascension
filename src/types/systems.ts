import type { Entity } from './entities'
import type { GameEvent } from './events'

export interface System {
  readonly name: string
  readonly priority: number
  update(entities: Entity[], events: GameEvent[], deltaTime: number): GameEvent[]
}

export interface SystemContext {
  currentTime: number
  deltaTime: number
  fixedTimeStep: number
  tickCount: number
}

export type SystemFactory = (context: SystemContext) => System
