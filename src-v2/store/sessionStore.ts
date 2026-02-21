import { create } from 'zustand'

import type { GameRoom, PlayerConnection } from '../types'

interface SessionState {
  room: GameRoom | null
  localPlayerId: string | null
  isHost: boolean
  isOnline: boolean

  setRoom: (room: GameRoom | null) => void
  setLocalPlayerId: (id: string | null) => void
  setIsHost: (isHost: boolean) => void
  setIsOnline: (isOnline: boolean) => void
  addPlayer: (player: PlayerConnection) => void
  removePlayer: (playerId: string) => void
  reset: () => void
}

export const useSessionStore = create<SessionState>((set, get) => ({
  room: null,
  localPlayerId: null,
  isHost: false,
  isOnline: false,

  setRoom: (room) => set({ room }),

  setLocalPlayerId: (id) => set({ localPlayerId: id }),

  setIsHost: (isHost) => set({ isHost }),

  setIsOnline: (isOnline) => set({ isOnline }),

  addPlayer: (player) => {
    const { room } = get()
    if (!room) return

    set({
      room: {
        ...room,
        players: [...room.players, player],
      },
    })
  },

  removePlayer: (playerId) => {
    const { room } = get()
    if (!room) return

    set({
      room: {
        ...room,
        players: room.players.filter((p) => p.id !== playerId),
      },
    })
  },

  reset: () =>
    set({
      room: null,
      localPlayerId: null,
      isHost: false,
      isOnline: false,
    }),
}))
