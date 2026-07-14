import { useEffect, useState, useCallback } from 'react'

import { eventQueue } from '../engine/EventQueue'
import { useCharacterStore, useSkillStore, useWorldStore } from '../store'
import type { GameEvent } from '../types'
import { SKILLS, getSkillBar } from '../types/skills'
import { findTargetInRange } from '../utils/targeting'

const POTION_COOLDOWN = 10000

function SkillSlot({
  skillId,
  slotKey,
  isActive,
  isEnabled,
  cooldownRemaining,
  potionCount,
  onActivate,
  onToggle,
}: {
  skillId: string | null
  slotKey: string
  isActive: boolean
  isEnabled?: boolean
  cooldownRemaining: number
  potionCount?: number
  onActivate: () => void
  onToggle?: () => void
}) {
  const [justActivated, setJustActivated] = useState(false)

  useEffect(() => {
    if (isActive) {
      setJustActivated(true)
      const timer = setTimeout(() => setJustActivated(false), 200)
      return () => clearTimeout(timer)
    }
  }, [isActive])

  if (!skillId) {
    return (
      <div style={styles.lockedSlot}>
        <span style={styles.keybind}>{slotKey}</span>
        <span style={styles.lockedIcon}>🔒</span>
      </div>
    )
  }

  const skill = SKILLS[skillId]
  if (!skill) {
    return (
      <div style={styles.lockedSlot}>
        <span style={styles.keybind}>{slotKey}</span>
        <span style={styles.lockedIcon}>🔒</span>
      </div>
    )
  }

  const onCooldown = cooldownRemaining > 0
  const cooldownPercent = skill.cooldown > 0 ? (cooldownRemaining / skill.cooldown) * 100 : 0
  const isAutoAttack = skillId === 'basic_attack'
  const isPotion = skillId === 'health_potion'
  const noPotions = isPotion && (potionCount ?? 0) <= 0

  return (
    <div
      style={{
        ...styles.slot,
        ...(isAutoAttack && isEnabled ? styles.slotEnabled : {}),
        ...(justActivated ? styles.slotActivated : {}),
        ...(isActive && !onCooldown && !isAutoAttack ? styles.slotActive : {}),
        ...(noPotions ? styles.slotDisabled : {}),
      }}
      onClick={isAutoAttack && onToggle ? onToggle : isPotion || noPotions ? undefined : onActivate}
    >
      <span style={styles.keybind}>{slotKey}</span>
      <span style={styles.icon}>{skill.icon}</span>
      <span style={styles.name}>{skill.name}</span>
      {isAutoAttack && (
        <div
          style={{ ...styles.autoAttackIndicator, background: isEnabled ? '#4a8a4a' : '#8a4a4a' }}
        >
          {isEnabled ? 'ON' : 'OFF'}
        </div>
      )}
      {isPotion && (
        <div style={{ ...styles.potionCount, color: noPotions ? '#8a4a4a' : '#4a8a4a' }}>
          {potionCount ?? 0}
        </div>
      )}
      {onCooldown && !isAutoAttack && !isPotion && (
        <>
          <div style={{ ...styles.cooldownOverlay, height: `${cooldownPercent}%` }} />
          <span style={styles.cooldownText}>{Math.ceil(cooldownRemaining / 1000)}s</span>
        </>
      )}
    </div>
  )
}

