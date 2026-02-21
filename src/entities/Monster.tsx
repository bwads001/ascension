import { Html } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { RigidBody, RapierRigidBody } from '@react-three/rapier'
import { useRef, useState, useEffect, useMemo, useCallback } from 'react'
import { Vector3, Mesh } from 'three'

import { useGameStore } from '../store/gameStore'
import { usePlayerStore } from '../store/playerStore'
import { isInTown, TOWN_RADIUS } from '../world/Wilderness'

type MonsterType = 'slime' | 'rat' | 'skeleton'

interface MonsterProps {
  type: MonsterType
  position: [number, number, number]
  id: string
}

const SPEEDS: Record<MonsterType, number> = {
  slime: 1.5,
  rat: 3,
  skeleton: 2,
}

const HEALTH: Record<MonsterType, number> = {
  slime: 25,
  rat: 15,
  skeleton: 50,
}

const AGGRO_RANGE = 8
const ATTACK_RANGE = 1.5
const ATTACK_COOLDOWN = 1000
const ATTACK_DAMAGE = 10
const PLAYER_ATTACK_RANGE = 3

function HealthBar({ health, maxHealth }: { health: number; maxHealth: number }) {
  const percent = Math.max(0, Math.min(100, (health / maxHealth) * 100))
  return (
    <Html center position={[0, 2.5, 0]} style={{ pointerEvents: 'none' }}>
      <div
        style={{
          width: '50px',
          height: '6px',
          background: 'rgba(0,0,0,0.5)',
          border: '1px solid #333',
          borderRadius: '2px',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            width: `${percent}%`,
            height: '100%',
            background: percent > 50 ? '#4a4' : percent > 25 ? '#aa4' : '#a44',
          }}
        />
      </div>
    </Html>
  )
}

function Slime({ isHit, onClick }: { isHit: boolean; onClick?: () => void }) {
  const meshRef = useRef<Mesh>(null)

  useFrame((state) => {
    if (meshRef.current) {
      const scale = 1 + Math.sin(state.clock.elapsedTime * 3) * 0.1
      meshRef.current.scale.setScalar(scale)
    }
  })

  return (
    <group onClick={onClick}>
      <mesh ref={meshRef} castShadow position={[0, 0.4, 0]}>
        <sphereGeometry args={[0.4, 16, 12]} />
        <meshStandardMaterial
          color={isHit ? '#ff6666' : '#5a9a5a'}
          roughness={0.3}
          metalness={0.1}
        />
      </mesh>
      <mesh position={[-0.1, 0.45, 0.35]}>
        <sphereGeometry args={[0.08]} />
        <meshStandardMaterial color="#1a1a1a" />
      </mesh>
      <mesh position={[0.1, 0.45, 0.35]}>
        <sphereGeometry args={[0.08]} />
        <meshStandardMaterial color="#1a1a1a" />
      </mesh>
    </group>
  )
}

function Rat({ isHit, onClick }: { isHit: boolean; onClick?: () => void }) {
  return (
    <group onClick={onClick}>
      <mesh castShadow position={[0, 0.25, 0]}>
        <capsuleGeometry args={[0.15, 0.4, 4, 8]} />
        <meshStandardMaterial color={isHit ? '#ff6666' : '#5c4a3d'} roughness={0.9} />
      </mesh>
      <mesh castShadow position={[0.3, 0.25, 0]}>
        <sphereGeometry args={[0.12, 8, 8]} />
        <meshStandardMaterial color={isHit ? '#ff6666' : '#5c4a3d'} roughness={0.9} />
      </mesh>
      <mesh position={[0.35, 0.28, 0.08]}>
        <sphereGeometry args={[0.04]} />
        <meshStandardMaterial color="#1a1a1a" />
      </mesh>
      <mesh position={[0.35, 0.28, -0.08]}>
        <sphereGeometry args={[0.04]} />
        <meshStandardMaterial color="#1a1a1a" />
      </mesh>
      <mesh castShadow position={[-0.35, 0.2, 0]} rotation={[0, 0, 0.3]}>
        <cylinderGeometry args={[0.02, 0.01, 0.3, 8]} />
        <meshStandardMaterial color="#8b7355" roughness={0.9} />
      </mesh>
      <mesh castShadow position={[-0.35, 0.2, 0]} rotation={[0, 0, -0.3]}>
        <cylinderGeometry args={[0.02, 0.01, 0.3, 8]} />
        <meshStandardMaterial color="#8b7355" roughness={0.9} />
      </mesh>
    </group>
  )
}

