import { OrbitControls as DreiOrbitControls } from '@react-three/drei'
import { useThree } from '@react-three/fiber'
import { useEffect } from 'react'
import { Vector3 } from 'three'

export default function OrbitControls() {
  const { camera } = useThree()

  useEffect(() => {
    const offset = new Vector3(15, 20, 15)
    camera.position.copy(offset)
    camera.lookAt(0, 0, 0)
  }, [camera])

  return (
    <DreiOrbitControls
      enablePan={true}
      enableZoom={true}
      minDistance={10}
      maxDistance={50}
      minPolarAngle={0.5}
      maxPolarAngle={1.2}
      target={[0, 0, 0]}
    />
  )
}
