import { create } from 'zustand'

import { persistenceService } from '../services'
import type { CharacterSave, GameSettings } from '../types'
import { createDefaultSaveData, createNewCharacter } from '../types'

interface CharacterState {
  characters: CharacterSave[]
  currentCharacterId: string | null
  settings: GameSettings
  loaded: boolean

  load: () => Promise<void>
  save: () => Promise<void>
  createCharacter: (name: string, playerClass: 'warrior' | 'archer' | 'mage') => CharacterSave
  deleteCharacter: (id: string) => Promise<void>
  selectCharacter: (id: string) => void
  updateCharacter: (character: CharacterSave) => void
  updateSettings: (settings: Partial<GameSettings>) => void
  getCurrentCharacter: () => CharacterSave | undefined
}

export const useCharacterStore = create<CharacterState>((set, get) => ({
  characters: [],
  currentCharacterId: null,
  settings: createDefaultSaveData().settings,
  loaded: false,

  load: async () => {
    const data = await persistenceService.load()
    set({
      characters: data.characters,
      currentCharacterId: data.lastCharacterId,
      settings: data.settings,
      loaded: true,
    })
  },

  save: async () => {
    const { characters, currentCharacterId, settings } = get()
    await persistenceService.save({
      version: 1,
      characters,
      settings,
      lastCharacterId: currentCharacterId,
    })
  },

  createCharacter: (name, playerClass) => {
    const character = createNewCharacter(name, playerClass)
    set((state) => ({
      characters: [...state.characters, character],
      currentCharacterId: character.id,
    }))
    get().save()
    return character
  },

  deleteCharacter: async (id) => {
    await persistenceService.deleteCharacter(id)
    set((state) => {
      const characters = state.characters.filter((c) => c.id !== id)
      const currentCharacterId =
        state.currentCharacterId === id ? (characters[0]?.id ?? null) : state.currentCharacterId

      return { characters, currentCharacterId }
    })
  },

  selectCharacter: (id) => {
    set({ currentCharacterId: id })
    get().save()
  },

  updateCharacter: (character) => {
    set((state) => {
      const characters = state.characters.map((c) => (c.id === character.id ? character : c))
      return { characters }
    })
    get().save()
  },

  updateSettings: (newSettings) => {
    set((state) => ({
      settings: { ...state.settings, ...newSettings },
    }))
    get().save()
  },

  getCurrentCharacter: () => {
    const { characters, currentCharacterId } = get()
    return characters.find((c) => c.id === currentCharacterId)
  },
}))
