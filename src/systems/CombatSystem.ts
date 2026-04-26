import { useCombatStore, useDamageNumberStore, useWorldStore } from '../store'
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

function calculatePlayerDamage(entity: Entity): number {
  const combat = entity.components.combat
  const player = entity.components.player

  if (!combat) return 8

  let baseDamage = combat.attackDamage

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

  return baseDamage
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
    const store = useWorldStore.getState()
    // Read fresh state from store to avoid stale snapshot positions
    const attacker = store.entities[attackerId] ?? entities.find((e) => e.id === attackerId)
    const target = store.entities[targetId] ?? entities.find((e) => e.id === targetId)

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

    store.updateEntity(attackerId, {
      combat: { ...combat, lastAttackTime: currentTime },
    })

    const damage = calculatePlayerDamage(attacker)
    return createDamageDealtEvent(attackerId, targetId, damage)
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

    const targetPos = target.components.position
    if (targetPos) {
      const isPlayerDamage = !!target.components.player
      useDamageNumberStore
        .getState()
        .addDamageNumber(targetPos.x, 1, targetPos.z, amount, isPlayerDamage)
    }

    this.damageSourceMap.set(targetId, sourceId)

    const health = target.components.health
    const newHealth = Math.max(0, health.current - amount)

    const store = useWorldStore.getState()
    store.updateEntity(targetId, {
      health: {
        ...health,
        current: newHealth,
        dead: newHealth <= 0,
      },
    })

    if (newHealth <= 0 && !health.dead) {
      const killerId = this.damageSourceMap.get(targetId)
      emittedEvents.push(createEntityDiedEvent(targetId, killerId))
    }
  }

  private applyHeal(entityId: string, amount: number): void {
    const store = useWorldStore.getState()
    const entity = store.entities[entityId]
    if (!entity?.components.health) return

    const health = entity.components.health
    const newHealth = Math.min(health.max, health.current + amount)

    store.updateEntity(entityId, {
      health: { ...health, current: newHealth },
    })
  }

  private handleDeath(entityId: string, killedBy: string | undefined): void {
    if (!killedBy) return

    const store = useWorldStore.getState()
    const killer = store.entities[killedBy]
    if (!killer?.components.player) return

    const currentKills = killer.components.player.kills
    store.updateEntity(killedBy, {
      player: { ...killer.components.player, kills: currentKills + 1 },
    })

    this.damageSourceMap.delete(entityId)
  }
}

export const combatSystem = new CombatSystem()
