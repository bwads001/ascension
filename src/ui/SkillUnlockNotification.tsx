import { useEffect, useState } from 'react'

import { eventQueue } from '../engine/EventQueue'
import type { GameEvent } from '../types'
import { SKILLS } from '../types/skills'

interface UnlockNotification {
  id: string
  skillId: string
  timestamp: number
}

export default function SkillUnlockNotification() {
  const [notifications, setNotifications] = useState<UnlockNotification[]>([])

  useEffect(() => {
    const unsubscribe = eventQueue.onAll((event: GameEvent) => {
      if (event.type === 'SKILL_UNLOCKED') {
        const notification: UnlockNotification = {
          id: `${event.skillId}-${event.timestamp}`,
          skillId: event.skillId,
          timestamp: event.timestamp,
        }
        setNotifications((prev) => [...prev, notification])

        setTimeout(() => {
          setNotifications((prev) => prev.filter((n) => n.id !== notification.id))
        }, 3000)
      }
    })

    return unsubscribe
  }, [])

  if (notifications.length === 0) return null

  return (
    <div style={styles.container}>
      {notifications.map((notification) => {
        const skill = SKILLS[notification.skillId]
        if (!skill) return null

        return (
          <div key={notification.id} style={styles.notification}>
            <span style={styles.icon}>{skill.icon}</span>
            <div style={styles.text}>
              <span style={styles.title}>Skill Unlocked!</span>
              <span style={styles.name}>{skill.name}</span>
              <span style={styles.desc}>{skill.description}</span>
            </div>
          </div>
        )
      })}
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    position: 'absolute',
    top: 100,
    left: '50%',
    transform: 'translateX(-50%)',
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    pointerEvents: 'none',
    zIndex: 100,
  },
  notification: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    background: 'linear-gradient(135deg, rgba(100, 80, 20, 0.95) 0%, rgba(60, 50, 10, 0.95) 100%)',
    border: '2px solid #ffd700',
    borderRadius: 8,
    padding: '12px 20px',
    animation: 'slideIn 0.3s ease-out',
    boxShadow: '0 4px 20px rgba(255, 215, 0, 0.3)',
  },
  icon: {
    fontSize: 32,
  },
  text: {
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
  },
  title: {
    fontSize: 12,
    color: '#ffd700',
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  name: {
    fontSize: 18,
    color: '#fff',
    fontWeight: 'bold',
  },
  desc: {
    fontSize: 12,
    color: '#ccc',
  },
}
