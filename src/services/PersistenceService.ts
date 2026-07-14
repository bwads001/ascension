import type { SaveData, CharacterSave, GameSettings } from '../types'
import { createDefaultSaveData, SAVE_VERSION } from '../types'

const STORAGE_KEY = 'ascension_save_data'

export class PersistenceService {
  private cache: SaveData | null = null

  async load(): Promise<SaveData> {
    if (this.cache) {
      return this.cache
    }

    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (!raw) {
        this.cache = createDefaultSaveData()
        return this.cache
      }

      const data = JSON.parse(raw) as SaveData

      if (data.version !== SAVE_VERSION) {
        this.cache = await this.migrate(data)
      } else {
        this.cache = data
      }

      return this.cache
    } catch {
      console.error('Failed to load save data')
      this.cache = createDefaultSaveData()
      return this.cache
    }
  }

  async save(data: SaveData): Promise<void> {
    try {
      data.version = SAVE_VERSION
      const raw = JSON.stringify(data)
      localStorage.setItem(STORAGE_KEY, raw)
      this.cache = data
    } catch (error) {
      console.error('Failed to save data:', error)
      throw error
    }
  }

  async getCharacter(id: string): Promise<CharacterSave | undefined> {
    const data = await this.load()
    return data.characters.find((c) => c.id === id)
  }

  async saveCharacter(character: CharacterSave): Promise<void> {
    const data = await this.load()
    const index = data.characters.findIndex((c) => c.id === character.id)

    if (index >= 0) {
      data.characters[index] = character
    } else {
      data.characters.push(character)
    }

    data.lastCharacterId = character.id
    await this.save(data)
  }

  async deleteCharacter(id: string): Promise<void> {
    const data = await this.load()
    data.characters = data.characters.filter((c) => c.id !== id)

    if (data.lastCharacterId === id) {
      data.lastCharacterId = data.characters[0]?.id ?? null
    }

    await this.save(data)
  }

  async getSettings(): Promise<GameSettings> {
    const data = await this.load()
    return data.settings
  }

  async saveSettings(settings: GameSettings): Promise<void> {
    const data = await this.load()
    data.settings = settings
    await this.save(data)
  }

  async getLastCharacterId(): Promise<string | null> {
    const data = await this.load()
    return data.lastCharacterId
  }

  clearCache(): void {
    this.cache = null
  }

  async reset(): Promise<void> {
    this.cache = createDefaultSaveData()
    localStorage.removeItem(STORAGE_KEY)
  }

  private async migrate(data: SaveData): Promise<SaveData> {
    console.log(`Migrating save data from version ${data.version} to ${SAVE_VERSION}`)

    const migrated = createDefaultSaveData()
    migrated.settings = { ...migrated.settings, ...data.settings }
    migrated.lastCharacterId = data.lastCharacterId ?? null

    migrated.characters = (data.characters ?? []).map((char) => {
      const stats = char.stats

      return {
        ...char,
        stats: {
          level: stats.level ?? 1,
          xp: stats.xp ?? 0,
          xpToNextLevel: stats.xpToNextLevel ?? 150,
          kills: stats.kills ?? 0,
          highestFloor: stats.highestFloor ?? 0,
          playTimeMs: stats.playTimeMs ?? 0,
          attributes: stats.attributes ?? {
            strength: 5,
            agility: 5,
            intellect: 5,
            stamina: 5,
          },
          unspentPoints: stats.unspentPoints ?? 0,
          equipment: stats.equipment ?? {},
          inventory: stats.inventory ?? [],
          potions: stats.potions ?? 3,
        },
      }
    })

    return migrated
  }
}

export const persistenceService = new PersistenceService()
