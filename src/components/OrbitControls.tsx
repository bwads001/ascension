import { OrbitControls as DreiOrbitControls } from '@react-three/drei'

export default function OrbitControls() {
  return (
    <DreiOrbitControls
      enablePan={false}
      minDistance={5}
      maxDistance={30}
      minPolarAngle={0.3}
      maxPolarAngle={1.4}
    />
  )
}
