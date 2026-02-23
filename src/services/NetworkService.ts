import type { GameRoom, PlayerConnection } from '../types'

type EventCallback = (event: unknown) => void
type ConnectionCallback = (playerId: string) => void
type DisconnectionCallback = (playerId: string) => void
type RoomCallback = (room: GameRoom) => void

interface SignalingMessage {
  type: string
  roomId?: string
  playerId?: string
  playerName?: string
  payload?: unknown
  error?: string
}

export interface NetworkMessage {
  type: 'event' | 'state_sync'
  payload: unknown
  timestamp: number
  senderId: string
}

const SIGNALING_URL = import.meta.env.VITE_SIGNALING_URL || 'ws://localhost:8080/ws'

export class NetworkService {
  private ws: WebSocket | null = null
  private peerConnections: Map<string, RTCPeerConnection> = new Map()
  private dataChannels: Map<string, RTCDataChannel> = new Map()

  private onEventCallbacks: Set<EventCallback> = new Set()
  private onConnectCallbacks: Set<ConnectionCallback> = new Set()
  private onDisconnectCallbacks: Set<DisconnectionCallback> = new Set()
  private onRoomUpdateCallbacks: Set<RoomCallback> = new Set()

  private localPlayerId: string | null = null
  private isHost = false
  private room: GameRoom | null = null
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5

  private iceServers = [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ]

  async createRoom(playerName: string): Promise<GameRoom> {
    this.isHost = true

    await this.connect()

    return new Promise((resolve, reject) => {
      const handler = (msg: SignalingMessage) => {
        if (msg.type === 'room_created') {
          this.localPlayerId = msg.playerId!
          this.room = {
            id: msg.roomId!,
            hostId: this.localPlayerId,
            players: [
              {
                id: this.localPlayerId,
                characterId: this.localPlayerId,
                character: this.createCharacter(this.localPlayerId, playerName),
                isHost: true,
                latency: 0,
                ready: true,
              },
            ],
            state: 'lobby',
            floor: 0,
            createdAt: Date.now(),
          }
          this.offMessage(handler)
          resolve(this.room)
        } else if (msg.type === 'error') {
          this.offMessage(handler)
          reject(new Error(msg.error))
        }
      }
      this.onMessage(handler)
      this.send({ type: 'create_room', playerName })
    })
  }

  async joinRoom(roomId: string, playerName: string): Promise<GameRoom> {
    this.isHost = false

    await this.connect()

    return new Promise((resolve, reject) => {
      const handler = (msg: SignalingMessage) => {
        if (msg.type === 'room_joined') {
          this.localPlayerId = msg.playerId!
          const players = (msg.payload as Array<{ id: string; name: string }>).map((p) => ({
            id: p.id,
            characterId: p.id,
            character: this.createCharacter(p.id, p.name),
            isHost: p.id === msg.roomId!.substring(0, 8),
            latency: 0,
            ready: true,
          }))
          this.room = {
            id: msg.roomId!,
            hostId: players.find((p) => p.isHost)?.id ?? '',
            players,
            state: 'lobby',
            floor: 0,
            createdAt: Date.now(),
          }
          this.offMessage(handler)
          resolve(this.room)
        } else if (msg.type === 'error') {
          this.offMessage(handler)
          reject(new Error(msg.error))
        }
      }
      this.onMessage(handler)
      this.send({ type: 'join_room', roomId, playerName })
    })
  }

