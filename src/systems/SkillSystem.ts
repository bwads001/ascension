import { useDamageNumberStore, useWorldStore } from '../store'
import type { System, GameEvent, Entity } from '../types'
import { SKILLS } from '../types/skills'
import { inRange, distanceXZ } from '../utils/math'

export class SkillSystem implements System {
  readonly name = 'SkillSystem'
  readonly priority = 18

  update(entities: Entity[], events: GameEvent[], _deltaTime: number): GameEvent[] {
    const emittedEvents: GameEvent[] = []
    const store = useWorldStore.getState()

    for (const event of events) {
      if (event.type === 'USE_SKILL') {
        this.handleUseSkill(
          event.entityId,
          event.skillId,
          event.targetId,
          entities,
          store,
          emittedEvents
        )
      }
    }

    return emittedEvents
  }

  private handleUseSkill(
    entityId: string,
    skillId: string,
    targetId: string,
    entities: Entity[],
    store: ReturnType<typeof useWorldStore.getState>,
    emittedEvents: GameEvent[]
  ): void {
    const skill = SKILLS[skillId]
    if (!skill) return

    const user = store.entities[entityId]
    if (!user?.components.position) return

    if (skill.targetType === 'self') {
      this.executeSelfSkill(user, skill, store, emittedEvents)
    } else if (skill.targetType === 'enemy') {
      const target = store.entities[targetId]
      if (
        target &&
        target.components.position &&
        target.components.health &&
        !target.components.health.dead
      ) {
        if (inRange(user.components.position, target.components.position, skill.range)) {
          this.executeEnemySkill(user, target, skill, store, emittedEvents)
        }
      }
    } else if (skill.targetType === 'area') {
      this.executeAreaSkill(user, skill, entities, store, emittedEvents)
    }
  }

  private executeSelfSkill(
    user: Entity,
    skill: (typeof SKILLS)[string],
    store: ReturnType<typeof useWorldStore.getState>,
    _emittedEvents: GameEvent[]
  ): void {
    if (skill.id === 'heal') {
      const health = user.components.health
      if (health) {
        const healAmount = Math.floor(health.max * 0.3)
        const newHealth = Math.min(health.max, health.current + healAmount)
        store.updateEntity(user.id, {
          health: { ...health, current: newHealth },
        })
      }
    } else if (skill.id === 'battle_cry') {
      store.updateEntity(user.id, {
        player: { ...user.components.player!, name: user.components.player!.name + ' ⚡' },
      })
      setTimeout(() => {
        const current = store.entities[user.id]
        if (current?.components.player) {
          store.updateEntity(user.id, {
            player: {
              ...current.components.player,
              name: current.components.player.name.replace(' ⚡', ''),
            },
          })
        }
      }, 5000)
    } else if (skill.id === 'evasion') {
      // Evasion - for now just note it
    }
  }

  private executeEnemySkill(
    user: Entity,
    target: Entity,
    skill: (typeof SKILLS)[string],
    store: ReturnType<typeof useWorldStore.getState>,
    emittedEvents: GameEvent[]
  ): void {
    const multiplier = skill.damageMultiplier ?? 1
    let baseDamage = user.components.combat?.attackDamage ?? 10

    const player = user.components.player
    if (player) {
      const attrs = player.attributes
      switch (player.class) {
        case 'warrior':
          baseDamage += attrs.strength * 2
          break
        case 'archer':
          baseDamage += attrs.agility * 2
          break
        case 'mage':
          baseDamage += attrs.intellect * 2
          break
      }
    }

    const damage = Math.floor(baseDamage * multiplier)

    if (target.components.health) {
      const health = target.components.health
      const newHealth = Math.max(0, health.current - damage)

      store.updateEntity(target.id, {
        health: {
          ...health,
          current: newHealth,
          dead: newHealth <= 0,
        },
      })

      const targetPos = target.components.position
      if (targetPos) {
        const isPlayerDamage = !!target.components.player
        useDamageNumberStore
          .getState()
          .addDamageNumber(targetPos.x, 1, targetPos.z, damage, isPlayerDamage)
      }

      if (newHealth <= 0 && !health.dead) {
        emittedEvents.push({
          type: 'ENTITY_DIED',
          timestamp: performance.now(),
          entityId: target.id,
          killedBy: user.id,
        })
      }
    }
  }

  private executeAreaSkill(
    user: Entity,
    skill: (typeof SKILLS)[string],
    entities: Entity[],
    store: ReturnType<typeof useWorldStore.getState>,
    emittedEvents: GameEvent[]
  ): void {
    const userPos = user.components.position
    if (!userPos) return

    const radius = skill.areaRadius ?? skill.range
    const multiplier = skill.damageMultiplier ?? 1
    let baseDamage = user.components.combat?.attackDamage ?? 10

    const player = user.components.player
    if (player) {
      const attrs = player.attributes
      switch (player.class) {
        case 'warrior':
          baseDamage += attrs.strength * 2
          break
        case 'archer':
          baseDamage += attrs.agility * 2
          break
        case 'mage':
          baseDamage += attrs.intellect * 2
          break
      }
    }

    const damage = Math.floor(baseDamage * multiplier)

    for (const entity of entities) {
      if (entity.type !== 'monster') continue
      if (!entity.components.position || !entity.components.health) continue
      if (entity.components.health.dead) continue

      const dist = distanceXZ(userPos, entity.components.position)
      if (dist <= radius) {
        const health = entity.components.health
        const newHealth = Math.max(0, health.current - damage)

        store.updateEntity(entity.id, {
          health: {
            ...health,
            current: newHealth,
            dead: newHealth <= 0,
          },
        })

        const entityPos = entity.components.position
        if (entityPos) {
          useDamageNumberStore
            .getState()
            .addDamageNumber(entityPos.x, 1, entityPos.z, damage, false)
        }

        if (newHealth <= 0 && !health.dead) {
          emittedEvents.push({
            type: 'ENTITY_DIED',
            timestamp: performance.now(),
            entityId: entity.id,
            killedBy: user.id,
          })
        }
      }
    }
  }
}

export const skillSystem = new SkillSystem()
