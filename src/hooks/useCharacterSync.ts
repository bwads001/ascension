import { useEffect } from 'react'

import { useCharacterStore, useWorldStore } from '../store'
import { getXpRequiredForLevel } from '../types'

/**
 * Mirrors the live world entity's player component into the persisted character store.
 * Without this, gameplay progress (level/xp/kills/attributes) is never written back
 * to the save file and resets to level 1 on reload.
 */
export function useCharacterSync(): void {
  useEffect(() => {
    let lastSerialized = ''

    const unsubscribe = useWorldStore.subscribe((state) => {
      const charStore = useCharacterStore.getState()
      const characterId = charStore.currentCharacterId
      if (!characterId) return

      const entity = state.entities[characterId]
      const player = entity?.components.player
      if (!player) return

      const character = charStore.characters.find((c) => c.id === characterId)
      if (!character) return

      const next = {
        level: player.level,
        xp: player.xp,
        xpToNextLevel: player.xpToNextLevel || getXpRequiredForLevel(player.level + 1),
        kills: player.kills,
        attributes: player.attributes,
        unspentPoints: player.unspentPoints,
        floor: state.floor,
        highestFloor: Math.max(character.stats.highestFloor, state.floor),
      }

      const fingerprint = JSON.stringify(next)
      if (fingerprint === lastSerialized) return
      lastSerialized = fingerprint

      const pos = entity?.components.position
      charStore.updateCharacter({
        ...character,
        lastPlayedAt: Date.now(),
        stats: {
          ...character.stats,
          level: next.level,
          xp: next.xp,
          xpToNextLevel: next.xpToNextLevel,
          kills: next.kills,
          highestFloor: next.highestFloor,
          attributes: next.attributes,
          unspentPoints: next.unspentPoints,
        },
        position: pos
          ? { floor: state.floor, x: pos.x, z: pos.z }
          : character.position,
      })
    })

    return unsubscribe
  }, [])
}
