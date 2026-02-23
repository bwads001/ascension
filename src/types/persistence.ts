import type { PlayerClass, Attributes } from './entities'

export interface CharacterStats {
  level: number
  xp: number
  xpToNextLevel: number
  kills: number
  highestFloor: number
  playTimeMs: number
  attributes: Attributes
  unspentPoints: number
}

export interface CharacterPosition {
  floor: number
  x: number
  z: number
}

export interface CharacterSave {
  id: string
  name: string
  class: PlayerClass
  createdAt: number
  lastPlayedAt: number
  stats: CharacterStats
  position: CharacterPosition
}

export interface GameSettings {
  musicVolume: number
  sfxVolume: number
  fullscreen: boolean
}

export interface SaveData {
  version: number
  characters: CharacterSave[]
  settings: GameSettings
  lastCharacterId: string | null
}

export const DEFAULT_SETTINGS: GameSettings = {
  musicVolume: 0.7,
  sfxVolume: 0.8,
  fullscreen: false,
}

export const SAVE_VERSION = 1

export function createDefaultSaveData(): SaveData {
  return {
    version: SAVE_VERSION,
    characters: [],
    settings: DEFAULT_SETTINGS,
    lastCharacterId: null,
  }
}

export function createNewCharacter(name: string, playerClass: PlayerClass): CharacterSave {
  return {
    id: crypto.randomUUID(),
    name,
    class: playerClass,
    createdAt: Date.now(),
    lastPlayedAt: Date.now(),
    stats: {
      level: 1,
      xp: 0,
      xpToNextLevel: 150,
      kills: 0,
      highestFloor: 0,
      playTimeMs: 0,
      attributes: {
        strength: 5,
        agility: 5,
        intellect: 5,
        stamina: 5,
      },
      unspentPoints: 0,
    },
    position: {
      floor: 0,
      x: 0,
      z: 0,
    },
  }
}
