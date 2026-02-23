import { Html } from '@react-three/drei'
import { useEffect } from 'react'

import { useDamageNumberStore } from '../store/damageNumberStore'

function DamageNumberItem({
  x,
  y,
  z,
  amount,
  isPlayerDamage,
  createdAt,
}: {
  x: number
  y: number
  z: number
  amount: number
  isPlayerDamage: boolean
  createdAt: number
}) {
  const age = performance.now() - createdAt
  const progress = Math.min(age / 1500, 1)
  const offsetY = progress * 2
  const opacity = 1 - progress

  const color = isPlayerDamage ? '#ff4444' : '#ffff00'
  const fontSize = Math.min(24 + Math.floor(amount / 10) * 2, 40)

  return (
    <Html position={[x, y + 1 + offsetY, z]} center style={{ pointerEvents: 'none' }}>
      <div
        style={{
          color,
          fontSize,
          fontWeight: 'bold',
          fontFamily: 'sans-serif',
          textShadow: '2px 2px 2px rgba(0,0,0,0.8)',
          opacity,
          whiteSpace: 'nowrap',
          userSelect: 'none',
        }}
      >
        -{amount}
      </div>
    </Html>
  )
}

export default function DamageNumbers() {
  const numbers = useDamageNumberStore((s) => s.numbers)
  const tick = useDamageNumberStore((s) => s.tick)

  useEffect(() => {
    const interval = setInterval(() => {
      tick(performance.now())
    }, 100)
    return () => clearInterval(interval)
  }, [tick])

  return (
    <>
      {numbers.map((n) => (
        <DamageNumberItem
          key={n.id}
          x={n.x}
          y={n.y}
          z={n.z}
          amount={n.amount}
          isPlayerDamage={n.isPlayerDamage}
          createdAt={n.createdAt}
        />
      ))}
    </>
  )
}
