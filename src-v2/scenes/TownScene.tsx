import { useEffect, useMemo } from 'react'

import { entityManager } from '../engine/EntityManager'
import { gameLoop } from '../engine/GameLoop'
import { Player, Monster } from '../entities'
import { useCharacterStore, useUIStore, useWorldStore } from '../store'
import { movementSystem, interactionSystem, syncSystem, aiSystem } from '../systems'
import { PLAYER_DEFAULTS, MONSTER_DEFAULTS } from '../types'
import type { MonsterType } from '../types'
import { Floor, Camera } from '../world'

const MONSTER_SPAWNS: Array<{ type: MonsterType; position: [number, number, number] }> = [
  { type: 'slime', position: [15, 0, 5] },
  { type: 'slime', position: [-15, 0, 8] },
  { type: 'slime', position: [10, 0, -18] },
  { type: 'rat', position: [18, 0, -10] },
  { type: 'rat', position: [-12, 0, -15] },
  { type: 'skeleton', position: [-18, 0, 0] },
  { type: 'skeleton', position: [8, 0, 20] },
  { type: 'skeleton', position: [-5, 0, 18] },
]

export default function TownScene() {
  const currentCharacter = useCharacterStore((s) => s.getCurrentCharacter())
  const currentCharacterId = useCharacterStore((s) => s.currentCharacterId)
  const setShowStartScreen = useUIStore((s) => s.setShowStartScreen)
  const worldEntities = useWorldStore((s) => s.entities)

  useEffect(() => {
    gameLoop.registerSystem(interactionSystem)
    gameLoop.registerSystem(movementSystem)
    gameLoop.registerSystem(aiSystem)
    gameLoop.registerSystem(syncSystem)

    return () => {
      gameLoop.unregisterSystem('InteractionSystem')
      gameLoop.unregisterSystem('MovementSystem')
      gameLoop.unregisterSystem('AISystem')
      gameLoop.unregisterSystem('SyncSystem')
    }
  }, [])

  useEffect(() => {
    if (!currentCharacter) return

    const existingEntity = entityManager.get(currentCharacter.id)
    if (!existingEntity) {
      const entity = entityManager.create({
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
          player: {
            class: currentCharacter.class,
            name: currentCharacter.name,
            kills: currentCharacter.stats.kills,
          },
        },
      })

      useWorldStore.getState().setEntity(entity)
    }
  }, [currentCharacter])

  useEffect(() => {
    for (const spawn of MONSTER_SPAWNS) {
      const monsterDefaults = MONSTER_DEFAULTS[spawn.type]
      const id = `monster_${spawn.type}_${spawn.position[0]}_${spawn.position[2]}`

      if (entityManager.exists(id)) continue

      const entity = entityManager.create({
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

      useWorldStore.getState().setEntity(entity)
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
      <Floor size={50} />
      <Player id={currentCharacterId} />
      {monsters.map((monster) => (
        <Monster key={monster.id} id={monster.id} />
      ))}
    </>
  )
}