function Skeleton({ isHit, onClick }: { isHit: boolean; onClick?: () => void }) {
  return (
    <group onClick={onClick}>
      <mesh castShadow position={[0, 0.8, 0]}>
        <boxGeometry args={[0.3, 0.8, 0.2]} />
        <meshStandardMaterial color={isHit ? '#ff6666' : '#e8e8e0'} roughness={0.8} />
      </mesh>
      <mesh castShadow position={[0, 1.4, 0]}>
        <boxGeometry args={[0.25, 0.25, 0.25]} />
        <meshStandardMaterial color={isHit ? '#ff6666' : '#e8e8e0'} roughness={0.8} />
      </mesh>
      <mesh position={[-0.06, 1.42, 0.13]}>
        <sphereGeometry args={[0.04]} />
        <meshStandardMaterial color="#1a1a1a" />
      </mesh>
      <mesh position={[0.06, 1.42, 0.13]}>
        <sphereGeometry args={[0.04]} />
        <meshStandardMaterial color="#1a1a1a" />
      </mesh>
      <mesh castShadow position={[-0.25, 0.8, 0]} rotation={[0, 0, 0.5]}>
        <boxGeometry args={[0.08, 0.5, 0.08]} />
        <meshStandardMaterial color={isHit ? '#ff6666' : '#e8e8e0'} roughness={0.8} />
      </mesh>
      <mesh castShadow position={[0.25, 0.8, 0]} rotation={[0, 0, -0.5]}>
        <boxGeometry args={[0.08, 0.5, 0.08]} />
        <meshStandardMaterial color={isHit ? '#ff6666' : '#e8e8e0'} roughness={0.8} />
      </mesh>
      <mesh castShadow position={[-0.1, 0.2, 0]}>
        <boxGeometry args={[0.1, 0.4, 0.1]} />
        <meshStandardMaterial color={isHit ? '#ff6666' : '#e8e8e0'} roughness={0.8} />
      </mesh>
      <mesh castShadow position={[0.1, 0.2, 0]}>
        <boxGeometry args={[0.1, 0.4, 0.1]} />
        <meshStandardMaterial color={isHit ? '#ff6666' : '#e8e8e0'} roughness={0.8} />
      </mesh>
    </group>
  )
}

