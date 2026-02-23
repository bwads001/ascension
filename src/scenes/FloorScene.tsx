import { useEffect, useMemo, useRef } from 'react'

import DamageNumbers from '../effects/DamageNumbers'
import { gameLoop } from '../engine/GameLoop'
import { Player, Monster } from '../entities'
import { useCharacterStore, useWorldStore } from '../store'
import {
  movementSystem,
  interactionSystem,
  aiSystem,
  combatSystem,
  levelingSystem,
  regenSystem,
} from '../systems'
import { PLAYER_DEFAULTS, MONSTER_DEFAULTS } from '../types'
import type { Entity, MonsterType } from '../types'
import Camera from '../world/Camera'
import FloorDungeon, { generateDungeon } from '../world/FloorDungeon'

interface FloorMonsterSpawn {
  type: MonsterType
  position: [number, number, number]
}

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

function generateMonsterSpawns(
  floor: number,
  rooms: ReturnType<typeof generateDungeon>
): FloorMonsterSpawn[] {
  const spawns: FloorMonsterSpawn[] = []

  const monsterTypes: MonsterType[] = ['slime', 'rat', 'skeleton']
  const monstersPerRoom = 2 + Math.floor(floor / 2)

  rooms.forEach((room, roomIndex) => {
    const numMonsters = roomIndex === rooms.length - 1 ? 0 : monstersPerRoom

    for (let i = 0; i < numMonsters; i++) {
      const typeIndex = Math.min(floor - 1, monsterTypes.length - 1)
      const type =
        Math.random() < 0.7
          ? monsterTypes[typeIndex]
          : monsterTypes[Math.floor(Math.random() * typeIndex + 1)]

      const offsetX = (Math.random() - 0.5) * (room.width - 4)
      const offsetZ = (Math.random() - 0.5) * (room.depth - 4)

      spawns.push({
        type,
        position: [room.x + offsetX, 0, room.z + offsetZ],
      })
    }
  })

  return spawns
}

function getFloorMonsterStats(floor: number, type: MonsterType) {
  const baseStats = MONSTER_DEFAULTS[type]
  const scaling = 1 + (floor - 1) * 0.3

  return {
    health: {
      current: Math.floor((baseStats.health?.current ?? 30) * scaling),
      max: Math.floor((baseStats.health?.max ?? 30) * scaling),
      dead: false,
    },
    combat: baseStats.combat
      ? {
          ...baseStats.combat,
          attackDamage: Math.floor(baseStats.combat.attackDamage * scaling),
        }
      : undefined,
  }
}

export default function FloorScene() {
  const currentCharacter = useCharacterStore((s) => s.getCurrentCharacter())
  const currentCharacterId = useCharacterStore((s) => s.currentCharacterId)
  const floor = useWorldStore((s) => s.floor)
  const setFloor = useWorldStore((s) => s.setFloor)
  const worldEntities = useWorldStore((s) => s.entities)
  const initializedRef = useRef(false)

  useEffect(() => {
    initializedRef.current = false
  }, [floor])

  const rooms = useMemo(() => generateDungeon(floor), [floor])
  const monsterSpawns = useMemo(() => generateMonsterSpawns(floor, rooms), [floor, rooms])

  useEffect(() => {
    gameLoop.registerSystem(interactionSystem)
    gameLoop.registerSystem(movementSystem)
    gameLoop.registerSystem(aiSystem)
    gameLoop.registerSystem(combatSystem)
    gameLoop.registerSystem(levelingSystem)
    gameLoop.registerSystem(regenSystem)

    return () => {
      gameLoop.unregisterSystem('InteractionSystem')
      gameLoop.unregisterSystem('MovementSystem')
      gameLoop.unregisterSystem('AISystem')
      gameLoop.unregisterSystem('CombatSystem')
      gameLoop.unregisterSystem('LevelingSystem')
      gameLoop.unregisterSystem('RegenSystem')
    }
  }, [])

  useEffect(() => {
    if (!currentCharacter) return

    const store = useWorldStore.getState()
    const firstRoom = rooms[0]
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

    const existingEntity = store.entities[currentCharacter.id]
    if (existingEntity) {
      store.updateEntity(currentCharacter.id, {
        position: { x: firstRoom.x, y: 0, z: firstRoom.z, rotation: 0 },
        velocity: { x: 0, y: 0, z: 0 },
      })
    } else {
      const entity = createEntity({
        type: 'player',
        id: currentCharacter.id,
        components: {
          ...PLAYER_DEFAULTS,
          position: {
            x: firstRoom.x,
            y: 0,
            z: firstRoom.z,
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
  }, [currentCharacter, rooms])

  useEffect(() => {
    if (initializedRef.current) return
    initializedRef.current = true

    const store = useWorldStore.getState()

    for (const spawn of monsterSpawns) {
      const id = `floor${floor}_${spawn.type}_${Math.round(spawn.position[0])}_${Math.round(spawn.position[2])}`

      const monsterDefaults = MONSTER_DEFAULTS[spawn.type]
      const scaledStats = getFloorMonsterStats(floor, spawn.type)

      const entity = createEntity({
        type: 'monster',
        id,
        components: {
          ...monsterDefaults,
          ...scaledStats,
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
            lastWanderTime: 0,
            targetId: null,
          },
        },
      })

      store.setEntity(entity)
    }
  }, [floor, monsterSpawns])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setFloor(0)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [setFloor])

  useEffect(() => {
    return () => {
      const store = useWorldStore.getState()
      const floorMonsterIds = Object.keys(store.entities).filter((id) =>
        id.startsWith(`floor${floor}_`)
      )
      for (const id of floorMonsterIds) {
        store.removeEntity(id)
      }
    }
  }, [floor])

  const monsters = useMemo(() => {
    return Object.values(worldEntities).filter((e) => e.type === 'monster')
  }, [worldEntities])

  const handleExit = () => {
    setFloor(0)
  }

  if (!currentCharacter || !currentCharacterId) {
    return null
  }

  return (
    <>
      <Camera />
      <ambientLight intensity={0.6} />
      <pointLight position={[0, 10, 0]} intensity={2} castShadow distance={50} />

      <FloorDungeon rooms={rooms} onExit={handleExit} />

      <Player />
      {monsters.map((monster) => (
        <Monster key={monster.id} id={monster.id} />
      ))}
      <DamageNumbers />
    </>
  )
}
