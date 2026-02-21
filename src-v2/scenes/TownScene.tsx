import { useEffect } from 'react'

import { entityManager } from '../engine/EntityManager'
import { gameLoop } from '../engine/GameLoop'
import { Player } from '../entities'
import { useCharacterStore, useUIStore, useWorldStore } from '../store'
import { movementSystem, interactionSystem, syncSystem } from '../systems'
import { PLAYER_DEFAULTS } from '../types'
import { Floor, Camera } from '../world'

export default function TownScene() {
  const currentCharacter = useCharacterStore((s) => s.getCurrentCharacter())
  const currentCharacterId = useCharacterStore((s) => s.currentCharacterId)
  const setShowStartScreen = useUIStore((s) => s.setShowStartScreen)

  useEffect(() => {
    gameLoop.registerSystem(interactionSystem)
    gameLoop.registerSystem(movementSystem)
    gameLoop.registerSystem(syncSystem)

    return () => {
      gameLoop.unregisterSystem('InteractionSystem')
      gameLoop.unregisterSystem('MovementSystem')
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
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowStartScreen(true)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [setShowStartScreen])

  if (!currentCharacter || !currentCharacterId) {
    return null
  }

  return (
    <>
      <Camera />
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} intensity={1} castShadow />
      <Floor size={30} />
      <Player id={currentCharacterId} />
    </>
  )
}
