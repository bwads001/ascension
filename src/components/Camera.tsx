import { useFrame, useThree } from '@react-three/fiber'
import { Vector3 } from 'three'

import { usePlayerStore } from '../store/playerStore'

export default function Camera() {
  const { camera } = useThree()
  const position = usePlayerStore((state) => state.position)

  useFrame(() => {
    const targetX = position[0]
    const targetZ = position[2]

    const offset = new Vector3(0, 25, 25)
    const targetPosition = new Vector3(targetX + offset.x, offset.y, targetZ + offset.z)

    camera.position.lerp(targetPosition, 0.05)
    camera.lookAt(targetX, 0, targetZ)
  })

  return null
}
