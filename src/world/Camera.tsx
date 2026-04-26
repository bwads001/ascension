import { useThree, useFrame } from '@react-three/fiber'
import { Vector3 } from 'three'

import { useWorldStore, useCharacterStore } from '../store'

const CAMERA_OFFSET = new Vector3(0, 25, -25)

export default function Camera() {
  const { camera } = useThree()
  const currentCharacterId = useCharacterStore((s) => s.currentCharacterId)
  const entity = useWorldStore((s) => s.entities[currentCharacterId ?? ''])

  useFrame(() => {
    if (!entity?.components.position) return

    const pos = entity.components.position

    camera.position.set(pos.x + CAMERA_OFFSET.x, CAMERA_OFFSET.y, pos.z + CAMERA_OFFSET.z)
    camera.up.set(0, 1, 0)
    camera.lookAt(pos.x, 0, pos.z)
  })

  return null
}