  leaveRoom(): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.send({ type: 'leave_room' })
    }

    this.dataChannels.forEach((channel) => channel.close())
    this.dataChannels.clear()

    this.peerConnections.forEach((pc) => pc.close())
    this.peerConnections.clear()

    if (this.ws) {
      this.ws.close()
      this.ws = null
    }

    this.room = null
    this.localPlayerId = null
    this.isHost = false
  }

  broadcast(message: NetworkMessage): void {
    const data = JSON.stringify(message)
    this.dataChannels.forEach((channel) => {
      if (channel.readyState === 'open') {
        channel.send(data)
      }
    })
  }

  sendTo(playerId: string, message: NetworkMessage): void {
    const channel = this.dataChannels.get(playerId)
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

  onRoomUpdate(callback: RoomCallback): () => void {
    this.onRoomUpdateCallbacks.add(callback)
    return () => this.onRoomUpdateCallbacks.delete(callback)
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
    return this.ws?.readyState === WebSocket.OPEN
  }

  private async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(SIGNALING_URL)

      this.ws.onopen = () => {
        this.reconnectAttempts = 0
        resolve()
      }

      this.ws.onerror = () => {
        reject(new Error('Failed to connect to signaling server'))
      }

      this.ws.onclose = () => {
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
          this.reconnectAttempts++
          setTimeout(() => this.connect(), 1000 * this.reconnectAttempts)
        }
      }

      this.ws.onmessage = (event) => {
        const msg = JSON.parse(event.data) as SignalingMessage
        this.handleSignalingMessage(msg)
      }
    })
  }

  private handleSignalingMessage(msg: SignalingMessage): void {
    switch (msg.type) {
      case 'player_joined':
        if (this.room && msg.playerId && msg.playerName) {
          this.room.players.push({
            id: msg.playerId,
            characterId: msg.playerId,
            character: this.createCharacter(msg.playerId, msg.playerName),
            isHost: false,
            latency: 0,
            ready: true,
          })
          this.onRoomUpdateCallbacks.forEach((cb) => cb(this.room!))
          if (this.isHost) {
            this.createPeerConnection(msg.playerId, true)
          }
        }
        break

      case 'player_left':
        if (this.room && msg.playerId) {
          this.room.players = this.room.players.filter((p) => p.id !== msg.playerId)
          this.onRoomUpdateCallbacks.forEach((cb) => cb(this.room!))
          this.peerConnections.get(msg.playerId)?.close()
          this.peerConnections.delete(msg.playerId)
          this.dataChannels.delete(msg.playerId)
        }
        break

      case 'offer':
        if (msg.playerId && !this.isHost) {
          this.handleOffer(msg.playerId, msg.payload as RTCSessionDescriptionInit)
        }
        break

      case 'answer':
        if (msg.playerId && this.isHost) {
          this.handleAnswer(msg.playerId, msg.payload as RTCSessionDescriptionInit)
        }
        break

      case 'ice_candidate':
        if (msg.playerId) {
          this.handleIceCandidate(msg.playerId, msg.payload as RTCIceCandidateInit)
        }
        break
    }

    if (this.messageHandlers.has(msg.type)) {
      this.messageHandlers.get(msg.type)?.(msg)
    }
  }

  private messageHandlers: Map<string, (msg: SignalingMessage) => void> = new Map()

  private onMessage(handler: (msg: SignalingMessage) => void): void {
    const types = ['room_created', 'room_joined', 'error']
    types.forEach((type) => this.messageHandlers.set(type, handler))
  }

  private offMessage(_handler: (msg: SignalingMessage) => void): void {
    const types = ['room_created', 'room_joined', 'error']
    types.forEach((type) => this.messageHandlers.delete(type))
  }

  private send(msg: SignalingMessage): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(msg))
    }
  }

  private createPeerConnection(playerId: string, isInitiator: boolean): RTCPeerConnection {
    const pc = new RTCPeerConnection({ iceServers: this.iceServers })
    this.peerConnections.set(playerId, pc)

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        this.send({
          type: 'ice_candidate',
          playerId,
          payload: event.candidate.toJSON(),
        })
      }
    }

    if (isInitiator) {
      const channel = pc.createDataChannel('game')
      this.setupDataChannel(channel, playerId)
      pc.createOffer().then((offer) => {
        pc.setLocalDescription(offer)
        this.send({ type: 'offer', playerId, payload: offer })
      })
    } else {
      pc.ondatachannel = (event) => {
        this.setupDataChannel(event.channel, playerId)
      }
    }

    return pc
  }

  private setupDataChannel(channel: RTCDataChannel, playerId: string): void {
    this.dataChannels.set(playerId, channel)

    channel.onopen = () => {
      this.onConnectCallbacks.forEach((cb) => cb(playerId))
    }

    channel.onclose = () => {
      this.onDisconnectCallbacks.forEach((cb) => cb(playerId))
    }

    channel.onmessage = (event) => {
      const msg = JSON.parse(event.data) as NetworkMessage
      this.onEventCallbacks.forEach((cb) => cb(msg.payload))
    }
  }

  private async handleOffer(playerId: string, offer: RTCSessionDescriptionInit): Promise<void> {
    const pc = this.createPeerConnection(playerId, false)
    await pc.setRemoteDescription(new RTCSessionDescription(offer))
    const answer = await pc.createAnswer()
    await pc.setLocalDescription(answer)
    this.send({ type: 'answer', playerId, payload: answer })
  }

  private async handleAnswer(playerId: string, answer: RTCSessionDescriptionInit): Promise<void> {
    const pc = this.peerConnections.get(playerId)
    if (pc) {
      await pc.setRemoteDescription(new RTCSessionDescription(answer))
    }
  }

  private async handleIceCandidate(
    playerId: string,
    candidate: RTCIceCandidateInit
  ): Promise<void> {
    const pc = this.peerConnections.get(playerId)
    if (pc) {
      await pc.addIceCandidate(new RTCIceCandidate(candidate))
    }
  }

  private createCharacter(id: string, name: string): PlayerConnection['character'] {
    return {
      id,
      name,
      class: 'warrior',
      createdAt: Date.now(),
      lastPlayedAt: Date.now(),
      stats: {
        level: 1,
        xp: 0,
        xpToNextLevel: 150,
        kills: 0,
        highestFloor: 0,
        playTimeMs: 0,
        attributes: { strength: 5, agility: 5, intellect: 5, stamina: 5 },
        unspentPoints: 0,
      },
      position: { floor: 0, x: 0, z: 0 },
    }
  }
}

export const networkService = new NetworkService()
