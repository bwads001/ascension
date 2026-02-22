import { eventQueue } from '../engine/EventQueue'
import { networkService, type NetworkMessage } from '../services/NetworkService'
import type { System, GameEvent, Entity } from '../types'

export class NetworkSystem implements System {
  readonly name = 'NetworkSystem'
  readonly priority = 0

  private lastSyncTime = 0
  private syncInterval = 100

  private unsubscribe: (() => void) | null = null

  init(): void {
    this.unsubscribe = networkService.onEvent((event) => {
      this.handleRemoteEvent(event as GameEvent)
    })
  }

  destroy(): void {
    if (this.unsubscribe) {
      this.unsubscribe()
      this.unsubscribe = null
    }
  }

  update(entities: Entity[], events: GameEvent[], _deltaTime: number): GameEvent[] {
    const isOnline = networkService.getIsOnline()
    const isHost = networkService.getIsHost()

    if (!isOnline) return []

    const emittedEvents: GameEvent[] = []
    const currentTime = performance.now()

    if (isHost) {
      for (const event of events) {
        if (this.shouldSyncEvent(event)) {
          this.broadcastEvent(event)
        }
      }

      if (currentTime - this.lastSyncTime >= this.syncInterval) {
        this.broadcastStateSync(entities)
        this.lastSyncTime = currentTime
      }
    } else {
      for (const event of events) {
        if (this.shouldSendToHost(event)) {
          this.sendToHost(event)
        }
      }
    }

    return emittedEvents
  }

  private shouldSyncEvent(event: GameEvent): boolean {
    const syncableEvents: GameEvent['type'][] = [
      'DAMAGE_DEALT',
      'ENTITY_DIED',
      'ENTITY_SPAWNED',
      'ENTITY_DESTROYED',
      'HEAL',
      'FLOOR_TRANSITION',
    ]
    return syncableEvents.includes(event.type)
  }

  private shouldSendToHost(event: GameEvent): boolean {
    const clientEvents: GameEvent['type'][] = ['MOVE_TO', 'ATTACK_ENTITY', 'INTERACT']
    return clientEvents.includes(event.type)
  }

  private broadcastEvent(event: GameEvent): void {
    const message: NetworkMessage = {
      type: 'event',
      payload: event,
      timestamp: performance.now(),
      senderId: networkService.getLocalPlayerId() ?? '',
    }
    networkService.broadcast(message)
  }

  private sendToHost(event: GameEvent): void {
    const hostId = networkService.getRoom()?.hostId
    if (!hostId) return

    const message: NetworkMessage = {
      type: 'event',
      payload: event,
      timestamp: performance.now(),
      senderId: networkService.getLocalPlayerId() ?? '',
    }
    networkService.sendTo(hostId, message)
  }

  private broadcastStateSync(entities: Entity[]): void {
    const state = entities.map((e) => ({
      id: e.id,
      type: e.type,
      components: e.components,
    }))

    const message: NetworkMessage = {
      type: 'state_sync',
      payload: state,
      timestamp: performance.now(),
      senderId: networkService.getLocalPlayerId() ?? '',
    }
    networkService.broadcast(message)
  }

  private handleRemoteEvent(event: GameEvent): void {
    eventQueue.enqueue(event)
  }
}

export const networkSystem = new NetworkSystem()
