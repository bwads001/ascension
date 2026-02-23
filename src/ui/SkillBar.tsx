import { useEffect, useState, useCallback } from 'react'

import { eventQueue } from '../engine/EventQueue'
import { useCharacterStore, useSkillStore, useWorldStore } from '../store'
import type { GameEvent } from '../types'
import { SKILLS, getSkillBar } from '../types/skills'
import { findTargetInRange } from '../utils/targeting'

function SkillSlot({
  skillId,
  slotKey,
  isActive,
  cooldownRemaining,
  onActivate,
}: {
  skillId: string | null
  slotKey: string
  isActive: boolean
  cooldownRemaining: number
  onActivate: () => void
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

  return (
    <div
      style={{
        ...styles.slot,
        ...(justActivated ? styles.slotActivated : {}),
        ...(isActive && !onCooldown ? styles.slotActive : {}),
      }}
      onClick={onActivate}
    >
      <span style={styles.keybind}>{slotKey}</span>
      <span style={styles.icon}>{skill.icon}</span>
      <span style={styles.name}>{skill.name}</span>
      {onCooldown && (
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

  useEffect(() => {
    const interval = setInterval(() => {
      tick(performance.now())
    }, 100)
    return () => clearInterval(interval)
  }, [tick])

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
      if (!currentCharacterId) return

      const skill = SKILLS[skillId]
      if (!skill) return

      const currentTime = performance.now()
      const cooldownRemaining = getCooldownRemaining(skillId, currentTime)

      if (cooldownRemaining > 0) return

      if (skillId === 'basic_attack') {
        return
      }

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
    [currentCharacterId, entities, getCooldownRemaining, setActiveSkill, useSkill]
  )

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key
      const slotIndex = key >= '1' && key <= '9' ? parseInt(key) - 1 : key === '0' ? 9 : -1

      if (slotIndex >= 0 && slotIndex < skillBar.length) {
        const skillId = skillBar[slotIndex]
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
        return (
          <SkillSlot
            key={index}
            skillId={skillId}
            slotKey={slotKey}
            isActive={activeSkill === skillId}
            cooldownRemaining={cooldownRemaining}
            onActivate={() => skillId && activateSkill(skillId)}
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
  slotActive: {
    borderColor: '#ffcc00',
    transform: 'scale(1.05)',
  },
  slotActivated: {
    borderColor: '#fff',
    background: 'linear-gradient(180deg, #5a5a6a 0%, #4a4a5a 100%)',
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
