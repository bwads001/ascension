import { useFrame } from '@react-three/fiber'
import { RigidBody, CuboidCollider, RapierRigidBody } from '@react-three/rapier'
import { useRef } from 'react'
import { Vector3 } from 'three'

import useKeyboard from '../hooks/useKeyboard'
import { usePlayerStore } from '../store/playerStore'

const SPEED = 5
const JUMP_FORCE = 5

export default function Player() {
  const ref = useRef<RapierRigidBody>(null)
  const keys = useKeyboard()
  const canJump = useRef(true)
  const { position, setPosition } = usePlayerStore()

  useFrame(() => {
    if (!ref.current) return

    const vel = ref.current.linvel()
    const movement = new Vector3()

    if (keys.forward) movement.z -= 1
    if (keys.backward) movement.z += 1
    if (keys.left) movement.x -= 1
    if (keys.right) movement.x += 1

    if (movement.length() > 0) {
      movement.normalize().multiplyScalar(SPEED)
    }

    ref.current.setLinvel({ x: movement.x, y: vel.y, z: movement.z }, true)

    const pos = ref.current.translation()
    setPosition([pos.x, pos.y, pos.z])

    if (keys.jump && canJump.current) {
      ref.current.setLinvel({ x: vel.x, y: JUMP_FORCE, z: vel.z }, true)
      canJump.current = false
      setTimeout(() => {
        canJump.current = true
      }, 500)
    }
  })

  return (
    <RigidBody
      ref={ref}
      position={position}
      colliders={false}
      mass={1}
      type="dynamic"
      lockRotations
    >
      <CuboidCollider args={[0.4, 0.8, 0.4]} />
      <mesh castShadow position={[0, 0.8, 0]}>
        <capsuleGeometry args={[0.4, 1, 8, 16]} />
        <meshStandardMaterial color="#4a90d9" metalness={0.3} roughness={0.7} />
      </mesh>
      <mesh castShadow position={[0, 0.3, 0.2]}>
        <sphereGeometry args={[0.1]} />
        <meshStandardMaterial color="#2c3e50" />
      </mesh>
    </RigidBody>
  )
}
