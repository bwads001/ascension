import { RigidBody } from '@react-three/rapier'

export default function Floor() {
  return (
    <RigidBody type="fixed" colliders="cuboid">
      <mesh receiveShadow position={[0, -0.5, 0]}>
        <boxGeometry args={[20, 1, 20]} />
        <meshStandardMaterial color="#2d3436" metalness={0.1} roughness={0.9} />
      </mesh>
      {[...Array(5)].map((_, i) =>
        [...Array(5)].map((_row, j) => (
          <mesh key={`${i}-${j}`} receiveShadow position={[(i - 2) * 4, -0.49, (j - 2) * 4]}>
            <boxGeometry args={[3.8, 0.02, 3.8]} />
            <meshStandardMaterial color={(i + j) % 2 === 0 ? '#3d3d3d' : '#2a2a2a'} />
          </mesh>
        ))
      )}
    </RigidBody>
  )
}
