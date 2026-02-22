import type { GameRoom } from '../types'

type EventCallback = (event: unknown) => void
type ConnectionCallback = (playerId: string) => void
type DisconnectionCallback = (playerId: string) => void

export interface NetworkMessage {
  type: 'event' | 'state_sync' | 'player_joined' | 'player_left' | 'ping' | 'pong'
  payload: unknown
  timestamp: number
  senderId: string
}

export class NetworkService {
  private peerConnection: RTCPeerConnection | null = null
  private dataChannel: RTCDataChannel | null = null
  private connections: Map<string, RTCDataChannel> = new Map()

  private onEventCallbacks: Set<EventCallback> = new Set()
  private onConnectCallbacks: Set<ConnectionCallback> = new Set()
  private onDisconnectCallbacks: Set<DisconnectionCallback> = new Set()

  private localPlayerId: string | null = null
  private isHost = false
  private room: GameRoom | null = null

  async createRoom(playerName: string): Promise<GameRoom> {
    this.isHost = true
    this.localPlayerId = crypto.randomUUID()

    this.room = {
      id: this.generateRoomId(),
      hostId: this.localPlayerId,
      players: [
        {
          id: this.localPlayerId,
          characterId: this.localPlayerId,
          character: {
            id: this.localPlayerId,
            name: playerName,
            class: 'warrior',
            createdAt: Date.now(),
            lastPlayedAt: Date.now(),
            stats: { level: 1, kills: 0, highestFloor: 0, playTimeMs: 0 },
            position: { floor: 0, x: 0, z: 0 },
          },
          isHost: true,
          latency: 0,
          ready: true,
        },
      ],
      state: 'lobby',
      floor: 0,
      createdAt: Date.now(),
    }

    return this.room
  }

  async joinRoom(_roomId: string, _playerName: string): Promise<GameRoom> {
    this.isHost = false
    this.localPlayerId = crypto.randomUUID()

    throw new Error('Multiplayer requires a signaling server. Run in single-player mode.')
  }

  leaveRoom(): void {
    this.connections.forEach((channel) => channel.close())
    this.connections.clear()

    if (this.dataChannel) {
      this.dataChannel.close()
      this.dataChannel = null
    }

    if (this.peerConnection) {
      this.peerConnection.close()
      this.peerConnection = null
    }

    this.room = null
    this.localPlayerId = null
    this.isHost = false
  }

  broadcast(message: NetworkMessage): void {
    const data = JSON.stringify(message)

    if (this.isHost) {
      this.connections.forEach((channel) => {
        if (channel.readyState === 'open') {
          channel.send(data)
        }
      })
    } else if (this.dataChannel?.readyState === 'open') {
      this.dataChannel.send(data)
    }
  }

  sendTo(playerId: string, message: NetworkMessage): void {
    const channel = this.connections.get(playerId)
    if (channel?.readyState === 'open') {
      channel.send(JSON.stringify(message))
    }
  }

  onEvent(callback: EventCallback): () => void {
    this.onEventCallbacks.add(callback)
    return () => this.onEventCallbacks.delete(callback)
  }

  onConnect(callback: ConnectionCallback): () => void {
    this.onConnectCallbacks.add(callback)
    return () => this.onConnectCallbacks.delete(callback)
  }

  onDisconnect(callback: DisconnectionCallback): () => void {
    this.onDisconnectCallbacks.add(callback)
    return () => this.onDisconnectCallbacks.delete(callback)
  }

  getRoom(): GameRoom | null {
    return this.room
  }

  getLocalPlayerId(): string | null {
    return this.localPlayerId
  }

  getIsHost(): boolean {
    return this.isHost
  }

  getIsOnline(): boolean {
    return this.connections.size > 0 || this.dataChannel !== null
  }

  private generateRoomId(): string {
    return Math.random().toString(36).substring(2, 8).toUpperCase()
  }
}

export const networkService = new NetworkService()
