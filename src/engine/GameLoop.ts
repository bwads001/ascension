import type { System, GameEvent } from '../types'
import { EntityManager } from './EntityManager'
import { EventQueue } from './EventQueue'
import { TimeManager } from './TimeManager'

type GameLoopCallback = (tick: number, deltaTime: number) => void

export class GameLoop {
  private running = false
  private frameId: number | null = null
  private systems: System[] = []
  private onTickCallbacks: GameLoopCallback[] = []

  constructor(
    private readonly entityManager: EntityManager,
    private readonly eventQueue: EventQueue,
    private readonly timeManager: TimeManager
  ) {}

  registerSystem(system: System): void {
    this.systems.push(system)
    this.systems.sort((a, b) => a.priority - b.priority)
  }

  unregisterSystem(name: string): void {
    this.systems = this.systems.filter((s) => s.name !== name)
  }

  onTick(callback: GameLoopCallback): () => void {
    this.onTickCallbacks.push(callback)
    return () => {
      this.onTickCallbacks = this.onTickCallbacks.filter((cb) => cb !== callback)
    }
  }

  start(): void {
    if (this.running) return

    this.running = true
    this.timeManager.start()
    this.loop()
  }

  stop(): void {
    this.running = false
    if (this.frameId !== null) {
      cancelAnimationFrame(this.frameId)
      this.frameId = null
    }
  }

  isRunning(): boolean {
    return this.running
  }

  private loop = (): void => {
    if (!this.running) return

    const currentTime = performance.now()
    this.timeManager.update(currentTime)

    while (this.timeManager.shouldTick()) {
      const deltaTime = this.timeManager.consumeTick()
      this.tick(deltaTime)
    }

    this.frameId = requestAnimationFrame(this.loop)
  }

  private tick(deltaTime: number): void {
    const entities = this.entityManager.getAll()
    const events = this.eventQueue.dequeueAll()

    let newEvents: GameEvent[] = []

    for (const system of this.systems) {
      const systemEvents = system.update(entities, [...events, ...newEvents], deltaTime)
      newEvents = newEvents.concat(systemEvents)
    }

    this.eventQueue.enqueueMultiple(newEvents)

    for (const callback of this.onTickCallbacks) {
      callback(this.timeManager.getTickCount(), deltaTime)
    }
  }

  pause(): void {
    this.timeManager.pause()
  }

  resume(): void {
    this.timeManager.resume()
  }

  isPaused(): boolean {
    return this.timeManager.isPaused()
  }
}

import { entityManager } from './EntityManager'
import { eventQueue } from './EventQueue'
import { timeManager } from './TimeManager'

export const gameLoop = new GameLoop(entityManager, eventQueue, timeManager)
