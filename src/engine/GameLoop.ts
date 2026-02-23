import { useWorldStore } from '../store'
import type { System, GameEvent, Entity } from '../types'
import { eventQueue } from './EventQueue'
import { timeManager } from './TimeManager'

type GameLoopCallback = (tick: number, deltaTime: number) => void

export class GameLoop {
  private running = false
  private frameId: number | null = null
  private systems: System[] = []
  private onTickCallbacks: GameLoopCallback[] = []

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
    timeManager.start()
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
    timeManager.update(currentTime)

    while (timeManager.shouldTick()) {
      const deltaTime = timeManager.consumeTick()
      this.tick(deltaTime)
    }

    this.frameId = requestAnimationFrame(this.loop)
  }

  private tick(deltaTime: number): void {
    const entities = Object.values(useWorldStore.getState().entities) as Entity[]
    const events = eventQueue.dequeueAll()

    let newEvents: GameEvent[] = []

    for (const system of this.systems) {
      const systemEvents = system.update(entities, [...events, ...newEvents], deltaTime)
      newEvents = newEvents.concat(systemEvents)
    }

    for (const event of newEvents) {
      eventQueue.emit(event)
    }

    for (const callback of this.onTickCallbacks) {
      callback(timeManager.getTickCount(), deltaTime)
    }
  }

  pause(): void {
    timeManager.pause()
  }

  resume(): void {
    timeManager.resume()
  }

  isPaused(): boolean {
    return timeManager.isPaused()
  }
}

export const gameLoop = new GameLoop()
