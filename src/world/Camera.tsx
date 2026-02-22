import { useThree, useFrame } from '@react-three/fiber'
import { Vector3 } from 'three'

import { useWorldStore, useCharacterStore } from '../store'

export default function Camera() {
  const { camera } = useThree()
  const currentCharacterId = useCharacterStore((s) => s.currentCharacterId)
  const entity = useWorldStore((s) => s.entities[currentCharacterId ?? ''])

  useFrame(() => {
    if (!entity?.components.position) return

    const pos = entity.components.position
    const targetX = pos.x
    const targetZ = pos.z

    const offset = new Vector3(0, 25, -25)
    const targetPosition = new Vector3(targetX + offset.x, offset.y, targetZ + offset.z)

    camera.position.lerp(targetPosition, 0.05)
    camera.lookAt(targetX, 0, targetZ)
  })

  return null
}
