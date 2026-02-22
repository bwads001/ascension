import type { GameEvent, GameEventType } from '../types'

type EventCallback = (event: GameEvent) => void

export class EventQueue {
  private queue: GameEvent[] = []
  private listeners: Map<GameEventType, Set<EventCallback>> = new Map()
  private allListeners: Set<EventCallback> = new Set()

  enqueue(event: GameEvent): void {
    this.queue.push(event)
  }

  enqueueMultiple(events: GameEvent[]): void {
    this.queue.push(...events)
  }

  dequeue(): GameEvent | undefined {
    return this.queue.shift()
  }

  dequeueAll(): GameEvent[] {
    const events = [...this.queue]
    this.queue = []
    return events
  }

  peek(): GameEvent | undefined {
    return this.queue[0]
  }

  clear(): void {
    this.queue = []
  }

  size(): number {
    return this.queue.length
  }

  isEmpty(): boolean {
    return this.queue.length === 0
  }

  on(eventType: GameEventType, callback: EventCallback): () => void {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set())
    }
    this.listeners.get(eventType)!.add(callback)

    return () => {
      this.listeners.get(eventType)?.delete(callback)
    }
  }

  onAll(callback: EventCallback): () => void {
    this.allListeners.add(callback)
    return () => {
      this.allListeners.delete(callback)
    }
  }

  emit(event: GameEvent): void {
    const listeners = this.listeners.get(event.type)
    if (listeners) {
      listeners.forEach((cb) => cb(event))
    }
    this.allListeners.forEach((cb) => cb(event))
  }

  processAll(): void {
    while (this.queue.length > 0) {
      const event = this.queue.shift()!
      this.emit(event)
    }
  }

  processBatch(maxCount: number): number {
    let processed = 0
    while (this.queue.length > 0 && processed < maxCount) {
      const event = this.queue.shift()!
      this.emit(event)
      processed++
    }
    return processed
  }
}

export const eventQueue = new EventQueue()