export default function Monster({ type, position, id }: MonsterProps) {
  const ref = useRef<RapierRigidBody>(null)
  const wanderTarget = useRef(new Vector3(...position))
  const canAttack = useRef(true)
  const lastHealth = useRef(HEALTH[type])
  const attackTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)
  const canBeAttacked = useRef(true)

  const playerPosition = usePlayerStore((state) => state.position)
  const playerIsDead = usePlayerStore((state) => state.isDead)
  const takeDamage = usePlayerStore((state) => state.takeDamage)
  const monsterData = useGameStore((state) => state.monsters.get(id))
  const registerMonster = useGameStore((state) => state.registerMonster)
  const damageMonster = useGameStore((state) => state.damageMonster)

  const speed = SPEEDS[type]
  const maxHealth = HEALTH[type]
  const isDead = monsterData?.dead ?? false
  const health = monsterData?.health ?? maxHealth

  const [isHit, setIsHit] = useState(false)

  const handleAttack = useCallback(() => {
    if (playerIsDead || isDead || !canBeAttacked.current) return

    const currentPos = ref.current?.translation()
    if (!currentPos) return

    const dx = playerPosition[0] - currentPos.x
    const dz = playerPosition[2] - currentPos.z
    const distance = Math.sqrt(dx * dx + dz * dz)

    if (distance <= PLAYER_ATTACK_RANGE) {
      damageMonster(id, 25)
      canBeAttacked.current = false
      setTimeout(() => {
        canBeAttacked.current = true
      }, 500)
    }
  }, [playerIsDead, isDead, playerPosition, damageMonster, id])

  useEffect(() => {
    registerMonster({
      id,
      type,
      position,
      health: maxHealth,
      maxHealth,
      dead: false,
    })
  }, [id, type, position, maxHealth, registerMonster])

  useEffect(() => {
    if (health < lastHealth.current) {
      setIsHit(true)
      const t = setTimeout(() => setIsHit(false), 150)
      return () => clearTimeout(t)
    }
    lastHealth.current = health
  }, [health])

  useEffect(() => {
    const interval = setInterval(() => {
      if (!isDead && ref.current) {
        const currentPos = ref.current.translation()
        const offsetX = (Math.random() - 0.5) * 8
        const offsetZ = (Math.random() - 0.5) * 8
        let newX = currentPos.x + offsetX
        let newZ = currentPos.z + offsetZ

        if (isInTown(newX, newZ)) {
          const angle = Math.atan2(newZ, newX)
          newX = Math.cos(angle) * (TOWN_RADIUS + 3)
          newZ = Math.sin(angle) * (TOWN_RADIUS + 3)
        }

        wanderTarget.current.set(newX, 0, newZ)
      }
    }, 3000)

    return () => clearInterval(interval)
  }, [isDead])

  useEffect(() => {
    return () => {
      if (attackTimeout.current) {
        clearTimeout(attackTimeout.current)
      }
    }
  }, [])

  useFrame((_, delta) => {
    if (!ref.current || isDead) return

    const currentPos = ref.current.translation()
    const current = new Vector3(currentPos.x, currentPos.y, currentPos.z)

    const dx = playerPosition[0] - currentPos.x
    const dz = playerPosition[2] - currentPos.z
    const playerDistance = Math.sqrt(dx * dx + dz * dz)

    const playerInTown = isInTown(playerPosition[0], playerPosition[2])

    let target: Vector3
    let currentSpeed = speed

    if (!playerInTown && !playerIsDead && playerDistance <= AGGRO_RANGE) {
      target = new Vector3(playerPosition[0], 0, playerPosition[2])
      currentSpeed = speed * 1.3

      if (playerDistance <= ATTACK_RANGE && canAttack.current) {
        takeDamage(ATTACK_DAMAGE)
        canAttack.current = false
        attackTimeout.current = setTimeout(() => {
          canAttack.current = true
        }, ATTACK_COOLDOWN)
      }
    } else {
      target = wanderTarget.current
    }

    const direction = target.clone().sub(current)
    const distance = direction.length()

    if (distance > 0.5) {
      direction.normalize()
      const newPos = current.clone().add(direction.multiplyScalar(currentSpeed * delta))

      if (isInTown(newPos.x, newPos.z)) {
        const angle = Math.atan2(newPos.z, newPos.x)
        newPos.x = Math.cos(angle) * (TOWN_RADIUS + 1)
        newPos.z = Math.sin(angle) * (TOWN_RADIUS + 1)
      }

      ref.current.setTranslation({ x: newPos.x, y: newPos.y, z: newPos.z }, true)
    }
  })

  const MonsterMesh = useMemo(() => {
    const onClick = () => handleAttack()
    switch (type) {
      case 'slime':
        return <Slime isHit={isHit} onClick={onClick} />
      case 'rat':
        return <Rat isHit={isHit} onClick={onClick} />
      case 'skeleton':
        return <Skeleton isHit={isHit} onClick={onClick} />
    }
  }, [type, isHit, handleAttack])

  if (isDead) return null

  return (
    <RigidBody
      ref={ref}
      position={position}
      colliders={false}
      type="kinematicPosition"
      lockRotations
    >
      {MonsterMesh}
      {monsterData && <HealthBar health={monsterData.health} maxHealth={monsterData.maxHealth} />}
    </RigidBody>
  )
}

export type { MonsterType }
