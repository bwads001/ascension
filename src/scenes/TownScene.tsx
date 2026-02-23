import { useEffect, useMemo } from 'react'

import DamageNumbers from '../effects/DamageNumbers'
import { gameLoop } from '../engine/GameLoop'
import { Player, Monster } from '../entities'
import { useCharacterStore, useUIStore, useWorldStore } from '../store'
import {
  movementSystem,
  interactionSystem,
  aiSystem,
  combatSystem,
  levelingSystem,
  regenSystem,
  skillSystem,
} from '../systems'
import { PLAYER_DEFAULTS, MONSTER_DEFAULTS } from '../types'
import type { MonsterType, Entity } from '../types'
import { Floor, Camera, Wilderness, Town, Well, TowerEntrance } from '../world'

const MONSTER_SPAWNS: Array<{ type: MonsterType; position: [number, number, number] }> = [
  { type: 'slime', position: [15, 0, 5] },
  { type: 'slime', position: [-15, 0, 8] },
  { type: 'slime', position: [10, 0, -18] },
  { type: 'rat', position: [18, 0, -10] },
  { type: 'rat', position: [-12, 0, -15] },
  { type: 'skeleton', position: [-18, 0, 0] },
  { type: 'skeleton', position: [8, 0, 20] },
  { type: 'skeleton', position: [-5, 0, 18] },
  { type: 'slime', position: [70, 0, 5] },
  { type: 'slime', position: [65, 0, -10] },
  { type: 'rat', position: [75, 0, 0] },
  { type: 'rat', position: [68, 0, 12] },
  { type: 'skeleton', position: [78, 0, -8] },
]

function createEntity(config: {
  type: Entity['type']
  id: string
  components: Entity['components']
}): Entity {
  const now = performance.now()
  return {
    id: config.id,
    type: config.type,
    components: config.components,
    createdAt: now,
    updatedAt: now,
  }
}

export default function TownScene() {
  const currentCharacter = useCharacterStore((s) => s.getCurrentCharacter())
  const currentCharacterId = useCharacterStore((s) => s.currentCharacterId)
  const setShowStartScreen = useUIStore((s) => s.setShowStartScreen)
  const worldEntities = useWorldStore((s) => s.entities)

  useEffect(() => {
    gameLoop.registerSystem(interactionSystem)
    gameLoop.registerSystem(movementSystem)
    gameLoop.registerSystem(aiSystem)
    gameLoop.registerSystem(combatSystem)
    gameLoop.registerSystem(levelingSystem)
    gameLoop.registerSystem(regenSystem)
    gameLoop.registerSystem(skillSystem)

    return () => {
      gameLoop.unregisterSystem('InteractionSystem')
      gameLoop.unregisterSystem('MovementSystem')
      gameLoop.unregisterSystem('AISystem')
      gameLoop.unregisterSystem('CombatSystem')
      gameLoop.unregisterSystem('LevelingSystem')
      gameLoop.unregisterSystem('RegenSystem')
      gameLoop.unregisterSystem('SkillSystem')
    }
  }, [])

  useEffect(() => {
    if (!currentCharacter) return

    const store = useWorldStore.getState()
    if (!store.entities[currentCharacter.id]) {
      const stats = currentCharacter.stats
      const attrs = stats.attributes ?? { strength: 5, agility: 5, intellect: 5, stamina: 5 }
      const maxHealth = 100 + attrs.stamina * 10
      let baseDamage = 8
      switch (currentCharacter.class) {
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

      const entity = createEntity({
        type: 'player',
        id: currentCharacter.id,
        components: {
          ...PLAYER_DEFAULTS,
          position: {
            x: currentCharacter.position.x,
            y: 0,
            z: currentCharacter.position.z,
            rotation: 0,
          },
          velocity: { x: 0, y: 0, z: 0 },
          health: {
            current: maxHealth,
            max: maxHealth,
            dead: false,
          },
          combat: {
            attackRange: 3,
            attackDamage: baseDamage,
            attackCooldown: 500,
            lastAttackTime: 0,
            targetId: null,
          },
          player: {
            class: currentCharacter.class,
            name: currentCharacter.name,
            kills: stats.kills,
            level: stats.level ?? 1,
            xp: stats.xp ?? 0,
            xpToNextLevel: stats.xpToNextLevel ?? 150,
            attributes: attrs,
            unspentPoints: stats.unspentPoints ?? 0,
          },
        },
      })

      store.setEntity(entity)
    }
  }, [currentCharacter])

  useEffect(() => {
    const store = useWorldStore.getState()

    for (const spawn of MONSTER_SPAWNS) {
      const monsterDefaults = MONSTER_DEFAULTS[spawn.type]
      const id = `monster_${spawn.type}_${spawn.position[0]}_${spawn.position[2]}`

      if (store.entities[id]) continue

      const entity = createEntity({
        type: 'monster',
        id,
        components: {
          ...monsterDefaults,
          position: {
            x: spawn.position[0],
            y: spawn.position[1],
            z: spawn.position[2],
            rotation: 0,
          },
          velocity: { x: 0, y: 0, z: 0 },
          ai: {
            ...monsterDefaults.ai!,
            homePosition: [spawn.position[0], spawn.position[1], spawn.position[2]],
            wanderTarget: [spawn.position[0], spawn.position[1], spawn.position[2]],
          },
        },
      })

      store.setEntity(entity)
    }
  }, [])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowStartScreen(true)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [setShowStartScreen])

  const monsters = useMemo(() => {
    return Object.values(worldEntities).filter((e) => e.type === 'monster')
  }, [worldEntities])

  if (!currentCharacter || !currentCharacterId) {
    return null
  }

  return (
    <>
      <Camera />
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} intensity={1} castShadow />

      <Floor />
      <Wilderness />

      <Town />
      <Well position={[-2, 0, 4]} />

      <TowerEntrance position={[0, 0, 38]} />

      <Player />
      {monsters.map((monster) => (
        <Monster key={monster.id} id={monster.id} />
      ))}
      <DamageNumbers />
    </>
  )
}
