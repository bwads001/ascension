import { Html } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { RigidBody, RapierRigidBody } from '@react-three/rapier'
import { useRef, useState, useEffect, useMemo, useCallback } from 'react'
import { Vector3, Mesh } from 'three'

import { useWorldStore } from '../store'
import type { MonsterType } from '../types'
import { isInTown, TOWN_RADIUS } from '../world'

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

interface MonsterProps {
  id: string
}

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

function Slime({ isHit, isHovered }: { isHit: boolean; isHovered: boolean }) {
  const meshRef = useRef<Mesh>(null)

  useFrame((state) => {
    if (meshRef.current) {
      const scale = 1 + Math.sin(state.clock.elapsedTime * 3) * 0.1
      meshRef.current.scale.setScalar(scale)
    }
  })

  const baseColor = isHit ? '#ff6666' : '#5a9a5a'

  return (
    <group>
      <mesh ref={meshRef} castShadow position={[0, 0.4, 0]}>
        <sphereGeometry args={[0.4, 16, 12]} />
        <meshStandardMaterial
          color={baseColor}
          emissive={isHovered ? '#ffff00' : '#000000'}
          emissiveIntensity={isHovered ? 0.5 : 0}
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

function Rat({ isHit, isHovered }: { isHit: boolean; isHovered: boolean }) {
  const baseColor = isHit ? '#ff6666' : '#5c4a3d'
  const emissive = isHovered ? '#ffff00' : '#000000'
  const emissiveIntensity = isHovered ? 0.5 : 0

  return (
    <group>
      <mesh castShadow position={[0, 0.25, 0]}>
        <capsuleGeometry args={[0.15, 0.4, 4, 8]} />
        <meshStandardMaterial
          color={baseColor}
          emissive={emissive}
          emissiveIntensity={emissiveIntensity}
          roughness={0.9}
        />
      </mesh>
      <mesh castShadow position={[0.3, 0.25, 0]}>
        <sphereGeometry args={[0.12, 8, 8]} />
        <meshStandardMaterial
          color={baseColor}
          emissive={emissive}
          emissiveIntensity={emissiveIntensity}
          roughness={0.9}
        />
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

function Skeleton({ isHit, isHovered }: { isHit: boolean; isHovered: boolean }) {
  const baseColor = isHit ? '#ff6666' : '#e8e8e0'
  const emissive = isHovered ? '#ffff00' : '#000000'
  const emissiveIntensity = isHovered ? 0.5 : 0

  const bodyMaterial = (
    <meshStandardMaterial
      color={baseColor}
      emissive={emissive}
      emissiveIntensity={emissiveIntensity}
      roughness={0.8}
    />
  )

  return (
    <group>
      <mesh castShadow position={[0, 0.8, 0]}>
        <boxGeometry args={[0.3, 0.8, 0.2]} />
        {bodyMaterial}
      </mesh>
      <mesh castShadow position={[0, 1.4, 0]}>
        <boxGeometry args={[0.25, 0.25, 0.25]} />
        {bodyMaterial}
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
        {bodyMaterial}
      </mesh>
      <mesh castShadow position={[0.25, 0.8, 0]} rotation={[0, 0, -0.5]}>
        <boxGeometry args={[0.08, 0.5, 0.08]} />
        {bodyMaterial}
      </mesh>
      <mesh castShadow position={[-0.1, 0.2, 0]}>
        <boxGeometry args={[0.1, 0.4, 0.1]} />
        {bodyMaterial}
      </mesh>
      <mesh castShadow position={[0.1, 0.2, 0]}>
        <boxGeometry args={[0.1, 0.4, 0.1]} />
        {bodyMaterial}
      </mesh>
    </group>
  )
}

export default function Monster({ id }: MonsterProps) {
  const ref = useRef<RapierRigidBody>(null)
  const wanderTarget = useRef(new Vector3())
  const canAttack = useRef(true)
  const lastHealth = useRef(0)
  const attackTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)
  const initialized = useRef(false)

  const entity = useWorldStore((s) => s.entities[id])
  const updateEntity = useWorldStore((s) => s.updateEntity)
  const entities = useWorldStore((s) => s.entities)

  const position = entity?.components.position
  const monsterType = entity?.components.monster?.type ?? 'slime'
  const health = entity?.components.health
  const isDead = health?.dead ?? false
  const maxHealth = HEALTH[monsterType]
  const currentHealth = health?.current ?? maxHealth

  const [isHit, setIsHit] = useState(false)
  const [isHovered, setIsHovered] = useState(false)

  useEffect(() => {
    if (!initialized.current && position) {
      wanderTarget.current.set(position.x, position.y, position.z)
      lastHealth.current = currentHealth
      initialized.current = true
    }
  }, [position, currentHealth])

  const getPlayerData = useCallback(() => {
    const allEntities = useWorldStore.getState().entities
    const playerEntries = Object.values(allEntities).filter((e) => e.type === 'player')
    if (playerEntries.length === 0) return null
    const player = playerEntries[0]
    return {
      position: player.components.position,
      isDead: player.components.health?.dead ?? false,
      id: player.id,
    }
  }, [])

  const handleClick = useCallback(() => {
    const player = getPlayerData()
    if (!player || player.isDead || isDead) return

    const currentPos = ref.current?.translation()
    if (!currentPos) return

    const allEntities = useWorldStore.getState().entities
    const existingCombat = allEntities[player.id]?.components.combat
    updateEntity(player.id, {
      velocity: { x: currentPos.x, y: 0, z: currentPos.z },
      combat: existingCombat ? { ...existingCombat, targetId: id } : undefined,
    })
  }, [getPlayerData, isDead, updateEntity, id])

  useEffect(() => {
    if (currentHealth < lastHealth.current) {
      setIsHit(true)
      const t = setTimeout(() => setIsHit(false), 150)
      return () => clearTimeout(t)
    }
    lastHealth.current = currentHealth
  }, [currentHealth])

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
    if (!ref.current || isDead || !position) return

    const currentPos = ref.current.translation()
    const current = new Vector3(currentPos.x, currentPos.y, currentPos.z)

    const player = getPlayerData()
    const playerPosition = player?.position
    const playerIsDead = player?.isDead ?? true

    let target: Vector3
    let currentSpeed = SPEEDS[monsterType]

    if (playerPosition && !playerIsDead) {
      const dx = playerPosition.x - currentPos.x
      const dz = playerPosition.z - currentPos.z
      const playerDistance = Math.sqrt(dx * dx + dz * dz)

      const playerInTown = isInTown(playerPosition.x, playerPosition.z)

      if (!playerInTown && playerDistance <= AGGRO_RANGE) {
        target = new Vector3(playerPosition.x, 0, playerPosition.z)
        currentSpeed = currentSpeed * 1.3

        if (playerDistance <= ATTACK_RANGE && canAttack.current) {
          if (player.id) {
            const playerHealth = entities[player.id]?.components.health
            if (playerHealth && !playerHealth.dead) {
              const newHealth = Math.max(0, playerHealth.current - ATTACK_DAMAGE)
              updateEntity(player.id, {
                health: {
                  ...playerHealth,
                  current: newHealth,
                  dead: newHealth <= 0,
                },
              })
            }
          }
          canAttack.current = false
          attackTimeout.current = setTimeout(() => {
            canAttack.current = true
          }, ATTACK_COOLDOWN)
        }
      } else {
        target = wanderTarget.current
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
    switch (monsterType) {
      case 'slime':
        return <Slime isHit={isHit} isHovered={isHovered} />
      case 'rat':
        return <Rat isHit={isHit} isHovered={isHovered} />
      case 'skeleton':
        return <Skeleton isHit={isHit} isHovered={isHovered} />
    }
  }, [monsterType, isHit, isHovered])

  if (!position || isDead) return null

  return (
    <RigidBody
      ref={ref}
      position={[position.x, position.y, position.z]}
      colliders={false}
      type="kinematicPosition"
      lockRotations
    >
      <group
        onClick={handleClick}
        onPointerOver={(e) => {
          e.stopPropagation()
          setIsHovered(true)
          document.body.style.cursor = 'pointer'
        }}
        onPointerOut={() => {
          setIsHovered(false)
          document.body.style.cursor = 'default'
        }}
      >
        {MonsterMesh}
        {health && <HealthBar health={currentHealth} maxHealth={maxHealth} />}
      </group>
    </RigidBody>
  )
}

export type { MonsterType }