export default function SkillBar() {
  const currentCharacter = useCharacterStore((s) => s.getCurrentCharacter())
  const currentCharacterId = useCharacterStore((s) => s.currentCharacterId)
  const activeSkill = useSkillStore((s) => s.activeSkill)
  const useSkill = useSkillStore((s) => s.useSkill)
  const getCooldownRemaining = useSkillStore((s) => s.getCooldownRemaining)
  const setActiveSkill = useSkillStore((s) => s.setActiveSkill)
  const entities = useWorldStore((s) => s.entities)
  const tick = useSkillStore((s) => s.tick)

  const playerClass = currentCharacter?.class ?? 'warrior'
  const playerLevel = currentCharacter?.stats.level ?? 1
  const skillBar = getSkillBar(playerClass, playerLevel)
  const autoAttackEnabled =
    entities[currentCharacterId!]?.components.combat?.autoAttackEnabled ?? false
  const potionCount = entities[currentCharacterId!]?.components.player?.potions ?? 0

  useEffect(() => {
    const interval = setInterval(() => {
      tick(performance.now())
    }, 100)
    return () => clearInterval(interval)
  }, [tick])

  const toggleAutoAttack = useCallback(() => {
    if (!currentCharacterId) {
      console.log('[toggleAutoAttack] No currentCharacterId')
      return
    }
    const store = useWorldStore.getState()
    const entity = store.entities[currentCharacterId]
    if (!entity?.components.combat) {
      console.log('[toggleAutoAttack] No combat component')
      return
    }

    console.log(
      '[toggleAutoAttack] Toggling from',
      entity.components.combat.autoAttackEnabled,
      'to',
      !entity.components.combat.autoAttackEnabled
    )
    store.updateEntity(currentCharacterId, {
      combat: {
        ...entity.components.combat,
        autoAttackEnabled: !entity.components.combat.autoAttackEnabled,
      },
    })
  }, [currentCharacterId])

  useEffect(() => {
    const unsubscribe = eventQueue.on('ATTACK_ENTITY', (event: GameEvent) => {
      if (event.type === 'ATTACK_ENTITY' && event.attackerId === currentCharacterId) {
        setActiveSkill('basic_attack')
      }
    })
    return unsubscribe
  }, [currentCharacterId, setActiveSkill])

  const activateSkill = useCallback(
    (skillId: string) => {
      console.log('[activateSkill] Called with skillId:', skillId)
      if (!currentCharacterId) {
        console.log('[activateSkill] No currentCharacterId')
        return
      }

      const skill = SKILLS[skillId]
      if (!skill) {
        console.log('[activateSkill] No skill found for:', skillId)
        return
      }

      const currentTime = performance.now()

      if (skillId === 'basic_attack') {
        console.log('[activateSkill] Calling toggleAutoAttack')
        toggleAutoAttack()
        return
      }

      if (skillId === 'health_potion') {
        const store = useWorldStore.getState()
        const player = store.entities[currentCharacterId]
        if (!player?.components.player) return

        if (player.components.player.potions <= 0) return
        if (currentTime - player.components.player.lastPotionTime < POTION_COOLDOWN) return

        const event: GameEvent = {
          type: 'USE_POTION',
          timestamp: currentTime,
          entityId: currentCharacterId,
        }
        eventQueue.enqueue(event)
        return
      }

      const cooldownRemaining = getCooldownRemaining(skillId, currentTime)
      if (cooldownRemaining > 0) return

      if (!useSkill(skillId, currentTime)) return

      setActiveSkill(skillId)

      const player = entities[currentCharacterId]
      if (!player) return

      if (skill.targetType === 'self') {
        const event: GameEvent = {
          type: 'USE_SKILL',
          timestamp: currentTime,
          entityId: currentCharacterId,
          skillId,
          targetId: currentCharacterId,
        }
        eventQueue.enqueue(event)
      } else if (skill.targetType === 'enemy') {
        const target = findTargetInRange(player, Object.values(entities), skill.range)
        if (target) {
          const event: GameEvent = {
            type: 'USE_SKILL',
            timestamp: currentTime,
            entityId: currentCharacterId,
            skillId,
            targetId: target.id,
          }
          eventQueue.enqueue(event)
        }
      } else if (skill.targetType === 'area') {
        const event: GameEvent = {
          type: 'USE_SKILL',
          timestamp: currentTime,
          entityId: currentCharacterId,
          skillId,
          targetId: currentCharacterId,
        }
        eventQueue.enqueue(event)
      }
    },
    [currentCharacterId, entities, getCooldownRemaining, setActiveSkill, useSkill, toggleAutoAttack]
  )

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key
      const slotIndex = key >= '1' && key <= '9' ? parseInt(key) - 1 : key === '0' ? 9 : -1

      console.log('[SkillBar] Key pressed:', key, 'slotIndex:', slotIndex)
      if (slotIndex >= 0 && slotIndex < skillBar.length) {
        const skillId = skillBar[slotIndex]
        console.log('[SkillBar] skillId at slot:', skillId)
        if (skillId) {
          activateSkill(skillId)
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [skillBar, activateSkill])

  const currentTime = performance.now()

  return (
    <div style={styles.container}>
      {skillBar.map((skillId, index) => {
        const slotKey = index < 9 ? String(index + 1) : '0'
        const cooldownRemaining = skillId ? getCooldownRemaining(skillId, currentTime) : 0
        const isAutoAttack = skillId === 'basic_attack'
        const isPotion = skillId === 'health_potion'
        return (
          <SkillSlot
            key={index}
            skillId={skillId}
            slotKey={slotKey}
            isActive={activeSkill === skillId}
            isEnabled={isAutoAttack ? autoAttackEnabled : undefined}
            cooldownRemaining={cooldownRemaining}
            potionCount={isPotion ? potionCount : undefined}
            onActivate={() => skillId && activateSkill(skillId)}
            onToggle={isAutoAttack ? toggleAutoAttack : undefined}
          />
        )
      })}
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    position: 'absolute',
    bottom: 20,
    left: '50%',
    transform: 'translateX(-50%)',
    display: 'flex',
    gap: 8,
    padding: 8,
    background: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 8,
    border: '2px solid #444',
  },
  slot: {
    width: 60,
    height: 70,
    background: 'linear-gradient(180deg, #3a3a4a 0%, #2a2a3a 100%)',
    borderRadius: 6,
    border: '2px solid #555',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    position: 'relative',
    overflow: 'hidden',
    transition: 'border-color 0.15s, transform 0.15s',
  },
  slotEnabled: {
    borderColor: '#4a8a4a',
    background: 'linear-gradient(180deg, #3a5a3a 0%, #2a4a2a 100%)',
  },
  slotActive: {
    borderColor: '#ffcc00',
    transform: 'scale(1.05)',
  },
  slotActivated: {
    borderColor: '#fff',
    background: 'linear-gradient(180deg, #5a5a6a 0%, #4a4a5a 100%)',
  },
  slotDisabled: {
    opacity: 0.5,
    cursor: 'not-allowed',
  },
  lockedSlot: {
    width: 60,
    height: 70,
    background: 'rgba(20, 20, 30, 0.6)',
    borderRadius: 6,
    border: '2px solid #222',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    opacity: 0.5,
  },
  lockedIcon: {
    fontSize: 20,
    opacity: 0.5,
  },
  keybind: {
    position: 'absolute',
    top: 2,
    left: 4,
    fontSize: 10,
    color: '#888',
    fontFamily: 'monospace',
    fontWeight: 'bold',
  },
  icon: {
    fontSize: 24,
    marginBottom: 2,
  },
  name: {
    fontSize: 9,
    color: '#ccc',
    fontFamily: 'system-ui, sans-serif',
    textAlign: 'center',
    maxWidth: 56,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  autoAttackIndicator: {
    position: 'absolute',
    bottom: 4,
    fontSize: 10,
    fontWeight: 'bold',
    color: '#fff',
    padding: '2px 6px',
    borderRadius: 3,
  },
  potionCount: {
    position: 'absolute',
    bottom: 4,
    fontSize: 10,
    fontWeight: 'bold',
    padding: '2px 6px',
    borderRadius: 3,
  },
  cooldownOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    background: 'rgba(0, 0, 0, 0.6)',
    transition: 'height 0.1s linear',
    pointerEvents: 'none',
  },
  cooldownText: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    textShadow: '1px 1px 2px #000',
    pointerEvents: 'none',
  },
}
