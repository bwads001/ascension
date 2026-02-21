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
    const targetPos = new Vector3(pos.x + 10, 15, pos.z + 10)

    camera.position.lerp(targetPos, 0.05)
    camera.lookAt(pos.x, 0, pos.z)
  })

  return null
}
