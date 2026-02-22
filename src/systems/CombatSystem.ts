import { entityManager } from '../engine/EntityManager'
import { useCombatStore } from '../store'
import type { System, GameEvent, Entity } from '../types'
import { inRange } from '../utils/math'

function createDamageDealtEvent(sourceId: string, targetId: string, amount: number): GameEvent {
  return {
    type: 'DAMAGE_DEALT',
    timestamp: performance.now(),
    sourceId,
    targetId,
    amount,
  }
}

function createEntityDiedEvent(entityId: string, killedBy?: string): GameEvent {
  return {
    type: 'ENTITY_DIED',
    timestamp: performance.now(),
    entityId,
    killedBy,
  }
}

export class CombatSystem implements System {
  readonly name = 'CombatSystem'
  readonly priority = 20

  private damageSourceMap: Map<string, string> = new Map()

  update(entities: Entity[], events: GameEvent[], _deltaTime: number): GameEvent[] {
    const emittedEvents: GameEvent[] = []
    const currentTime = performance.now()

    for (const event of events) {
      if (event.type === 'ATTACK_ENTITY') {
        const result = this.handleAttack(event.attackerId, event.targetId, entities, currentTime)
        if (result) emittedEvents.push(result)
      } else if (event.type === 'DAMAGE_DEALT') {
        this.applyDamage(event.sourceId, event.targetId, event.amount, entities, emittedEvents)
      } else if (event.type === 'HEAL') {
        this.applyHeal(event.entityId, event.amount)
      } else if (event.type === 'ENTITY_DIED') {
        this.handleDeath(event.entityId, event.killedBy)
      }
    }

    return emittedEvents
  }

  private handleAttack(
    attackerId: string,
    targetId: string,
    entities: Entity[],
    currentTime: number
  ): GameEvent | null {
    const attacker = entities.find((e) => e.id === attackerId)
    const target = entities.find((e) => e.id === targetId)

    if (!attacker?.components.combat || !target?.components.health) return null
    if (!attacker.components.position || !target.components.position) return null
    if (target.components.health.dead) return null

    const combat = attacker.components.combat
    const attackerPos = attacker.components.position
    const targetPos = target.components.position

    if (!inRange(attackerPos, targetPos, combat.attackRange)) {
      return null
    }

    if (!this.canAttack(attackerId, currentTime)) {
      return null
    }

    this.setCooldown(attackerId, currentTime, combat.attackCooldown)

    return createDamageDealtEvent(attackerId, targetId, combat.attackDamage)
  }

  private canAttack(entityId: string, currentTime: number): boolean {
    const combatStore = useCombatStore.getState()
    return combatStore.canAttack(entityId, currentTime)
  }

  private setCooldown(entityId: string, currentTime: number, cooldown: number): void {
    const combatStore = useCombatStore.getState()
    combatStore.setCooldown(entityId, currentTime, cooldown)
  }

  private applyDamage(
    sourceId: string,
    targetId: string,
    amount: number,
    entities: Entity[],
    emittedEvents: GameEvent[]
  ): void {
    const target = entities.find((e) => e.id === targetId)
    if (!target?.components.health) return

    this.damageSourceMap.set(targetId, sourceId)

    const health = target.components.health
    const newHealth = Math.max(0, health.current - amount)

    entityManager.updateComponent(targetId, 'health', {
      current: newHealth,
      dead: newHealth <= 0,
    })

    if (newHealth <= 0 && !health.dead) {
      const killerId = this.damageSourceMap.get(targetId)
      emittedEvents.push(createEntityDiedEvent(targetId, killerId))
    }
  }

  private applyHeal(entityId: string, amount: number): void {
    const entity = entityManager.get(entityId)
    if (!entity?.components.health) return

    const health = entity.components.health
    const newHealth = Math.min(health.max, health.current + amount)

    entityManager.updateComponent(entityId, 'health', {
      current: newHealth,
    })
  }

  private handleDeath(entityId: string, killedBy?: string): void {
    if (!killedBy) return

    const killer = entityManager.get(killedBy)
    if (!killer?.components.player) return

    const currentKills = killer.components.player.kills
    entityManager.updateComponent(killedBy, 'player', {
      kills: currentKills + 1,
    })

    this.damageSourceMap.delete(entityId)
  }
}

export const combatSystem = new CombatSystem()
