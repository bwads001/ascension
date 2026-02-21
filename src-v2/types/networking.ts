import type { CharacterSave } from './persistence'

export type RoomState = 'lobby' | 'playing' | 'paused'

export interface PlayerConnection {
  id: string
  characterId: string
  character: CharacterSave
  isHost: boolean
  latency: number
  ready: boolean
}

export interface GameRoom {
  id: string
  hostId: string
  players: PlayerConnection[]
  state: RoomState
  floor: number
  createdAt: number
}

export interface NetworkStats {
  ping: number
  uploadRate: number
  downloadRate: number
  packetLoss: number
}
