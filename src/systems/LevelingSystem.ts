import { useWorldStore } from '../store'
import type { System, GameEvent, Entity } from '../types'
import { getXpRequiredForLevel } from '../types/entities'
import { getAvailableSkills, SKILLS } from '../types/skills'

export class LevelingSystem implements System {
  readonly name = 'LevelingSystem'
  readonly priority = 25

  private previousLevels: Map<string, number> = new Map()

  update(entities: Entity[], events: GameEvent[], _deltaTime: number): GameEvent[] {
    const store = useWorldStore.getState()
    const emittedEvents: GameEvent[] = []

    for (const event of events) {
      if (event.type === 'ENTITY_DIED') {
        this.grantXp(event.killedBy, event.entityId, entities, store)
      }
    }

    for (const entity of entities) {
      if (entity.type !== 'player') continue
      if (!entity.components.player) continue

      const leveledUp = this.checkLevelUp(entity, store)
      if (leveledUp) {
        const newSkills = this.getNewlyUnlockedSkills(entity, entity.components.player.level)
        for (const skillId of newSkills) {
          emittedEvents.push({
            type: 'SKILL_UNLOCKED',
            timestamp: performance.now(),
            entityId: entity.id,
            skillId,
          })
        }
      }
    }

    return emittedEvents
  }

  private grantXp(
    killerId: string | undefined,
    targetId: string,
    entities: Entity[],
    store: ReturnType<typeof useWorldStore.getState>
  ): void {
    if (!killerId) return

    const killer = store.entities[killerId]
    const target = entities.find((e) => e.id === targetId)

    if (!killer?.components.player || !target?.components.monster) return

    const player = killer.components.player
    const monsterType = target.components.monster.type

    const xpGained = this.getXpFromMonster(monsterType)
    const newXp = player.xp + xpGained

    store.updateEntity(killerId, {
      player: { ...player, xp: newXp },
    })
  }

  private getXpFromMonster(monsterType: string): number {
    const xpValues: Record<string, number> = {
      slime: 15,
      rat: 12,
      skeleton: 30,
    }
    return xpValues[monsterType] ?? 10
  }

  private checkLevelUp(entity: Entity, store: ReturnType<typeof useWorldStore.getState>): boolean {
    const player = entity.components.player!

    if (player.xp < player.xpToNextLevel) return false

    const newLevel = player.level + 1
    const remainingXp = player.xp - player.xpToNextLevel
    const newXpToNextLevel = getXpRequiredForLevel(newLevel + 1)

    store.updateEntity(entity.id, {
      player: {
        ...player,
        level: newLevel,
        xp: remainingXp,
        xpToNextLevel: newXpToNextLevel,
        unspentPoints: player.unspentPoints + 3,
      },
    })

    return true
  }

  private getNewlyUnlockedSkills(entity: Entity, newLevel: number): string[] {
    const player = entity.components.player!
    const prevLevel = this.previousLevels.get(entity.id) ?? 1
    this.previousLevels.set(entity.id, newLevel)

    const unlocked: string[] = []
    const available = getAvailableSkills(player.class, newLevel)

    for (const skillId of available) {
      const skill = SKILLS[skillId]
      if (skill && skill.unlockLevel > prevLevel && skill.unlockLevel <= newLevel) {
        unlocked.push(skillId)
      }
    }

    return unlocked
  }
}

export const levelingSystem = new LevelingSystem()
